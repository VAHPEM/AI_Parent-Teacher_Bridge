-- Optional: tie each class row to a teacher so /teacher/students can filter by TEACHER_ID.
-- Run manually against your Postgres DB when ready.

ALTER TABLE classes ADD COLUMN IF NOT EXISTS teacher_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes (teacher_id);

-- Example after seeding:
-- UPDATE classes SET teacher_id = 1 WHERE id IN (1, 2);
