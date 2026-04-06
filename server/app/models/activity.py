from sqlalchemy import Column, Integer, String, ForeignKey, Text, Boolean, TIMESTAMP, func
from sqlalchemy.dialects.postgresql import JSONB
from app.db.database import Base


class Activity(Base):
    __tablename__ = "activities"

    id             = Column(Integer, primary_key=True, autoincrement=True)
    student_id     = Column(Integer, ForeignKey("students.id"), nullable=False)
    ai_report_id   = Column(Integer, ForeignKey("ai_reports.id"))
    subject_id     = Column(Integer, ForeignKey("subjects.id"))
    title          = Column(String(255))
    activity_type  = Column(String(100))
    duration       = Column(String(50))
    difficulty     = Column(String(50))
    description    = Column(Text)
    steps          = Column(JSONB)
    curriculum_ref = Column(String(255))
    confidence     = Column(String(20), default="medium")
    completed      = Column(Boolean, default=False)
    created_at     = Column(TIMESTAMP, server_default=func.now())
