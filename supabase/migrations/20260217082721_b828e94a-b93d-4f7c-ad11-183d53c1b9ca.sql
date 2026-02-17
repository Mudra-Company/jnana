ALTER TABLE public.company_roles
ADD COLUMN collaboration_profile jsonb DEFAULT '{"links":[],"environmentalImpact":3,"operationalFluidity":3}'::jsonb;