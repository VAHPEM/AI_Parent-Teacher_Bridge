import json
import os
import re
from typing import Any

from dotenv import load_dotenv
from openai import OpenAI

from app.services.prompt_builder import build_prompt

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
    prompt = build_prompt(student_payload, rag_context=None)

    response = client.chat.completions.create(
        model=model,
        temperature=0.2,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an educational AI assistant powered by CurricuLLM. "
                    "Follow the user's JSON instructions exactly. "
                    "Return a single JSON object with keys 'report' and 'activities' only. "
                    "Do not use markdown code fences."
                ),
            },
            {"role": "user", "content": prompt},
        ],
    )

    content = (response.choices[0].message.content or "").strip()
    content = _strip_json_markdown(content)
    try:
        data = json.loads(content)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Model did not return valid JSON.\nRaw:\n{content}") from exc

    return _normalize_llm_payload(data)


def _normalize_llm_payload(data: Any) -> dict[str, Any]:
    """
    New shape: { "report": {...}, "activities": [...] }.
    Legacy flat report (single object with parent_summary / strengths) still supported.
    """
    if not isinstance(data, dict):
        return {"report": {}, "activities": []}
    if "report" in data and isinstance(data["report"], dict):
        acts = data.get("activities")
        if acts is None:
            acts = []
        if not isinstance(acts, list):
            acts = [acts] if isinstance(acts, dict) else []
        return {"report": data["report"], "activities": acts}
    return {"report": data, "activities": []}


def _strip_json_markdown(raw: str) -> str:
    """CurricuLLM sometimes wraps JSON in ```json ... ``` fences."""
    s = raw.strip()
    if s.startswith("```"):
        s = re.sub(r"^```(?:json)?\s*", "", s, flags=re.IGNORECASE)
        s = re.sub(r"\s*```\s*$", "", s)
    return s.strip()


def parent_chat_completion(
    report_context: str,
    parent_question: str,
    student_first_name: str,
    *,
    all_first_names: list[str] | None = None,
) -> str:
    client = _client()
    if not client:
        raise ValueError("CURRICULLM_API_KEY is not set")

    model = os.getenv("CURRICULLM_MODEL", "gpt-4o-mini")
    names = list(dict.fromkeys(all_first_names or [student_first_name]))
    names_label = ", ".join(names)

    if len(names) <= 1:
        system = (
            "You are a helpful school assistant for parents. "
            f"You only answer about the student {student_first_name} using the REPORT CONTEXT below. "
            "If the answer is not supported by the report context, say you do not have that detail "
            "and suggest they use Ask a Teacher for personal or sensitive topics. "
            "Be warm, concise, and clear. Do not invent grades or events."
        )
    else:
        system = (
            "You are a helpful school assistant for parents. "
            f"The parent has several children in this account: {names_label}. "
            "The REPORT CONTEXT has one section per child (each starts with a line like '=== Full Name ==='). "
            f"The parent may currently be viewing {student_first_name}'s screen, but you must answer using "
            "whichever child's section(s) apply. If the question is about one child, focus on that child. "
            "If it is about all children or compares them, use every section that has usable data. "
            "If a section says there is no usable report, do not invent details for that child. "
            "If it is unclear which child they mean, ask a short clarifying question. "
            "If the answer is not supported by the report context, say you do not have that detail "
            "and suggest Ask a Teacher for personal or sensitive topics. "
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
    fallback = (
        "I do not have enough in the progress summaries to answer that. Please ask your children's teacher."
        if len(names) > 1
        else "I do not have enough in the progress summary to answer that. Please ask your child's teacher."
    )
    return (response.choices[0].message.content or "").strip() or fallback
