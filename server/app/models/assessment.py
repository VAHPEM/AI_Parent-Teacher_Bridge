from sqlalchemy import Column, Integer, String, ForeignKey, Numeric, Date, TIMESTAMP, func
from app.db.database import Base


class Assessment(Base):
    __tablename__ = "assessments"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    subject_id      = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    assessment_name = Column(String(255), nullable=False)
    assessment_type = Column(String(100))
    term            = Column(String(50))
    week_number     = Column(Integer)
    due_date        = Column(Date)
    max_score       = Column(Numeric(10, 2))
    created_at      = Column(TIMESTAMP, server_default=func.now())
