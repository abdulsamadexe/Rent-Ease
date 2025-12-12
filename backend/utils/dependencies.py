from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.users import User


def get_current_user(
    x_user_id: int = Header(..., description="User id returned from /auth/login"),
    db: Session = Depends(get_db),
) -> User:
    user = db.query(User).filter(User.user_id == x_user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session (user not found)")
    return user
