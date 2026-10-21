-- Step 1: Delete the old ENUM type completely
DROP TYPE "Role";

-- Step 2: Recreate the ENUM type without the 'viewer' value
CREATE TYPE "Role" AS ENUM ('collector', 'admin');
