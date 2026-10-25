ALTER TABLE expenses
DROP COLUMN updated_at;

ALTER TABLE expenses
DROP COLUMN created_at;

ALTER TABLE expenses
ADD COLUMN expense_date DATE DEFAULT CURRENT_DATE;
