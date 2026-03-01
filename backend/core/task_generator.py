from sqlalchemy.orm import Session
from db.crud import get_dominant_weakness, get_all_problems, get_user_sessions, get_mistake_records_for_user
from db.models import Problem
from google import genai
from google.genai import types
from dotenv import load_dotenv
import os
import json
import re
import uuid
from typing import Optional

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MODEL_NAME = "models/gemini-2.5-flash"

TAG_DESCRIPTIONS = {
    "missed_edge_case": "empty input, null values, single element, negative numbers, or boundary conditions",
    "off_by_one_error": "loop indices, array bounds, range boundaries that are one step off",
    "incorrect_loop_boundary": "incorrect start or end of loop iteration range",
    "unnecessary_nested_loop": "O(n²) brute force solution where an O(n) approach using a hash map or two pointers exists",
    "base_condition_flaw": "incorrect initialization of variables, wrong base values, or flawed starting conditions",
    "redundant_computation": "repeated calculations inside loops that could be cached or precomputed",
}


def get_starting_difficulty(sessions: list) -> int:
    if not sessions:
        return 1
    first_problem_id = sessions[0]["problem_id"]
    difficulty_map = {
        "p_001": 1, "p_002": 1, "p_003": 1, "p_004": 1,
        "p_005": 2, "p_006": 2, "p_007": 2, "p_009": 2,
        "p_008": 3, "p_010": 3,
    }
    return difficulty_map.get(first_problem_id, 1)


def get_recent_weak_tags(db: Session, user_id: str, limit: int = 2) -> list[str]:
    """
    Get the most recent mistake tags from the user's last session.
    These are the tags we'll target in the generated problem.
    """
    records = get_mistake_records_for_user(db, user_id)
    if not records:
        return []

    # get tags from the latest session only
    latest_session = max(r.session_num for r in records)
    latest_tags = [
        r.tag for r in records
        if r.session_num == latest_session
    ]

    # deduplicate while preserving order
    seen = set()
    unique_tags = []
    for tag in latest_tags:
        if tag not in seen:
            seen.add(tag)
            unique_tags.append(tag)

    return unique_tags[:limit]


def generate_problem_for_tags(tags: list[str], difficulty: int, solved_ids: set) -> Optional[dict]:
    """
    Uses Gemini to generate a fresh DSA problem that specifically targets
    the given cognitive mistake tags. Returns a problem dict or None on failure.
    """

    tag_descriptions = "\n".join([
        f"- {tag}: forces the solver to handle {TAG_DESCRIPTIONS.get(tag, tag)}"
        for tag in tags
    ])

    difficulty_label = {1: "easy", 2: "medium", 3: "hard"}.get(difficulty, "medium")

    prompt = f"""
You are a DSA problem designer. Generate a NEW array-based coding problem that specifically forces the solver to confront these cognitive mistake patterns:

{tag_descriptions}

Requirements:
- Domain: Arrays (iterative reasoning)
- Difficulty: {difficulty_label}
- The problem MUST naturally lead to mistakes in the listed cognitive areas if solved carelessly
- Include a clear problem statement, 1-2 examples with input/output, and constraints
- Do NOT mention the mistake tags in the problem statement
- The problem should feel like a real LeetCode-style problem

Return ONLY valid JSON in this exact structure:
{{
  "title": "Problem title here",
  "description": "Full problem statement with examples and constraints",
  "difficulty": {difficulty},
  "target_tags": {json.dumps(tags)},
  "domain": "arrays"
}}
"""

    for attempt in range(2):
        try:
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    response_mime_type="application/json"
                )
            )

            raw_text = response.text.strip()
            raw_text = re.sub(r"^```json|^```|```$", "", raw_text, flags=re.MULTILINE).strip()
            problem_data = json.loads(raw_text)

            # generate a unique ID so it doesn't clash with static bank
            problem_id = f"gen_{uuid.uuid4().hex[:8]}"
            problem_data["id"] = problem_id

            return problem_data

        except Exception as e:
            print(f"Problem generation error (attempt {attempt + 1}): {e}")
            if attempt == 1:
                return None
            continue

    return None


def save_generated_problem(db: Session, problem_data: dict) -> Problem:
    """Save the AI-generated problem to DB so it can be retrieved normally."""
    from db.models import Problem as ProblemModel
    problem = ProblemModel(
        id=problem_data["id"],
        title=problem_data["title"],
        description=problem_data["description"],
        difficulty=problem_data["difficulty"],
        target_tags=problem_data["target_tags"],
        domain=problem_data.get("domain", "arrays")
    )
    db.add(problem)
    db.commit()
    db.refresh(problem)
    return problem


def get_next_problem(db: Session, user_id: str) -> Optional[Problem]:
    """
    Main entry point. Tries to generate a targeted problem using Gemini
    based on the user's most recent mistake tags. Falls back to DB selection
    if generation fails.
    """

    sessions = get_user_sessions(db, user_id)
    solved_problem_ids = set(s["problem_id"] for s in sessions)
    baseline_difficulty = get_starting_difficulty(sessions)

    # get the tags from the user's most recent session
    recent_tags = get_recent_weak_tags(db, user_id)

    if recent_tags:
        # try to generate a fresh problem targeting exact weakness tags
        problem_data = generate_problem_for_tags(
            tags=recent_tags,
            difficulty=baseline_difficulty,
            solved_ids=solved_problem_ids
        )

        if problem_data:
            # save generated problem to DB and return it
            return save_generated_problem(db, problem_data)

    # fallback — select from existing DB bank if generation fails
    dominant_tag = get_dominant_weakness(db, user_id)
    all_problems = get_all_problems(db)

    eligible = [
        p for p in all_problems
        if p.id not in solved_problem_ids
        and p.difficulty >= baseline_difficulty
    ]

    if not eligible:
        eligible = [p for p in all_problems if p.id not in solved_problem_ids]

    if not eligible:
        eligible = sorted(all_problems, key=lambda p: p.difficulty, reverse=True)

    if not dominant_tag:
        return sorted(eligible, key=lambda p: p.difficulty)[0] if eligible else None

    targeted = [
        p for p in eligible
        if dominant_tag in (p.target_tags or [])
    ]

    if targeted:
        return sorted(targeted, key=lambda p: p.difficulty)[0]

    return sorted(eligible, key=lambda p: p.difficulty)[0] if eligible else None
