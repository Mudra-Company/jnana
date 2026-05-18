
-- 1) Invite columns on company_members
ALTER TABLE public.company_members
  ADD COLUMN IF NOT EXISTS invite_token text,
  ADD COLUMN IF NOT EXISTS invite_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS invite_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS invited_by uuid,
  ADD COLUMN IF NOT EXISTS personal_message text,
  ADD COLUMN IF NOT EXISTS pending_role_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS company_members_invite_token_key
  ON public.company_members (invite_token)
  WHERE invite_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS company_members_user_id_idx
  ON public.company_members (user_id);

-- 2) Onboarding progress
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid,
  flow text NOT NULL DEFAULT 'b2c', -- 'b2c' | 'b2b'
  current_step text,
  completed_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  profile_strength_score int NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, company_id)
);

ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own onboarding progress"
  ON public.onboarding_progress
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Company admins view onboarding progress"
  ON public.onboarding_progress
  FOR SELECT
  USING (company_id IS NOT NULL AND is_company_admin(auth.uid(), company_id));

CREATE POLICY "Super admins manage onboarding progress"
  ON public.onboarding_progress
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER onboarding_progress_updated_at
  BEFORE UPDATE ON public.onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Profile strength function (0..100)
CREATE OR REPLACE FUNCTION public.calculate_profile_strength(_user_id uuid)
RETURNS int
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score int := 0;
  v_has_avatar boolean;
  v_has_headline boolean;
  v_has_bio boolean;
  v_skill_count int;
  v_has_riasec boolean;
  v_has_karma boolean;
  v_has_role boolean;
BEGIN
  SELECT (avatar_url IS NOT NULL AND avatar_url <> ''),
         (headline IS NOT NULL AND headline <> ''),
         (bio IS NOT NULL AND bio <> '')
    INTO v_has_avatar, v_has_headline, v_has_bio
  FROM public.profiles WHERE id = _user_id;

  SELECT COUNT(*) INTO v_skill_count
  FROM public.user_hard_skills WHERE user_id = _user_id;

  SELECT EXISTS(SELECT 1 FROM public.riasec_results WHERE user_id = _user_id) INTO v_has_riasec;
  SELECT EXISTS(SELECT 1 FROM public.karma_sessions WHERE user_id = _user_id) INTO v_has_karma;
  SELECT EXISTS(
    SELECT 1 FROM public.company_role_assignments WHERE user_id = _user_id
  ) INTO v_has_role;

  IF v_has_avatar THEN v_score := v_score + 5; END IF;
  IF v_has_headline THEN v_score := v_score + 10; END IF;
  IF v_has_bio THEN v_score := v_score + 10; END IF;
  IF v_skill_count >= 3 THEN v_score := v_score + 20;
  ELSIF v_skill_count >= 1 THEN v_score := v_score + 10;
  END IF;
  IF v_has_riasec THEN v_score := v_score + 20; END IF;
  IF v_has_karma THEN v_score := v_score + 20; END IF;
  IF v_has_role THEN v_score := v_score + 15; END IF;

  RETURN LEAST(v_score, 100);
EXCEPTION WHEN undefined_table THEN
  -- If user_hard_skills table doesn't exist yet, still return partial score
  RETURN v_score;
END;
$$;
