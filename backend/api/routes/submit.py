from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.deps import get_db
from schemas.analysis import SubmitRequest, SubmitResponse
from core.classifier import classify_code
from core.task_generator import get_next_problem
from db.crud import get_or_create_user, get_problem, save_submission

router = APIRouter()

@router.post("/submit", response_model=SubmitResponse)
def submit_code(request: SubmitRequest, db: Session = Depends(get_db)):

    # ensure user exists
    get_or_create_user(db, request.user_id)

    # fetch problem
    problem = get_problem(db, request.problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    # classify code via Gemini
    analysis = classify_code(
        problem_description=problem.description,
        code=request.code,
        language=request.language
    )

    # save submission + mistake records to DB
    save_submission(
        db=db,
        user_id=request.user_id,
        problem_id=request.problem_id,
        session_num=request.session_num,
        analysis=analysis
    )

    # get next targeted problem
    next_problem = get_next_problem(db, request.user_id)

    return SubmitResponse(
        user_id=request.user_id,
        session_num=request.session_num,
        problem_id=request.problem_id,
        analysis=analysis,
        next_problem_id=next_problem.id if next_problem else None
    )