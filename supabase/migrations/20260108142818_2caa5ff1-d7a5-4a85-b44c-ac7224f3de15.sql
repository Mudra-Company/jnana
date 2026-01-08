-- Add region column to profiles for better geographical filtering
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS region text DEFAULT NULL;