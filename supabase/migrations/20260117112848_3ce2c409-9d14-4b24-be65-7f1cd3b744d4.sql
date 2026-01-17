-- Add birth_date column to profiles for generational calculations
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.birth_date IS 'Data di nascita per calcolo generazionale dinamico (formato YYYY-MM-DD)';