from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from pydantic import BaseModel
import models, schemas

router = APIRouter(tags=["Equipment"])

class AvailabilityUpdate(BaseModel):
    is_available: bool

@router.get("/equipment", response_model=List[schemas.EquipmentOut])
def get_equipment(search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Equipment)
    if search:
        query = query.filter(models.Equipment.name.ilike(f"%{search}%"))
    return query.all()

@router.post("/equipment", response_model=schemas.EquipmentOut)
def create_equipment(item: schemas.EquipmentBase, owner_id: int, db: Session = Depends(get_db)):
    new_item = models.Equipment(**item.dict(), owner_id=owner_id)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@router.patch("/equipment/{id}/availability")
def update_availability(id: int, status: AvailabilityUpdate, db: Session = Depends(get_db)):
    item = db.query(models.Equipment).filter(models.Equipment.equipment_id == id).first()
    if not item: raise HTTPException(404, "Not Found")
    item.is_available = status.is_available
    db.commit()
    return item

@router.delete("/equipment/{id}")
def delete_equipment(id: int, owner_id: int, db: Session = Depends(get_db)):
    item = db.query(models.Equipment).filter(models.Equipment.equipment_id == id).first()
    if not item: raise HTTPException(404, "Not Found")
    
    # Active rental check
    active = db.query(models.Rental).filter(
        models.Rental.equipment_id == id,
        models.Rental.status.in_(['approved', 'rented'])
    ).first()
    if active: raise HTTPException(400, "Cannot delete with active rentals")

    db.delete(item)
    db.commit()
    return {"detail": "Deleted"}

@router.get("/equipment/{id}", response_model=schemas.EquipmentOut)
def get_single_equipment(id: int, db: Session = Depends(get_db)):
    item = db.query(models.Equipment).filter(models.Equipment.equipment_id == id).first()
    if not item: raise HTTPException(404, "Not Found")
    return item