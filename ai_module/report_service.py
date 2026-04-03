from typing import Any

from db import fetch_student_payload, save_ai_report
from curricullm_client import CurricuLLMClient


client = CurricuLLMClient()


def generate_report_for_student(student_id: int) -> int:
    """
    End-to-end flow for one student:
    1. Fetch student data from DB
    2. Call CurricuLLM
    3. Validate / normalize AI output
    4. Apply deterministic risk rules
    5. Save into ai_reports

    Returns:
        report_id (int): inserted ai_reports.id
    """
    student_payload = fetch_student_payload(student_id)

    if not student_payload:
        raise ValueError(f"Student with id={student_id} not found.")

    ai_report = client.generate_parent_report(student_payload)
    validated_report = _validate_and_normalize_report(ai_report, student_payload)

    report_id = save_ai_report(validated_report)
    return report_id


def _validate_and_normalize_report(
    report: dict[str, Any],
    student_payload: dict[str, Any]
) -> dict[str, Any]:
    """
    Ensure required fields exist, normalize types/defaults,
    and override risk-related fields using deterministic rules.
    """
    latest_week = student_payload["latest_week"]
    db_student_id = student_payload["student"]["student_id"]

    calculated_risk, calculated_followup = _calculate_risk_from_records(student_payload)

    normalized = {
        "student_id": report.get("student_id", db_student_id),
        "week_number": report.get("week_number", latest_week),
        "strengths": _ensure_list_of_strings(report.get("strengths", [])),
        "support_areas": _ensure_list_of_strings(report.get("support_areas", [])),
        "parent_summary": str(report.get("parent_summary", "")).strip(),
        "parent_actions": _ensure_list_of_strings(report.get("parent_actions", [])),
        "risk_level": calculated_risk,
        "needs_teacher_followup": calculated_followup,
    }

    if not normalized["parent_summary"]:
        normalized["parent_summary"] = "No summary was generated for this student."

    return normalized


def _calculate_risk_from_records(student_payload: dict[str, Any]) -> tuple[str, bool]:
    """
    Rule-based risk detection.

    Rules:
    - High:
        - scores decrease across 3 or more consecutive records in the same subject
        - OR at least 3 low scores (<= 5.5)
        - OR strong negative teacher comments
    - Medium:
        - at least 2 low scores (<= 5.5)
        - OR moderate negative teacher comments
    - Low:
        - otherwise
    """
    records = student_payload["weekly_records"]

    subject_scores: dict[str, list[tuple[int, float]]] = {}
    negative_comment_count = 0
    strong_negative_comment_count = 0
    low_score_count = 0

    strong_negative_keywords = [
        "serious difficulty",
        "significant difficulty",
        "major difficulty",
        "very concerned",
        "urgent support",
        "struggles heavily",
        "far below",
        "at risk",
    ]

    moderate_negative_keywords = [
        "needs help",
        "needs support",
        "struggles",
        "difficulty",
        "challenging",
        "still needs help",
        "has difficulty",
    ]

    for record in records:
        subject = record.get("subject")
        score = record.get("score")
        week_number = record.get("week_number")
        teacher_comment = (record.get("teacher_comment") or "").lower()

        if score is not None and subject is not None and week_number is not None:
            score_float = float(score)
            subject_scores.setdefault(subject, []).append((int(week_number), score_float))

            if score_float <= 5.5:
                low_score_count += 1

        if any(keyword in teacher_comment for keyword in strong_negative_keywords):
            strong_negative_comment_count += 1
        elif any(keyword in teacher_comment for keyword in moderate_negative_keywords):
            negative_comment_count += 1

    for subject in subject_scores:
        subject_scores[subject].sort(key=lambda x: x[0])

    # Rule 1: clear decreasing trend in the same subject over 3+ records
    for subject, values in subject_scores.items():
        scores = [score for _, score in values]
        if len(scores) >= 3:
            strictly_decreasing = all(
                scores[i] > scores[i + 1] for i in range(len(scores) - 1)
            )
            if strictly_decreasing:
                return "high", True

    # Rule 2: repeated low scores
    if low_score_count >= 3:
        return "high", True

    # Rule 3: serious negative comments
    if strong_negative_comment_count >= 1:
        return "high", True

    # Rule 4: moderate concern
    if low_score_count >= 2 or negative_comment_count >= 2:
        return "medium", False

    return "low", False


def _ensure_list_of_strings(value: Any) -> list[str]:
    """
    Convert AI output into a clean list[str].
    """
    if value is None:
        return []

    if isinstance(value, list):
        cleaned = []
        for item in value:
            item_str = str(item).strip()
            if item_str:
                cleaned.append(item_str)
        return cleaned

    if isinstance(value, str):
        value = value.strip()
        return [value] if value else []

    value_str = str(value).strip()
    return [value_str] if value_str else []