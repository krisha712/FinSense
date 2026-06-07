from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User
from middleware import get_current_user

router = APIRouter(prefix="/api/user", tags=["user"])


@router.get("/me")
async def get_user_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return {
        "data": {
            "id": current_user.id,
            "email": current_user.email,
            "created_at": current_user.created_at.isoformat()
        },
        "metadata": {},
        "error": None
    }
