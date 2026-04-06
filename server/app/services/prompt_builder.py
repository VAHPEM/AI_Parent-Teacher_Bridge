import json
from typing import Any


def build_prompt(
    student_payload: dict[str, Any],
    rag_context: str | None = None,
) -> str:
    """
    Convert student payload (from DB) into a structured prompt for CurricuLLM.
    """

    student = student_payload["student"]
    records = student_payload["weekly_records"]
    latest_week = student_payload["latest_week"]

    prompt: dict[str, Any] = {
        "task": "Generate a weekly parent progress report and supporting learning activities from student learning records.",
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
            "Parent recommendations should be simple and realistic. Do not assume parents can teach complex academic concepts.",
            "Generate 1 to 3 learning activities to help improve the student's weak areas.",
            "Activities should directly address the student's support areas.",
            "Difficulty definitions:",
            "- easy: the parent can directly follow the provided steps to guide the child. No external reference is required.",
            "- medium: the parent can still guide the child using the provided steps, but the activity should also include a helpful supporting reference when relevant.",
            "- hard: the topic is too difficult for the parent to guide directly. In this case, prioritize a useful reference for the child and do not rely on parent-led teaching steps.",
            "Activity rules by difficulty:",
            "- For easy activities, prioritize simple hands-on steps.",
            "- For medium activities, provide both steps and a useful reference.",
            "- For hard activities, prioritize reference material over parent-guided steps.",
            "- For hard activities, do not assume the parent can teach the concept.",
            "Confidence rules:",
            "- high: the activity clearly matches a support area and the guidance is specific.",
            "- medium: the activity is relevant but somewhat general.",
            "- low: the activity may be useful but is weakly matched or lacks enough context.",
            "IMPORTANT OUTPUT RULES:",
            "- Return exactly ONE JSON object.",
            "- The JSON must contain TWO keys: 'report' and 'activities'.",
            "- 'report' must be a single object.",
            "- 'activities' must be a list (array) of objects.",
            "- Do NOT include any explanation, markdown, or extra text.",
            "- Output MUST be valid JSON.",
        ],
        "output_format": {
            "report": {
                "student_id": "integer",
                "week_number": "integer",
                "term": "string",
                "summary": "string",
                "strengths": ["string"],
                "support_areas": ["string"],
                "recommendations": ["string"],
                "risk_level": "low | medium | high",
                "confidence": "low | medium | high",
                "status": "draft | reviewed | sent",
            },
            "activities": [
                {
                    "student_id": "integer",
                    "subject_id": "string",
                    "title": "string",
                    "type": "string",
                    "duration": "string",
                    "difficulty": "easy | medium | hard",
                    "description": "string",
                    "steps": ["string"],
                    "ai_generated": "boolean",
                    "reference": "string",
                    "confidence": "low | medium | high",
                }
            ],
        },
        "student_profile": {
            "student_id": student["student_id"],
            "student_name": student["student_name"],
            "class_name": student["class_name"],
            "grade_level": student["grade_level"],
            "preferred_language": student["parent"]["preferred_language"],
        },
        "latest_week": latest_week,
        "weekly_records": _format_records(records),
    }

    if rag_context and rag_context.strip():
        prompt["retrieved_knowledge_base_excerpts"] = rag_context.strip()
        prompt["instructions"].append(
            "When relevant, align activities and recommendations with the retrieved knowledge base excerpts. "
            "Do not contradict the student's actual weekly records; the excerpts are guidance only."
        )

    return json.dumps(prompt, ensure_ascii=False, indent=2)


def _format_records(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    formatted = []
    for r in records:
        formatted.append(
            {
                "week": r["week_number"],
                "subject": r["subject"],
                "skill": r["skill"],
                "score": r["score"],
                "teacher_comment": r["teacher_comment"],
            }
        )
    return formatted
