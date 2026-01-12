-- ============================================================
-- FASE 1: Data Migration - Correggere i record con company_id NULL
-- ============================================================

-- Correggi riasec_results
UPDATE riasec_results rr
SET company_id = (
  SELECT cm.company_id 
  FROM company_members cm 
  WHERE cm.user_id = rr.user_id 
  LIMIT 1
)
WHERE rr.company_id IS NULL
AND EXISTS (
  SELECT 1 FROM company_members cm WHERE cm.user_id = rr.user_id
);

-- Correggi karma_sessions
UPDATE karma_sessions ks
SET company_id = (
  SELECT cm.company_id 
  FROM company_members cm 
  WHERE cm.user_id = ks.user_id 
  LIMIT 1
)
WHERE ks.company_id IS NULL
AND EXISTS (
  SELECT 1 FROM company_members cm WHERE cm.user_id = ks.user_id
);

-- Correggi climate_responses
UPDATE climate_responses cr
SET company_id = (
  SELECT cm.company_id 
  FROM company_members cm 
  WHERE cm.user_id = cr.user_id 
  LIMIT 1
)
WHERE cr.company_id IS NULL
AND EXISTS (
  SELECT 1 FROM company_members cm WHERE cm.user_id = cr.user_id
);

-- ============================================================
-- FASE 2: Migliorare RLS Policies con fallback via membership
-- ============================================================

-- Drop existing company admin policies
DROP POLICY IF EXISTS "Company admins can view company results" ON riasec_results;
DROP POLICY IF EXISTS "Company admins can view company sessions" ON karma_sessions;
DROP POLICY IF EXISTS "Company admins can view company climate responses" ON climate_responses;

-- Nuova policy per riasec_results (con fallback)
CREATE POLICY "Company admins can view company results v2"
ON riasec_results FOR SELECT
USING (
  -- Super admin può vedere tutto
  has_role(auth.uid(), 'super_admin')
  OR
  -- L'utente può vedere i propri risultati
  auth.uid() = user_id
  OR
  -- Company admin può vedere i risultati della propria azienda (metodo diretto)
  (company_id IS NOT NULL AND is_company_admin(auth.uid(), company_id))
  OR
  -- Company admin fallback: verifica tramite membership dell'utente del record
  EXISTS (
    SELECT 1 FROM company_members cm 
    WHERE cm.user_id = riasec_results.user_id 
    AND is_company_admin(auth.uid(), cm.company_id)
  )
);

-- Nuova policy per karma_sessions (con fallback)
CREATE POLICY "Company admins can view company sessions v2"
ON karma_sessions FOR SELECT
USING (
  -- Super admin può vedere tutto
  has_role(auth.uid(), 'super_admin')
  OR
  -- L'utente può vedere le proprie sessioni
  auth.uid() = user_id
  OR
  -- Company admin può vedere le sessioni della propria azienda (metodo diretto)
  (company_id IS NOT NULL AND is_company_admin(auth.uid(), company_id))
  OR
  -- Company admin fallback: verifica tramite membership dell'utente del record
  EXISTS (
    SELECT 1 FROM company_members cm 
    WHERE cm.user_id = karma_sessions.user_id 
    AND is_company_admin(auth.uid(), cm.company_id)
  )
);

-- Nuova policy per climate_responses (con fallback)
CREATE POLICY "Company admins can view company climate responses v2"
ON climate_responses FOR SELECT
USING (
  -- Super admin può vedere tutto
  has_role(auth.uid(), 'super_admin')
  OR
  -- L'utente può vedere le proprie risposte
  auth.uid() = user_id
  OR
  -- Company admin può vedere le risposte della propria azienda (metodo diretto)
  (company_id IS NOT NULL AND is_company_admin(auth.uid(), company_id))
  OR
  -- Company admin fallback: verifica tramite membership dell'utente del record
  EXISTS (
    SELECT 1 FROM company_members cm 
    WHERE cm.user_id = climate_responses.user_id 
    AND is_company_admin(auth.uid(), cm.company_id)
  )
);