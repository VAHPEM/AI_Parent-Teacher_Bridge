from sqlalchemy.orm import Session
from app.models.student import Student
from app.schemas.student import StudentCreate


class StudentService:
    @staticmethod
    def create_student(db: Session, payload: StudentCreate):
        existing = db.query(Student).filter(Student.student_code == payload.student_code).first()
        if existing:
            return None

        student = Student(
            student_code=payload.student_code,
            name=payload.name,
            class_id=payload.class_id,
            parent_id=payload.parent_id,
        )
        db.add(student)
        db.commit()
        db.refresh(student)
        return student

    @staticmethod
    def get_student_by_id(db: Session, student_id: int):
        return db.query(Student).filter(Student.id == student_id).first()
