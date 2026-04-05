from sqlalchemy import Column, Integer, String, ForeignKey, Numeric, Text, TIMESTAMP, func, UniqueConstraint
from app.db.database import Base


class AssessmentScore(Base):
    __tablename__ = "assessment_scores"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    student_id    = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    score         = Column(Numeric(10, 2))
    grade         = Column(String(20))
    comment       = Column(Text)
    created_at    = Column(TIMESTAMP, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("assessment_id", "student_id", name="uq_assessment_score"),
    )
