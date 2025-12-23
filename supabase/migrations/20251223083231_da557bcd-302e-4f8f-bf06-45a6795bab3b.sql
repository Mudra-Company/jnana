-- Add is_hiring column to company_members for open positions
ALTER TABLE public.company_members 
ADD COLUMN is_hiring BOOLEAN DEFAULT false;