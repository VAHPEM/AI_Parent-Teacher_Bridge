import os
from typing import Any
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import Json

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 5432)),
    "dbname": os.getenv("DB_NAME", "test"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD"),
}


def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)


def get_all_student_ids() -> list[int]:
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM students ORDER BY id;")
            rows = cur.fetchall()
            return [row[0] for row in rows]
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
                    s.class_name,
                    s.grade_level,
                    p.id,
                    p.name,
                    p.preferred_language,
                    p.prefers_voice
                FROM students s
                JOIN parents p ON s.parent_id = p.id
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
                    subject,
                    skill,
                    score,
                    teacher_comment
                FROM weekly_records
                WHERE student_id = %s
                ORDER BY week_number, subject, skill
                """,
                (student_id,),
            )
            rows = cur.fetchall()

            records: list[dict[str, Any]] = []
            for row in rows:
                records.append(
                    {
                        "record_id": row[0],
                        "student_id": row[1],
                        "week_number": row[2],
                        "subject": row[3],
                        "skill": row[4],
                        "score": float(row[5]) if row[5] is not None else None,
                        "teacher_comment": row[6],
                    }
                )

            return records
    finally:
        conn.close()


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


def save_ai_report(report: dict[str, Any]) -> int:
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
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
                    confidence,
                    status,
                    teacher_approved,
                    sent_to_parent
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (
                    report["student_id"],
                    report["week_number"],
                    report.get("term"),
                    report["summary"],
                    Json(report["strengths"]),
                    Json(report["support_areas"]),
                    Json(report["recommendations"]),
                    report["risk_level"],
                    report.get("confidence", "medium"),
                    report.get("status", "draft"),
                    False,
                    False,
                ),
            )
            report_id = cur.fetchone()[0]
        conn.commit()
        return report_id
    finally:
        conn.close()


def save_activities(activities: list[dict[str, Any]]) -> None:
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            for activity in activities:
                cur.execute(
                    """
                    INSERT INTO activities (
                        student_id,
                        subject_id,
                        title,
                        type,
                        duration,
                        difficulty,
                        description,
                        steps,
                        ai_generated,
                        reference,
                        confidence,
                        completed
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        activity["student_id"],
                        activity.get("subject_id"),
                        activity["title"],
                        activity.get("type"),
                        activity.get("duration"),
                        activity.get("difficulty"),
                        activity.get("description"),
                        Json(activity.get("steps", [])),
                        activity.get("ai_generated", True),
                        activity.get("reference"),
                        activity.get("confidence", "medium"),
                        False,
                    ),
                )
        conn.commit()
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
                    confidence,
                    status,
                    teacher_approved,
                    sent_to_parent,
                    created_at
                FROM ai_reports
                ORDER BY id DESC
                """
            )
            rows = cur.fetchall()

            reports = []
            for row in rows:
                reports.append(
                    {
                        "id": row[0],
                        "student_id": row[1],
                        "week_number": row[2],
                        "term": row[3],
                        "summary": row[4],
                        "strengths": row[5],
                        "support_areas": row[6],
                        "recommendations": row[7],
                        "risk_level": row[8],
                        "confidence": row[9],
                        "status": row[10],
                        "teacher_approved": row[11],
                        "sent_to_parent": row[12],
                        "created_at": row[13],
                    }
                )
            return reports
    finally:
        conn.close()
