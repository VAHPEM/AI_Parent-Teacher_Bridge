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
from app.models.chat_session import ChatSession
from app.models.message import ChatMessage
from app.models.parent_question import ParentQuestion
from app.models.question_reply import QuestionReply
from app.exceptions.app_exception import AppException
from app.services.translation_service import TranslationService
import logging
import random

logger = logging.getLogger(__name__)

COLORS = ["#2563EB", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#EC4899", "#14B8A6", "#F97316"]

SCHOOL_NAME = "Greenwood Primary School"

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
    {"type": "message", "text": "Your teacher replied to your question",       "time": "Yesterday"},
    {"type": "alert",   "text": "New English assessment available to review",  "time": "Yesterday"},
    {"type": "ai",      "text": "AI generated new home learning activities",   "time": "2 days ago"},
]

UPCOMING_EVENTS = [
    {"title": "Parent-Teacher Conference", "date": "April 10, 2026", "type": "meeting"},
    {"title": "Science Fair",              "date": "April 15, 2026", "type": "event"},
    {"title": "Term 2 Reports Released",   "date": "April 22, 2026", "type": "report"},
]

import random

def random_color(current_colors=None):
    colors = [
        "#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F",
        "#EDC948", "#B07AA1", "#FF9DA7", "#9C755F", "#BAB0AC"
    ]

    current_colors = current_colors or []
    available_colors = [c for c in colors if c not in current_colors]

    return random.choice(available_colors) if available_colors else None

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


def _assert_student_belongs_to_parent(db: Session, student_id: int, parent_id: int) -> None:
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise AppException("Student not found", 404)
    if student.parent_id != parent_id:
        raise AppException("Not allowed to access this student", 403)


class ParentService:

    @staticmethod
    def _get_parent_language(db: Session, parent_id: int) -> str:
        parent = db.query(Parent).filter(Parent.id == parent_id).first()
        return parent.preferred_language if parent and parent.preferred_language else "en"

    @staticmethod
    def _get_localized_text(content: str, original_content: str, original_language: str, pref_lang: str) -> str:
        logger.info(f"Formatting localized text | pref_lang: {pref_lang} | original_language: {original_language} | original_content: {original_content[:20] if original_content else 'None'} | content: {content[:20]}...")
        if pref_lang == "en":
            return content
        if original_language == pref_lang and original_content:
            logger.info(f"Found matching original_content for language {pref_lang}, returning original.")
            return original_content
        # If it's not missing and different languages, translate on the fly
        return TranslationService.translate_from_english(content, pref_lang)

    # ── Children ──────────────────────────────────────────────────────
    @staticmethod
    def get_parent_info(db: Session, parent_id: int) -> dict:
        parent = db.query(Parent).filter(Parent.id == parent_id).first()
        if not parent:
            raise AppException("Parent not found", 404)
        return {
            "id": parent.id,
            "name": parent.name,
            "initials": _initials(parent.name),
            "color": _color(parent.id),
        }
    @staticmethod
    def get_children(db: Session, parent_id: int) -> list:
        # Use outer joins so parents still see children even if class/teacher not assigned yet.
        rows = (
            db.query(Student, Class, Teacher)
            .outerjoin(Class, Student.class_id == Class.id)
            .outerjoin(Teacher, Class.teacher_id == Teacher.id)
            .filter(Student.parent_id == parent_id)
            .order_by(Student.id)
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
            class_name = student.class_name or (cls.name if cls else None) or "Unassigned class"
            year = student.grade_level or (cls.grade_level if cls else None) or "Year 5"
            teacher_name = teacher.name if teacher else "Unassigned teacher"
            result.append({
                "id":           student.id,
                "name":         student.name,
                "firstName":    student.name.split()[0],
                "initials":     _initials(student.name),
                "color":        _color(student.id),
                "year":         year,
                "class_name":   class_name,
                "teacher":      teacher_name,
                "school":       SCHOOL_NAME,
                "overallGrade": overall,
                "attendance":   "95%",
            })
        return result

    # ── Dashboard ─────────────────────────────────────────────────────
    @staticmethod
    def get_dashboard(db: Session, student_id: int, parent_id: int) -> dict:
        _assert_student_belongs_to_parent(db, student_id, parent_id)
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise AppException("Student not found", 404)

        pref_lang = ParentService._get_parent_language(db, student.parent_id)

        # For each week, get the latest (highest id) AI report
        max_id_per_week = (
            db.query(func.max(AIReport.id).label("max_id"))
            .filter(AIReport.student_id == student_id, AIReport.teacher_approved == True)
            .group_by(AIReport.week_number)
            .subquery()
        )
        weekly_reports = (
            db.query(AIReport)
            .filter(AIReport.id.in_(max_id_per_week))
            .order_by(AIReport.week_number)
            .all()
        )

        # Build per-week overall entries
        weekly_averages: list[float | None] = []
        for rpt in weekly_reports:
            records = (
                db.query(WeeklyRecord)
                .filter(
                    WeeklyRecord.student_id == student_id,
                    WeeklyRecord.week_number == rpt.week_number,
                )
                .all()
            )
            scores = [float(r.score) for r in records if r.score is not None]
            weekly_averages.append(sum(scores) / len(scores) if scores else None)

        recent_reports = []
        for i, rpt in enumerate(weekly_reports):
            avg = weekly_averages[i]
            grade = _grade_from_score(avg)
            # Trend: compare this week's avg to previous week's avg
            if i == 0 or weekly_averages[i - 1] is None or avg is None:
                trend = "stable"
            else:
                diff = avg - weekly_averages[i - 1]
                trend = "up" if diff > 5 else ("down" if diff < -5 else "stable")

            recent_reports.append({
                "week":            f"Week {rpt.week_number}",
                "grade":           grade,
                "trend":           trend,
                "summary":         rpt.summary or "",
                "recommendations": list(rpt.recommendations or [])[:3],
                "strengths":       list(rpt.strengths or [])[:2],
                "riskLevel":       rpt.risk_level or "low",
            })

        # AI insight from the latest week's report
        latest_report = weekly_reports[-1] if weekly_reports else None
        ai_insight = (
            latest_report.summary
            if latest_report
            else f"{student.name.split()[0]} is making progress this term."
        )

        result = {
            "recentReports":  recent_reports,
            "recentActivity": RECENT_ACTIVITY,
            "upcomingEvents": UPCOMING_EVENTS,
            "aiInsight":      ai_insight,
        }

        return TranslationService.translate_json(result, pref_lang, db) if pref_lang != "en" else result

    # ── Progress ──────────────────────────────────────────────────────
    @staticmethod
    def get_progress(db: Session, student_id: int, parent_id: int) -> dict:
        _assert_student_belongs_to_parent(db, student_id, parent_id)
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise AppException("Student not found", 404)

        pref_lang = ParentService._get_parent_language(db, student.parent_id)

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
        current_color = []
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
            color = random_color(current_color)
            current_color.append(color)
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
                "color":          color,
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

        result = {"subjects": subjects, "progressHistory": progress_history}
        return TranslationService.translate_json(result, pref_lang, db) if pref_lang != "en" else result

    # ── Activities ────────────────────────────────────────────────────
    @staticmethod
    def get_activities(db: Session, student_id: int, parent_id: int) -> list:
        _assert_student_belongs_to_parent(db, student_id, parent_id)
        student = db.query(Student).filter(Student.id == student_id).first()
        pref_lang = ParentService._get_parent_language(db, student.parent_id) if student else "en"

        rows = (
            db.query(Activity)
            .join(AIReport, Activity.ai_report_id == AIReport.id)
            .filter(
                Activity.student_id == student_id,
                AIReport.teacher_approved == True,
            )
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

        return TranslationService.translate_json(result, pref_lang, db) if pref_lang != "en" else result

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
    def get_teachers(db: Session, student_id: int, parent_id: int) -> list:
        _assert_student_belongs_to_parent(db, student_id, parent_id)
        student = db.query(Student).filter(Student.id == student_id).first()
        cls = db.query(Class).filter(Class.id == student.class_id).first()
        teacher = db.query(Teacher).filter(Teacher.id == cls.teacher_id).first() if cls else None
        if not teacher:
            return []
        return [{
            "id":       teacher.id,
            "name":     teacher.name,
            "initials": _initials(teacher.name),
            "subject":  "Class Teacher",
            "school":   SCHOOL_NAME,
        }]

    # ── Messages (backed by parent_questions + replies) ───────────────
    @staticmethod
    def get_messages(db: Session, student_id: int, parent_id: int) -> list:
        teachers = ParentService.get_teachers(db, student_id, parent_id)
        pref_lang = ParentService._get_parent_language(db, parent_id)
        result = []
        for t in teachers:
            questions = (
                db.query(ParentQuestion)
                .filter(
                    ParentQuestion.student_id == student_id,
                    ParentQuestion.parent_id == parent_id,
                )
                .order_by(ParentQuestion.created_at)
                .all()
            )
            messages = []
            for q in questions:
                messages.append({
                    "id":         f"q-{q.id}",
                    "from_type":  "parent",
                    "from_id":    parent_id,
                    "text":       ParentService._get_localized_text(q.content, q.original_content, q.original_language, pref_lang),
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
                        "text":       ParentService._get_localized_text(r.content, r.original_content, r.original_language, pref_lang),
                        "created_at": str(r.created_at),
                    })
            result.append({
                "teacherId":   t["id"],
                "teacherName": t["name"],
                "messages":    messages,
            })
        return result

    @staticmethod
    def send_message(db: Session, student_id: int, teacher_id: int, text: str, parent_id: int) -> dict:
        _assert_student_belongs_to_parent(db, student_id, parent_id)
        pref_lang = ParentService._get_parent_language(db, parent_id)
        logger.info(f"Handling send_message | parent_id={parent_id} | pref_lang={pref_lang} | text={text[:20]}...")
        english_content = TranslationService.translate_to_english(text, pref_lang) if pref_lang != "en" else text
        logger.info(f"Saving send_message | english_content={english_content[:20]}...")

        q = ParentQuestion(
            parent_id=parent_id,
            student_id=student_id,
            content=english_content,
            original_content=text,
            original_language=pref_lang,
            priority="yellow",
        )
        db.add(q)
        db.commit()
        db.refresh(q)
        return {"message_id": f"q-{q.id}", "createdAt": str(q.created_at)}

    # ── Questions ─────────────────────────────────────────────────────
    @staticmethod
    def get_questions(db: Session, student_id: int, parent_id: int) -> list:
        _assert_student_belongs_to_parent(db, student_id, parent_id)
        pref_lang = ParentService._get_parent_language(db, parent_id)
        questions = (
            db.query(ParentQuestion)
            .filter(
                ParentQuestion.student_id == student_id,
                ParentQuestion.parent_id == parent_id,
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

            # Translate subject_name on the fly if needed (though we didn't save original subject)
            # Assuming subject_name is standard or we translate it
            if subject_name and pref_lang != "en":
                subject_name = TranslationService.translate_from_english(subject_name, pref_lang)

            result.append({
                "id":                  q.id,
                "subject":             subject_name,
                "content":             ParentService._get_localized_text(q.content, q.original_content, q.original_language, pref_lang),
                "priority":            q.priority,
                "status":              q.status,
                "createdAt":           str(q.created_at),
                "aiSuggestedResponse": q.ai_suggested_response,
                "replies": [
                    {
                        "id":         r.id,
                        "from_type":  r.from_role,
                        "from_id":    r.from_id,
                        "content":    ParentService._get_localized_text(r.content, r.original_content, r.original_language, pref_lang),
                        "created_at": str(r.created_at),
                    }
                    for r in replies
                ],
            })
        return result

    @staticmethod
    def create_question(db: Session, student_id: int, subject: str, content: str, priority: str, parent_id: int) -> dict:
        _assert_student_belongs_to_parent(db, student_id, parent_id)
        pref_lang = ParentService._get_parent_language(db, parent_id)
        logger.info(f"create_question | pref_lang={pref_lang} | subject={subject[:30]} | content={content[:30]}...")
        english_subject = TranslationService.translate_to_english(subject, pref_lang) if pref_lang != "en" else subject
        english_content = TranslationService.translate_to_english(content, pref_lang) if pref_lang != "en" else content
        logger.info(
            f"create_question | english_subject={english_subject[:30]} | english_content={english_content[:30]}...")

        # Look up or create subject by name
        subject_id = None
        if english_subject:
            subj = db.query(Subject).filter(Subject.subject_name == english_subject).first()
            if not subj:
                subj = Subject(subject_name=english_subject)
                db.add(subj)
                db.flush()
            subject_id = subj.id

        q = ParentQuestion(
            parent_id=parent_id,
            student_id=student_id,
            subject_id=subject_id,
            content=english_content,
            original_content=content,
            original_language=pref_lang,
            priority=priority,
            flag_reason=priority,
        )
        db.add(q)
        db.commit()
        db.refresh(q)
        return {"question_id": q.id, "status": q.status}

    @staticmethod
    def add_followup(db: Session, question_id: int, content: str, parent_id: int) -> dict:
        q = db.query(ParentQuestion).filter(ParentQuestion.id == question_id).first()
        if not q:
            raise AppException("Question not found", 404)
        if q.parent_id != parent_id:
            raise AppException("Not allowed to update this question", 403)

        pref_lang = ParentService._get_parent_language(db, parent_id)
        english_content = TranslationService.translate_to_english(content, pref_lang) if pref_lang != "en" else content

        reply = QuestionReply(
            question_id=question_id,
            from_role="parent",
            from_id=parent_id,
            content=english_content,
            original_content=content,
            original_language=pref_lang,
        )
        db.add(reply)
        db.commit()
        db.refresh(reply)
        return {"message_id": reply.id, "createdAt": str(reply.created_at)}

    # ── Settings ──────────────────────────────────────────────────────
    @staticmethod
    def get_settings(db: Session, parent_id: int) -> dict:
        parent = db.query(Parent).filter(Parent.id == parent_id).first()
        if not parent:
            raise AppException("Parent not found", 404)
        return {
            "name":               parent.name,
            "phone":              parent.phone,
            "preferred_language": parent.preferred_language,
            "notifications":      parent.notifications or {},
        }

    @staticmethod
    def update_settings(db: Session, language: str | None, notifications: dict | None, parent_id: int) -> dict:
        parent = db.query(Parent).filter(Parent.id == parent_id).first()
        if not parent:
            raise AppException("Parent not found", 404)
        if language:
            parent.preferred_language = language
        if notifications is not None:
            parent.notifications = notifications
        db.commit()
        return {"message": "Saved"}

    # ── AI Chat Sessions ──────────────────────────────────────────────
    @staticmethod
    def assert_chat_session(
        db: Session, session_id: int, student_id: int, parent_id: int
    ) -> ChatSession:
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not session:
            raise AppException("Chat session not found", 404)
        if session.student_id != student_id or session.parent_id != parent_id:
            raise AppException("Not allowed to use this chat session", 403)
        return session

    @staticmethod
    def get_chat_sessions(db: Session, student_id: int, parent_id: int) -> list:
        sessions = (
            db.query(ChatSession)
            .filter(ChatSession.student_id == student_id, ChatSession.parent_id == parent_id)
            .order_by(desc(ChatSession.created_at))
            .all()
        )
        return [
            {"id": s.id, "title": s.title or "New Chat", "language": s.language, "created_at": str(s.created_at)}
            for s in sessions
        ]

    @staticmethod
    def create_chat_session(db: Session, student_id: int, parent_id: int, language: str) -> dict:
        session = ChatSession(student_id=student_id, parent_id=parent_id, language=language)
        db.add(session)
        db.commit()
        db.refresh(session)
        return {"id": session.id, "title": session.title or "New Chat", "language": session.language, "created_at": str(session.created_at)}

    @staticmethod
    def get_session_messages(
        db: Session, session_id: int, student_id: int, parent_id: int
    ) -> list:
        ParentService.assert_chat_session(db, session_id, student_id, parent_id)
        msgs = (
            db.query(ChatMessage)
            .filter(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at)
            .all()
        )
        return [{"id": m.id, "role": m.role, "content": m.content, "created_at": str(m.created_at)} for m in msgs]

    @staticmethod
    def delete_chat_session(db: Session, session_id: int, parent_id: int) -> None:
        session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.parent_id == parent_id).first()
        if not session:
            raise AppException("Session not found", 404)
        db.delete(session)
        db.commit()

    @staticmethod
    def add_chat_message(db: Session, session_id: int, role: str, content: str) -> dict:
        msg = ChatMessage(session_id=session_id, role=role, content=content)
        db.add(msg)
        # Update session title from first parent message
        if role == "parent":
            session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
            if session and not session.title:
                session.title = content[:60]
        db.commit()
        db.refresh(msg)
        return {"id": msg.id, "role": msg.role, "content": msg.content, "created_at": str(msg.created_at)}

    # ── AI Chat Sessions v2 (parent-level, not per-student) ───────────
    @staticmethod
    def get_chat_sessions_v2(db: Session, parent_id: int) -> list:
        sessions = (
            db.query(ChatSession)
            .filter(ChatSession.parent_id == parent_id)
            .order_by(desc(ChatSession.created_at))
            .all()
        )
        return [
            {"id": s.id, "title": s.title or "New Chat", "language": s.language, "created_at": str(s.created_at)}
            for s in sessions
        ]

    @staticmethod
    def create_chat_session_v2(db: Session, parent_id: int, language: str) -> dict:
        session = ChatSession(student_id=None, parent_id=parent_id, language=language)
        db.add(session)
        db.commit()
        db.refresh(session)
        return {"id": session.id, "title": session.title or "New Chat", "language": session.language, "created_at": str(session.created_at)}

    @staticmethod
    def assert_chat_session_v2(db: Session, session_id: int, parent_id: int) -> ChatSession:
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not session:
            raise AppException("Chat session not found", 404)
        if session.parent_id != parent_id:
            raise AppException("Not allowed to use this chat session", 403)
        return session

    @staticmethod
    def get_session_messages_v2(db: Session, session_id: int, parent_id: int) -> list:
        ParentService.assert_chat_session_v2(db, session_id, parent_id)
        msgs = (
            db.query(ChatMessage)
            .filter(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at)
            .all()
        )
        return [{"id": m.id, "role": m.role, "content": m.content, "created_at": str(m.created_at)} for m in msgs]

