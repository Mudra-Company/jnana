
# Allineamento di Karma AI con la piattaforma role-centric

## 1. Audit: dove è oggi Karma AI

**Cosa fa già bene**
- Doppio bot configurabile da super-admin: `karma_talents` (B2C) e `jnana` (B2B), versionato in `karma_bot_configs` (system_prompt, objectives, profile_inputs, model, max_exchanges, temperature, closing_patterns).
- Knowledge base documentale per bot (`karma_bot_documents` con estrazione testo).
- Streaming chat via `karma-chat` edge function + analisi finale via `karma-analyze` con tool calling strutturato.
- `profileData` già arricchito di: anagrafica, RIASEC, esperienze, education, skills (solo nomi), jobTitle, e contesto organizzativo light (orgNodeName, isManager, directReports, teamSize, orgLevel, managerName, climate average).

**Dove è rimasto indietro rispetto al resto della piattaforma**

| Area piattaforma | Stato attuale piattaforma | Ciò che Karma riceve / produce oggi |
|---|---|---|
| Ruolo (CompanyRole) | Entità primaria con `requiredHardSkills` con livello 1–5, `requiredSoftSkills`, `requiredSeniority`, `requiredEducation`, `requiredLanguages`, `requiredCertifications`, `yearsExperienceMin/Max`, `responsibilities`, `dailyTasks`, `kpis`, CCNL, contratto, remote policy | Karma vede solo `jobTitle` (testo libero) — non sa cosa il ruolo richiede |
| Hard skills della persona | `user_hard_skills` con `proficiencyLevel` 1–5 + categoria | Inviati come lista flat di nomi, senza livello → impossibile ragionare sul gap |
| Match scoring | `roleFitScore`, `managerFitScore`, `cultureFitScore` calcolati con engine deterministico (skill matched/missing, soft skill matched/missing, seniority match) | Karma non ne è a conoscenza, non li sfrutta come "ipotesi" da verificare nel colloquio |
| Collaboration profile | `links` per team/persona con %, `personalAffinity`, `environmentalImpact`, `operationalFluidity` (SpaceSync) | Non comunicato né indagato |
| Clima (9 dimensioni IT) | Punteggi per dimensione in `climate_responses` | Karma riceve solo media globale come stringa |
| Compliance / CCNL | Documenti, scadenze, livello inquadramento | Non comunicato |
| Output strutturato | UI mostra soft skill matched/missing per ruolo, fit per dimensione clima, fit per manager, seniority match, gap hard skill | `karma-analyze` produce 5 soft skill + 3 valori + 2-3 rischi + seniority generica → non aggancia il modello dati e non alimenta i KPI mostrati |

## 2. Visione del nuovo Karma AI

Karma diventa "il colloquiatore che conosce il ruolo". Per ogni sessione Karma riceve l'intero contesto persona+ruolo+azienda e produce un payload ricco che alimenta direttamente le card della piattaforma (Fit Ruolo, Fit Manager, Fit Culturale, Hard Skills assessment, piano di sviluppo, alert).

Tre modalità di colloquio (configurabili come "scenari" del bot, non più solo `bot_type`):
1. **Discovery (Karma Talents B2C)** — profilazione candidato esterno.
2. **Onboarding / Role Fit (Jnana B2B – nuovo dipendente o cambio ruolo)** — verifica gap rispetto al ruolo target.
3. **Climate & Culture Pulse (Jnana B2B – review periodico)** — copre le 9 dimensioni clima + collaborazione.

Ogni scenario ha system prompt, obiettivi, input profilo e schema di output propri, tutti versionati.

## 3. Evoluzione del modello dati

### 3.1 Migration `karma_bot_configs`
Aggiungere:
- `scenario text` (`discovery` | `role_fit` | `climate_pulse`) — sostituisce di fatto la dicotomia bot_type/uso, con `bot_type` mantenuto per compatibilità.
- `allowed_inputs jsonb` — albero esteso di sezioni attivabili (vedi 3.2), sostituisce `profile_inputs` flat (lascio `profile_inputs` per retro-compatibilità durante la migrazione).
- `output_schema jsonb` — definizione dichiarativa dei campi che Karma deve estrarre a fine colloquio (nome, tipo, descrizione, enum, required). Sblocca il super-admin: oggi lo schema è hard-coded in `karma-analyze`.
- `discussion_style jsonb` — `{ tone, max_response_sentences, language, follow_up_depth }`.

### 3.2 Nuove categorie di input attivabili (`allowed_inputs`)
- **Persona**: bio, headline, esperienze, education, languages (con livello), certifications, portfolio, RIASEC, hard skills **con proficiency 1–5**, soft skills emerse, generation badge.
- **Ruolo target** (nuovo): titolo, descrizione, responsibilities, dailyTasks, KPI, requiredHardSkills (con livello), requiredSoftSkills, requiredSeniority, requiredLanguages, requiredCertifications, anni esperienza, CCNL, contratto, remote policy.
- **Gap analysis pre-calcolato** (nuovo): hardSkillsMatched/Missing/Underleveled, softSkillsMatched/Missing, seniorityDelta, languagesGap. Karma li riceve come "ipotesi da verificare", non come verità assoluta.
- **Contesto organizzativo**: orgNode, manager, riporti, team, livello, comunicazioni formali (`communicates_with_roles`).
- **Collaboration profile**: link, environmentalImpact, operationalFluidity (per scenario `climate_pulse`).
- **Clima**: 9 dimensioni con score corrente.
- **Storico Karma**: ultime 1-2 sessioni (riassunto + skill assessment) per continuità.

### 3.3 Nuove template variables disponibili nel system prompt
Oltre alle attuali, aggiungere: `{{roleTitle}}`, `{{roleDescription}}`, `{{requiredHardSkills}}` (formattato `Nome (Lv X richiesto)`), `{{requiredSoftSkills}}`, `{{requiredSeniority}}`, `{{kpis}}`, `{{responsibilities}}`, `{{dailyTasks}}`, `{{userHardSkillsLeveled}}` (`Nome (Lv X attuale)`), `{{skillGap}}` (Markdown bullet di mancanze e under-level), `{{seniorityGap}}`, `{{climateScores}}`, `{{collaborationLinks}}`, `{{previousKarmaSummary}}`.

### 3.4 Migration `karma_sessions` (output)
Aggiungere:
- `role_id uuid null` — quale ruolo è stato discusso.
- `scenario text` — quale scenario è stato eseguito.
- `skill_assessments jsonb` — array di `{ skillName, requiredLevel, observedLevel (1-5 o null), evidence, confidence }`.
- `soft_skill_assessments jsonb` — `{ skillName, present: bool, evidence, confidence }`.
- `culture_fit jsonb` — `{ dimension, score (1-5), evidence }` per le 9 dimensioni clima.
- `manager_fit_signals jsonb` — `{ score (1-5), themes[], red_flags[] }`.
- `growth_areas jsonb` — array `{ area, suggestedActions[] }`.
- `career_aspirations jsonb` — `{ shortTerm, longTerm, mobilityWillingness, mentorshipInterest }`.
- `alerts jsonb` — flag tipo retention_risk, burnout_signal, mismatch_role.
- `confidence_overall numeric(3,2)`.

I campi storici (`summary`, `soft_skills`, `primary_values`, `risk_factors`, `seniority_assessment`) restano per retro-compatibilità.

## 4. `karma-chat` edge function — modifiche
- Recupera il ruolo target (parametro nuovo `roleId` opzionale; se assente in `jnana`, prende il primary assignment dell'utente da `role_assignments`).
- Costruisce `roleContext` da `company_roles` + skills/seniority richiesti.
- Carica `user_hard_skills` con `proficiencyLevel`.
- Calcola lato server lo `skillGap` (delta livello richiesto vs attuale) usando la stessa logica di `matchingEngine`.
- Carica climate scores per dimensione, collaboration profile, ultime due sessioni Karma.
- Espande tutte le nuove template variables in `processTemplateVariables`.
- Rispetta `allowed_inputs` come whitelist: variabili non abilitate vengono iniettate vuote.

## 5. `karma-analyze` edge function — modifiche
- Riceve `output_schema` dalla config attiva e costruisce dinamicamente la `function` per il tool calling (oggi hard-coded).
- Default schema per ciascuno dei 3 scenari (vedi 3.4) registrato come seed nelle config v2.
- Per `role_fit` include obbligatoriamente `skill_assessments` con `observedLevel` 1–5 per ogni `requiredHardSkill` ricevuta — Karma deve stimare il livello osservato dalle risposte, non solo dire "presente/assente".
- Per `climate_pulse` include obbligatoriamente `culture_fit` per le 9 dimensioni.
- Salva il payload in `karma_sessions` mappando i nuovi campi.

## 6. Backend UI — `KarmaAIConfigView`
- Selettore **Scenario** (3 card invece dei 2 tab attuali, oppure tab annidato sotto bot_type).
- Pannello **Variabili disponibili** riorganizzato per gruppi collassabili: Persona / Ruolo / Gap / Org / Collaborazione / Clima / Storico — ogni chip cliccabile inserisce la variabile nel prompt al cursore.
- Pannello **Input attivabili** sostituisce la lista flat di toggle: alberi a sezione con descrizione di ciascun campo.
- Nuovo pannello **Output Schema editor**: lista di campi con `{name, type (string|number|enum|array|object), description, required}`, drag-and-drop, anteprima JSON. Validazione lato client + server.
- Nuovo pannello **Stile conversazione**: tono, lunghezza max risposta, lingua, profondità follow-up.
- Anteprima: il box "System Prompt" mostra in lettura la versione finale con un profilo demo selezionabile (un dipendente reale dell'azienda demo) per vedere il prompt effettivo che arriva al modello.
- Cronologia versioni include diff del prompt e degli `output_schema` tra versioni.
- Aggiornata lista modelli (aggiungere `google/gemini-3-flash-preview` come default consigliato e `openai/gpt-5-mini`).

## 7. Frontend consumer
- `KarmaChatView` (B2B) e `KarmaTestChat` (B2C) passano in più: `scenario`, `roleId` (per B2B prende il primary assignment).
- `KarmaProfileDetailView` mostra nuove sezioni quando presenti: Skill Assessment vs richiesti (barre 1-5 confronto), Culture Fit per dimensione, Manager Fit signals, Growth Areas, Career Aspirations, Alerts.

## 8. Migrazione dati esistenti
- Le config v1 esistenti restano attive; viene creata automaticamente una v2 per ciascun bot con `scenario` impostato (`karma_talents` → `discovery`, `jnana` → `role_fit`), `allowed_inputs` derivato dai `profile_inputs` correnti, `output_schema` di default. Il super-admin può attivarla a piacere.
- Le sessioni Karma esistenti restano con i campi vecchi popolati; i nuovi campi sono nullable.

## Fuori scope
- Riscrittura del motore di scoring (`matchingEngine`) — Karma usa i suoi output, non li ricalcola.
- Modifica al modulo SpaceSync.
- UI candidato (chat) oltre al pass-through dei nuovi parametri: l'esperienza utente della chat resta invariata.

## Dettagli tecnici

**Migration SQL principale (estratto)**

```sql
ALTER TABLE karma_bot_configs
  ADD COLUMN scenario text CHECK (scenario IN ('discovery','role_fit','climate_pulse')),
  ADD COLUMN allowed_inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN output_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN discussion_style jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE karma_sessions
  ADD COLUMN role_id uuid REFERENCES company_roles(id) ON DELETE SET NULL,
  ADD COLUMN scenario text,
  ADD COLUMN skill_assessments jsonb,
  ADD COLUMN soft_skill_assessments jsonb,
  ADD COLUMN culture_fit jsonb,
  ADD COLUMN manager_fit_signals jsonb,
  ADD COLUMN growth_areas jsonb,
  ADD COLUMN career_aspirations jsonb,
  ADD COLUMN alerts jsonb,
  ADD COLUMN confidence_overall numeric(3,2);
```

**Esempio `output_schema` per `role_fit`**

```json
{
  "fields": [
    { "name": "summary", "type": "string", "required": true },
    { "name": "skill_assessments", "type": "array", "required": true,
      "items": { "skillName": "string", "requiredLevel": "number",
                 "observedLevel": "number|null", "evidence": "string",
                 "confidence": "low|medium|high" } },
    { "name": "soft_skill_assessments", "type": "array", "required": true },
    { "name": "manager_fit_signals", "type": "object" },
    { "name": "growth_areas", "type": "array" },
    { "name": "career_aspirations", "type": "object" },
    { "name": "alerts", "type": "array" },
    { "name": "seniority_observed", "type": "enum",
      "enum": ["Junior","Mid","Senior","Lead","C-Level"] }
  ]
}
```
