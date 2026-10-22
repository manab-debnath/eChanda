
-- Record who created each club.
ALTER TABLE clubs
ADD COLUMN created_by UUID NOT NULL REFERENCES users(id);

-- Store each user's role within a club.
ALTER TABLE clubs_users
ADD COLUMN role "Role" NOT NULL DEFAULT 'viewer';

-- Remove the global role from users.
ALTER TABLE users
DROP COLUMN role;
