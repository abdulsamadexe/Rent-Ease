from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas

router = APIRouter(tags=["Auth"])

@router.post("/auth/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if email exists
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    
    # NO HASHING - Storing password exactly as entered
    new_user = models.User(
        name=user.name, 
        email=user.email, 
        password=user.password 
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/auth/login")
def login(creds: dict, db: Session = Depends(get_db)):
    # 1. Find user by email
    user = db.query(models.User).filter(models.User.email == creds.get('email')).first()
    
    # 2. Simple String Comparison
    # Check if user exists AND if the password matches exactly
    if not user or user.password != creds.get('password'):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {"user_id": user.user_id, "name": user.name, "email": user.email}