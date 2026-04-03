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
    # App settings
    # -----------------------------
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"