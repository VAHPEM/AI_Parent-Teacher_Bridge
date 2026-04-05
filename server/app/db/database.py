import os
from pathlib import Path
from urllib.parse import quote_plus

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker, declarative_base

_SERVER_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(_SERVER_ROOT / ".env")
load_dotenv()


def _database_url() -> str:
    url = os.getenv("DATABASE_URL", "").strip()
    if url:
        return url
    user = os.getenv("DB_USER", "postgres")
    password = os.getenv("DB_PASSWORD", "")
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5432")
    name = os.getenv("DB_NAME", "test")
    user_q = quote_plus(user)
    pass_q = quote_plus(password) if password else ""
    auth = f"{user_q}:{pass_q}@" if password else f"{user_q}@"
    return f"postgresql+psycopg2://{auth}{host}:{port}/{name}"


DATABASE_URL = _database_url()

try:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
except ModuleNotFoundError as e:
    if "psycopg2" in str(e).lower():
        raise RuntimeError(
            "PostgreSQL driver not installed. From the `server` directory run:\n"
            "  pip install -r requirements.txt\n"
            "(needs `psycopg2-binary`.)"
        ) from e
    raise

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
