from typing import Any

from db import fetch_student_payload, save_ai_report, save_activities
from curricullm_client import CurricuLLMClient


client = CurricuLLMClient()


def generate_report_for_student(student_id: int) -> int:
    """
    End-to-end flow for one student:
    1. Fetch student data from DB
    2. Call CurricuLLM
    3. Validate / normalize AI output
    4. Apply deterministic risk rules
    5. Save report into ai_reports
    6. Save activities into activities

    Returns:
        report_id (int): inserted ai_reports.id
    """
    student_payload = fetch_student_payload(student_id)

    if not student_payload:
        raise ValueError(f"Student with id={student_id} not found.")

    ai_output = client.generate_ai_output(student_payload)

    if "report" not in ai_output:
        raise ValueError("AI output missing 'report' key.")
    if "activities" not in ai_output:
        raise ValueError("AI output missing 'activities' key.")

    validated_report = _validate_report(ai_output["report"], student_payload)
    validated_activities = _validate_activities(ai_output["activities"], student_payload)

    report_id = save_ai_report(validated_report)
    save_activities(validated_activities)

    return report_id


def _validate_report(
    report: dict[str, Any],
    student_payload: dict[str, Any]
) -> dict[str, Any]:
    """
    Validate and normalize report object from AI output.
    Risk fields are overridden by deterministic rules.
    """
    latest_week = student_payload["latest_week"]
    db_student_id = student_payload["student"]["student_id"]

    risk_level, _ = _calculate_risk_from_records(student_payload)

    normalized = {
        "student_id": report.get("student_id", db_student_id),
        "week_number": report.get("week_number", latest_week),
        "term": str(report.get("term", "Term 1")).strip(),
        "summary": str(report.get("summary", "")).strip(),
        "strengths": _ensure_list_of_strings(report.get("strengths", [])),
        "support_areas": _ensure_list_of_strings(report.get("support_areas", [])),
        "recommendations": _ensure_list_of_strings(report.get("recommendations", [])),
        "risk_level": risk_level,
        "confidence": _normalize_confidence(report.get("confidence", "medium")),
        "status": _normalize_status(report.get("status", "draft")),
    }

    if not normalized["summary"]:
        normalized["summary"] = "No summary was generated for this student."

    return normalized


def _validate_activities(
    activities: list[dict[str, Any]],
    student_payload: dict[str, Any]
) -> list[dict[str, Any]]:
    """
    Validate and normalize activities list from AI output.

    Difficulty rules:
    - easy: parent can follow steps directly, reference optional
    - medium: parent can follow steps, reference should usually exist
    - hard: parent should not teach directly, prioritize reference, keep steps minimal
    """
    db_student_id = student_payload["student"]["student_id"]

    if not isinstance(activities, list):
        return []

    cleaned: list[dict[str, Any]] = []

    for activity in activities[:3]:
        difficulty = _normalize_difficulty(activity.get("difficulty", "medium"))
        steps = _ensure_list_of_strings(activity.get("steps", []))
        reference = str(activity.get("reference", "")).strip()

        if difficulty == "easy":
            # Easy: steps are primary, reference optional
            if not steps:
                steps = ["Follow the activity instructions together with the child."]
            # reference can stay empty

        elif difficulty == "medium":
            # Medium: steps + should usually have reference
            if not steps:
                steps = [
                    "Guide the child through the activity step by step.",
                    "Use the supporting material if the child needs extra help."
                ]
            if not reference:
                reference = "Use a teacher-provided worksheet, practice sheet, or sample exercise for extra support."

        elif difficulty == "hard":
            # Hard: parent should not be expected to teach directly
            # keep steps minimal, prioritize reference
            if not reference:
                reference = "Use a teacher-provided resource, exam example, or study document for independent review."
            if len(steps) > 2:
                steps = steps[:2]
            if not steps:
                steps = [
                    "Ask the child to review the provided reference material.",
                    "Encourage the child to note down questions for the teacher."
                ]

        cleaned.append({
            "student_id": activity.get("student_id", db_student_id),
            "subject_id": str(activity.get("subject_id", "General")).strip(),
            "title": str(activity.get("title", "Suggested Activity")).strip(),
            "type": str(activity.get("type", "practice")).strip(),
            "duration": str(activity.get("duration", "10 minutes")).strip(),
            "difficulty": difficulty,
            "description": str(activity.get("description", "")).strip(),
            "steps": steps,
            "ai_generated": bool(activity.get("ai_generated", True)),
            "reference": reference,
            "confidence": _normalize_confidence(activity.get("confidence", "medium")),
        })

    return cleaned


def _calculate_risk_from_records(student_payload: dict[str, Any]) -> tuple[str, bool]:
    """
    Rule-based risk detection.

    High:
    - clear decreasing trend over 3+ records in same subject
    - OR 3+ low scores
    - OR strong negative teacher comments

    Medium:
    - 2+ low scores
    - OR repeated moderate negative teacher comments

    Low:
    - otherwise
    """
    records = student_payload["weekly_records"]

    subject_scores: dict[str, list[tuple[int, float]]] = {}
    low_score_count = 0
    moderate_negative_comment_count = 0
    strong_negative_comment_count = 0

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
            moderate_negative_comment_count += 1

    for subject in subject_scores:
        subject_scores[subject].sort(key=lambda x: x[0])

    for _, values in subject_scores.items():
        scores = [score for _, score in values]
        if len(scores) >= 3:
            strictly_decreasing = all(
                scores[i] > scores[i + 1] for i in range(len(scores) - 1)
            )
            if strictly_decreasing:
                return "high", True

    if low_score_count >= 3:
        return "high", True

    if strong_negative_comment_count >= 1:
        return "high", True

    if low_score_count >= 2 or moderate_negative_comment_count >= 2:
        return "medium", False

    return "low", False


def _ensure_list_of_strings(value: Any) -> list[str]:
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


def _normalize_confidence(value: Any) -> str:
    value_str = str(value).strip().lower() if value is not None else "medium"
    if value_str in {"low", "medium", "high"}:
        return value_str
    return "medium"


def _normalize_status(value: Any) -> str:
    value_str = str(value).strip().lower() if value is not None else "draft"
    if value_str in {"draft", "reviewed", "sent"}:
        return value_str
    return "draft"


def _normalize_difficulty(value: Any) -> str:
    value_str = str(value).strip().lower() if value is not None else "medium"
    if value_str in {"easy", "medium", "hard"}:
        return value_str
    return "medium"