-- Drop the automatically generated restriction constraint
ALTER TABLE collections
DROP CONSTRAINT collections_club_id_fkey;

-- Add the constraint back with ON DELETE CASCADE
ALTER TABLE collections
ADD CONSTRAINT collections_club_id_fkey
FOREIGN KEY (club_id)
REFERENCES clubs(id)
ON DELETE CASCADE;

-- Drop the automatically generated restriction constraint
ALTER TABLE expenses
DROP CONSTRAINT expenses_club_id_fkey;

-- Add the constraint back with ON DELETE CASCADE
ALTER TABLE expenses
ADD CONSTRAINT expenses_club_id_fkey
FOREIGN KEY (club_id)
REFERENCES clubs(id)
ON DELETE CASCADE;
