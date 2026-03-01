from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from api.deps import get_db
from core.recurrence import calculate_recurrence_rates, get_extinction_report
from db.crud import get_dominant_weakness, get_or_create_user

router = APIRouter()

@router.get("/analytics/{user_id}")
def get_analytics(user_id: str, db: Session = Depends(get_db)):
    get_or_create_user(db, user_id)

    recurrence_data = calculate_recurrence_rates(db, user_id)
    extinction = get_extinction_report(db, user_id)
    dominant = get_dominant_weakness(db, user_id)

    return {
        "user_id": user_id,
        "dominant_weakness": dominant,
        "recurrence_data": recurrence_data,
        "extinction_report": extinction
    }