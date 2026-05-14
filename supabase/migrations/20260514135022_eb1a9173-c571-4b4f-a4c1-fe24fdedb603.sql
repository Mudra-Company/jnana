-- KARMA AI v2: scenari, input attivabili, output schema configurabile

ALTER TABLE public.karma_bot_configs
  ADD COLUMN IF NOT EXISTS scenario text,
  ADD COLUMN IF NOT EXISTS allowed_inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS output_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS discussion_style jsonb NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'karma_bot_configs_scenario_check'
  ) THEN
    ALTER TABLE public.karma_bot_configs
      ADD CONSTRAINT karma_bot_configs_scenario_check
      CHECK (scenario IS NULL OR scenario IN ('discovery','role_fit','climate_pulse'));
  END IF;
END$$;

-- Default sensato per le config esistenti
UPDATE public.karma_bot_configs
SET scenario = CASE
  WHEN bot_type = 'karma_talents' THEN 'discovery'
  WHEN bot_type = 'jnana' THEN 'role_fit'
  ELSE scenario
END
WHERE scenario IS NULL;

-- Output ricco delle sessioni Karma
ALTER TABLE public.karma_sessions
  ADD COLUMN IF NOT EXISTS role_id uuid,
  ADD COLUMN IF NOT EXISTS scenario text,
  ADD COLUMN IF NOT EXISTS skill_assessments jsonb,
  ADD COLUMN IF NOT EXISTS soft_skill_assessments jsonb,
  ADD COLUMN IF NOT EXISTS culture_fit jsonb,
  ADD COLUMN IF NOT EXISTS manager_fit_signals jsonb,
  ADD COLUMN IF NOT EXISTS growth_areas jsonb,
  ADD COLUMN IF NOT EXISTS career_aspirations jsonb,
  ADD COLUMN IF NOT EXISTS alerts jsonb,
  ADD COLUMN IF NOT EXISTS confidence_overall numeric(3,2);

CREATE INDEX IF NOT EXISTS idx_karma_sessions_role_id ON public.karma_sessions(role_id);
CREATE INDEX IF NOT EXISTS idx_karma_sessions_scenario ON public.karma_sessions(scenario);
CREATE INDEX IF NOT EXISTS idx_karma_bot_configs_scenario ON public.karma_bot_configs(scenario);