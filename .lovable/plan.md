## Obiettivo

Rendere l'influencer riconoscibile a colpo d'occhio dall'organigramma e mostrare tutte le sue informazioni (tipo, ambito, note) nella spalla sinistra quando si seleziona quella posizione.

## Cosa è già in piedi (e perché non basta)

- `UnifiedRolePersonCard.tsx` ha già una piccola icona "Sparkles" 10px viola accanto al nome — troppo piccola per essere notata (cfr. screenshot 1, dove Marco Galli non sembra avere alcun segno).
- `OrgChartContextPanel.tsx` mostra già nel pannello del nodo la sezione "Influencer del team" con i nomi, ma quando si clicca sulla *posizione* del singolo influencer (vista `PositionView`, screenshot 2) non c'è traccia del fatto che sia un influencer.

## Modifiche

### 1. Badge influencer più evidente sulla card (file: `src/components/roles/UnifiedRolePersonCard.tsx`)

Sostituire il puntino 4×4 con un badge "pill" affianco al nome assignee:
- Icona `Sparkles` 12px viola + label `Influencer`
- Sfondo `bg-violet-100`, bordo `border-violet-200`, testo `text-violet-700`
- `title` con scope + lista tipi per il tooltip rapido

Manteniamo posizione (subito a destra del nome, prima del `profileCode`).

### 2. Sezione "Influencer" nella spalla sinistra — vista posizione (file: `src/components/admin/orgchart/OrgChartContextPanel.tsx`)

Dentro `PositionView`, dopo gli `ScoreBar` e prima delle hard/soft skill, aggiungere render condizionale se `position.assignment?.isInfluencer === true`:

```text
INFLUENCER
✨ Influencer del team
  · Ambito: Team / Dipartimento / Azienda    (badge colorato)
  · Tipologia: Technical, Cultural, …        (chip multipli)
  · Note: testo libero (se presente)
```

Tutti i dati vengono letti da `position.assignment` (`isInfluencer`, `influenceScope`, `influenceType`, `influenceNotes`) che è già popolato dal hook `useUnifiedOrgData` → `buildUnifiedPositions`. Nessuna nuova query / nessun cambio dati.

Labels italiane per scope: `team → "del Team"`, `department → "di Dipartimento"`, `company → "Aziendale"`.
Labels per tipo: `technical → "Tecnico"`, `cultural → "Culturale"`, `network → "Network"`, `decisional → "Decisionale"` (riusare le stesse mappe già definite in `UnifiedDetailModal`).

### 3. Lista influencer del nodo → click per aprire la posizione (file: `src/components/admin/orgchart/OrgChartContextPanel.tsx`)

Nella sezione "Influencer del team" del `NodeView`, rendere ogni voce un `<button>` che, su click, seleziona la `UnifiedPosition` dell'influencer. Già passiamo `roles` al pannello: per ogni `nodeRoles` con `primary.isInfluencer` costruiamo un mini-`UnifiedPosition` (role + assignee + assignment + metrics di default) e chiamiamo lo stesso flusso usato dal click sulla card. 

Per evitare di duplicare la logica di `buildUnifiedPositions`, aggiungiamo una prop opzionale `onSelectInfluencer?: (roleId: string) => void` al pannello; `CompanyOrgView` la implementa cercando la `UnifiedPosition` già calcolata e chiamando il suo handler esistente (`handleUnifiedPositionClick` / equivalente). Tocca quindi anche `views/admin/CompanyOrgView.tsx` (solo il punto in cui istanzia `<OrgChartContextPanel>`).

## File toccati

- `src/components/roles/UnifiedRolePersonCard.tsx` — badge più visibile
- `src/components/admin/orgchart/OrgChartContextPanel.tsx` — nuova sezione in `PositionView` + influencer list cliccabile in `NodeView`
- `views/admin/CompanyOrgView.tsx` — wiring di `onSelectInfluencer`

## Cosa NON cambia

- Schema DB, hook di fetch, modale di modifica influencer.
- Logica di matching / SpaceSync / job rotation (già usa i campi).

