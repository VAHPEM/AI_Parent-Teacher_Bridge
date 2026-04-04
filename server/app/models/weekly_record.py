from sqlalchemy import Column, Integer, String, ForeignKey, Numeric, Text, TIMESTAMP, func
from app.db.database import Base


class WeeklyRecord(Base):
    __tablename__ = "weekly_records"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    student_id      = Column(Integer, ForeignKey("students.id"), nullable=False)
    week_number     = Column(Integer, nullable=False)
    subject         = Column(String(50), nullable=False)
    skill           = Column(String(100))
    score           = Column(Numeric(4, 1))
    teacher_comment = Column(Text)
    created_at      = Column(TIMESTAMP, server_default=func.now())
