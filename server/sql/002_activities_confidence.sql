-- Optional manual migration (startup also runs this via apply_schema_patches)
ALTER TABLE activities ADD COLUMN IF NOT EXISTS confidence VARCHAR(20);
