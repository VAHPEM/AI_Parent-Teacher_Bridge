import json
from typing import Any

from openai import OpenAI

from app.ai.config import Config


class CurricuLLMClient:
    def __init__(self) -> None:
        if not Config.CURRICULLM_API_KEY:
            raise ValueError("Missing CURRICULLM_API_KEY in .env")

        self.model = Config.CURRICULLM_MODEL
        self.client = OpenAI(
            api_key=Config.CURRICULLM_API_KEY,
            base_url=Config.CURRICULLM_BASE_URL,
        )

    def generate_parent_report(
        self,
        student_payload: dict[str, Any],
        rag_context: str | None = None,
    ) -> dict[str, Any]:
        prompt = self._build_prompt(student_payload, rag_context)

        response = self.client.chat.completions.create(
            model=self.model,
            temperature=0.2,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an educational AI assistant. "
                        "Generate a weekly parent progress report from student learning data. "
                        "Use simple parent-friendly language. "
                        "Return only valid JSON. Do not include markdown fences."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
        )

        content = response.choices[0].message.content.strip()

        try:
            return json.loads(content)
        except json.JSONDecodeError as exc:
            raise ValueError(
                f"CurricuLLM did not return valid JSON.\nRaw response:\n{content}"
            ) from exc

    def _build_prompt(
        self,
        student_payload: dict[str, Any],
        rag_context: str | None = None,
    ) -> str:
        student = student_payload["student"]
        latest_week = student_payload["latest_week"]
        records = student_payload["weekly_records"]

        prompt_body: dict[str, Any] = {
            "task": "Create a weekly parent report for one student.",
            "requirements": [
                "Identify strengths based on positive performance or improvement trends.",
                "Identify support areas based on low scores, repeated struggles, or concerning comments.",
                "Write a short parent-friendly summary in simple language.",
                "Suggest realistic parent actions. Do not assume the parent can teach advanced concepts.",
                "Set risk_level as low, medium, or high.",
                "Set needs_teacher_followup to true only when teacher intervention is likely needed.",
            ],
            "return_json_schema": {
                "student_id": "integer",
                "week_number": "integer",
                "strengths": ["string"],
                "support_areas": ["string"],
                "parent_summary": "string",
                "parent_actions": ["string"],
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

        if rag_context and rag_context.strip():
            prompt_body["retrieved_knowledge_base_excerpts"] = rag_context.strip()
            prompt_body["requirements"].append(
                "When relevant, align parent-facing suggestions with the retrieved knowledge base excerpts. "
                "Do not contradict the student's actual weekly_records; excerpts are guidance only."
            )

        return json.dumps(prompt_body, ensure_ascii=False, indent=2)

    def answer_parent_question(
        self,
        *,
        student_name: str,
        student_id: int,
        approved_report_text: str,
        optional_kb_excerpts: str | None,
        parent_message: str,
    ) -> str:
        system = (
            "You help parents understand their child's progress at school. "
            "The section APPROVED_TEACHER_REPORT is the only authoritative source for facts "
            "about this child's progress, strengths, support areas, and recommendations. "
            "You are answering ONLY about the one student named in the user message (see STUDENT_CONTEXT). "
            "Never mention or discuss any other student by name (no classmates, no examples of other children). "
            "Optional reference excerpts are generic school guidance only: do not treat them as facts about this student "
            "and do not pull other children's names from them. "
            "If the parent asks something not covered in the approved report, say you do not "
            "have that information and suggest they message the teacher. "
            "Use warm, clear, non-judgmental language. Do not invent grades, events, or teacher quotes."
        )
        parts: list[str] = [
            "### STUDENT_CONTEXT",
            f"The parent's child is {student_name} (internal student_id={student_id}). "
            f"Every fact you state about progress must come from APPROVED_TEACHER_REPORT for this student only.",
            "",
            "### APPROVED_TEACHER_REPORT",
            approved_report_text.strip(),
        ]
        if optional_kb_excerpts and optional_kb_excerpts.strip():
            parts.extend(
                [
                    "",
                    "### Optional reference excerpts (secondary)",
                    optional_kb_excerpts.strip(),
                ]
            )
        parts.extend(["", "### Parent question", parent_message.strip()])
        user_content = "\n".join(parts)

        response = self.client.chat.completions.create(
            model=self.model,
            temperature=0.2,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user_content},
            ],
        )
        return (response.choices[0].message.content or "").strip()
