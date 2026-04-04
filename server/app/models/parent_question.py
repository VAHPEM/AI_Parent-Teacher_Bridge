from sqlalchemy import Column, Integer, String, ForeignKey, Text, Boolean, TIMESTAMP, func
from app.db.database import Base


class ParentQuestion(Base):
    __tablename__ = "parent_questions"

    id                    = Column(Integer, primary_key=True, autoincrement=True)
    parent_id             = Column(Integer, ForeignKey("parents.id"), nullable=False)
    student_id            = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject_id            = Column(Integer, ForeignKey("subjects.id"))
    content               = Column(Text, nullable=False)
    priority              = Column(String(50), default="general")
    status                = Column(String(50), default="open")
    flag_reason           = Column(String(255))
    ai_suggested_response = Column(Text)
    call_scheduled        = Column(Boolean, default=False)
    created_at            = Column(TIMESTAMP, server_default=func.now())
