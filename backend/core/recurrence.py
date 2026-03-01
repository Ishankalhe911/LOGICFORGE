from db.crud import get_recurrence_matrix
from sqlalchemy.orm import Session


def calculate_recurrence_rates(db: Session, user_id: str) -> dict:
    """
    Converts raw counts into recurrence rates per tag per session.
    recurrence_rate = occurrences / total_sessions

    Example output:
    {
        "off_by_one_error": {
            "sessions": {1: 2, 2: 1, 3: 0},
            "recurrence_rate": 0.67,
            "trend": "improving",
            "first_seen": 1,
            "last_seen": 2
        }
    }
    """
    matrix = get_recurrence_matrix(db, user_id)

    if not matrix:
        return {}

    all_sessions = sorted(
        set(s for tag_data in matrix.values() for s in tag_data.keys())
    )
    total_sessions = len(all_sessions)

    result = {}

    for tag, session_counts in matrix.items():
        total_occurrences = sum(session_counts.values())
        recurrence_rate = round(total_occurrences / total_sessions, 2)

        # trend — compare first half vs second half of sessions
        mid = total_sessions // 2
        first_half = all_sessions[:mid] if mid > 0 else all_sessions[:1]
        second_half = all_sessions[mid:] if mid > 0 else all_sessions

        first_half_count = sum(session_counts.get(s, 0) for s in first_half)
        second_half_count = sum(session_counts.get(s, 0) for s in second_half)

        if second_half_count < first_half_count:
            trend = "improving"
        elif second_half_count > first_half_count:
            trend = "worsening"
        else:
            trend = "stable"

        # when was this tag first and last seen
        active_sessions = [s for s, count in session_counts.items() if count > 0]
        first_seen = min(active_sessions) if active_sessions else None
        last_seen = max(active_sessions) if active_sessions else None

        result[tag] = {
            "sessions": session_counts,
            "recurrence_rate": recurrence_rate,
            "trend": trend,
            "first_seen": first_seen,
            "last_seen": last_seen
        }

    return result


def get_extinction_report(db: Session, user_id: str) -> dict:
    """
    Returns which tags have been extinguished (0 occurrences in latest session)
    and which are still active.

    This is what powers the demo graph's 'improvement' story.
    """
    matrix = get_recurrence_matrix(db, user_id)

    if not matrix:
        return {"extinguished": [], "active": []}

    all_sessions = sorted(
        set(s for tag_data in matrix.values() for s in tag_data.keys())
    )

    if not all_sessions:
        return {"extinguished": [], "active": []}

    latest_session = max(all_sessions)

    extinguished = []
    active = []

    for tag, session_counts in matrix.items():
        if session_counts.get(latest_session, 0) == 0:
            extinguished.append(tag)
        else:
            active.append(tag)

    return {
        "extinguished": extinguished,
        "active": active,
        "latest_session": latest_session
    }