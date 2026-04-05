import os
from pathlib import Path

from dotenv import load_dotenv

# server/app/ai/config.py -> parents[2] == server/
_SERVER_ROOT = Path(__file__).resolve().parents[2]
_AI_ROOT = Path(__file__).resolve().parent
_RAG_DATA_DIR = _AI_ROOT / "data"

load_dotenv(_SERVER_ROOT / ".env")
load_dotenv(_AI_ROOT / ".env")
load_dotenv()


class Config:
    """Centralized settings for AI features (DB, CurricuLLM, RAG)."""

    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", 5432))
    DB_NAME: str = os.getenv("DB_NAME", "test")
    DB_USER: str = os.getenv("DB_USER", "postgres")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")

    CURRICULLM_API_KEY: str = os.getenv("CURRICULLM_API_KEY", "")
    CURRICULLM_BASE_URL: str = os.getenv(
        "CURRICULLM_BASE_URL",
        "https://api.curricullm.com/v1",
    )
    CURRICULLM_MODEL: str = os.getenv("CURRICULLM_MODEL", "gpt-4o-mini")
    # Embeddings often need a different OpenAI-compatible host than chat (CurricuLLM may not expose /v1/embeddings).
    EMBEDDING_BASE_URL: str = (
        os.getenv("EMBEDDING_BASE_URL", "").strip() or CURRICULLM_BASE_URL
    )
    EMBEDDING_API_KEY: str = os.getenv("EMBEDDING_API_KEY", "").strip()

    RAG_ENABLED: bool = os.getenv("RAG_ENABLED", "true").lower() == "true"
    # When true, retrieve RAG context from pgvector on ai_reports (same student, approved).
    RAG_USE_AI_REPORTS_PG: bool = (
        os.getenv("RAG_USE_AI_REPORTS_PG", "true").lower() == "true"
    )
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
    EMBEDDING_DIMENSION: int = int(os.getenv("EMBEDDING_DIMENSION", "1536"))
    RAG_TOP_K: int = int(os.getenv("RAG_TOP_K", "5"))
    RAG_FAISS_INDEX_PATH: str = os.getenv(
        "RAG_FAISS_INDEX",
        str(_RAG_DATA_DIR / "rag_index.faiss"),
    )
    RAG_CHUNKS_JSON_PATH: str = os.getenv(
        "RAG_CHUNKS_JSON",
        str(_RAG_DATA_DIR / "rag_chunks.json"),
    )

    AUTO_APPROVE_AI_REPORTS: bool = (
        os.getenv("AUTO_APPROVE_AI_REPORTS", "true").lower() == "true"
    )

    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # Scope /teacher/students to one teacher's classes (no auth yet — use env or query params).
    # Option A: add INTEGER column `teacher_id` on `classes`, set rows, then set TEACHER_ID=1
    _TEACHER_ID_RAW: str = os.getenv("TEACHER_ID", "").strip()
    TEACHER_ID: int | None = int(_TEACHER_ID_RAW) if _TEACHER_ID_RAW.isdigit() else None
    # Option B: comma-separated class IDs this teacher teaches, e.g. TEACHER_CLASS_IDS=1,2
    TEACHER_CLASS_IDS_RAW: str = os.getenv("TEACHER_CLASS_IDS", "").strip()

    @staticmethod
    def teacher_class_ids_list() -> list[int]:
        raw = Config.TEACHER_CLASS_IDS_RAW
        if not raw:
            return []
        out: list[int] = []
        for part in raw.split(","):
            p = part.strip()
            if p.isdigit():
                out.append(int(p))
        return out

    @staticmethod
    def parse_class_ids_query(raw: str | None) -> list[int] | None:
        if raw is None or not raw.strip():
            return None
        out: list[int] = []
        for part in raw.split(","):
            p = part.strip()
            if p.isdigit():
                out.append(int(p))
        return out or None
