from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint
from app.db.database import Base


class ClassSubject(Base):
    __tablename__ = "class_subjects"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    class_id   = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)

    __table_args__ = (
        UniqueConstraint("class_id", "subject_id", name="uq_class_subject"),
    )
