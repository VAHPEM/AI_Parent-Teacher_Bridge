from sqlalchemy import Column, Integer, String, ForeignKey, Text, Boolean, TIMESTAMP, func
from app.db.database import Base


class ParentFeedback(Base):
    __tablename__ = "parent_feedback"

    id                    = Column(Integer, primary_key=True, autoincrement=True)
    report_id             = Column(Integer, ForeignKey("ai_reports.id", ondelete="CASCADE"))
    parent_id             = Column(Integer, ForeignKey("parents.id", ondelete="CASCADE"))
    feedback_text         = Column(Text)
    status                = Column(String(30))
    needs_teacher_followup = Column(Boolean, default=False)
    created_at            = Column(TIMESTAMP, server_default=func.now())
