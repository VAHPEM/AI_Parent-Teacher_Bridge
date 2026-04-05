import os
import json
from typing import Any
from dotenv import load_dotenv
from openai import OpenAI

from prompt_builder import build_prompt

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

    def generate_ai_output(
        self,
        student_payload: dict[str, Any],
        rag_context: str | None = None,
    ) -> dict[str, Any]:
        prompt = build_prompt(student_payload, rag_context)

        response = self.client.chat.completions.create(
            model=self.model,
            temperature=0,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an educational AI assistant. "
                        "Generate a weekly parent progress report and learning activities "
                        "from student learning data. "
                        "Use simple parent-friendly language. "
                        "Return only valid JSON. "
                        "Do not include markdown fences or extra explanation."
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
            parsed = json.loads(content)
        except json.JSONDecodeError as exc:
            raise ValueError(
                f"CurricuLLM did not return valid JSON.\nRaw response:\n{content}"
            ) from exc

        if not isinstance(parsed, dict):
            raise ValueError(f"Expected top-level JSON object, got: {type(parsed)}")

        if "report" not in parsed:
            raise ValueError(f"AI output missing 'report'. Raw response:\n{content}")

        if "activities" not in parsed:
            raise ValueError(f"AI output missing 'activities'. Raw response:\n{content}")

        if not isinstance(parsed["activities"], list):
            raise ValueError(f"'activities' must be a list. Raw response:\n{content}")

        return parsed