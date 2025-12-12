from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.rentals import Rental
from ..models.equipment import Equipment
from ..models.users import User
from ..schemas.rentals import RentalRequestCreate, RentalOut
from ..utils.dependencies import get_current_user
from ..utils.validations import ensure_end_after_start, calculate_total_cost

router = APIRouter(prefix="/rentals", tags=["Rentals"])


def _has_overlap(db: Session, equipment_id: int, start_date: date, end_date: date, exclude_rental_id: int | None = None) -> bool:
    q = db.query(Rental).filter(
        Rental.equipment_id == equipment_id,
        Rental.status.in_(["approved", "rented"]),
        Rental.start_date <= end_date,
        Rental.end_date >= start_date,
    )
    if exclude_rental_id is not None:
        q = q.filter(Rental.rental_id != exclude_rental_id)
    return db.query(q.exists()).scalar()


@router.post("/request", response_model=RentalOut, status_code=status.HTTP_201_CREATED)
def request_rental(
    payload: RentalRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    eq = db.query(Equipment).filter(Equipment.equipment_id == payload.equipment_id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Equipment not found")

    if not eq.is_available:
        raise HTTPException(status_code=400, detail="Equipment is not available")

    # Renter cannot be owner
    if eq.owner_id == current_user.user_id:
        raise HTTPException(status_code=403, detail="Owner cannot rent their own equipment")

    try:
        ensure_end_after_start(payload.start_date, payload.end_date)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if _has_overlap(db, eq.equipment_id, payload.start_date, payload.end_date):
        raise HTTPException(status_code=409, detail="Date range overlaps with an approved/rented booking")

    total_cost = calculate_total_cost(payload.start_date, payload.end_date, eq.price_per_day)

    rental = Rental(
        equipment_id=eq.equipment_id,
        renter_id=current_user.user_id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        total_cost=total_cost,
        status="pending",
    )
    db.add(rental)
    db.commit()
    db.refresh(rental)
    return rental


@router.get("/renter/{renter_id}", response_model=list[RentalOut])
def list_renter_rentals(
    renter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if renter_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Cannot view another user's rentals")

    return db.query(Rental).filter(Rental.renter_id == renter_id).order_by(Rental.created_at.desc()).all()


@router.get("/owner/{owner_id}", response_model=list[RentalOut])
def list_owner_requests(
    owner_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if owner_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Cannot view another owner's requests")

    return (
        db.query(Rental)
        .join(Equipment, Equipment.equipment_id == Rental.equipment_id)
        .filter(Equipment.owner_id == owner_id)
        .order_by(Rental.created_at.desc())
        .all()
    )


@router.put("/{rental_id}/approve", response_model=RentalOut)
def approve_rental(
    rental_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rental = db.query(Rental).filter(Rental.rental_id == rental_id).first()
    if not rental:
        raise HTTPException(status_code=404, detail="Rental not found")
    if rental.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending rentals can be approved")

    eq = db.query(Equipment).filter(Equipment.equipment_id == rental.equipment_id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Equipment not found")
    if eq.owner_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Only owner can approve")

    # Check overlap again at approval time (important if multiple pending requests exist)
    if _has_overlap(db, eq.equipment_id, rental.start_date, rental.end_date, exclude_rental_id=rental.rental_id):
        raise HTTPException(status_code=409, detail="Overlapping approved/rented booking exists")

    rental.status = "approved"
    db.commit()
    db.refresh(rental)
    return rental


@router.put("/{rental_id}/reject", response_model=RentalOut)
def reject_rental(
    rental_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rental = db.query(Rental).filter(Rental.rental_id == rental_id).first()
    if not rental:
        raise HTTPException(status_code=404, detail="Rental not found")
    if rental.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending rentals can be rejected")

    eq = db.query(Equipment).filter(Equipment.equipment_id == rental.equipment_id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Equipment not found")
    if eq.owner_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Only owner can reject")

    rental.status = "rejected"
    db.commit()
    db.refresh(rental)
    return rental


@router.put("/{rental_id}/mark-rented", response_model=RentalOut)
def mark_rented(
    rental_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rental = db.query(Rental).filter(Rental.rental_id == rental_id).first()
    if not rental:
        raise HTTPException(status_code=404, detail="Rental not found")
    if rental.status != "approved":
        raise HTTPException(status_code=400, detail="Only approved rentals can be marked rented")

    eq = db.query(Equipment).filter(Equipment.equipment_id == rental.equipment_id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Equipment not found")
    if eq.owner_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Only owner can mark rented")

    rental.status = "rented"
    # Optionally: make equipment unavailable during an active rental
    eq.is_available = False

    db.commit()
    db.refresh(rental)
    return rental


@router.put("/{rental_id}/request-return", response_model=RentalOut)
def request_return(
    rental_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rental = db.query(Rental).filter(Rental.rental_id == rental_id).first()
    if not rental:
        raise HTTPException(status_code=404, detail="Rental not found")
    if rental.renter_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Only renter can request return")
    if rental.status != "rented":
        raise HTTPException(status_code=400, detail="Return can only be requested for rented items")

    # Rule: renter can request return only on/after start_date
    if date.today() < rental.start_date:
        raise HTTPException(status_code=400, detail="Cannot request return before rental start_date")

    rental.status = "return_requested"
    db.commit()
    db.refresh(rental)
    return rental


@router.put("/{rental_id}/mark-returned", response_model=RentalOut)
def mark_returned(
    rental_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rental = db.query(Rental).filter(Rental.rental_id == rental_id).first()
    if not rental:
        raise HTTPException(status_code=404, detail="Rental not found")
    if rental.status != "return_requested":
        raise HTTPException(status_code=400, detail="Only return_requested rentals can be marked returned")

    eq = db.query(Equipment).filter(Equipment.equipment_id == rental.equipment_id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Equipment not found")
    if eq.owner_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Only owner can mark returned")

    rental.status = "returned"
    eq.is_available = True

    db.commit()
    db.refresh(rental)
    return rental
