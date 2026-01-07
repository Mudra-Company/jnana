-- Remove the constraint that forces is_hiring = true for records without user_id
ALTER TABLE company_members DROP CONSTRAINT IF EXISTS company_members_user_or_hiring_check;

-- Fix existing records: set is_hiring = false for placeholders that have name/email
UPDATE company_members 
SET is_hiring = false 
WHERE user_id IS NULL 
  AND is_hiring = true 
  AND (placeholder_email IS NOT NULL OR placeholder_first_name IS NOT NULL);