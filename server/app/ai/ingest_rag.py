from pathlib import Path

from app.ai.config import Config
from app.ai.rag_store import ingest_directory


def main() -> None:
    data_dir = Path(__file__).resolve().parent / "data" / "rag"
    data_dir.mkdir(parents=True, exist_ok=True)

    if not (Config.CURRICULLM_API_KEY.strip() or Config.EMBEDDING_API_KEY.strip()):
        print(
            "Missing CURRICULLM_API_KEY or EMBEDDING_API_KEY in server/.env — ingest needs the embeddings API."
        )
        return

    txts = sorted(data_dir.glob("**/*.txt"))
    mds = sorted(data_dir.glob("**/*.md"))
    if not txts and not mds:
        print(
            f"No .txt or .md files under {data_dir}\n"
            "Add curriculum notes there, then run this again."
        )
        return

    try:
        n = ingest_directory(data_dir)
    except Exception as e:
        print(f"Ingest failed: {e}")
        raise

    if n == 0:
        print("Ingest produced 0 chunks (empty files?)")
        return

    print(
        f"Ingested {n} chunk(s) from {data_dir}\n"
        f"Index: {Config.RAG_FAISS_INDEX_PATH}\n"
        f"Chunks: {Config.RAG_CHUNKS_JSON_PATH}"
    )


if __name__ == "__main__":
    main()
