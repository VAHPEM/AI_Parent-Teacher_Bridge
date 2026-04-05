from sqlalchemy import Column, Integer, String, ForeignKey, Text, Boolean, TIMESTAMP, func
from sqlalchemy.dialects.postgresql import JSONB
from app.db.database import Base


class AIReport(Base):
    __tablename__ = "ai_reports"

    id               = Column(Integer, primary_key=True, autoincrement=True)
    student_id       = Column(Integer, ForeignKey("students.id"))
    week_number      = Column(Integer)
    term             = Column(String(50))
    summary          = Column(Text)
    strengths        = Column(JSONB)
    support_areas    = Column(JSONB)
    improvement_areas = Column(JSONB)
    parent_actions   = Column(JSONB)
    recommendations  = Column(JSONB)
    risk_level       = Column(String(20))
    curriculum_ref   = Column(String(255))
    status           = Column(String(50), default="draft")
    teacher_approved = Column(Boolean, default=False)
    sent_to_parent   = Column(Boolean, default=False)
    created_at       = Column(TIMESTAMP, server_default=func.now())
