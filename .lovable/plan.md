## Diagnosi

Ci sono due bug indipendenti, entrambi causati dalla migrazione "role-centric" (da `company_members` a `company_roles`) lasciata a metà.

### Bug 1 — "Posizioni Aperte" mostra 0 anche se la posizione esiste

Verificato sul DB di Amaeru:
- La posizione **"Stagista" (vacante, hiring)** vive in `company_roles` con `is_hiring=true`.
- Non c'è nessuna riga in `company_members` con `is_hiring=true`.

La Dashboard infatti mostra correttamente "IN HIRING: 1" perché `AdminDashboard` somma entrambe le sorgenti (`roles.filter(r => r.isHiring)` + legacy `company_members`).

Invece la pagina **Posizioni Aperte** (`OpenPositionsView` → `useOpenPositions`) interroga **solo la tabella legacy `company_members`** con `.eq('is_hiring', true)`, quindi non vede mai i ruoli moderni → "0 posizioni aperte".

Stesso problema su `getPositionById`: se l'utente cliccasse "Trova Candidati" su un ruolo moderno, fallirebbe a caricarlo.

### Bug 2 — Dall'organigramma manca la CTA "Trova Candidati"

Il `UnifiedDetailModal` ha già la logica per mostrare il bottone "Trova Candidati":
```tsx
{!assignee && role.isHiring && onOpenMatching && ( <Button>Trova Candidati</Button> )}
```
Ma in `CompanyOrgView.tsx` (riga ~2132) il modal viene istanziato **senza la prop `onOpenMatching`**, quindi il bottone non appare mai. Lo screenshot del modal "Stagista" lo conferma: VACANTE + HIRING ma solo "Modifica".

La prop `onOpenPositionMatching` arriva già fino a `CompanyOrgView` da `App.tsx` (riga 1143) — basta inoltrarla al modal.

## Piano

### 1. `useOpenPositions` — leggere da entrambe le sorgenti

Sostituire `fetchPositions` e `getPositionById` per fare l'UNION di:

- **company_roles** con `is_hiring = true` (sorgente primaria moderna)
- **company_members** con `is_hiring = true` (legacy, retrocompatibilità)

Mappatura uniforme verso `OpenPosition`:
- `id`: id del record (con prefisso interno `role:` / `member:` per disambiguare quando passato a `PositionMatchingView`, OPPURE preservare l'id grezzo se `PositionMatchingView` già accetta entrambi — verifico in implementazione e adatto)
- `jobTitle`: `company_roles.title` / `company_members.job_title`
- `departmentId/Name`: `company_roles.org_node_id` / `company_members.department_id` (join `org_nodes`)
- `requiredProfile`: per i ruoli, costruirlo on-the-fly da `required_hard_skills`, `required_soft_skills`, `required_seniority` (stesso shape dell'interfaccia `RequiredProfile`); per i membri legacy resta il JSON `required_profile`.
- Escludere i ruoli che hanno già un assignee attivo (anche se `is_hiring=true`).

Verificare che `PositionMatchingView` funzioni con un id di `company_roles`: se oggi accetta solo id di `company_members`, aggiungere il branch per caricare anche da `company_roles`.

### 2. `CompanyOrgView` — passare `onOpenMatching` al modal

Nel render di `<UnifiedDetailModal …>` aggiungere:
```tsx
onOpenMatching={() => {
  const positionId = selectedUnifiedPosition.role.id;
  // se è un ruolo "implicit-…", prima auto-promuoverlo (riusare la logica già presente in onSaveRole)
  onOpenPositionMatching?.(positionId);
  setSelectedUnifiedPosition(null);
}}
```
Caso ruolo "implicit-…": estrarre la promozione in una piccola helper e chiamarla anche qui, così cliccando "Trova Candidati" su una posizione non ancora promossa il ruolo viene creato e poi si apre il matching.

### 3. Coerenza KPI Dashboard ↔ Posizioni Aperte

Dopo la fix #1, KPI "IN HIRING" della Dashboard e count della pagina "Posizioni Aperte" useranno la stessa sorgente unificata. Lo `AdminDashboard` può smettere di sommare due conteggi separati: leggerà anch'esso da `useOpenPositions` (o lasciamo invariato, ma rimuoviamo la duplicazione `roles.length + legacyHiringPositions.length` perché i ruoli moderni con `is_hiring=true` sono già un sottoinsieme dei "vacanti"). Allineamento da fare in fase 1, dopo aver verificato i numeri.

### 4. QA manuale (in default mode)

- Aprire `/Posizioni Aperte` su Amaeru → deve apparire la card "Stagista" con bottone "Trova Candidati".
- Cliccare "Trova Candidati" → si apre `PositionMatchingView` per quel ruolo.
- Aprire l'organigramma → cliccare la posizione "Stagista" → nel modal ora compaiono entrambi i bottoni "Modifica" e "Trova Candidati".
- Verificare che il KPI Dashboard "IN HIRING" continui a mostrare 1 (e non 2).

## File toccati

- `src/hooks/useOpenPositions.ts` — query unificata su `company_roles` + `company_members`.
- `views/admin/CompanyOrgView.tsx` — passare `onOpenMatching` a `UnifiedDetailModal` (gestendo i ruoli `implicit-…`).
- `views/admin/PositionMatchingView.tsx` — eventuale supporto a id di `company_roles` (da verificare a inizio implementazione).
- `views/admin/AdminDashboard.tsx` — rimuovere doppio conteggio se necessario per coerenza.

## Fuori scope

Nessun cambiamento di schema DB: entrambe le tabelle restano. La migrazione completa di `company_members` legacy → `company_roles` è un lavoro più ampio non richiesto qui.
