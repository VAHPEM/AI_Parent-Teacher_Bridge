from sqlalchemy.orm import Session
from app.models.student import Student
from app.schemas.student import StudentCreate


class StudentService:
    @staticmethod
    def create_student(db: Session, payload: StudentCreate):
        existing_student = db.query(Student).filter(
            Student.student_id == payload.student_id
        ).first()

        if existing_student:
            return None

        student = Student(
            student_id=payload.student_id,
            student_name=payload.student_name
        )

        db.add(student)
        db.commit()
        db.refresh(student)

        return student

    @staticmethod
    def get_student_by_student_id(db: Session, student_id: int):
        return db.query(Student).filter(Student.student_id == student_id).first()