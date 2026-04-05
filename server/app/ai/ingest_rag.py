"""
Build FAISS index from server/app/ai/data/rag/*.txt|*.md.

Run from server directory:
  python -m app.ai.ingest_rag
"""

from pathlib import Path

from app.ai.rag_store import ingest_directory


def main() -> None:
    data_dir = Path(__file__).resolve().parent / "data" / "rag"
    data_dir.mkdir(parents=True, exist_ok=True)
    n = ingest_directory(data_dir)
    print(f"Ingested {n} chunk(s) from {data_dir}")


if __name__ == "__main__":
    main()
