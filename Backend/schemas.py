from pydantic import BaseModel
from datetime import date
from typing import Optional

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserOut(BaseModel):
    user_id: int
    name: str
    email: str
    class Config:
        from_attributes = True

class EquipmentBase(BaseModel):
    name: str
    category: str
    description: str
    image_url: Optional[str] = None
    price_per_day: int
    condition: str
    is_available: bool = True

class EquipmentOut(EquipmentBase):
    equipment_id: int
    owner_id: int
    class Config:
        from_attributes = True

class RentalCreate(BaseModel):
    equipment_id: int
    renter_id: int
    start_date: date
    end_date: date

class RentalOut(BaseModel):
    rental_id: int
    equipment_id: int
    renter_id: int
    start_date: date
    end_date: date
    total_cost: int
    status: str
    class Config:
        from_attributes = True