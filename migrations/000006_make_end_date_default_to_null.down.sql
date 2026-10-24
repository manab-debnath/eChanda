-- Rollback 'end_date' value
ALTER TABLE clubs
ALTER COLUMN end_date DROP DEFAULT;
