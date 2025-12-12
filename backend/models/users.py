from sqlalchemy import Column, Integer, String, TIMESTAMP, text
from ..database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)

    # Plain text password (not secure; requested)
    password = Column(String(255), nullable=False)

    created_at = Column(TIMESTAMP, nullable=False, server_default=text("now()"))
