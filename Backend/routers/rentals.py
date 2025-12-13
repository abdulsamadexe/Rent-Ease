from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas

router = APIRouter(tags=["Rentals"])

@router.post("/rentals/request", response_model=schemas.RentalOut)
def request_rental(rental: schemas.RentalCreate, db: Session = Depends(get_db)):
    # 1. Get Equipment
    item = db.query(models.Equipment).filter(models.Equipment.equipment_id == rental.equipment_id).first()
    if not item: raise HTTPException(404, "Equipment not found")
    
    # 2. Check Owner
    if item.owner_id == rental.renter_id:
        raise HTTPException(403, "Cannot rent your own equipment")

    # 3. Check Database for Overlaps
    overlap = db.query(models.Rental).filter(
        models.Rental.equipment_id == rental.equipment_id,
        models.Rental.status.in_(['approved', 'rented']),
        models.Rental.start_date <= rental.end_date,
        models.Rental.end_date >= rental.start_date
    ).first()
    
    if overlap:
        raise HTTPException(409, "Equipment not available for these dates")

    # 4. Calculate Cost (Your logic: End - Start + 1)
    day_count = (rental.end_date - rental.start_date).days + 1
    if day_count < 1: raise HTTPException(400, "Invalid date range")
    
    total = day_count * item.price_per_day

    new_rental = models.Rental(
        **rental.dict(),
        total_cost=total,
        status="pending"
    )
    db.add(new_rental)
    db.commit()
    db.refresh(new_rental)
    return new_rental

@router.get("/rentals/my-requests/{user_id}")
def get_my_rentals(user_id: int, db: Session = Depends(get_db)):
    return db.query(models.Rental).filter(models.Rental.renter_id == user_id).all()

@router.get("/rentals/owner-requests/{user_id}")
def get_owner_requests(user_id: int, db: Session = Depends(get_db)):
    return db.query(models.Rental).join(models.Equipment)\
             .filter(models.Equipment.owner_id == user_id).all()

@router.put("/rentals/{id}/{action}")
def update_rental_status(id: int, action: str, db: Session = Depends(get_db)):
    rental = db.query(models.Rental).filter(models.Rental.rental_id == id).first()
    if not rental: raise HTTPException(404, "Not Found")

    valid_transitions = {
        'approve': ('pending', 'approved'),
        'reject': ('pending', 'rejected'),
        'pickup': ('approved', 'rented'),
        'return-request': ('rented', 'return_requested'),
        'confirm-return': ('return_requested', 'returned')
    }

    if action not in valid_transitions:
        raise HTTPException(400, "Invalid action")
    
    required_state, new_state = valid_transitions[action]
    
    if rental.status != required_state:
        raise HTTPException(400, f"Rental must be {required_state} to {action}")
        
    rental.status = new_state
    db.commit()
    return {"status": new_state}