-- Drop the automatically generated restriction constraint on expenses table
ALTER TABLE expenses
DROP CONSTRAINT expenses_club_id_fkey;

-- Add the constraint back with ON DELETE RESTRICT on expenses table
ALTER TABLE expenses
ADD CONSTRAINT expenses_club_id_fkey
FOREIGN KEY (club_id)
REFERENCES clubs(id)
ON DELETE RESTRICT;

-- Drop the automatically generated restriction constraint on collections tables
ALTER TABLE collections
DROP CONSTRAINT expenses_club_id_fkey;

-- Add the constraint back with ON DELETE RESTRICT on collections table
ALTER TABLE collections
ADD CONSTRAINT expenses_club_id_fkey
FOREIGN KEY (club_id)
REFERENCES clubs(id)
ON DELETE RESTRICT;
