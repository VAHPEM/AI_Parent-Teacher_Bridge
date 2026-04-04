from sqlalchemy import Column, Integer, String, ForeignKey, Text, TIMESTAMP, func
from app.db.database import Base


class WeeklyObservation(Base):
    __tablename__ = "weekly_observations"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    student_id      = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    teacher_id      = Column(Integer, ForeignKey("teachers.id"))
    class_id        = Column(Integer, ForeignKey("classes.id"))
    subject_id      = Column(Integer, ForeignKey("subjects.id"))
    term            = Column(String(50))
    week_number     = Column(Integer, nullable=False)
    participation   = Column(String(100))
    trend           = Column(String(100))
    concerns        = Column(Text)
    teacher_comment = Column(Text)
    curriculum_ref  = Column(String(255))
    created_at      = Column(TIMESTAMP, server_default=func.now())
