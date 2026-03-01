from sqlalchemy.orm import Session
from db.crud import get_dominant_weakness, get_all_problems, get_user_sessions
from db.models import Problem
from typing import Optional


def get_next_problem(db: Session, user_id: str) -> Optional[Problem]:
    """
    Selects the next problem based on the user's dominant cognitive weakness.

    Logic:
    1. Find user's dominant weakness tag
    2. Find problems that target that tag
    3. Exclude problems the user already solved
    4. Return the best match
    5. Fallback to any unsolved problem if no targeted match found
    """

    dominant_tag = get_dominant_weakness(db, user_id)

    # get problems user already attempted
    sessions = get_user_sessions(db, user_id)
    solved_problem_ids = set(s["problem_id"] for s in sessions)

    all_problems = get_all_problems(db)
    unsolved = [p for p in all_problems if p.id not in solved_problem_ids]

    if not unsolved:
        # user has solved everything — reset and start over with hardest
        unsolved = sorted(all_problems, key=lambda p: p.difficulty, reverse=True)

    if not dominant_tag:
        # no history yet — return first problem by difficulty
        return sorted(unsolved, key=lambda p: p.difficulty)[0] if unsolved else None

    # find problems that target the dominant weakness
    targeted = [
        p for p in unsolved
        if dominant_tag in (p.target_tags or [])
    ]

    if targeted:
        # pick the one with lowest difficulty first — don't overwhelm
        return sorted(targeted, key=lambda p: p.difficulty)[0]

    # no targeted problem found — return any unsolved by difficulty
    return sorted(unsolved, key=lambda p: p.difficulty)[0] if unsolved else None