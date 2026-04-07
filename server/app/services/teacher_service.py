from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models.student import Student
from app.models.class_ import Class
from app.models.teacher import Teacher
from app.models.subject import Subject
from app.models.weekly_record import WeeklyRecord
from app.models.weekly_observation import WeeklyObservation
from app.models.assessment import Assessment
from app.models.assessment_score import AssessmentScore
from app.models.ai_report import AIReport
from app.models.parent_question import ParentQuestion
from app.models.parent import Parent
from app.models.question_reply import QuestionReply
from app.models.canvas_sync_log import CanvasSyncLog
from app.models.activity import Activity
from app.exceptions.app_exception import AppException
from app.services.ai_report_service import (
    assert_teacher_for_student,
    confidence_from_risk,
    create_ai_report_for_student,
    delete_stub_reports_for_class,
    generate_ai_reports_for_students_parallel,
)
from datetime import datetime

# Palette used to derive avatar colour from student/parent id
COLORS = ["#2563EB", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#EC4899", "#14B8A6", "#F97316"]

SCHOOL_NAME = "Greenwood Primary School"


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


def _time_ago(dt) -> str:
    if not dt:
        return ""
    delta = datetime.now() - dt
    if delta.days >= 1:
        return f"{delta.days}d ago"
    hours = delta.seconds // 3600
    if hours >= 1:
        return f"{hours}h ago"
    mins = delta.seconds // 60
    return f"{mins}m ago"


class TeacherService:

    # ── Dashboard ─────────────────────────────────────────────────────
    @staticmethod
    def get_dashboard(db: Session, teacher_id: int) -> dict:
        teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
        cls = db.query(Class).filter(Class.teacher_id == teacher_id).first()

        total_students = db.query(Student).filter(Student.class_id == cls.id).count()
        pending_reviews = db.query(AIReport).filter(AIReport.status.in_(["pending", "draft"])).count()
        flagged = db.query(ParentQuestion).filter(ParentQuestion.status == "open").count()

        # Performance chart: count students per band per week
        # Average each student's score across subjects for that week, then bucket
        all_student_ids = [s.id for s in db.query(Student.id).all()]
        week_nums = [
            r[0] for r in db.query(WeeklyRecord.week_number)
            .distinct()
            .order_by(WeeklyRecord.week_number)
            .all()
        ]
        performance = []
        for wk in week_nums:
            above = expected = approaching = below = 0
            for sid in all_student_ids:
                records = db.query(WeeklyRecord).filter(
                    WeeklyRecord.student_id == sid,
                    WeeklyRecord.week_number == wk,
                    WeeklyRecord.score.isnot(None),
                ).all()
                if not records:
                    continue
                avg = sum(float(r.score) for r in records) / len(records)
                if avg >= 80:
                    above += 1
                elif avg >= 60:
                    expected += 1
                elif avg >= 45:
                    approaching += 1
                else:
                    below += 1
            performance.append({
                "week":          f"Wk {wk}",
                "aboveExpected": above,
                "expected":      expected,
                "approaching":   approaching,
                "below":         below,
            })

        # Recent AI analysis
        ai_rows = (
            db.query(AIReport, Student)
            .join(Student, AIReport.student_id == Student.id)
            .order_by(desc(AIReport.created_at))
            .limit(5)
            .all()
        )
        recent_analysis = [TeacherService._format_ai_report(r, s, []) for r, s in ai_rows]

        # Flagged questions
        q_rows = (
            db.query(ParentQuestion, Parent, Student)
            .join(Parent, ParentQuestion.parent_id == Parent.id)
            .join(Student, ParentQuestion.student_id == Student.id)
            .filter(ParentQuestion.status == "open")
            .order_by(desc(ParentQuestion.created_at))
            .limit(3)
            .all()
        )
        flagged_questions = [TeacherService._format_question_flat(q, p, s, db) for q, p, s in q_rows]

        teacher_name = teacher.name if teacher else "Teacher"
        return {
            "teacherName": teacher_name,
            "school":      SCHOOL_NAME,
            "stats": {
                "totalStudents":  total_students,
                "pendingReviews": pending_reviews,
                "aiHandled":      85,
                "flagged":        flagged,
            },
            "performance":      performance,
            "recentAnalysis":   recent_analysis,
            "flaggedQuestions": flagged_questions,
        }

    # ── Classes ───────────────────────────────────────────────────────
    @staticmethod
    def get_classes(db: Session, teacher_id: int | None = None) -> list:
        query = db.query(Class)
        if teacher_id is not None:
            query = query.filter(Class.teacher_id == teacher_id)
        classes = query.order_by(Class.id).all()
        result = []
        for cls in classes:
            teacher = db.query(Teacher).filter(Teacher.id == cls.teacher_id).first()
            students = db.query(Student).filter(Student.class_id == cls.id).all()
            grades = []
            for s in students:
                latest = (
                    db.query(WeeklyRecord)
                    .filter(WeeklyRecord.student_id == s.id)
                    .order_by(desc(WeeklyRecord.week_number))
                    .first()
                )
                if latest:
                    grades.append(_grade_from_score(latest.score))
            avg_score = None
            scores = [
                float(r.score) for s in students
                for r in [db.query(WeeklyRecord).filter(WeeklyRecord.student_id == s.id).order_by(desc(WeeklyRecord.week_number)).first()]
                if r and r.score is not None
            ]
            avg_grade = _grade_from_score(sum(scores) / len(scores) if scores else None)
            result.append({
                "id":           cls.id,
                "name":         cls.name,
                "grade_level":  cls.grade_level or "",
                "teacher":      teacher.name if teacher else "",
                "studentCount": len(students),
                "avgGrade":     avg_grade,
                "trending":     "up",
            })
        return result

    @staticmethod
    def get_class_students(db: Session, class_id: int) -> list:
        students = db.query(Student).filter(Student.class_id == class_id).all()
        result = []
        for s in students:
            latest = (
                db.query(WeeklyRecord)
                .filter(WeeklyRecord.student_id == s.id)
                .order_by(desc(WeeklyRecord.week_number))
                .first()
            )
            prev = (
                db.query(WeeklyRecord)
                .filter(WeeklyRecord.student_id == s.id)
                .order_by(desc(WeeklyRecord.week_number))
                .offset(1).first()
            )
            grade = _grade_from_score(latest.score if latest else None)
            trend = "stable"
            if latest and prev and latest.score and prev.score:
                diff = float(latest.score) - float(prev.score)
                trend = "up" if diff > 5 else ("down" if diff < -5 else "stable")
            result.append({
                "id":       s.id,
                "name":     s.name,
                "initials": _initials(s.name),
                "color":    _color(s.id),
                "grade":    grade,
                "trend":    trend,
            })
        return result

    # ── Grade Entry ───────────────────────────────────────────────────
    @staticmethod
    def get_assessments(db: Session, class_id: int, week: int, subject: str, term: str) -> list:
        subj = db.query(Subject).filter(Subject.subject_name == subject).first()
        if not subj:
            return []
        assessments = (
            db.query(Assessment)
            .filter(
                Assessment.subject_id == subj.id,
                Assessment.week_number == week,
                Assessment.term == term,
            )
            .order_by(Assessment.id)
            .all()
        )
        return [
            {
                "id":              a.id,
                "assessment_name": a.assessment_name,
                "assessment_type": a.assessment_type,
                "max_score":       float(a.max_score) if a.max_score else None,
                "week_number":     a.week_number,
                "term":            a.term,
            }
            for a in assessments
        ]

    @staticmethod
    def get_grade_entry(db: Session, class_id: int, assessment_id: int, week: int, subject: str, term: str) -> list:
        subj = db.query(Subject).filter(Subject.subject_name == subject).first()
        subject_id = subj.id if subj else None

        students = db.query(Student).filter(Student.class_id == class_id).all()
        result = []
        for s in students:
            score_row = (
                db.query(AssessmentScore)
                .filter(
                    AssessmentScore.assessment_id == assessment_id,
                    AssessmentScore.student_id == s.id,
                )
                .first()
            )
            obs = (
                db.query(WeeklyObservation)
                .filter(
                    WeeklyObservation.student_id == s.id,
                    WeeklyObservation.week_number == week,
                    WeeklyObservation.subject_id == subject_id,
                )
                .first()
            ) if subject_id else None

            score = float(score_row.score) if score_row and score_row.score else None
            concerns_raw = obs.concerns if obs and obs.concerns else ""
            result.append({
                "id":            s.id,
                "student_id":    s.id,
                "name":          s.name,
                "initials":      _initials(s.name),
                "grade":         _grade_from_score(score),
                "score":         score or 0,
                "participation": score_row.participation if score_row and score_row.participation else (obs.participation if obs else "Satisfactory"),
                "comment":       score_row.comment if score_row else "",
                "concerns":      [c for c in concerns_raw.split(",") if c] if concerns_raw else [],
            })
        return result

    @staticmethod
    def _recalculate_weekly_record(db: Session, student_id: int, week: int, subject: str, term: str) -> None:
        subj = db.query(Subject).filter(Subject.subject_name == subject).first()
        if not subj:
            return

        assessments = (
            db.query(Assessment)
            .filter(
                Assessment.subject_id == subj.id,
                Assessment.week_number == week,
                Assessment.term == term,
            )
            .all()
        )
        if not assessments:
            return

        assessment_ids = [a.id for a in assessments]
        scores = (
            db.query(AssessmentScore)
            .filter(
                AssessmentScore.student_id == student_id,
                AssessmentScore.assessment_id.in_(assessment_ids),
                AssessmentScore.score.isnot(None),
            )
            .all()
        )
        if not scores:
            return

        assessment_map = {a.id: a for a in assessments}
        total_score = 0.0
        total_max = 0.0
        comments = []

        for sc in scores:
            a = assessment_map.get(sc.assessment_id)
            max_s = float(a.max_score) if a and a.max_score else 100.0
            total_score += float(sc.score)
            total_max += max_s
            if sc.comment and sc.comment.strip():
                comments.append(sc.comment.strip())

        weighted_pct = round(total_score / total_max * 100, 1) if total_max > 0 else None
        combined_comment = "; ".join(comments) if comments else None

        existing = (
            db.query(WeeklyRecord)
            .filter(
                WeeklyRecord.student_id == student_id,
                WeeklyRecord.week_number == week,
                WeeklyRecord.subject == subject,
            )
            .first()
        )
        if existing:
            existing.score = weighted_pct
            if combined_comment:
                existing.teacher_comment = combined_comment
        else:
            db.add(WeeklyRecord(
                student_id=student_id,
                week_number=week,
                subject=subject,
                score=weighted_pct,
                teacher_comment=combined_comment,
            ))

    @staticmethod
    def _recalculate_weekly_observation(db: Session, student_id: int, week: int, subject_id: int, term: str) -> None:
        """Join participation from all assessment_scores this week/subject → weekly_observation.
        Same pattern as _recalculate_weekly_record joining teacher comments."""
        scores = (
            db.query(AssessmentScore)
            .join(Assessment, AssessmentScore.assessment_id == Assessment.id)
            .filter(
                AssessmentScore.student_id == student_id,
                Assessment.week_number == week,
                Assessment.term == term,
                Assessment.subject_id == subject_id,
                AssessmentScore.participation.isnot(None),
            )
            .order_by(Assessment.id)
            .all()
        )
        if not scores:
            return

        combined = "; ".join(s.participation for s in scores if s.participation)
        if not combined:
            return

        obs = (
            db.query(WeeklyObservation)
            .filter(
                WeeklyObservation.student_id == student_id,
                WeeklyObservation.week_number == week,
                WeeklyObservation.subject_id == subject_id,
            )
            .first()
        )
        if obs:
            obs.participation = combined
        else:
            db.add(WeeklyObservation(
                student_id=student_id,
                week_number=week,
                subject_id=subject_id,
                term=term,
                participation=combined,
            ))

    @staticmethod
    def save_grade_entry(db: Session, class_id: int, assessment_id: int, week: int, term: str, subject: str, entries: list, status: str) -> dict:
        subj = db.query(Subject).filter(Subject.subject_name == subject).first()
        subject_id = subj.id if subj else None

        for entry in entries:
            student_id = entry["student_id"]

            # Upsert assessment_score
            existing_score = (
                db.query(AssessmentScore)
                .filter(
                    AssessmentScore.assessment_id == assessment_id,
                    AssessmentScore.student_id == student_id,
                )
                .first()
            )
            auto_grade = _grade_from_score(entry.get("score"))
            participation = entry.get("participation")
            if existing_score:
                existing_score.score         = entry.get("score")
                existing_score.grade         = auto_grade
                existing_score.participation = participation
                existing_score.comment       = entry.get("comment")
            else:
                db.add(AssessmentScore(
                    assessment_id=assessment_id,
                    student_id=student_id,
                    score=entry.get("score"),
                    grade=auto_grade,
                    participation=participation,
                    comment=entry.get("comment"),
                ))

            # Upsert weekly_observation for concerns only (participation is aggregated below)
            concerns = entry.get("concerns") or []
            if subject_id and concerns:
                obs = (
                    db.query(WeeklyObservation)
                    .filter(
                        WeeklyObservation.student_id == student_id,
                        WeeklyObservation.week_number == week,
                        WeeklyObservation.subject_id == subject_id,
                    )
                    .first()
                )
                concerns_str = ",".join(concerns)
                if obs:
                    obs.concerns = concerns_str
                else:
                    db.add(WeeklyObservation(
                        student_id=student_id,
                        week_number=week,
                        subject_id=subject_id,
                        term=term,
                        concerns=concerns_str,
                    ))

        db.flush()

        for entry in entries:
            sid = entry["student_id"]
            TeacherService._recalculate_weekly_record(db, sid, week, subject, term)
            if subject_id:
                TeacherService._recalculate_weekly_observation(db, sid, week, subject_id, term)

        db.commit()
        return {"message": "Draft saved" if status == "draft" else "Submitted", "count": len(entries)}

    @staticmethod
    def generate_ai_reports_after_grade_submit(
        db: Session,
        teacher_id: int,
        class_id: int,
        term: str,
        student_ids: list[int],
    ) -> dict:
        """
        After grades are submitted, create CurricuLLM-backed ai_reports rows for affected students.
        Failures are collected per student so grade save is never rolled back.
        """
        cls = db.query(Class).filter(Class.id == class_id).first()
        if not cls or cls.teacher_id != teacher_id:
            return {
                "ok": False,
                "reason": "Teacher does not own this class",
                "created": [],
                "skipped": [],
            }

        seen: set[int] = set()
        skipped: list[dict] = []
        to_process: list[int] = []

        for sid in student_ids:
            if sid in seen:
                continue
            seen.add(sid)
            stu = (
                db.query(Student)
                .filter(Student.id == sid, Student.class_id == class_id)
                .first()
            )
            if not stu:
                skipped.append({"student_id": sid, "reason": "Student not in class"})
                continue
            to_process.append(sid)

        par_created, par_skipped = generate_ai_reports_for_students_parallel(
            to_process,
            term,
            reraise_server_error=False,
        )
        return {
            "ok": True,
            "created": par_created,
            "skipped": skipped + par_skipped,
        }

    # ── AI Analysis ───────────────────────────────────────────────────
    @staticmethod
    def _format_ai_report(report: AIReport, student: Student, activities: list) -> dict:
        merged_recs = list(report.recommendations or [])
        summary = (report.summary or "").strip()
        return {
            "id":            report.id,
            "avatar":        _initials(student.name),
            "avatarColor":   _color(student.id),
            "student":       student.name,
            "year":          student.grade_level or student.class_name or "",
            "subject":       None,
            "status":        report.status,
            "confidence":    confidence_from_risk(report.risk_level),
            "summary":       summary,
            "weakAreas":     list(report.support_areas or []),
            "recommendations": merged_recs,
            "curriculumRef": report.curriculum_ref or "",
            "practicePreview": (merged_recs + [summary or "See summary above."])[0],
            "timestamp":     _time_ago(report.created_at),
            "activities":    activities,
        }

    @staticmethod
    def get_ai_analysis(db: Session, teacher_id: int, confidence: str | None = None) -> list:
        rows = (
            db.query(AIReport, Student)
            .join(Student, AIReport.student_id == Student.id)
            .join(Class, Student.class_id == Class.id)
            .filter(Class.teacher_id == teacher_id)
            .order_by(desc(AIReport.created_at))
            .all()
        )
        # Batch-fetch activities for all reports to avoid N+1
        report_ids = [r.id for r, _ in rows]
        all_activities = (
            db.query(Activity)
            .filter(Activity.ai_report_id.in_(report_ids))
            .order_by(Activity.id)
            .all()
        ) if report_ids else []
        acts_by_report: dict[int, list] = {}
        for a in all_activities:
            acts_by_report.setdefault(a.ai_report_id, []).append({
                "id":           a.id,
                "title":        a.title or "",
                "type":         a.activity_type or "",
                "duration":     a.duration or "",
                "difficulty":   a.difficulty or "",
                "description":  a.description or "",
                "steps":        list(a.steps or []),
                "curriculumRef": a.curriculum_ref or "",
                "completed":    a.completed,
            })
        out = [
            TeacherService._format_ai_report(r, s, acts_by_report.get(r.id, []))
            for r, s in rows
        ]
        if confidence:
            c = confidence.lower()
            out = [x for x in out if (x.get("confidence") or "").lower() == c]
        return out

    @staticmethod
    def update_activity(
        db: Session,
        activity_id: int,
        title: str | None,
        description: str | None,
        steps: list[str] | None,
        curriculum_ref: str | None,
    ) -> dict:
        activity = db.query(Activity).filter(Activity.id == activity_id).first()
        if not activity:
            raise AppException("Activity not found", 404)
        if title is not None:
            activity.title = title
        if description is not None:
            activity.description = description
        if steps is not None:
            activity.steps = steps
        if curriculum_ref is not None:
            activity.curriculum_ref = curriculum_ref
        db.commit()
        return {
            "id":          activity.id,
            "title":       activity.title or "",
            "type":        activity.activity_type or "",
            "duration":    activity.duration or "",
            "difficulty":  activity.difficulty or "",
            "description": activity.description or "",
            "steps":       list(activity.steps or []),
            "curriculumRef": activity.curriculum_ref or "",
            "completed":   activity.completed,
        }

    @staticmethod
    def update_ai_analysis_status(
        db: Session,
        report_id: int,
        status: str,
        teacher_notes: str | None = None,
    ) -> dict:
        report = db.query(AIReport).filter(AIReport.id == report_id).first()
        if not report:
            raise AppException("Report not found", 404)
        report.status = status
        if status == "auto_approved":
            report.teacher_approved = True
            if teacher_notes and teacher_notes.strip():
                report.teacher_notes = teacher_notes.strip()
        elif status == "needs_revision":
            report.teacher_approved = False
            if teacher_notes and teacher_notes.strip():
                report.teacher_notes = teacher_notes.strip()
        db.commit()
        return {"id": report.id, "status": report.status}

    @staticmethod
    def revise_ai_report_content(
        db: Session,
        report_id: int,
        summary: str | None,
        recommendations: list[str] | None,
        support_areas: list[str] | None,
        curriculum_ref: str | None,
        teacher_notes: str | None,
    ) -> dict:
        report = db.query(AIReport).filter(AIReport.id == report_id).first()
        if not report:
            raise AppException("Report not found", 404)
        if summary is not None:
            report.summary = summary
        if recommendations is not None:
            report.recommendations = recommendations
        if support_areas is not None:
            report.support_areas = support_areas
        if curriculum_ref is not None:
            report.curriculum_ref = curriculum_ref
        if teacher_notes is not None:
            report.teacher_notes = teacher_notes
        report.status = "auto_approved"
        report.teacher_approved = True
        db.commit()
        student = db.query(Student).filter(Student.id == report.student_id).first()
        activities = db.query(Activity).filter(Activity.ai_report_id == report.id).order_by(Activity.id).all()
        acts = [{
            "id": a.id, "title": a.title or "", "type": a.activity_type or "",
            "duration": a.duration or "", "difficulty": a.difficulty or "",
            "description": a.description or "", "steps": list(a.steps or []),
            "curriculumRef": a.curriculum_ref or "", "completed": a.completed,
        } for a in activities]
        return TeacherService._format_ai_report(report, student, acts)

    @staticmethod
    def generate_student_ai_report(
        db: Session, teacher_id: int, student_id: int, term: str = "Term 2"
    ) -> dict:
        assert_teacher_for_student(db, teacher_id, student_id)
        row = create_ai_report_for_student(db, student_id, term=term)
        return {
            "id": row.id,
            "student_id": row.student_id,
            "week_number": row.week_number,
            "status": row.status,
            "risk_level": row.risk_level,
            "teacher_approved": row.teacher_approved,
        }

    # ── Flagged Questions ─────────────────────────────────────────────
    @staticmethod
    def _format_question_flat(q: ParentQuestion, parent: Parent, student: Student, db: Session) -> dict:
        subject_name = None
        if q.subject_id:
            subj = db.query(Subject).filter(Subject.id == q.subject_id).first()
            subject_name = subj.subject_name if subj else None
        replies = (
            db.query(QuestionReply)
            .filter(QuestionReply.question_id == q.id)
            .order_by(QuestionReply.created_at)
            .all()
        )
        # Look up teacher for this student's class
        cls = db.query(Class).filter(Class.id == student.class_id).first()
        teacher = db.query(Teacher).filter(Teacher.id == cls.teacher_id).first() if cls else None
        teacher_name = teacher.name if teacher else "Teacher"
        teacher_initials = _initials(teacher_name) if teacher else "T"
        return {
            "id":                   q.id,
            "avatar":               _initials(parent.name),
            "avatarColor":          _color(parent.id),
            "parentName":           parent.name,
            "parentInitials":       _initials(parent.name),
            "teacherName":          teacher_name,
            "teacherInitials":      teacher_initials,
            "childName":            student.name.split()[0],
            "studentName":          student.name,
            "priority":             q.priority,
            "status":               q.status,
            "subject":              subject_name,
            "question":             q.content,
            "aiSuggestedResponse":  q.ai_suggested_response or "",
            "flagReason":           q.flag_reason or q.priority,
            "flagIcon":             "🚩",
            "timestamp":            _time_ago(q.created_at),
            "createdAt":            str(q.created_at),
            "replies": [
                {
                    "id":         r.id,
                    "from_role":  r.from_role,
                    "content":    r.content,
                    "createdAt":  str(r.created_at),
                }
                for r in replies
            ],
        }

    @staticmethod
    def get_flagged_questions(db: Session) -> list:
        rows = (
            db.query(ParentQuestion, Parent, Student)
            .join(Parent, ParentQuestion.parent_id == Parent.id)
            .join(Student, ParentQuestion.student_id == Student.id)
            .order_by(desc(ParentQuestion.created_at))
            .all()
        )
        return [TeacherService._format_question_flat(q, p, s, db) for q, p, s in rows]

    @staticmethod
    def respond_to_question(db: Session, question_id: int, response: str, method: str, teacher_id: int) -> dict:
        q = db.query(ParentQuestion).filter(ParentQuestion.id == question_id).first()
        if not q:
            raise AppException("Question not found", 404)
        q.status = "answered"
        reply = QuestionReply(
            question_id=question_id,
            from_role="teacher",
            from_id=teacher_id,
            content=response,
        )
        db.add(reply)
        db.commit()
        return {"id": q.id, "status": "answered"}

    @staticmethod
    def schedule_call(db: Session, question_id: int) -> dict:
        q = db.query(ParentQuestion).filter(ParentQuestion.id == question_id).first()
        if not q:
            raise AppException("Question not found", 404)
        q.call_scheduled = True
        db.commit()
        return {"id": q.id, "callScheduled": True}

    # ── Reports (backed by ai_reports) ────────────────────────────────
    @staticmethod
    def get_reports(db: Session, teacher_id: int, class_id: int | None = None) -> dict:
        # Build the list of classes to include
        if class_id is not None:
            cls = db.query(Class).filter(Class.id == class_id, Class.teacher_id == teacher_id).first()
            if not cls:
                raise AppException("Class not found or not owned by this teacher", 404)
            classes = [cls]
        else:
            classes = db.query(Class).filter(Class.teacher_id == teacher_id).all()

        # Map class_id → class for fast lookup
        class_map = {c.id: c for c in classes}
        class_ids = list(class_map.keys())

        # Get all students in the relevant classes
        students = db.query(Student).filter(Student.class_id.in_(class_ids)).all() if class_ids else []
        student_map = {s.id: s for s in students}
        student_ids = [s.id for s in students]
        student_class_map = {s.id: s.class_id for s in students}

        reports = (
            db.query(AIReport)
            .filter(AIReport.student_id.in_(student_ids) if student_ids else False)
            .order_by(desc(AIReport.created_at))
            .all()
        )
        sent = [r for r in reports if r.sent_to_parent]
        return {
            "stats": {
                "generated": len(reports),
                "sent":      len(sent),
                "readRate":  94,
            },
            "reports": [
                {
                    "id":           r.id,
                    "title":        f"{student_map.get(r.student_id, {}).name or 'Unknown Student'} - {r.term or 'Term 2'} Week {r.week_number or '?'} AI Report",
                    "class_name":   getattr(class_map.get(student_class_map.get(r.student_id, -1)), "name", ""),
                    "term":         r.term or "Term 2",
                    "week_number":  r.week_number,
                    "status":       "sent" if r.sent_to_parent else ("ready" if r.teacher_approved else "draft"),
                    "studentCount": 1,
                    "generatedAt":  str(r.created_at) if r.created_at else None,
                    "sentAt":       None,
                }
                for r in reports
            ],
        }

    @staticmethod
    def generate_report(db: Session, teacher_id: int, class_id: int, term: str, week: int) -> dict:
        """
        One real AI report per student via CurricuLLM (api.curricullm.com), not placeholder rows.
        """
        cls = db.query(Class).filter(Class.id == class_id).first()
        if not cls:
            raise AppException("Class not found", 404)
        if cls.teacher_id != teacher_id:
            raise AppException("Not allowed to generate reports for this class", 403)

        removed_stubs = delete_stub_reports_for_class(db, class_id)

        students = db.query(Student).filter(Student.class_id == class_id).all()
        student_ids = [s.id for s in students]

        created_raw, skipped = generate_ai_reports_for_students_parallel(
            student_ids,
            term,
            reraise_server_error=True,
        )

        created = []
        for c in created_raw:
            rid = c["report_id"]
            r = db.query(AIReport).filter(AIReport.id == rid).first()
            created.append(
                {
                    "student_id": c["student_id"],
                    "report_id": rid,
                    "week_number": r.week_number if r else None,
                }
            )

        return {
            "generated": len(created),
            "skipped": skipped,
            "reports": created,
            "legacy_stub_reports_removed": removed_stubs,
            "term": term,
            "week_requested": week,
        }

    # ── Canvas Sync ───────────────────────────────────────────────────
    @staticmethod
    def get_canvas_status(db: Session) -> dict:
        latest = (
            db.query(CanvasSyncLog)
            .order_by(desc(CanvasSyncLog.synced_at))
            .first()
        )
        students = db.query(Student).count()
        records  = db.query(WeeklyRecord).count()
        return {
            "connected":   True,
            "school":      SCHOOL_NAME,
            "lastSyncAt":  str(latest.synced_at) if latest else None,
            "recordCount": latest.records_count if latest else 0,
            "stats": {
                "studentsSynced": students,
                "gradesUpdated":  records,
                "frequency":      "Daily",
            },
        }

    @staticmethod
    def get_canvas_history(db: Session) -> list:
        rows = (
            db.query(CanvasSyncLog)
            .order_by(desc(CanvasSyncLog.synced_at))
            .limit(10)
            .all()
        )
        return [
            {
                "id":      r.id,
                "date":    str(r.synced_at),
                "records": r.records_count,
                "status":  r.status,
                "trigger": r.trigger_type,
            }
            for r in rows
        ]

    @staticmethod
    def run_canvas_sync(db: Session) -> dict:
        records_count = db.query(WeeklyRecord).count()
        log = CanvasSyncLog(
            records_count=records_count,
            status="success",
            trigger_type="manual",
        )
        db.add(log)
        db.commit()
        return {"synced": True, "recordCount": records_count, "completedAt": str(log.synced_at)}
