
-- =====================================================================
-- FASE 0 — Fondamenta dati per "Il Mio Spazio" (profilo personale)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) peer_collaboration_ratings
--    Voti 1-5 di compatibilità collaborativa tra colleghi.
--    Il singolo voto NON è mai visibile al destinatario.
-- ---------------------------------------------------------------------
CREATE TABLE public.peer_collaboration_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rater_user_id uuid NOT NULL,
  rated_user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  rating smallint NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT peer_rating_range CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT peer_rating_no_self CHECK (rater_user_id <> rated_user_id),
  CONSTRAINT peer_rating_unique UNIQUE (rater_user_id, rated_user_id)
);

CREATE INDEX idx_peer_ratings_rated ON public.peer_collaboration_ratings(rated_user_id);
CREATE INDEX idx_peer_ratings_company ON public.peer_collaboration_ratings(company_id);

ALTER TABLE public.peer_collaboration_ratings ENABLE ROW LEVEL SECURITY;

-- Solo il rater può inserire/aggiornare/eliminare il proprio voto e vederlo
CREATE POLICY "Raters manage own peer ratings"
ON public.peer_collaboration_ratings
FOR ALL
USING (auth.uid() = rater_user_id)
WITH CHECK (auth.uid() = rater_user_id);

-- Super admin vede tutto
CREATE POLICY "Super admins view all peer ratings"
ON public.peer_collaboration_ratings
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER trg_peer_ratings_updated_at
BEFORE UPDATE ON public.peer_collaboration_ratings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- View aggregata: esposta solo quando count >= 3 (anonimizzazione k-anon)
CREATE OR REPLACE VIEW public.peer_affinity_aggregates
WITH (security_invoker = on) AS
SELECT
  rated_user_id,
  company_id,
  ROUND(AVG(rating)::numeric, 2) AS avg_rating,
  COUNT(*)::int AS rating_count
FROM public.peer_collaboration_ratings
GROUP BY rated_user_id, company_id
HAVING COUNT(*) >= 3;

-- ---------------------------------------------------------------------
-- 2) user_growth_preferences
--    Aspirazioni della persona: ruoli interni, skill da sviluppare,
--    apertura a job rotation/relocation.
-- ---------------------------------------------------------------------
CREATE TABLE public.user_growth_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  company_id uuid,
  interested_role_ids uuid[] NOT NULL DEFAULT '{}',
  interested_role_titles_free text[] NOT NULL DEFAULT '{}',
  skills_to_develop text[] NOT NULL DEFAULT '{}',
  rotation_open boolean NOT NULL DEFAULT false,
  relocation_open boolean NOT NULL DEFAULT false,
  target_seniority text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_growth_prefs_company ON public.user_growth_preferences(company_id);

ALTER TABLE public.user_growth_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own growth preferences"
ON public.user_growth_preferences
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Company HR can view growth preferences"
ON public.user_growth_preferences
FOR SELECT
USING (company_id IS NOT NULL AND is_company_hr(auth.uid(), company_id));

CREATE POLICY "Super admins manage all growth preferences"
ON public.user_growth_preferences
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER trg_growth_prefs_updated_at
BEFORE UPDATE ON public.user_growth_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- 3) user_kpi_self_checkins
--    Self-check trimestrale sul KPI del proprio ruolo.
-- ---------------------------------------------------------------------
CREATE TABLE public.user_kpi_self_checkins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role_id uuid NOT NULL,
  company_id uuid NOT NULL,
  kpi_key text NOT NULL,
  status text NOT NULL,
  note text,
  period text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kpi_checkin_status CHECK (status IN ('on_track','at_risk','late')),
  CONSTRAINT kpi_checkin_unique UNIQUE (user_id, role_id, kpi_key, period)
);

CREATE INDEX idx_kpi_checkins_role ON public.user_kpi_self_checkins(role_id);
CREATE INDEX idx_kpi_checkins_company ON public.user_kpi_self_checkins(company_id);

ALTER TABLE public.user_kpi_self_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own KPI checkins"
ON public.user_kpi_self_checkins
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Company HR can view KPI checkins"
ON public.user_kpi_self_checkins
FOR SELECT
USING (is_company_hr(auth.uid(), company_id));

CREATE POLICY "Super admins manage all KPI checkins"
ON public.user_kpi_self_checkins
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER trg_kpi_checkins_updated_at
BEFORE UPDATE ON public.user_kpi_self_checkins
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
