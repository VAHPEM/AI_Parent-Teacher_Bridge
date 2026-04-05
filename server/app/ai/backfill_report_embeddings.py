"""Backfill summary_embedding for existing ai_reports. Run from server/:

    python -m app.ai.backfill_report_embeddings
"""

from app.ai.config import Config
from app.ai.report_embeddings import sync_ai_report_embedding
from app.ai.repository import (
    ai_reports_vector_column_exists,
    get_db_connection,
    pgvector_try_register,
)


def main() -> None:
    if not (Config.CURRICULLM_API_KEY.strip() or Config.EMBEDDING_API_KEY.strip()):
        print("Set CURRICULLM_API_KEY or EMBEDDING_API_KEY for embeddings.")
        return
    conn = get_db_connection()
    try:
        if not pgvector_try_register(conn):
            print("pgvector Python adapter missing. pip install pgvector")
            return
        if not ai_reports_vector_column_exists(conn):
            print(
                "Column ai_reports.summary_embedding missing. "
                "Run server/migrations/add_ai_report_summary_embedding.sql"
            )
            return
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM ai_reports ORDER BY id")
            ids = [r[0] for r in cur.fetchall()]
    finally:
        conn.close()

    for rid in ids:
        c2 = get_db_connection()
        try:
            pgvector_try_register(c2)
            with c2.cursor() as cur:
                sync_ai_report_embedding(cur, rid)
            c2.commit()
            print(f"Embedded report id={rid}")
        finally:
            c2.close()

    print(f"Done ({len(ids)} row(s)).")


if __name__ == "__main__":
    main()
