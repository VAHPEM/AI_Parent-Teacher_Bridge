"""
Load plain-text knowledge files into rag_documents (pgvector).

Usage:
  python ai_module/ingest_rag.py
  cd ai_module && python ingest_rag.py

Requires: sql/001_rag_pgvector.sql applied, CURRICULLM_API_KEY, DB_* env vars,
and: pip install -r requirements.txt (pgvector package).
"""

import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from rag_store import ingest_directory


def main() -> None:
    base = Path(__file__).resolve().parent
    data_dir = base / "data" / "rag"
    data_dir.mkdir(parents=True, exist_ok=True)
    n = ingest_directory(data_dir)
    print(f"Ingested {n} chunk(s) from {data_dir}")


if __name__ == "__main__":
    main()
