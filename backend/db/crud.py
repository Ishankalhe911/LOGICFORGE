from sqlalchemy.orm import Session
from sqlalchemy import func
from db.models import User, Problem, Submission, MistakeRecord
from schemas.analysis import AnalysisResult
from typing import Optional
import json


# ─────────────────────────────────────────
# USER
# ─────────────────────────────────────────

def get_or_create_user(db: Session, user_id: str) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = User(id=user_id)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


# ─────────────────────────────────────────
# PROBLEM
# ─────────────────────────────────────────

def get_problem(db: Session, problem_id: str) -> Optional[Problem]:
    return db.query(Problem).filter(Problem.id == problem_id).first()

def get_all_problems(db: Session) -> list[Problem]:
    return db.query(Problem).all()


# ─────────────────────────────────────────
# SUBMISSION
# ─────────────────────────────────────────

def save_submission(
    db: Session,
    user_id: str,
    problem_id: str,
    session_num: int,
    analysis: AnalysisResult
) -> Submission:

    # convert analysis to storable JSON
    analysis_json = {
        "detected_mistakes": [
            {
                "tag": m.tag.value,
                "confidence_score": m.confidence_score,
                "reasoning_summary": m.reasoning_summary,
                "line_reference": m.line_reference
            }
            for m in analysis.detected_mistakes
        ]
    }

    clean_tags = [tag.value for tag in analysis.clean_tags]

    submission = Submission(
        user_id=user_id,
        problem_id=problem_id,
        session_num=session_num,
        analysis_json=analysis_json,
        clean_tags=clean_tags
    )

    db.add(submission)
    db.commit()
    db.refresh(submission)

    # save individual mistake records for fast recurrence querying
    for mistake in analysis.detected_mistakes:
        record = MistakeRecord(
            user_id=user_id,
            tag=mistake.tag.value,
            session_num=session_num,
            confidence_score=mistake.confidence_score,
            reasoning_summary=mistake.reasoning_summary,
            submission_id=submission.id
        )
        db.add(record)

    db.commit()
    return submission


# ─────────────────────────────────────────
# RECURRENCE DATA
# ─────────────────────────────────────────

def get_mistake_records_for_user(db: Session, user_id: str) -> list[MistakeRecord]:
    return (
        db.query(MistakeRecord)
        .filter(MistakeRecord.user_id == user_id)
        .order_by(MistakeRecord.session_num)
        .all()
    )

def get_recurrence_matrix(db: Session, user_id: str) -> dict:
    """
    Returns a matrix of tag → session → count.
    This is what feeds the recurrence graph on the frontend.

    Example output:
    {
        "off_by_one_error":       {1: 2, 2: 1, 3: 0},
        "missed_edge_case":       {1: 1, 2: 1, 3: 0},
        "base_condition_flaw":    {1: 1, 2: 0, 3: 0}
    }
    """
    records = get_mistake_records_for_user(db, user_id)

    # get all sessions this user has
    all_sessions = sorted(set(r.session_num for r in records))

    matrix = {}

    for record in records:
        tag = record.tag
        session = record.session_num

        if tag not in matrix:
            matrix[tag] = {}

        matrix[tag][session] = matrix[tag].get(session, 0) + 1

    # fill in 0s for sessions where a tag didn't appear
    for tag in matrix:
        for session in all_sessions:
            if session not in matrix[tag]:
                matrix[tag][session] = 0

    return matrix


def get_dominant_weakness(db: Session, user_id: str) -> Optional[str]:
    """
    Returns the tag with the highest total recurrence across all sessions.
    This is what task_generator uses to pick the next problem.
    """
    records = get_mistake_records_for_user(db, user_id)

    if not records:
        return None

    tag_counts = {}
    for record in records:
        tag_counts[record.tag] = tag_counts.get(record.tag, 0) + 1

    return max(tag_counts, key=tag_counts.get)


# ─────────────────────────────────────────
# SESSION
# ─────────────────────────────────────────

def get_user_sessions(db: Session, user_id: str) -> list[dict]:
    """
    Returns per-session summary for a user.
    """
    submissions = (
        db.query(Submission)
        .filter(Submission.user_id == user_id)
        .order_by(Submission.session_num)
        .all()
    )

    return [
        {
            "session_num": s.session_num,
            "problem_id": s.problem_id,
            "clean_tags": s.clean_tags,
            "submitted_at": s.submitted_at.isoformat()
        }
        for s in submissions
    ]