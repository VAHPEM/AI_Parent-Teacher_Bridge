from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os
from urllib.parse import quote_plus

load_dotenv()


def _resolve_database_url() -> str:
    explicit = (os.getenv("DATABASE_URL") or "").strip()
    if explicit:
        return explicit
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5432")
    name = os.getenv("DB_NAME", "test")
    user = os.getenv("DB_USER", "postgres")
    password = os.getenv("DB_PASSWORD", "") or ""
    if password:
        auth = f"{quote_plus(user)}:{quote_plus(password)}"
    else:
        auth = quote_plus(user)
    return f"postgresql+psycopg2://{auth}@{host}:{port}/{name}"


DATABASE_URL = _resolve_database_url()

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def apply_schema_patches(eng) -> None:
    """
    SQLAlchemy create_all() does not ALTER existing tables when new columns are added
    to models. Patch known columns so older databases stay compatible.
    """
    if eng.dialect.name != "postgresql":
        return
    with eng.begin() as conn:
        conn.execute(
            text("ALTER TABLE ai_reports ADD COLUMN IF NOT EXISTS teacher_notes TEXT")
        )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()