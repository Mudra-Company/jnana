-- Add wants_karma_visibility column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS wants_karma_visibility boolean DEFAULT false;

-- Migrate existing data: Set to true for users who are looking for work, 
-- have subscribers_only visibility, and are NOT part of any company
UPDATE profiles p
SET wants_karma_visibility = true
WHERE looking_for_work = true
  AND profile_visibility = 'subscribers_only'
  AND NOT EXISTS (
    SELECT 1 FROM company_members cm WHERE cm.user_id = p.id
  );