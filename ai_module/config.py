import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()


class Config:
    """
    Centralized configuration for the application.
    """

    # -----------------------------
    # Database config
    # -----------------------------
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", 5432))
    DB_NAME: str = os.getenv("DB_NAME", "test")
    DB_USER: str = os.getenv("DB_USER", "postgres")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")

    # -----------------------------
    # CurricuLLM API config
    # -----------------------------
    CURRICULLM_API_KEY: str = os.getenv("CURRICULLM_API_KEY", "")
    CURRICULLM_BASE_URL: str = os.getenv(
        "CURRICULLM_BASE_URL",
        "https://api.curricullm.com/v1"
    )
    CURRICULLM_MODEL: str = os.getenv(
        "CURRICULLM_MODEL",
        "gpt-4o-mini"
    )

    # -----------------------------
    # RAG / vector store (pgvector in Postgres)
    # -----------------------------
    RAG_ENABLED: bool = os.getenv("RAG_ENABLED", "true").lower() == "true"
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
    EMBEDDING_DIMENSION: int = int(os.getenv("EMBEDDING_DIMENSION", "1536"))
    RAG_TOP_K: int = int(os.getenv("RAG_TOP_K", "5"))

    # -----------------------------
    # App settings
    # -----------------------------
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"