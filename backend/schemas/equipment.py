from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class EquipmentCreate(BaseModel):
    name: str
    category: str
    description: str
    image_url: Optional[str] = None
    price_per_day: int
    condition: str


class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    price_per_day: Optional[int] = None
    condition: Optional[str] = None
    is_available: Optional[bool] = None


class EquipmentAvailability(BaseModel):
    is_available: bool


class EquipmentOut(BaseModel):
    equipment_id: int
    owner_id: int
    name: str
    category: str
    description: str
    image_url: Optional[str]
    price_per_day: int
    condition: str
    is_available: bool
    created_at: datetime

    class Config:
        from_attributes = True


class EquipmentListOut(BaseModel):
    items: list[EquipmentOut]
    total: int
    page: int
    page_size: int
