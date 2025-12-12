from sqlalchemy import Column, Integer, String, Date, TIMESTAMP, ForeignKey, text
from ..database import Base


class Rental(Base):
    __tablename__ = "rentals"

    rental_id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.equipment_id"), nullable=False, index=True)
    renter_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, index=True)

    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    total_cost = Column(Integer, nullable=False)
    status = Column(String(30), nullable=False)

    created_at = Column(TIMESTAMP, nullable=False, server_default=text("now()"))
