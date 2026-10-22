
-- Restore the global role column.
ALTER TABLE users
ADD COLUMN role "Role" NOT NULL DEFAULT 'viewer';

-- Remove the membership role column.
ALTER TABLE clubs_users
DROP COLUMN role;

-- Remove the club creator column.
ALTER TABLE clubs
DROP COLUMN created_by;
