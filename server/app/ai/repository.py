import os
from typing import Any

import logging

import psycopg2
from psycopg2 import errors as pg_errors
from psycopg2.extras import Json

logger = logging.getLogger(__name__)

from app.ai.config import Config

DB_CONFIG = {
    "host": Config.DB_HOST,
    "port": Config.DB_PORT,
    "dbname": Config.DB_NAME,
    "user": Config.DB_USER,
    "password": Config.DB_PASSWORD if Config.DB_PASSWORD else None,
}


def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)


def pgvector_try_register(conn) -> bool:
    """Register pgvector types on this connection (safe no-op if unavailable)."""
    try:
        from pgvector.psycopg2 import register_vector
    except ImportError:
        return False
    try:
        register_vector(conn)
        return True
    except Exception:
        return False


def ai_reports_vector_column_exists(conn) -> bool:
    try:
        with conn.cursor() as cur:
            return _ai_reports_summary_embedding_column_on_cursor(cur)
    except Exception:
        return False


def _ai_reports_summary_embedding_column_on_cursor(cur) -> bool:
    cur.execute(
        """
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'ai_reports'
              AND column_name = 'summary_embedding'
        )
        """
    )
    row = cur.fetchone()
    return bool(row and row[0])


def search_similar_ai_reports_excerpts(
    embedding: list[float],
    *,
    student_id: int,
    top_k: int,
    exclude_report_id: int | None = None,
) -> str:
    """
    Cosine nearest neighbours among teacher-approved reports for one student.
    Used for report generation (prior weeks) and optional parent-chat context.
    """
    from app.ai.report_embeddings import format_stored_report_excerpt

    conn = get_db_connection()
    try:
        if not pgvector_try_register(conn):
            return ""
        if not ai_reports_vector_column_exists(conn):
            return ""
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT week_number, term, summary, strengths, support_areas, recommendations
                    FROM ai_reports
                    WHERE teacher_approved = true
                      AND student_id = %s
                      AND summary_embedding IS NOT NULL
                      AND (%s IS NULL OR id <> %s)
                    ORDER BY summary_embedding <=> %s
                    LIMIT %s
                    """,
                    (
                        student_id,
                        exclude_report_id,
                        exclude_report_id,
                        embedding,
                        top_k,
                    ),
                )
                rows = cur.fetchall()
        except Exception as e:
            logger.warning("search_similar_ai_reports_excerpts failed: %s", e)
            return ""
    finally:
        conn.close()

    blocks: list[str] = []
    for row in rows:
        blocks.append(
            format_stored_report_excerpt(
                row[0], row[1], row[2], row[3], row[4], row[5]
            )
        )
    return "\n\n---\n\n".join(blocks) if blocks else ""


def get_all_student_ids() -> list[int]:
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM students ORDER BY id;")
            rows = cur.fetchall()
            return [row[0] for row in rows]
    finally:
        conn.close()


def list_students_brief(
    *,
    filter_teacher_id: int | None = None,
    filter_class_ids: list[int] | None = None,
) -> list[dict[str, Any]]:
    """
    Rows for the teacher report dropdown: `{id, name, class_name}`.
    If `filter_teacher_id` is set, restrict to students in classes with `classes.teacher_id`
    (column must exist — see server/migrations/add_classes_teacher_id.sql).
    Else if `filter_class_ids` is non-empty, restrict to those `students.class_id` values.
    Else return all students (joined with class for display).
    """
    conn = get_db_connection()
    try:
        if filter_teacher_id is not None:
            try:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        SELECT s.id, s.name, c.name
                        FROM students s
                        JOIN classes c ON s.class_id = c.id
                        WHERE c.teacher_id = %s
                        ORDER BY c.name, s.name
                        """,
                        (filter_teacher_id,),
                    )
                    rows = cur.fetchall()
                    return [
                        {"id": r[0], "name": r[1], "class_name": r[2]}
                        for r in rows
                    ]
            except pg_errors.UndefinedColumn:
                conn.rollback()
                logger.warning(
                    "classes.teacher_id missing — ignoring teacher filter. "
                    "Run server/migrations/add_classes_teacher_id.sql or use TEACHER_CLASS_IDS."
                )

        with conn.cursor() as cur:
            if filter_class_ids:
                placeholders = ",".join(["%s"] * len(filter_class_ids))
                cur.execute(
                    f"""
                    SELECT s.id, s.name, COALESCE(c.name, '')
                    FROM students s
                    LEFT JOIN classes c ON s.class_id = c.id
                    WHERE s.class_id IN ({placeholders})
                    ORDER BY c.name NULLS LAST, s.name
                    """,
                    tuple(filter_class_ids),
                )
            else:
                cur.execute(
                    """
                    SELECT s.id, s.name, COALESCE(c.name, '')
                    FROM students s
                    LEFT JOIN classes c ON s.class_id = c.id
                    ORDER BY c.name NULLS LAST, s.name
                    """
                )
            rows = cur.fetchall()
            return [
                {"id": r[0], "name": r[1], "class_name": r[2] or None}
                for r in rows
            ]
    finally:
        conn.close()


def fetch_student_profile(student_id: int) -> dict[str, Any] | None:
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    s.id,
                    s.name,
                    c.name,
                    c.grade_level,
                    p.id,
                    p.name,
                    p.preferred_language,
                    CASE
                        WHEN lower(coalesce(p.notifications->>'prefers_voice', ''))
                             IN ('true', 't', '1', 'yes')
                        THEN true
                        ELSE false
                    END
                FROM students s
                JOIN parents p ON s.parent_id = p.id
                JOIN classes c ON s.class_id = c.id
                WHERE s.id = %s
                """,
                (student_id,),
            )
            row = cur.fetchone()

            if not row:
                return None

            return {
                "student_id": row[0],
                "student_name": row[1],
                "class_name": row[2],
                "grade_level": row[3],
                "parent": {
                    "parent_id": row[4],
                    "parent_name": row[5],
                    "preferred_language": row[6],
                    "prefers_voice": row[7],
                },
            }
    finally:
        conn.close()


def fetch_student_weekly_records(student_id: int) -> list[dict[str, Any]]:
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    id,
                    student_id,
                    week_number,
                    term,
                    subject,
                    grade,
                    score,
                    trend,
                    participation,
                    concerns,
                    teacher_comment
                FROM weekly_records
                WHERE student_id = %s
                ORDER BY week_number, term, subject
                """,
                (student_id,),
            )
            rows = cur.fetchall()

            records: list[dict[str, Any]] = []
            for row in rows:
                grade = row[5]
                score = row[6]
                records.append(
                    {
                        "record_id": row[0],
                        "student_id": row[1],
                        "week_number": row[2],
                        "term": row[3],
                        "subject": row[4],
                        "grade": grade,
                        "skill": (grade or "").strip() if grade else "",
                        "score": float(score) if score is not None else None,
                        "trend": row[7],
                        "participation": row[8],
                        "concerns": row[9],
                        "teacher_comment": row[10],
                    }
                )

            return records
    finally:
        conn.close()


def _resolve_report_term(
    cur, student_id: int, week_number: int, fallback: str | None
) -> str:
    cur.execute(
        """
        SELECT term FROM weekly_records
        WHERE student_id = %s AND week_number = %s
        ORDER BY id DESC
        LIMIT 1
        """,
        (student_id, week_number),
    )
    row = cur.fetchone()
    if row and row[0]:
        return str(row[0])
    return fallback or os.getenv("DEFAULT_REPORT_TERM", "Term 2")


def fetch_student_payload(student_id: int) -> dict[str, Any] | None:
    profile = fetch_student_profile(student_id)
    if not profile:
        return None

    records = fetch_student_weekly_records(student_id)
    latest_week = max((record["week_number"] for record in records), default=0)

    return {
        "student": profile,
        "latest_week": latest_week,
        "weekly_records": records,
    }


def save_ai_report(
    report: dict[str, Any],
    *,
    auto_approve: bool | None = None,
) -> int:
    """
    auto_approve=None → use Config.AUTO_APPROVE_AI_REPORTS (e.g. CLI batch).
    auto_approve=False → teacher workflow: pending until POST .../approve-report.
    """
    use_auto = (
        Config.AUTO_APPROVE_AI_REPORTS if auto_approve is None else auto_approve
    )
    teacher_ok = use_auto
    sent_ok = use_auto
    status = "auto_approved" if use_auto else "pending_review"

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            week_number = int(report["week_number"])
            term = report.get("term")
            if not term:
                term = _resolve_report_term(
                    cur, int(report["student_id"]), week_number, None
                )

            cur.execute(
                """
                INSERT INTO ai_reports (
                    student_id,
                    week_number,
                    term,
                    summary,
                    strengths,
                    support_areas,
                    recommendations,
                    risk_level,
                    teacher_approved,
                    sent_to_parent,
                    status
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (student_id, week_number, term) DO UPDATE SET
                    summary = EXCLUDED.summary,
                    strengths = EXCLUDED.strengths,
                    support_areas = EXCLUDED.support_areas,
                    recommendations = EXCLUDED.recommendations,
                    risk_level = EXCLUDED.risk_level,
                    teacher_approved = EXCLUDED.teacher_approved,
                    sent_to_parent = EXCLUDED.sent_to_parent,
                    status = EXCLUDED.status
                RETURNING id
                """,
                (
                    report["student_id"],
                    week_number,
                    term,
                    report["parent_summary"],
                    Json(report["strengths"]),
                    Json(report["support_areas"]),
                    Json(report["parent_actions"]),
                    report["risk_level"],
                    teacher_ok,
                    sent_ok,
                    status,
                ),
            )
            report_id = cur.fetchone()[0]
            if teacher_ok and _ai_reports_summary_embedding_column_on_cursor(cur):
                pgvector_try_register(conn)
                from app.ai.report_embeddings import sync_ai_report_embedding

                try:
                    sync_ai_report_embedding(cur, report_id)
                except Exception as e:
                    logger.warning(
                        "ai_reports.summary_embedding sync failed for id=%s: %s",
                        report_id,
                        e,
                    )
        conn.commit()
        return report_id
    finally:
        conn.close()


def set_report_teacher_approved(
    report_id: int,
    *,
    sent_to_parent: bool = True,
    status: str = "approved",
) -> bool:
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE ai_reports
                SET teacher_approved = true,
                    sent_to_parent = %s,
                    status = %s
                WHERE id = %s
                """,
                (sent_to_parent, status, report_id),
            )
            updated = cur.rowcount > 0
            if updated and _ai_reports_summary_embedding_column_on_cursor(cur):
                pgvector_try_register(conn)
                from app.ai.report_embeddings import sync_ai_report_embedding

                try:
                    sync_ai_report_embedding(cur, report_id)
                except Exception as e:
                    logger.warning(
                        "summary_embedding sync after approve failed id=%s: %s",
                        report_id,
                        e,
                    )
        conn.commit()
        return updated
    finally:
        conn.close()


def fetch_pending_ai_reports() -> list[dict[str, Any]]:
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    ar.id,
                    ar.student_id,
                    s.name,
                    ar.week_number,
                    ar.term,
                    ar.summary,
                    ar.strengths,
                    ar.support_areas,
                    ar.recommendations,
                    ar.risk_level,
                    ar.status
                FROM ai_reports ar
                JOIN students s ON s.id = ar.student_id
                WHERE ar.teacher_approved = false
                ORDER BY ar.id DESC
                """
            )
            rows = cur.fetchall()
            out: list[dict[str, Any]] = []
            for row in rows:
                out.append(
                    {
                        "id": row[0],
                        "student_id": row[1],
                        "student_name": row[2],
                        "week_number": row[3],
                        "term": row[4],
                        "summary": row[5],
                        "strengths": row[6],
                        "support_areas": row[7],
                        "recommendations": row[8],
                        "risk_level": row[9],
                        "status": row[10],
                    }
                )
            return out
    finally:
        conn.close()


def fetch_ai_report_by_id(report_id: int) -> dict[str, Any] | None:
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    ar.id,
                    ar.student_id,
                    s.name,
                    ar.week_number,
                    ar.term,
                    ar.summary,
                    ar.strengths,
                    ar.support_areas,
                    ar.recommendations,
                    ar.risk_level,
                    ar.teacher_approved,
                    ar.sent_to_parent,
                    ar.status
                FROM ai_reports ar
                JOIN students s ON s.id = ar.student_id
                WHERE ar.id = %s
                """,
                (report_id,),
            )
            row = cur.fetchone()
            if not row:
                return None
            return {
                "id": row[0],
                "student_id": row[1],
                "student_name": row[2],
                "week_number": row[3],
                "term": row[4],
                "summary": row[5],
                "strengths": row[6],
                "support_areas": row[7],
                "recommendations": row[8],
                "risk_level": row[9],
                "teacher_approved": row[10],
                "sent_to_parent": row[11],
                "status": row[12],
            }
    finally:
        conn.close()


def update_ai_report_draft(
    report_id: int,
    *,
    summary: str | None = None,
    strengths: list[str] | None = None,
    support_areas: list[str] | None = None,
    recommendations: list[str] | None = None,
) -> bool:
    """Update fields on a report that is not yet teacher-approved."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT teacher_approved FROM ai_reports WHERE id = %s",
                (report_id,),
            )
            row = cur.fetchone()
            if not row or row[0]:
                return False

            sets: list[str] = []
            vals: list[Any] = []

            if summary is not None:
                sets.append("summary = %s")
                vals.append(summary)
            if strengths is not None:
                sets.append("strengths = %s")
                vals.append(Json(strengths))
            if support_areas is not None:
                sets.append("support_areas = %s")
                vals.append(Json(support_areas))
            if recommendations is not None:
                sets.append("recommendations = %s")
                vals.append(Json(recommendations))

            if not sets:
                return True

            vals.append(report_id)
            cur.execute(
                f"UPDATE ai_reports SET {', '.join(sets)} WHERE id = %s",
                vals,
            )
            updated = cur.rowcount > 0
        conn.commit()
        return updated
    finally:
        conn.close()


def fetch_latest_teacher_approved_report(student_id: int) -> dict[str, Any] | None:
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    id,
                    student_id,
                    week_number,
                    term,
                    summary,
                    strengths,
                    support_areas,
                    recommendations,
                    risk_level
                FROM ai_reports
                WHERE student_id = %s AND teacher_approved = true
                ORDER BY id DESC
                LIMIT 1
                """,
                (student_id,),
            )
            row = cur.fetchone()
            if not row:
                return None
            return {
                "id": row[0],
                "student_id": row[1],
                "week_number": row[2],
                "term": row[3],
                "summary": row[4],
                "strengths": row[5],
                "support_areas": row[6],
                "recommendations": row[7],
                "risk_level": row[8],
            }
    finally:
        conn.close()


def get_latest_ai_reports() -> list[dict[str, Any]]:
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    id,
                    student_id,
                    week_number,
                    term,
                    summary,
                    strengths,
                    support_areas,
                    recommendations,
                    risk_level,
                    teacher_approved,
                    sent_to_parent
                FROM ai_reports
                ORDER BY id DESC
                """
            )
            rows = cur.fetchall()

            reports = []
            for row in rows:
                rec = row[7]
                reports.append(
                    {
                        "id": row[0],
                        "student_id": row[1],
                        "week_number": row[2],
                        "term": row[3],
                        "summary": row[4],
                        "strengths": row[5],
                        "support_areas": row[6],
                        "recommendations": rec,
                        "parent_actions": rec,
                        "risk_level": row[8],
                        "teacher_approved": row[9],
                        "sent_to_parent": row[10],
                    }
                )
            return reports
    finally:
        conn.close()
