from pydantic import BaseModel
from typing import List, Optional
from enum import Enum

class MistakeTag(str, Enum):
    missed_edge_case = "missed_edge_case"
    off_by_one_error = "off_by_one_error"
    incorrect_loop_boundary = "incorrect_loop_boundary"
    unnecessary_nested_loop = "unnecessary_nested_loop"
    base_condition_flaw = "base_condition_flaw"
    redundant_computation = "redundant_computation"

class DetectedMistake(BaseModel):
    tag: MistakeTag
    confidence_score: float
    reasoning_summary: str
    line_reference: Optional[str] = None

class AnalysisResult(BaseModel):
    detected_mistakes: List[DetectedMistake]
    clean_tags: List[MistakeTag]

class SubmitRequest(BaseModel):
    user_id: str
    session_num: int
    problem_id: str
    code: str
    language: str = "python"

class SubmitResponse(BaseModel):
    user_id: str
    session_num: int
    problem_id: str
    analysis: AnalysisResult
    next_problem_id: Optional[str] = None