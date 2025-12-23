-- Add required_profile column to company_members for individual role skill requirements
ALTER TABLE public.company_members 
ADD COLUMN required_profile JSONB DEFAULT '{}'::jsonb;

-- Add index for efficient queries on required_profile
CREATE INDEX idx_company_members_required_profile 
ON public.company_members USING gin(required_profile);

-- Add comment to document the column purpose
COMMENT ON COLUMN public.company_members.required_profile IS 'Individual role requirements: hardSkills, softSkills, seniority, description';