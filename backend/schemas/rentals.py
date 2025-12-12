from pydantic import BaseModel
from datetime import date, datetime


class RentalRequestCreate(BaseModel):
    equipment_id: int
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
    created_at: datetime

    class Config:
        from_attributes = True
