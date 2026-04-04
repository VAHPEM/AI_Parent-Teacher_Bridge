-- Run once against your app database (as a superuser if needed for CREATE EXTENSION).
-- psql: \i ai_module/sql/001_rag_pgvector.sql

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS rag_documents (
    id          BIGSERIAL PRIMARY KEY,
    source_path TEXT NOT NULL DEFAULT '',
    chunk_index INT  NOT NULL DEFAULT 0,
    content     TEXT NOT NULL,
    embedding   vector(1536) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (source_path, chunk_index)
);

-- Optional (recommended after you have ingested chunks): faster similarity search
-- CREATE INDEX IF NOT EXISTS rag_documents_embedding_hnsw
--     ON rag_documents
--     USING hnsw (embedding vector_cosine_ops);
