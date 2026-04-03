import os
import json
from typing import Any
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()


class CurricuLLMClient:
    def __init__(self) -> None:
        api_key = os.getenv("CURRICULLM_API_KEY")
        if not api_key:
            raise ValueError("Missing CURRICULLM_API_KEY in .env")

        self.model = os.getenv("CURRICULLM_MODEL", "gpt-4o-mini")
        self.client = OpenAI(
            api_key=api_key,
            base_url="https://api.curricullm.com/v1",
        )

    def generate_parent_report(self, student_payload: dict[str, Any]) -> dict[str, Any]:
        prompt = self._build_prompt(student_payload)

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

    def _build_prompt(self, student_payload: dict[str, Any]) -> str:
        student = student_payload["student"]
        latest_week = student_payload["latest_week"]
        records = student_payload["weekly_records"]

        prompt_body = {
            "task": "Create a weekly parent report for one student.",
            "requirements": [
                "Identify strengths based on positive performance or improvement trends.",
                "Identify support areas based on low scores, repeated struggles, or concerning comments.",
                "Write a short parent-friendly summary in simple language.",
                "Suggest realistic parent actions. Do not assume the parent can teach advanced concepts.",
                "Set risk_level as low, medium, or high.",
                "Set needs_teacher_followup to true only when teacher intervention is likely needed."
            ],
            "return_json_schema": {
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
                "preferred_language": student["parent"]["preferred_language"],
            },
            "latest_week": latest_week,
            "weekly_records": records,
        }

        return json.dumps(prompt_body, ensure_ascii=False, indent=2)