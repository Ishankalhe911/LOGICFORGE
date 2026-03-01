from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.deps import get_db
from db.crud import get_problem, get_all_problems, get_or_create_user
from db.models import Problem
import json
import os

router = APIRouter()

def seed_problems_if_empty(db: Session):
    count = db.query(Problem).count()
    if count == 0:
        json_path = os.path.join(os.path.dirname(__file__), "../../data/problems.json")
        with open(json_path, "r") as f:
            problems = json.load(f)
        for p in problems:
            db.add(Problem(**p))
        db.commit()

@router.get("/problems")
def list_problems(db: Session = Depends(get_db)):
    seed_problems_if_empty(db)
    problems = get_all_problems(db)
    return [
        {
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "difficulty": p.difficulty,
            "target_tags": p.target_tags,
            "domain": p.domain
        }
        for p in problems
    ]

@router.get("/problems/next/{user_id}")
def get_next_problem_for_user(user_id: str, db: Session = Depends(get_db)):
    from core.task_generator import get_next_problem
    seed_problems_if_empty(db)
    get_or_create_user(db, user_id)
    problem = get_next_problem(db, user_id)
    if not problem:
        raise HTTPException(status_code=404, detail="No problem available")
    return {
        "id": problem.id,
        "title": problem.title,
        "description": problem.description,
        "difficulty": problem.difficulty,
        "target_tags": problem.target_tags,
        "domain": problem.domain
    }

@router.get("/problems/{problem_id}")
def get_single_problem(problem_id: str, db: Session = Depends(get_db)):
    seed_problems_if_empty(db)
    problem = get_problem(db, problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    return {
        "id": problem.id,
        "title": problem.title,
        "description": problem.description,
        "difficulty": problem.difficulty,
        "target_tags": problem.target_tags,
        "domain": problem.domain
    }
