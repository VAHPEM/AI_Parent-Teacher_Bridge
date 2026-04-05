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

    RAG_ENABLED: bool = os.getenv("RAG_ENABLED", "true").lower() == "true"
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
