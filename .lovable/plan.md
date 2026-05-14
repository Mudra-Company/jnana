# Allineamento dettaglio ruolo: Dashboard ↔ Organigramma

## Problema

Cliccando su un ruolo in hiring dalla Dashboard (es. "Stagista") si atterra sull'Organigramma e si apre il **vecchio** `RoleDetailModal` (screen 1) — vista ridotta con solo Panoramica/Mansionario/Requisiti/Inquadramento/Storico, senza tab Persona/Collaborazione, senza CTA "Avvia Matching", senza accesso al matching.

Cliccando lo stesso ruolo dall'Organigramma si apre invece il `UnifiedDetailModal` (screen 2) — vista completa role-centric con tutti i tab, footer "Modifica" + "Avvia Matching", accesso shortlist/matching.

Causa: in `views/admin/CompanyOrgView.tsx` il deep-link `?role=<id>` chiama `setSelectedRole(role)` (vecchio modal) invece di aprire la `UnifiedPosition` nel modal unificato.

## To-be

Una sola modale di dettaglio per ogni posizione/ruolo, indipendentemente da dove parte il click (Dashboard, Organigramma, futuri entry-point). Si usa sempre `UnifiedDetailModal`.

## Modifiche

**File:** `views/admin/CompanyOrgView.tsx`

1. **Importare `useUnifiedOrgData`** e ottenere `buildUnifiedPositions` (per costruire la `UnifiedPosition` con `metrics` corretti partendo dal `CompanyRole` + assignee + companyValues + parentManagers).

2. **Riscrivere l'effect del deep-link** (righe ~1632-1648):
   - Trovare il ruolo per `focusRoleIdFromUrl`.
   - Costruire la `UnifiedPosition` corrispondente: usare `buildUnifiedPositions([role], users, companyValues, parentManagers, culturalDriverNodeIds)` e prendere il primo elemento. I `parentManagers` si ricavano da `parentManagersByNode[role.orgNodeId]` (già calcolato sotto, va spostato/anticipato se necessario, oppure ricalcolato inline per il singolo nodo).
   - Chiamare `handleOpenFullDetail(position)` (che già fa il fetch completo di assignments e setta `selectedUnifiedPosition`).
   - Rimuovere la chiamata a `setSelectedRole(role)`.
   - Mantenere il cleanup del query param `?role=` e il ref `hasOpenedFocusRoleRef` per evitare re-trigger.

3. **Rimuovere il rendering del vecchio `RoleDetailModal`** (righe ~2207-2215) e il relativo `useState` `selectedRole/setSelectedRole` se non più usati altrove. Verificare con grep che non ci siano altri call-site; se sì, lasciarli ma deprecare l'apertura via deep-link.

4. **Rimuovere l'import** di `RoleDetailModal` se non più referenziato.

## Sezione tecnica

- `handleOpenFullDetail` esiste già (righe 1698-1707) e fa: `fetchRoleWithAssignments(role.id)` → merge sulla position → `setSelectedUnifiedPosition(...)`. È esattamente il flusso che vogliamo.
- `parentManagersByNode` (riga 1654) è dichiarato dopo l'effect del deep-link: l'ordine è ok perché l'effect dipende da `roles` e gira dopo il primo render.
- Nessuna modifica a Dashboard, viewPathMap o types: il routing `?role=<id>` resta invariato; cambia solo cosa viene aperto a destinazione.
- Nessun cambiamento a backend, hook dati, RLS.

## Out of scope

- Refactoring del `RoleDetailModal` (può restare nel codebase per ora; se nessuno lo usa più lo si elimina in un cleanup successivo).
- Modifiche al click dell'organigramma (già corretto).
- Modifiche grafiche al `UnifiedDetailModal`.
