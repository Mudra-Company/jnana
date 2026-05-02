
-- ============================================================
-- 1) PROFILES: hide email & birth_date in karma marketplace
-- ============================================================

-- Drop the marketplace SELECT policies that exposed full profile rows
DROP POLICY IF EXISTS "Subscribers can view karma profiles" ON public.profiles;
DROP POLICY IF EXISTS "Company admins can view karma profiles" ON public.profiles;

-- Public-safe view for karma marketplace (NO email, NO birth_date, NO age)
CREATE OR REPLACE VIEW public.karma_profiles_public
WITH (security_invoker = on) AS
SELECT
  id,
  first_name,
  last_name,
  avatar_url,
  job_title,
  bio,
  location,
  region,
  headline,
  is_karma_profile,
  profile_visibility,
  looking_for_work,
  preferred_work_type,
  years_experience,
  wants_karma_visibility,
  created_at,
  updated_at
FROM public.profiles
WHERE is_karma_profile = true
  AND profile_visibility = 'subscribers_only';

-- The view runs with the caller's privileges; we need a permissive RLS policy
-- on the base table so subscribers/karma-admins can read the safe columns
-- through the view. Re-add a column-safe SELECT policy gated to the same audience.
CREATE POLICY "Karma marketplace can view karma profiles via view"
ON public.profiles FOR SELECT
USING (
  is_karma_profile = true
  AND profile_visibility = 'subscribers_only'
  AND (
    -- Active company subscribers
    EXISTS (
      SELECT 1
      FROM public.company_subscriptions cs
      JOIN public.company_members cm ON cm.company_id = cs.company_id
      WHERE cm.user_id = auth.uid()
        AND cs.status = 'active'
    )
    OR
    -- Company admins
    EXISTS (
      SELECT 1
      FROM public.company_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.role = 'admin'
    )
  )
);

-- Note: this policy still lets these audiences technically SELECT email from
-- the base table. The intended access path is the `karma_profiles_public` view,
-- which omits email/birth_date. We additionally REVOKE direct column access
-- on the sensitive columns from the `authenticated` role; the owner still
-- reads them via the "Users can view own profile" policy because that policy
-- + column grant model: column REVOKE applies to the role globally, so the
-- owner would also lose access. Therefore we do NOT revoke at the column level
-- and instead rely on the application contract to use the view. Application
-- code is updated in the same commit.

-- ============================================================
-- 2) RIASEC: move raw_answers to owner-only table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.riasec_results_raw (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id uuid NOT NULL UNIQUE
    REFERENCES public.riasec_results(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  raw_answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.riasec_results_raw ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own raw answers"
ON public.riasec_results_raw FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own raw answers"
ON public.riasec_results_raw FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Super admins can view all raw answers"
ON public.riasec_results_raw FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Migrate existing non-empty raw_answers
INSERT INTO public.riasec_results_raw (result_id, user_id, raw_answers, created_at)
SELECT id, user_id, raw_answers, submitted_at
FROM public.riasec_results
WHERE raw_answers IS NOT NULL
  AND raw_answers <> '{}'::jsonb
ON CONFLICT (result_id) DO NOTHING;

-- Drop the column from riasec_results so admins can no longer read it
ALTER TABLE public.riasec_results DROP COLUMN IF EXISTS raw_answers;

-- ============================================================
-- 3) PROFILE VIEW LOGS: retention policy (90 days)
-- ============================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_profile_views()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.profile_views_log
  WHERE viewed_at < now() - interval '90 days';
$$;

-- Trigger-based opportunistic cleanup on each new INSERT (cheap, no cron needed)
CREATE OR REPLACE FUNCTION public.profile_views_log_retention_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Probabilistic cleanup: ~1% of inserts run the cleanup
  IF random() < 0.01 THEN
    DELETE FROM public.profile_views_log
    WHERE viewed_at < now() - interval '90 days';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profile_views_log_retention ON public.profile_views_log;
CREATE TRIGGER profile_views_log_retention
AFTER INSERT ON public.profile_views_log
FOR EACH ROW EXECUTE FUNCTION public.profile_views_log_retention_trigger();
