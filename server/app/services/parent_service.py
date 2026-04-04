from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models.student import Student
from app.models.class_ import Class
from app.models.teacher import Teacher
from app.models.subject import Subject
from app.models.parent import Parent
from app.models.weekly_record import WeeklyRecord
from app.models.weekly_observation import WeeklyObservation
from app.models.ai_report import AIReport
from app.models.activity import Activity
from app.models.message import ChatMessage
from app.models.parent_question import ParentQuestion
from app.models.question_reply import QuestionReply
from app.exceptions.app_exception import AppException

DEMO_PARENT_ID = 4

COLORS = ["#2563EB", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#EC4899", "#14B8A6", "#F97316"]

LEVEL_MAP = {
    "A":  ("Above Expected", "#10B981", "#D1FAE5"),
    "B+": ("Above Expected", "#10B981", "#D1FAE5"),
    "B":  ("Above Expected", "#10B981", "#D1FAE5"),
    "C+": ("At Expected",    "#F59E0B", "#FEF3C7"),
    "C":  ("At Expected",    "#F59E0B", "#FEF3C7"),
    "D":  ("Below Expected", "#EF4444", "#FEE2E2"),
    "E":  ("Below Expected", "#EF4444", "#FEE2E2"),
}

RECENT_ACTIVITY = [
    {"type": "report",  "text": "Week 8 Mathematics report added",           "time": "2 hours ago"},
    {"type": "message", "text": "Ms. Thompson replied to your question",      "time": "Yesterday"},
    {"type": "alert",   "text": "New English assessment available to review",  "time": "Yesterday"},
    {"type": "ai",      "text": "AI generated new home learning activities",   "time": "2 days ago"},
]

UPCOMING_EVENTS = [
    {"title": "Parent-Teacher Conference", "date": "April 10, 2026", "type": "meeting"},
    {"title": "Science Fair",              "date": "April 15, 2026", "type": "event"},
    {"title": "Term 2 Reports Released",   "date": "April 22, 2026", "type": "report"},
]


def _color(id: int) -> str:
    return COLORS[id % len(COLORS)]


def _initials(name: str) -> str:
    parts = name.strip().split()
    return (parts[0][0] + parts[-1][0]).upper() if len(parts) >= 2 else parts[0][:2].upper()


def _grade_from_score(score) -> str:
    if score is None:
        return "N/A"
    s = float(score)
    if s >= 90: return "A"
    if s >= 80: return "B+"
    if s >= 70: return "B"
    if s >= 60: return "C+"
    if s >= 50: return "C"
    if s >= 40: return "D"
    return "E"


def _trend_from_records(records: list) -> str:
    scored = [r for r in records if r.score is not None]
    if len(scored) < 2:
        return "stable"
    diff = float(scored[-1].score) - float(scored[-2].score)
    return "up" if diff > 5 else ("down" if diff < -5 else "stable")


class ParentService:

    # ── Children ──────────────────────────────────────────────────────
    @staticmethod
    def get_children(db: Session) -> list:
        rows = (
            db.query(Student, Class, Teacher)
            .join(Class, Student.class_id == Class.id)
            .join(Teacher, Class.teacher_id == Teacher.id)
            .filter(Student.parent_id == DEMO_PARENT_ID)
            .all()
        )
        result = []
        for student, cls, teacher in rows:
            records = (
                db.query(WeeklyRecord)
                .filter(WeeklyRecord.student_id == student.id)
                .order_by(WeeklyRecord.week_number)
                .all()
            )
            scores = [float(r.score) for r in records if r.score is not None]
            overall = _grade_from_score(scores[-1] if scores else None)
            result.append({
                "id":           student.id,
                "name":         student.name,
                "firstName":    student.name.split()[0],
                "initials":     _initials(student.name),
                "color":        _color(student.id),
                "year":         student.grade_level or cls.grade_level or "Year 5",
                "class_name":   student.class_name or cls.name,
                "teacher":      teacher.name,
                "school":       "Greenwood Primary School",
                "overallGrade": overall,
                "attendance":   "95%",
            })
        return result

    # ── Dashboard ─────────────────────────────────────────────────────
    @staticmethod
    def get_dashboard(db: Session, student_id: int) -> dict:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise AppException("Student not found", 404)

        latest_week = (
            db.query(func.max(WeeklyRecord.week_number))
            .filter(WeeklyRecord.student_id == student_id)
            .scalar() or 8
        )

        records = (
            db.query(WeeklyRecord)
            .filter(WeeklyRecord.student_id == student_id, WeeklyRecord.week_number == latest_week)
            .all()
        )

        report = (
            db.query(AIReport)
            .filter(AIReport.student_id == student_id, AIReport.week_number == latest_week)
            .first()
        )

        recent_reports = []
        for r in records:
            recs = list(report.recommendations or []) if report else []
            all_records_for_subject = (
                db.query(WeeklyRecord)
                .filter(WeeklyRecord.student_id == student_id, WeeklyRecord.subject == r.subject)
                .order_by(WeeklyRecord.week_number)
                .all()
            )
            trend = _trend_from_records(all_records_for_subject)
            obs = (
                db.query(WeeklyObservation)
                .filter(
                    WeeklyObservation.student_id == student_id,
                    WeeklyObservation.week_number == latest_week,
                )
                .first()
            )
            comment = obs.teacher_comment if obs else r.teacher_comment or ""
            recent_reports.append({
                "subject":           r.subject,
                "grade":             _grade_from_score(r.score),
                "trend":             trend,
                "comment":           comment,
                "aiRecommendations": recs[:3],
                "week":              f"Week {r.week_number}",
            })

        ai_insight = (
            report.summary
            if report
            else f"{student.name.split()[0]} is making progress this term."
        )

        return {
            "recentReports":  recent_reports,
            "recentActivity": RECENT_ACTIVITY,
            "upcomingEvents": UPCOMING_EVENTS,
            "aiInsight":      ai_insight,
        }

    # ── Progress ──────────────────────────────────────────────────────
    @staticmethod
    def get_progress(db: Session, student_id: int) -> dict:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise AppException("Student not found", 404)

        latest_week = (
            db.query(func.max(WeeklyRecord.week_number))
            .filter(WeeklyRecord.student_id == student_id)
            .scalar() or 8
        )

        records = (
            db.query(WeeklyRecord)
            .filter(WeeklyRecord.student_id == student_id, WeeklyRecord.week_number == latest_week)
            .all()
        )

        report = (
            db.query(AIReport)
            .filter(AIReport.student_id == student_id, AIReport.week_number == latest_week)
            .first()
        )

        strengths    = list(report.strengths or [])    if report else []
        support_areas = list(report.support_areas or []) if report else []
        ai_recs      = list(report.recommendations or []) if report else []
        curriculum_ref = report.curriculum_ref if report else ""

        subjects = []
        for r in records:
            score = float(r.score or 0)
            grade = _grade_from_score(r.score)
            level, lc, lb = LEVEL_MAP.get(grade, ("At Expected", "#F59E0B", "#FEF3C7"))
            all_records_for_subject = (
                db.query(WeeklyRecord)
                .filter(WeeklyRecord.student_id == student_id, WeeklyRecord.subject == r.subject)
                .order_by(WeeklyRecord.week_number)
                .all()
            )
            trend = _trend_from_records(all_records_for_subject)
            obs = (
                db.query(WeeklyObservation)
                .filter(
                    WeeklyObservation.student_id == student_id,
                    WeeklyObservation.week_number == latest_week,
                )
                .first()
            )
            teacher_comment = obs.teacher_comment if obs else r.teacher_comment or ""
            subjects.append({
                "name":           r.subject,
                "grade":          grade,
                "score":          score,
                "trend":          trend,
                "level":          level,
                "levelColor":     lc,
                "levelBg":        lb,
                "curriculumRef":  curriculum_ref,
                "teacherComment": teacher_comment,
                "weakAreas":      support_areas[:3],
                "strengths":      strengths[:2],
                "aiRecs":         ai_recs[:4],
                "classAverage":   65.0,
            })

        all_records = (
            db.query(WeeklyRecord)
            .filter(WeeklyRecord.student_id == student_id)
            .order_by(WeeklyRecord.week_number)
            .all()
        )
        weeks_seen: dict = {}
        for r in all_records:
            key = f"Wk {r.week_number}"
            if key not in weeks_seen:
                weeks_seen[key] = {"week": key}
            weeks_seen[key][r.subject] = float(r.score or 0)
        progress_history = list(weeks_seen.values())

        return {"subjects": subjects, "progressHistory": progress_history}

    # ── Activities ────────────────────────────────────────────────────
    @staticmethod
    def get_activities(db: Session, student_id: int) -> list:
        rows = (
            db.query(Activity)
            .filter(Activity.student_id == student_id)
            .order_by(Activity.id)
            .all()
        )
        result = []
        for a in rows:
            # Look up subject name
            subject_name = None
            if a.subject_id:
                subj = db.query(Subject).filter(Subject.id == a.subject_id).first()
                subject_name = subj.subject_name if subj else None
            result.append({
                "id":            a.id,
                "subject":       subject_name,
                "title":         a.title,
                "type":          a.activity_type,
                "duration":      a.duration,
                "difficulty":    a.difficulty,
                "description":   a.description,
                "steps":         list(a.steps or []),
                "questions":     [],
                "aiGenerated":   True,
                "curriculumRef": a.curriculum_ref,
                "confidence":    "medium",
                "completed":     a.completed,
            })
        return result

    @staticmethod
    def complete_activity(db: Session, activity_id: int) -> dict:
        activity = db.query(Activity).filter(Activity.id == activity_id).first()
        if not activity:
            raise AppException("Activity not found", 404)
        activity.completed = True
        db.commit()
        return {"id": activity.id, "completed": True}

    # ── Teachers ──────────────────────────────────────────────────────
    @staticmethod
    def get_teachers(db: Session, student_id: int) -> list:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise AppException("Student not found", 404)
        cls = db.query(Class).filter(Class.id == student.class_id).first()
        teacher = db.query(Teacher).filter(Teacher.id == cls.teacher_id).first() if cls else None
        if not teacher:
            return []
        return [{
            "id":       teacher.id,
            "name":     teacher.name,
            "initials": _initials(teacher.name),
            "subject":  "Class Teacher",
            "school":   "Greenwood Primary School",
        }]

    # ── Messages (backed by parent_questions + replies) ───────────────
    @staticmethod
    def get_messages(db: Session, student_id: int) -> list:
        teachers = ParentService.get_teachers(db, student_id)
        result = []
        for t in teachers:
            questions = (
                db.query(ParentQuestion)
                .filter(
                    ParentQuestion.student_id == student_id,
                    ParentQuestion.parent_id == DEMO_PARENT_ID,
                )
                .order_by(ParentQuestion.created_at)
                .all()
            )
            messages = []
            for q in questions:
                messages.append({
                    "id":         f"q-{q.id}",
                    "from_type":  "parent",
                    "from_id":    DEMO_PARENT_ID,
                    "text":       q.content,
                    "created_at": str(q.created_at),
                })
                replies = (
                    db.query(QuestionReply)
                    .filter(QuestionReply.question_id == q.id)
                    .order_by(QuestionReply.created_at)
                    .all()
                )
                for r in replies:
                    messages.append({
                        "id":         r.id,
                        "from_type":  r.from_role,
                        "from_id":    r.from_id,
                        "text":       r.content,
                        "created_at": str(r.created_at),
                    })
            result.append({
                "teacherId":   t["id"],
                "teacherName": t["name"],
                "messages":    messages,
            })
        return result

    @staticmethod
    def send_message(db: Session, student_id: int, teacher_id: int, text: str) -> dict:
        # Create a question (open-priority) so teacher can see it
        q = ParentQuestion(
            parent_id=DEMO_PARENT_ID,
            student_id=student_id,
            content=text,
            priority="yellow",
        )
        db.add(q)
        db.commit()
        db.refresh(q)
        return {"message_id": f"q-{q.id}", "createdAt": str(q.created_at)}

    # ── Questions ─────────────────────────────────────────────────────
    @staticmethod
    def get_questions(db: Session, student_id: int) -> list:
        questions = (
            db.query(ParentQuestion)
            .filter(
                ParentQuestion.student_id == student_id,
                ParentQuestion.parent_id == DEMO_PARENT_ID,
            )
            .order_by(desc(ParentQuestion.created_at))
            .all()
        )
        result = []
        for q in questions:
            replies = (
                db.query(QuestionReply)
                .filter(QuestionReply.question_id == q.id)
                .order_by(QuestionReply.created_at)
                .all()
            )
            # Get subject name if subject_id is set
            subject_name = None
            if q.subject_id:
                subj = db.query(Subject).filter(Subject.id == q.subject_id).first()
                subject_name = subj.subject_name if subj else None
            result.append({
                "id":                  q.id,
                "subject":             subject_name,
                "content":             q.content,
                "priority":            q.priority,
                "status":              q.status,
                "createdAt":           str(q.created_at),
                "aiSuggestedResponse": q.ai_suggested_response,
                "replies": [
                    {
                        "id":         r.id,
                        "from_type":  r.from_role,
                        "from_id":    r.from_id,
                        "content":    r.content,
                        "created_at": str(r.created_at),
                    }
                    for r in replies
                ],
            })
        return result

    @staticmethod
    def create_question(db: Session, student_id: int, subject: str, content: str, priority: str) -> dict:
        # Look up or create subject by name
        subject_id = None
        if subject:
            subj = db.query(Subject).filter(Subject.subject_name == subject).first()
            if not subj:
                subj = Subject(subject_name=subject)
                db.add(subj)
                db.flush()
            subject_id = subj.id

        q = ParentQuestion(
            parent_id=DEMO_PARENT_ID,
            student_id=student_id,
            subject_id=subject_id,
            content=content,
            priority=priority,
            flag_reason=priority,
        )
        db.add(q)
        db.commit()
        db.refresh(q)
        return {"question_id": q.id, "status": q.status}

    @staticmethod
    def add_followup(db: Session, question_id: int, content: str) -> dict:
        q = db.query(ParentQuestion).filter(ParentQuestion.id == question_id).first()
        if not q:
            raise AppException("Question not found", 404)
        reply = QuestionReply(
            question_id=question_id,
            from_role="parent",
            from_id=DEMO_PARENT_ID,
            content=content,
        )
        db.add(reply)
        db.commit()
        db.refresh(reply)
        return {"message_id": reply.id, "createdAt": str(reply.created_at)}

    # ── Settings ──────────────────────────────────────────────────────
    @staticmethod
    def get_settings(db: Session) -> dict:
        parent = db.query(Parent).filter(Parent.id == DEMO_PARENT_ID).first()
        if not parent:
            raise AppException("Parent not found", 404)
        return {
            "name":               parent.name,
            "phone":              parent.phone,
            "preferred_language": parent.preferred_language,
            "notifications":      parent.notifications or {},
        }

    @staticmethod
    def update_settings(db: Session, language: str | None, notifications: dict | None) -> dict:
        parent = db.query(Parent).filter(Parent.id == DEMO_PARENT_ID).first()
        if not parent:
            raise AppException("Parent not found", 404)
        if language:
            parent.preferred_language = language
        if notifications is not None:
            parent.notifications = notifications
        db.commit()
        return {"message": "Saved"}
