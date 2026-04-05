-- Run once if your database was created before teacher_notes was added.
ALTER TABLE ai_reports ADD COLUMN IF NOT EXISTS teacher_notes TEXT;
