## Problema

`MyProfileView` (tab "Il mio Ruolo" e "Il mio Team") usa `useMyTeam`, che risolve il ruolo del dipendente **solo** da `company_role_assignments`. Per molti utenti "legacy" (es. Giulia Ruggi) esiste solo la riga in `company_members` (con `job_title` + `department_id`), e nessun assignment esplicito. Risultato: il profilo mostra "Nessun ruolo aziendale ancora assegnato" e "Nessun collega", anche se nell'organigramma la persona è chiaramente sotto "Head of Marketing" nel dipartimento Marketing & Growth.

L'organigramma (`useUnifiedOrgData.buildMergedPositions`) gestisce già questo caso unendo ruoli espliciti e utenti legacy nello stesso nodo. Dobbiamo replicare la stessa logica di risoluzione nel profilo.

## Cosa fare

### 1. Estendere `useMyTeam` con fallback legacy

In ordine di priorità, risolvere il ruolo dell'utente:

1. **Assignment esplicito** (logica attuale): riga attiva in `company_role_assignments` → role + org_node.
2. **Fallback legacy**: leggere `company_members` per `user_id` + `company_id`:
   - `department_id` → `org_node_id` di riferimento.
   - `job_title` → cercare in `company_roles` un ruolo con `org_node_id = department_id` e `title` che combacia (match case-insensitive, equality o contiene). Se trovato, usare quel `company_role` come "ruolo derivato".
   - Se nessun ruolo matcha ma esiste il `department_id`, mostrare comunque dipartimento + job_title come ruolo "implicito" (senza KPI/skills, ma con team derivato dal nodo).

### 2. Derivare team anche dai colleghi legacy

Oggi `peers` viene calcolato solo da `company_role_assignments` nello stesso `org_node_id`. Aggiungere:

- Query a `company_members` con stesso `company_id` e stesso `department_id` (escluso me) → trasformare in `TeamPerson` con `roleTitle = job_title`, `roleId = null` (o id del ruolo derivato se matchato).
- Dedup: se un utente compare sia da assignments che da company_members, tenere la versione "assignment" (più ricca).
- Stesso ragionamento per `departmentSiblings` (parent node) e `directReports` (utenti legacy il cui `department_id` figlio corrisponde al mio nodo, oppure ruoli che `reports_to_role_id` punta al mio ruolo derivato — opzionale, può restare vuoto se non determinabile).

### 3. Manager: fallback su nodo padre

Se non si trova manager via `reports_to_role_id`, cercare il "lead" del nodo padre (`org_nodes.parent_node_id`):
- Prima provare ruolo nel parent_node con flag/seniority "Lead/Head" o `reports_to_role_id = null` interno al parent.
- In alternativa, un membro `company_members` con `role = 'admin'`/'manager' nel parent_node, oppure il primo con `job_title` che inizia per "Head"/"CEO".
- Se nulla è determinabile, mostrare comunque il messaggio "Non hai un responsabile assegnato" attuale.

### 4. `MyRoleTab`: gestire ruolo derivato senza id

`MyRoleTab` riceve `roleId: string | null`. Quando il ruolo viene da fallback legacy, vogliamo comunque mostrare qualcosa di utile:

- Estendere `useMyTeam` a esporre direttamente l'oggetto `myRole: CompanyRole | null` (anche un "implicit role" costruito dal job_title quando manca il match), invece di solo `myRoleId`.
- `MyRoleTab` accetta `role: CompanyRole | null` (o `null`) e renderizza:
  - se `role.id` inizia con `implicit-` (o flag `isImplicit`), banner: "Il tuo HR non ha ancora collegato il tuo profilo a un ruolo strutturato dell'organigramma. Mostriamo le info di base." + job_title + dipartimento.
  - altrimenti, comportamento attuale (mansionario, KPI, skills, inquadramento).

### 5. `MyProfileView`: passare `myRole` al posto di `myRoleId`

Aggiornare l'invocazione di `MyRoleTab` e l'header per usare il ruolo risolto (anche implicito) per i badge.

## File interessati

- `src/hooks/useMyTeam.ts` — refactor del resolver (assignment → legacy company_members → implicit), aggiunta query a `company_members`, dedup, fallback manager.
- `src/components/profile/MyRoleTab.tsx` — accetta `role: CompanyRole | null` invece di `roleId`, gestisce caso implicit.
- `views/user/MyProfileView.tsx` — passa `team.myRole` a `MyRoleTab`; usa `team.myRoleTitle` (già esposto) per l'header.

Nessuna migrazione DB necessaria. Nessun cambiamento al backend o all'organigramma. Cambia solo il layer di risoluzione frontend del profilo personale.

## Risultato atteso

Aprendo il profilo di Giulia Ruggi (sia da admin sia da self-view):
- Tab "Il mio Ruolo" mostra "Head of Marketing" con i dati del ruolo strutturato di Marketing & Growth (mansionario, KPI, skills vs ruolo).
- Tab "Il mio Team" mostra i colleghi del nodo Marketing & Growth e l'eventuale Head del CEO Office come responsabile.
