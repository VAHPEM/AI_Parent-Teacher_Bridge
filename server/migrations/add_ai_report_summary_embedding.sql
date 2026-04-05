-- Vector search over AI report text (same-student, teacher-approved rows).
-- Requires the pgvector extension on your Postgres server.

CREATE EXTENSION IF NOT EXISTS vector;

-- Match EMBEDDING_DIMENSION in server/.env (default 1536 for text-embedding-3-small).
ALTER TABLE ai_reports ADD COLUMN IF NOT EXISTS summary_embedding vector(1536);

COMMENT ON COLUMN ai_reports.summary_embedding IS
  'L2-normalized embedding of summary + strengths/support/recommendations; used for RAG.';
