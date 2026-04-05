import json
import os
import re
from typing import Any

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()


def _client() -> OpenAI | None:
    key = (os.getenv("CURRICULLM_API_KEY") or "").strip()
    if not key:
        return None
    return OpenAI(
        api_key=key,
        base_url=os.getenv("CURRICULLM_BASE_URL", "https://api.curricullm.com/v1"),
    )


def generate_parent_report_json(student_payload: dict[str, Any]) -> dict[str, Any]:
    client = _client()
    if not client:
        raise ValueError("CURRICULLM_API_KEY is not set")

    model = os.getenv("CURRICULLM_MODEL", "gpt-4o-mini")
    prompt = json.dumps(_build_report_prompt_body(student_payload), ensure_ascii=False, indent=2)

    response = client.chat.completions.create(
        model=model,
        temperature=0.2,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an educational AI assistant powered by CurricuLLM. "
                    "Generate a weekly parent progress report from student learning data. "
                    "Align suggestions with sound curriculum practice (e.g. ACARA-style outcomes where relevant). "
                    "Use simple parent-friendly language. "
                    "Return only valid JSON. Do not include markdown fences."
                ),
            },
            {"role": "user", "content": prompt},
        ],
    )

    content = (response.choices[0].message.content or "").strip()
    content = _strip_json_markdown(content)
    try:
        return json.loads(content)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Model did not return valid JSON.\nRaw:\n{content}") from exc


def _strip_json_markdown(raw: str) -> str:
    """CurricuLLM sometimes wraps JSON in ```json ... ``` fences."""
    s = raw.strip()
    if s.startswith("```"):
        s = re.sub(r"^```(?:json)?\s*", "", s, flags=re.IGNORECASE)
        s = re.sub(r"\s*```\s*$", "", s)
    return s.strip()


def parent_chat_completion(report_context: str, parent_question: str, student_first_name: str) -> str:
    client = _client()
    if not client:
        raise ValueError("CURRICULLM_API_KEY is not set")

    model = os.getenv("CURRICULLM_MODEL", "gpt-4o-mini")
    system = (
        "You are a helpful school assistant for parents. "
        f"You only answer about the student {student_first_name} using the REPORT CONTEXT below. "
        "If the answer is not supported by the report context, say you do not have that detail "
        "and suggest they use Ask a Teacher for personal or sensitive topics. "
        "Be warm, concise, and clear. Do not invent grades or events."
    )
    user = f"REPORT CONTEXT:\n{report_context}\n\nPARENT QUESTION:\n{parent_question}"

    response = client.chat.completions.create(
        model=model,
        temperature=0.3,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    )
    return (response.choices[0].message.content or "").strip() or (
        "I do not have enough in the progress summary to answer that. Please ask your child's teacher."
    )


def _build_report_prompt_body(student_payload: dict[str, Any]) -> dict[str, Any]:
    student = student_payload["student"]
    latest_week = student_payload["latest_week"]
    records = student_payload["weekly_records"]

    return {
        "task": "Create a weekly parent report for one student.",
        "requirements": [
            "Identify strengths based on positive performance or improvement trends.",
            "Identify support areas based on low scores, repeated struggles, or concerning comments.",
            "Write parent_summary as a rich paragraph (not a single generic sentence): weave in themes from weekly_records and teacher_comment where relevant.",
            "Suggest 3–6 concrete parent_actions (short bullet strings).",
            "curriculum_ref: one sentence naming the main curriculum strand / achievement standard focus (e.g. ACARA numeracy, literacy) inferred from the subjects in weekly_records.",
            "Set risk_level as low, medium, or high (student learning risk).",
            "Set needs_teacher_followup to true only when teacher intervention is likely needed.",
        ],
        "return_json_schema": {
            "student_id": "integer",
            "week_number": "integer",
            "strengths": ["string"],
            "support_areas": ["string"],
            "parent_summary": "string",
            "parent_actions": ["string"],
            "curriculum_ref": "string",
            "risk_level": "low | medium | high",
            "needs_teacher_followup": "boolean",
        },
        "student_profile": {
            "student_id": student["student_id"],
            "student_name": student["student_name"],
            "class_name": student["class_name"],
            "grade_level": student["grade_level"],
            "preferred_language": student["parent"]["preferred_language"],
        },
        "latest_week": latest_week,
        "weekly_records": records,
    }
