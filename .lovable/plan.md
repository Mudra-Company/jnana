## Obiettivo
Unificare i due record:
- **A** = `e2f87c8c…` — `giuseppe.ciniero@mudra.team` (loggato, super_admin, oggi "Stagista" in Mudra spa)
- **B** = `7189d2cb…` — `giuseppe.ciniero@amaeru.eu` (CEO Amaeru, ha tutti i dati)

Risultato finale: un solo Giuseppe (account A) come **CEO & Presidente CDA** in **CEO Office / Amaeru**, con super_admin mantenuto e tutti i dati del CEO ereditati.

## Cosa farò (operazioni dati, nessuna modifica di codice)

### 1. Arricchisci `profiles` di A
Copia da B → A:
- `job_title` = "CEO & Presidente CDA"
- `headline` = "CEO @ Amaeru — Pet-tech & AI for Animal Wellbeing"
- `bio`, `location`, `region`, `birth_date`, `years_experience`, `avatar_url` (se valorizzati su B)

### 2. Sposta A in Amaeru (`company_members`)
- DELETE riga `company_members` di A in Mudra spa (Stagista).
- INSERT nuova riga `company_members` per A:
  - `company_id` = Amaeru (`02b47082…`)
  - `department_id` = CEO Office (`2117ea84…`)
  - `role` = `admin`, `status` = `completed`
  - `job_title` = "CEO & Presidente CDA"

### 3. Riassegna il ruolo "CEO & Presidente CDA" all'account A
Nel record `company_role_assignments` `72d9ff38…` (oggi `user_id = NULL`):
- UPDATE `user_id` = A
- UPDATE `company_member_id` = nuovo id membership di A in Amaeru

### 4. Trasferisci i risultati dei test da B → A
- UPDATE `riasec_results.user_id` da B a A (1 riga; `company_id` resta Amaeru)
- UPDATE `karma_sessions.user_id` da B a A (1 riga)
- UPDATE `climate_responses.user_id` da B a A per la riga di Amaeru (B ne ha 1)
- I risultati esistenti dell'account A (1 RIASEC + 1 Climate fatti su Mudra spa) vengono **mantenuti**: l'app userà comunque il più recente / quello del tenant attivo

### 5. Riassegna la scrivania
- UPDATE `office_desks` (id `dea3be6f…`): `company_member_id` → nuova membership di A

### 6. Cleanup utente duplicato B
- DELETE eventuali altre righe collegate a B (`profile_views_log` di B, `user_roles` di B)
- DELETE `profiles` di B
- DELETE da `auth.users` l'utente B (`giuseppe.ciniero@amaeru.eu`)

### 7. Verifica
SELECT finale per confermare:
- A ha 1 sola riga in `company_members` → Amaeru, admin, CEO Office
- `company_role_assignments` "CEO & Presidente CDA" punta ad A
- riasec/karma/climate di Amaeru appartengono ad A
- B non esiste più

## Note
- Nessun file di codice viene toccato.
- L'account `e2f87c8c…` mantiene `super_admin` e diventa anche admin di Amaeru.
- L'account `ciniero.g@gmail.com` (`72f1706f…`) non viene toccato (non è coinvolto nella confusione).
- Dopo l'esecuzione potrebbe essere necessario un refresh / nuovo login per vedere il nuovo tenant attivo.
