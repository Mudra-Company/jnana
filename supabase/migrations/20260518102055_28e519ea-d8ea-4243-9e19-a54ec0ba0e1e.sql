-- Add influencer concept to company_role_assignments
ALTER TABLE public.company_role_assignments
  ADD COLUMN IF NOT EXISTS is_influencer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS influence_scope text NOT NULL DEFAULT 'team',
  ADD COLUMN IF NOT EXISTS influence_type text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS influence_notes text;

-- Constrain influence_scope values
DO $$ BEGIN
  ALTER TABLE public.company_role_assignments
    ADD CONSTRAINT company_role_assignments_influence_scope_check
    CHECK (influence_scope IN ('team','department','company'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Partial index for fast lookup of influencer assignments
CREATE INDEX IF NOT EXISTS idx_company_role_assignments_is_influencer
  ON public.company_role_assignments (role_id)
  WHERE is_influencer = true;
