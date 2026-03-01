from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)  # user_id passed from frontend
    created_at = Column(DateTime, default=datetime.utcnow)

    submissions = relationship("Submission", back_populates="user")


class Problem(Base):
    __tablename__ = "problems"

    id = Column(String, primary_key=True, index=True)  # e.g. "p_001"
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    difficulty = Column(Integer, default=1)             # 1-3 scale
    target_tags = Column(JSON, default=list)            # which cognitive tags this problem tests
    domain = Column(String, default="arrays")

    submissions = relationship("Submission", back_populates="problem")


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    problem_id = Column(String, ForeignKey("problems.id"), nullable=False)
    session_num = Column(Integer, nullable=False)       # which session (1, 2, 3)
    
    # Raw analysis stored as JSON — full detected_mistakes list
    analysis_json = Column(JSON, nullable=False)
    
    # Flat tag list for fast recurrence queries — e.g. ["off_by_one_error", "missed_edge_case"]
    clean_tags = Column(JSON, default=list)
    
    submitted_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="submissions")
    problem = relationship("Problem", back_populates="submissions")


class MistakeRecord(Base):
    __tablename__ = "mistake_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    tag = Column(String, nullable=False)                # the specific mistake tag
    session_num = Column(Integer, nullable=False)
    confidence_score = Column(Float, nullable=False)
    reasoning_summary = Column(String, nullable=False)
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=False)