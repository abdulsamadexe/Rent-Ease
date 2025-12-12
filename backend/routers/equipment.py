from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.equipment import Equipment
from ..models.rentals import Rental
from ..schemas.equipment import (
    EquipmentCreate,
    EquipmentUpdate,
    EquipmentOut,
    EquipmentAvailability,
    EquipmentListOut,
)
from ..utils.dependencies import get_current_user
from ..models.users import User

router = APIRouter(prefix="/equipment", tags=["Equipment"])


@router.get("", response_model=EquipmentListOut)
def list_equipment(
    q: str | None = None,
    category: str | None = None,
    min_price: int | None = None,
    max_price: int | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Equipment).filter(Equipment.is_available == True)  # noqa: E712

    if q:
        query = query.filter(Equipment.name.ilike(f"%{q}%"))
    if category:
        query = query.filter(Equipment.category == category)
    if min_price is not None:
        query = query.filter(Equipment.price_per_day >= min_price)
    if max_price is not None:
        query = query.filter(Equipment.price_per_day <= max_price)
    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(status_code=400, detail="min_price cannot be greater than max_price")

    total = query.count()
    items = (
        query.order_by(Equipment.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/{equipment_id}", response_model=EquipmentOut)
def get_equipment(equipment_id: int, db: Session = Depends(get_db)):
    eq = db.query(Equipment).filter(Equipment.equipment_id == equipment_id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return eq


@router.post("", response_model=EquipmentOut, status_code=status.HTTP_201_CREATED)
def create_equipment(
    payload: EquipmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.price_per_day <= 0:
        raise HTTPException(status_code=400, detail="price_per_day must be > 0")

    eq = Equipment(
        owner_id=current_user.user_id,
        name=payload.name,
        category=payload.category,
        description=payload.description,
        image_url=payload.image_url,
        price_per_day=payload.price_per_day,
        condition=payload.condition,
    )
    db.add(eq)
    db.commit()
    db.refresh(eq)
    return eq


@router.put("/{equipment_id}", response_model=EquipmentOut)
def update_equipment(
    equipment_id: int,
    payload: EquipmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    eq = db.query(Equipment).filter(Equipment.equipment_id == equipment_id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Equipment not found")
    if eq.owner_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Only owner can update this equipment")

    data = payload.model_dump(exclude_unset=True)

    if "price_per_day" in data and data["price_per_day"] is not None and data["price_per_day"] <= 0:
        raise HTTPException(status_code=400, detail="price_per_day must be > 0")

    for k, v in data.items():
        setattr(eq, k, v)

    db.commit()
    db.refresh(eq)
    return eq


@router.patch("/{equipment_id}/availability", response_model=EquipmentOut)
def set_availability(
    equipment_id: int,
    payload: EquipmentAvailability,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    eq = db.query(Equipment).filter(Equipment.equipment_id == equipment_id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Equipment not found")
    if eq.owner_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Only owner can change availability")

    # Block changing availability if there is an approved/rented rental (per API spec)
    active = (
        db.query(Rental)
        .filter(
            Rental.equipment_id == equipment_id,
            Rental.status.in_(["approved", "rented"]),
        )
        .first()
    )
    if active:
        raise HTTPException(status_code=400, detail="Cannot change availability while rental is approved or rented")

    eq.is_available = payload.is_available
    db.commit()
    db.refresh(eq)
    return eq


@router.delete("/{equipment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_equipment(
    equipment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    eq = db.query(Equipment).filter(Equipment.equipment_id == equipment_id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Equipment not found")
    if eq.owner_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Only owner can delete this equipment")

    # Only allow delete if not currently rented or approved (per API spec)
    active = (
        db.query(Rental)
        .filter(
            Rental.equipment_id == equipment_id,
            Rental.status.in_(["approved", "rented"]),
        )
        .first()
    )
    if active:
        raise HTTPException(status_code=403, detail="Cannot delete equipment with approved/rented rentals")

    db.delete(eq)
    db.commit()
    return None
