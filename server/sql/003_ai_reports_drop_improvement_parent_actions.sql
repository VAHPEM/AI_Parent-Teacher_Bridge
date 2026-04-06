-- Optional manual migration (startup also runs DROP via apply_schema_patches)
ALTER TABLE ai_reports DROP COLUMN IF EXISTS improvement_areas;
ALTER TABLE ai_reports DROP COLUMN IF EXISTS parent_actions;
