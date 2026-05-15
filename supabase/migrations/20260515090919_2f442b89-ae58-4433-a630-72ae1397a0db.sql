-- Drop legacy unique (bot_type, version) — replaced by (bot_type, scenario, version)
ALTER TABLE karma_bot_configs DROP CONSTRAINT IF EXISTS karma_bot_configs_bot_type_version_key;

-- Backfill scenario on existing rows
UPDATE karma_bot_configs
SET scenario = CASE bot_type
  WHEN 'jnana' THEN 'role_fit'
  ELSE 'discovery'
END
WHERE scenario IS NULL;

-- Unique version per (bot_type, scenario)
CREATE UNIQUE INDEX IF NOT EXISTS karma_bot_configs_bot_scenario_version
  ON karma_bot_configs (bot_type, scenario, version);

-- Only one active per (bot_type, scenario)
CREATE UNIQUE INDEX IF NOT EXISTS karma_bot_configs_active_per_scenario
  ON karma_bot_configs (bot_type, scenario)
  WHERE is_active = true;

-- Seed climate_pulse config for jnana
INSERT INTO karma_bot_configs (
  bot_type, scenario, version, is_active,
  system_prompt, objectives, profile_inputs, allowed_inputs,
  output_schema, discussion_style, model, max_exchanges,
  temperature, closing_patterns, version_notes
)
SELECT
  'jnana', 'climate_pulse', 1, true,
  $PROMPT$Sei Karma, il colloquiatore di Jnana per il Climate & Culture Pulse periodico.

Obiettivo: rilevare in modo empatico e non intrusivo come la persona vive l'azienda lungo le 9 dimensioni di clima e la qualita' della collaborazione con il team.

Profilo persona: {{firstName}} {{lastName}} — {{headline}}
Ruolo attuale: {{roleTitle}} ({{orgNodeName}}, {{orgLevel}})
Manager: {{managerName}} | Team size: {{teamSize}}

Dimensioni di clima da esplorare (score corrente tra parentesi): {{climateScores}}
Link di collaborazione attivi: {{collaborationLinks}}
Sintesi storica delle ultime sessioni: {{previousKarmaSummary}}

Linee guida:
- Tono empatico, non valutativo. Apri con un check-in caldo sul vissuto recente.
- Per ciascuna delle 9 dimensioni, fai 1 domanda mirata se il punteggio attuale e' basso o se non c'e' segnale recente; altrimenti chiedi conferma soft.
- Esplora collaborazione: con chi lavora bene, dove c'e' attrito, qualita' della comunicazione con il manager.
- Se emergono segnali di rischio (burnout, disengagement, conflitto), annotali ma non drammatizzare in chat.
- Massimo {{maxExchanges}} scambi. Chiudi ringraziando e indicando che il feedback alimentera' azioni concrete.$PROMPT$,
  objectives, profile_inputs,
  jsonb_build_object(
    'bio', true, 'headline', true, 'experiences', false, 'education', false,
    'hard_skills_leveled', false, 'languages', false, 'certifications', false,
    'riasec_score', true,
    'org_position', true, 'manager_info', true, 'org_level', true,
    'role_title', true, 'role_description', false,
    'required_hard_skills', false, 'required_soft_skills', true,
    'required_seniority', false, 'kpis', false,
    'responsibilities', true, 'daily_tasks', false,
    'skill_gap', false, 'seniority_gap', false,
    'collaboration_links', true, 'environmental_impact', true,
    'climate_dimensions', true, 'company_context', true,
    'karma_history', true
  ),
  jsonb_build_object('fields', jsonb_build_array(
    jsonb_build_object('name','summary','type','string','required',true),
    jsonb_build_object('name','culture_fit','type','array_culture_fit','required',true,
      'description','Score 1-5 + evidence per ciascuna delle 9 dimensioni di clima'),
    jsonb_build_object('name','manager_fit_signals','type','object_manager_fit','required',true),
    jsonb_build_object('name','growth_areas','type','array_growth','required',false),
    jsonb_build_object('name','alerts','type','array_string','required',false,
      'description','Flag tipo retention_risk, burnout_signal, conflict_signal')
  )),
  jsonb_build_object(
    'tone','empatico, non valutativo',
    'max_response_sentences', 3,
    'language','it',
    'follow_up_depth','medium'
  ),
  model, max_exchanges, temperature, closing_patterns,
  'Seed iniziale climate_pulse'
FROM karma_bot_configs
WHERE bot_type = 'jnana' AND scenario = 'role_fit' AND is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM karma_bot_configs WHERE bot_type='jnana' AND scenario='climate_pulse'
  )
LIMIT 1;