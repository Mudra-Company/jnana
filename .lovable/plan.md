## Diagnosi

La sezione "Sintonia Leadership & Management" in `/admin/identity` mostra "Dati insufficienti" per Amaeru perché **i 22 membri di Amaeru non hanno alcun record in `riasec_results`** (e quindi nessun `profile_code`).

Verifiche fatte sul database:
- Amaeru: 22 membri totali, **0 con riasec**.
- Dürr Dental: 18 membri, 18 con riasec → la sezione funziona lì.
- I `karma_sessions` (23) e i `climate_responses` (22) di Amaeru sono presenti: solo i RIASEC sono stati persi.

La funzione `calculateLeadershipAnalytics` (`services/riasecService.ts`) richiede `user.profileCode` sia sul manager sia sul collaboratore (righe 494, 498). Senza `profile_code` non viene mai conteggiata nessuna coppia → `pairsCount = 0` → "Dati insufficienti".

I dati RIASEC originali esistono ancora nel codice del seed `supabase/functions/seed-amaeru-full/index.ts` (array `PEOPLE`, ~22 voci con scores R/I/A/S/E/C per ogni email `@amaeru.eu`). Gli `id` di `company_members` sono stabili e gli utenti auth+profiles esistono già con i giusti `user_id`.

## Soluzione: edge function di riparazione mirata

Creare una nuova edge function **`repair-amaeru-riasec`** che ripristina solo i `riasec_results` mancanti, **senza toccare auth, profiles, karma_sessions, climate_responses, role assignments** (per non rompere le memorie esistenti — cfr. memory "Seed Data Integrity").

### Cosa fa la function
1. Carica internamente la lista `PEOPLE_RIASEC` (solo `email`, `R, I, A, S, E, C`) estratta dal seed esistente.
2. Per ciascuna voce:
   - cerca l'utente su `profiles` via `email = …`;
   - se trovato, cancella eventuali righe in `riasec_results` per quell'`user_id` + `company_id = COMPANY_ID` (idempotenza);
   - inserisce una nuova riga in `riasec_results` con:
     - `score_r/i/a/s/e/c = round(valore/100*30)` (stessa scala del seed originale, conforme alla memory "Test Result Scales");
     - `profile_code = profileCode({R,I,A,S,E,C})` (top-3 lettere ordinate per score, come nel seed);
     - `raw_answers = { repaired: true }`;
     - `company_id = '02b47082-c1d5-4e63-bc78-b6e9dfe602a7'`.
3. Restituisce `{ ok, repaired, skipped, log }`.

### Trigger esecuzione
Aggiungere un piccolo bottone "Ripara dati RIASEC Amaeru" **solo** nella vista già esistente `src/views/admin/SeedDataView.tsx` (riservata a super_admin) che invoca la function. Nessuna esecuzione automatica al boot.

### Idempotenza & sicurezza
- La function è scoped per `COMPANY_ID = Amaeru` (costante hardcoded).
- Idempotente: cancella+ripopola le righe RIASEC della sola Amaeru.
- Nessuna modifica a auth/profiles/karma/climate/roles.
- `verify_jwt = true` (default) + check ruolo super_admin lato client (la SeedDataView è già protetta).

## Verifica post-fix

Dopo l'esecuzione:
- Query: `SELECT COUNT(*) FROM riasec_results WHERE user_id IN (SELECT user_id FROM company_members WHERE company_id='02b47082-c1d5-4e63-bc78-b6e9dfe602a7')` → atteso 22.
- Aprire `/admin/identity` su Amaeru → la sezione "3. Sintonia Leadership & Management" deve mostrare Global Alignment Index, Friction Rate, distribuzione e team alignment.

## File toccati

- **Nuovo**: `supabase/functions/repair-amaeru-riasec/index.ts` — function di riparazione con dataset inline.
- `src/views/admin/SeedDataView.tsx` — un bottone "Ripara RIASEC Amaeru" che chiama la function.

## Fuori scopo

- Nessuna modifica a `services/riasecService.ts` né alla UI di `AdminIdentityHub.tsx` (la logica è corretta, mancano solo i dati).
- Nessuna modifica DB schema, RLS, altre company.
- Nessun tocco a karma_sessions, climate_responses, role_assignments di Amaeru.
