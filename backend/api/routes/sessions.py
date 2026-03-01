from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from api.deps import get_db
from db.crud import get_user_sessions, get_or_create_user

router = APIRouter()

@router.get("/sessions/{user_id}")
def get_sessions(user_id: str, db: Session = Depends(get_db)):
    get_or_create_user(db, user_id)
    sessions = get_user_sessions(db, user_id)
    return {
        "user_id": user_id,
        "total_sessions": len(sessions),
        "sessions": sessions
    }