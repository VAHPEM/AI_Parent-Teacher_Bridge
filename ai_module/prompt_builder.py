import json
from typing import Any


def build_prompt(student_payload: dict[str, Any]) -> str:
    """
    Convert student payload (from DB) into a structured prompt for CurricuLLM.
    """

    student = student_payload["student"]
    records = student_payload["weekly_records"]
    latest_week = student_payload["latest_week"]

    prompt = {
        "task": "Generate a weekly parent progress report from student learning records.",
        
        "instructions": [
            "Use simple, parent-friendly language.",
            "Focus on trends over time, not just individual scores.",
            "Identify strengths (improvements or consistent good performance).",
            "Identify support areas (declining scores, repeated struggles, or teacher concerns).",
    
            "Detect score trends over time.",
            "If a student's score decreases over 2 or more consecutive weeks in the same subject, treat it as a serious concern.",
    
            "Risk level rules:",
            "- High: clear downward trend OR consistently low scores OR serious teacher concerns.",
            "- Medium: some inconsistency or moderate difficulty.",
            "- Low: stable or improving performance.",
    
            "Parent actions should be simple and realistic.",
            "Set needs_teacher_followup to true if risk_level is high.",
        ],

        "output_format": {
            "student_id": "integer",
            "week_number": "integer",
            "strengths": ["string"],
            "support_areas": ["string"],
            "parent_summary": "string",
            "parent_actions": ["string"],
            "risk_level": "low | medium | high",
            "needs_teacher_followup": "boolean"
        },

        "student_profile": {
            "student_id": student["student_id"],
            "student_name": student["student_name"],
            "class_name": student["class_name"],
            "grade_level": student["grade_level"],
            "preferred_language": student["parent"]["preferred_language"]
        },

        "latest_week": latest_week,

        "weekly_records": _format_records(records)
    }

    return json.dumps(prompt, ensure_ascii=False, indent=2)


# -----------------------------
# Helper functions
# -----------------------------

def _format_records(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Clean and standardize records before sending to AI.
    """

    formatted = []

    for r in records:
        formatted.append({
            "week": r["week_number"],
            "subject": r["subject"],
            "skill": r["skill"],
            "score": r["score"],
            "teacher_comment": r["teacher_comment"]
        })

    return formatted