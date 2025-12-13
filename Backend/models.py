from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, DateTime, Text
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Equipment(Base):
    __tablename__ = "equipment"
    equipment_id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    image_url = Column(Text)
    price_per_day = Column(Integer, nullable=False)
    condition = Column(String, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Rental(Base):
    __tablename__ = "rentals"
    rental_id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.equipment_id", ondelete="CASCADE"), nullable=False)
    renter_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_cost = Column(Integer, nullable=False)
    status = Column(String, default="pending") 
    created_at = Column(DateTime(timezone=True), server_default=func.now())