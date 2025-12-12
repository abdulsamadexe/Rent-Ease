from sqlalchemy import Column, Integer, String, Text, Boolean, TIMESTAMP, ForeignKey, text
from ..database import Base


class Equipment(Base):
    __tablename__ = "equipment"

    equipment_id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, index=True)

    name = Column(String(150), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=False)
    image_url = Column(Text)

    price_per_day = Column(Integer, nullable=False)
    condition = Column(String(50), nullable=False)

    is_available = Column(Boolean, nullable=False, server_default=text("true"))
    created_at = Column(TIMESTAMP, nullable=False, server_default=text("now()"))
