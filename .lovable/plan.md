# Fix conteggio persone + rinomina label nel pannello Organigramma

File unico toccato: `src/components/admin/orgchart/OrgChartContextPanel.tsx`.

## 1. Rinomina label

Nella `NodeView` (KpiTile attorno alla riga 322-331), aggiornare le due tile "Persone":

- `Persone (nodo)` → **`In questo nodo`**
- `Persone (sottoalbero)` → **`Collaboratori`** (include il nodo corrente + tutti i sotto-nodi)

Tooltip/aria invariati per il resto.

## 2. Correzione conteggio (4 invece di 3)

Nello screenshot il sottoalbero di *Marketing & Growth* contiene Giulia, Marco, Luca, Sofia = effettivamente 4 card, ma il KPI conta 4 mentre l'utente vede 3 persone reali. La causa più probabile è un **duplicato** nello stream `users`:

- `dataLoaders.ts` popola `departmentId` da `company_members.department_id`
- `adapters.ts` popola `departmentId` da `membership.department_id`

Se lo stesso utente compare sia come `company_member` legacy sia con un `company_role_assignments` collegato a una membership con node diverso (o stesso), finisce due volte nell'array `users` con id ripetuto, oppure compare un placeholder con `firstName` valorizzato ma senza vera identità (es. seed Amaeru). Vedi memoria `operations/seed-data-integrity`.

### Fix difensivo nel componente

In `collectNodeUsers` (riga 65-73) e nei filtri di KPI:

1. **Dedup per `user.id`** prima di contare:
   ```ts
   const dedupById = (arr: User[]) =>
     Array.from(new Map(arr.map(u => [u.id, u])).values());
   ```
2. Applicare in `collectNodeUsers` sul risultato finale e in `directUsers` (riga 276) prima dei `.filter(...)`.
3. Stringere il filtro "persona reale": richiedere `u.id && (u.firstName?.trim() || u.lastName?.trim()) && !u.isHiring` — oggi `firstName || lastName` matcha anche stringhe vuote in alcuni edge case.

Stesso trattamento alla `CompanyView` (riga 154) per coerenza con la KPI "Persone" globale.

## 3. Verifica post-fix

- Caricare `/admin/org`, selezionare *Marketing & Growth*: KPI "Collaboratori" deve mostrare **3** (o il numero reale di card visibili nel sottoalbero).
- Selezionare azienda root: KPI "Persone" globale non deve cambiare di pari passo se prima era già corretto; altrimenti riflette la dedup.
- Nessun altro KPI o sezione ("Manager / Lead", "Sotto-nodi") cambia comportamento.

## Out of scope

- Nessuna modifica a query DB, seed, o ad `adapters.ts` / `dataLoaders.ts`. Il dedup resta lato presentazione: se il duplicato nasce nel data layer va affrontato in un task dedicato di reconciliation.
