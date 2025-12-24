-- Allow company_members to have NULL user_id for placeholder/hiring slots
-- This enables creating org chart positions before someone is assigned

-- First drop the existing foreign key constraint
ALTER TABLE public.company_members 
ALTER COLUMN user_id DROP NOT NULL;

-- Add a check constraint to ensure either user_id is set OR is_hiring is true
-- This prevents orphan entries while allowing hiring placeholders
ALTER TABLE public.company_members 
ADD CONSTRAINT company_members_user_or_hiring_check 
CHECK (user_id IS NOT NULL OR is_hiring = true);

-- Add job_title column to store position information
ALTER TABLE public.company_members
ADD COLUMN IF NOT EXISTS job_title TEXT;

-- Add first_name and last_name for placeholder invites (people not yet in system)
ALTER TABLE public.company_members
ADD COLUMN IF NOT EXISTS placeholder_first_name TEXT,
ADD COLUMN IF NOT EXISTS placeholder_last_name TEXT,
ADD COLUMN IF NOT EXISTS placeholder_email TEXT;