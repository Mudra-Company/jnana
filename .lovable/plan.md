## Perché è vuoto

Il tile **Skill Gap** è calcolato da `calcSkillGap(users)` in `OrgChartContextPanel.tsx`, che legge da `user.requiredProfile` (campo legacy pre-architettura ruolo-centrica) e confronta solo con `karmaData.softSkills`. Nell'attuale modello i requisiti vivono su `company_roles.requiredHardSkills / requiredSoftSkills`, quindi `requiredProfile` è quasi sempre vuoto → ritorna `null` → "—".

## Cosa ha senso mostrare lì

Il KPI deve rispondere a una domanda operativa per l'admin: **"Quanto del fabbisogno di competenze di questo nodo è scoperto?"**

Definizione (coerente con il resto del pannello e con il modello roles-centric):

```
Skill Gap (%) = skill richieste non coperte / skill totali richieste × 100
```

Dove:
- **Skill richieste** = somma di `requiredHardSkills` + `requiredSoftSkills` di tutti i `CompanyRole` del nodo (vista nodo) o dell'intera azienda (vista azienda).
- **Coperta** = il ruolo ha un assegnatario reale (non hiring) e quella skill compare nelle sue `hardSkills` o `karmaData.softSkills` (match case-insensitive con la stessa logica fuzzy già usata in `calcSkillGap`).
- **Non coperta** = ruolo vacante / hiring → tutte le sue skill richieste contano come gap; oppure assegnatario presente ma skill mancante.

Vantaggi:
- Riflette l'architettura attuale (Roles primary entity).
- Penalizza correttamente le posizioni aperte (il messaggio "abbiamo gap perché manca gente" emerge naturalmente).
- Rimane confrontabile tra nodi e con la vista azienda.
- La semantica del colore già definita (`gapColor`: ≤20 verde, ≤50 giallo, >50 rosso) resta valida.

Edge case:
- Nodo / azienda con **zero ruoli con requisiti** → mostriamo "—" (come oggi quando non c'è dato, evitando 0% fuorviante).
- Nodo con tutti ruoli vacanti → 100%.

## Modifica

File unico: `src/components/admin/orgchart/OrgChartContextPanel.tsx`.

1. Sostituire `calcSkillGap(users: User[])` con `calcRoleSkillGap(roles: CompanyRole[])` che:
   - Itera sui ruoli passati.
   - Conta `req` come somma di `requiredHardSkills.length + requiredSoftSkills.length`.
   - Per ogni skill richiesta:
     - Se il ruolo non ha assegnatario reale → `gaps++`.
     - Altrimenti verifica match case-insensitive contro `assignee.hardSkills[].name` (per le hard) e `assignee.karmaData?.softSkills` (per le soft); se non trovata → `gaps++`.
   - Ritorna `null` se `req === 0`, altrimenti `Math.round(gaps/req*100)`.

2. Per ottenere l'assegnatario di ciascun ruolo riusare la stessa logica di `useUnifiedOrgData.buildUnifiedPositions`: prima `role.currentAssignee`, poi primary assignment. Gli `users` sono già passati al pannello, quindi posso risolverli localmente senza nuove query.

3. Invocazione:
   - In `CompanyView`: `const gap = calcRoleSkillGap(roles, users);` (era `calcSkillGap(users)`).
   - In `NodeView`: filtrare i ruoli del nodo (`roles.filter(r => r.orgNodeId === node.id)`) → `calcRoleSkillGap(nodeRoles, users)`. Resta sul nodo, non sul sottoalbero, per essere coerente con "Clima" che è anch'esso `directUsers`.

4. Nessuna modifica a tipi, hook, DB o altri componenti.

## Verifica

Sul nodo "Marketing & Growth" dello screenshot, il ruolo "Head of Marketing" ha requisiti definiti e Giulia Ruggi assegnata: il tile mostrerà una % concreta invece di "—". Sui nodi senza requisiti definiti continuerà a mostrare "—".
