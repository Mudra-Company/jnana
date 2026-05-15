# Fix scenari Karma AI: UI coerente e scenari come "configurazioni indipendenti"

## Cosa cambia concettualmente

Oggi: un bot (`karma_talents` o `jnana`) ha **una config attiva**, e lo scenario è un campo dentro quella config. Risultato: lo scenario non modifica davvero il prompt (puoi cambiarlo senza che cambi nulla del prompt salvato), e l'UI mostra incongruenze come "Discovery (B2C)" sotto Jnana.

Dopo: l'unità di configurazione diventa la coppia **(bot_type, scenario)**. Cioè:
- `karma_talents` → solo scenario `discovery` (1 config attiva)
- `jnana` → scenarios `role_fit` e `climate_pulse`, ognuno con la sua config attiva (2 config attive in parallelo, una per scenario)

Quando il front-end (KarmaChatView / KarmaTestChat) chiama l'edge function passando `scenario`, viene caricata la config attiva per quella coppia (bot_type, scenario). Il prompt, gli `allowed_inputs`, l'`output_schema` e lo `discussion_style` sono diversi per ogni scenario — ed è qui che lo scenario "modifica il prompt": cambia la config caricata.

Lo scenario non resta un bottone dentro l'editor del prompt, ma diventa **una scheda accanto alle versioni**, perché stai modificando un oggetto diverso.

## Modifiche

### 1. UI — `KarmaAIConfigView.tsx`
- Sotto la selezione `Karma Talents` / `Jnana`, aggiungere una seconda riga di tab degli **scenari disponibili per quel bot**:
  - `karma_talents` → un solo tab `Discovery`
  - `jnana` → due tab `Role Fit` e `Climate Pulse`
- Rimuovere il pannello `Scenario di Conversazione` con i 3 bottoni: lo scenario non è più un attributo modificabile del prompt, è il contesto in cui stai editando. Lo scenario corrente viene mostrato come breadcrumb (es. "Jnana → Role Fit · v3 attiva").
- Quando l'utente cambia tab scenario, ricarica `activeConfig` filtrando su `(bot_type, scenario)`.
- La cronologia versioni viene filtrata anch'essa per scenario corrente.
- Salvare nuova versione setta sempre `scenario = scenarioCorrente` (non più derivato dal bot_type).
- Aggiornare i suggerimenti di prompt iniziale: per `climate_pulse` precompilare con un prompt focalizzato su 9 dimensioni clima e collaborazione; per `role_fit` con focus su gap skill e seniority; per `discovery` con focus su profilazione candidato.

### 2. Hook — `useKarmaBotConfig.ts`
- Aggiungere parametro opzionale `scenario`: `useKarmaBotConfig(botType, scenario)`.
- `fetchConfigs` filtra anche per `scenario` quando passato.
- `activeConfig` = la versione attiva per quella coppia.
- `saveNewVersion` calcola `version = max(version per coppia bot_type+scenario) + 1`, e disattiva solo le altre versioni della stessa coppia (non tutte le righe del bot_type).
- `activateVersion` disattiva solo le altre versioni della stessa coppia.

### 3. Migrazione dati
- Per ogni config esistente con `scenario IS NULL`, popolare:
  - `karma_talents` → `scenario = 'discovery'`
  - `jnana` → `scenario = 'role_fit'`
- Per `jnana` creare in più una config seed `scenario = 'climate_pulse'` (clonata dall'attuale `jnana` con prompt e output schema specifici per il clima), `is_active = true`. Convivono entrambe attive perché ora "attivo" è scoped a (bot_type, scenario).
- Aggiungere indice univoco parziale: `UNIQUE (bot_type, scenario) WHERE is_active = true`.

### 4. Edge functions — già OK, piccola limatura
- `karma-chat` e `karma-analyze` già filtrano per scenario quando ricevuto. Aggiungere log esplicito se nessuna config viene trovata per la coppia richiesta (oggi cade silenziosamente sul fallback bot_type) e usare un fallback chiaro: se manca `(bot_type, scenario)`, log warning e usa la config attiva del bot_type ignorando scenario.

### 5. Vincolo coerenza front-end consumer
- `KarmaTestChat` continua a passare `scenario: 'discovery'`.
- `KarmaChatView` passa `scenario: 'role_fit'` di default; in futuro quando aggiungeremo trigger per il pulse periodico, passerà `'climate_pulse'`. Per adesso lasciamo `role_fit` hard-coded come oggi.

## Dettagli tecnici

### SQL migrazione

```sql
-- Backfill scenario su righe esistenti
UPDATE karma_bot_configs
SET scenario = CASE bot_type
  WHEN 'jnana' THEN 'role_fit'
  ELSE 'discovery'
END
WHERE scenario IS NULL;

-- Vincolo: una sola versione attiva per coppia
CREATE UNIQUE INDEX IF NOT EXISTS karma_bot_configs_active_per_scenario
  ON karma_bot_configs (bot_type, scenario)
  WHERE is_active = true;

-- Seed climate_pulse per jnana (clonata dall'attuale role_fit attivo,
-- con system_prompt + output_schema specifici per il clima)
INSERT INTO karma_bot_configs (bot_type, scenario, version, is_active,
  system_prompt, objectives, profile_inputs, allowed_inputs,
  output_schema, discussion_style, model, max_exchanges,
  temperature, closing_patterns, version_notes)
SELECT 'jnana', 'climate_pulse', 1, true,
  '<<prompt focus 9 dimensioni clima + collaborazione>>',
  objectives, profile_inputs,
  '{...allowed_inputs con climate_dimensions, collaboration_links abilitati...}'::jsonb,
  '{"fields":[{"name":"culture_fit","type":"array_culture_fit","required":true},...]}'::jsonb,
  '{"tone":"empatico","follow_up_depth":"medium"}'::jsonb,
  model, max_exchanges, temperature, closing_patterns,
  'Seed iniziale climate_pulse'
FROM karma_bot_configs
WHERE bot_type = 'jnana' AND scenario = 'role_fit' AND is_active = true
LIMIT 1;
```

### Firma hook

```ts
useKarmaBotConfig(botType: BotType, scenario: KarmaScenario)
```

`KarmaAIConfigView` mantiene due stati: `activeBotType` e `activeScenario`. La lista degli scenari disponibili per il bot:

```ts
const SCENARIOS_BY_BOT: Record<BotType, KarmaScenario[]> = {
  karma_talents: ['discovery'],
  jnana: ['role_fit', 'climate_pulse'],
};
```

## Fuori scope
- Aggiungere uno scenario `discovery` su `jnana` o `role_fit` su `karma_talents`: i bot restano vincolati ai loro scenari naturali.
- Trigger automatico del Climate Pulse periodico (cadenza, notifiche): solo predisposizione config, non l'orchestrazione.
- Modifiche a `KarmaProfileDetailView`, `karma-chat`/`karma-analyze` oltre il logging.
