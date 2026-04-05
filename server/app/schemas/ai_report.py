from pydantic import BaseModel, Field


class AiReportPatchBody(BaseModel):
    summary: str | None = None
    strengths: list[str] | None = None
    support_areas: list[str] | None = None
    recommendations: list[str] | None = None

    model_config = {"extra": "forbid"}
