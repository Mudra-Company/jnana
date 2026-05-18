# Piano: concetto di "Influencer"

## Obiettivo
Introdurre una persona/ruolo come **Influencer**: figura informale di riferimento del team (non gerarchica). Si attiva con un flag, è visibile nell'organigramma e nella spalla sinistra, e pesa sugli algoritmi di matching, job rotation e SpaceSync.

## Modello dati

Un Influencer è una **persona** (non un ruolo), ma il flag si gestisce sull'assegnazione/profilo perché:
- una stessa persona può essere influencer in un team e non in un altro,
- se la persona lascia il ruolo, il flag non deve "ereditarsi" automaticamente al successore.

Scelta: flag sull'**assignment** (per-team) + ambito (`org_node_id` del team in cui esercita influenza, derivato dal ruolo) + tipo di influenza.

Nuovi campi su `role_assignments`:
- `is_influencer boolean default false`
- `influence_scope text` — enum `team | department | company` (default `team`)
- `influence_type text[]` — multi-tag: `cultural`, `technical`, `social`, `mentor`, `innovator` (opzionale, default `[]`)
- `influence_notes text` (opzionale)

Indice parziale per query veloci: `where is_influencer = true`.

Vincolo soft (a livello UI, non DB): max 1 influencer "principale" per nodo team — più di uno è permesso ma segnalato.

## Backend

Migrazione Supabase: aggiunta colonne + indice + audit log (riusa `company_role_audit_logs` se applicabile all'assignment, altrimenti log applicativo). RLS: ereditata da `role_assignments` (nessuna nuova policy).

## Tipi TS
- `RoleAssignment`: aggiungere `isInfluencer`, `influenceScope`, `influenceType[]`, `influenceNotes`.
- `UnifiedPositionMetrics`: aggiungere `isInfluencer: boolean` e `influenceType: string[]`.
- `useUnifiedOrgData`: popolare i metrics dall'assignment primario.

## UI

### 1. Card persona/ruolo nell'organigramma (`UnifiedRolePersonCard.tsx`)
Icona piccola accanto al nome della persona (es. `Sparkles` o `Megaphone` lucide-react) con tooltip "Influencer · {types}". Stile coerente con il badge `isLeader` esistente, colore distinto (viola/ambra) per non confondersi con il manager/leader gerarchico.

### 2. Context panel sinistro (`OrgChartContextPanel.tsx`)
Nuova sezione **"Influencer del team"** sotto "Manager / Lead":
- se presente uno o più influencer nel nodo (assignments con `is_influencer=true` il cui ruolo è in quel nodo), mostrare nome + chip con `influenceType`.
- se assente, mostrare stato vuoto `— Nessun influencer identificato`.
Per nodi non-team mostra l'aggregato dei sotto-nodi (conteggio).

### 3. Modale dettaglio posizione (`UnifiedDetailModal.tsx`)
Nel tab **Persona** aggiungere blocco "Influenza nel team" con:
- toggle `is_influencer` (editabile da admin/hr),
- selettore `influence_scope`,
- multi-chip `influence_type`,
- textarea note.
Salvataggio via `useRoleAssignments` con pattern di persistenza esistente (update locale → Supabase → revert on failure).

### 4. Edit user/profilo
Nessuna modifica al profilo persona globale — il flag è contestuale al ruolo/team. Sul profilo persona si mostra solo la lista dei team in cui è influencer (read-only, derivata).

## Algoritmi (impatto)

### Matching (`src/utils/matchingEngine.ts`)
Aggiungere un piccolo bonus quando si valuta il fit di un candidato verso un team che ha già un influencer compatibile (es. mentor → junior). Peso suggerito: +3–5% sul match score totale, dietro un nuovo fattore `influencerSynergyScore`. Documentare nel memory `match-score-calculation-v2`.

### Job rotation (`src/utils/jobRotationAnalyzer.ts`)
- Penalizzare rotazioni che **rimuoverebbero l'unico influencer** da un team (rischio "vuoto culturale").
- Bonus se la rotazione **porta un influencer** in un team che ne è privo e ne avrebbe beneficio (basso engagement / culture score basso).
- Aggiungere campo `influencerImpact` nel report con motivazione human-readable.

### SpaceSync (`src/utils/proximityEngine.ts`)
- Aumentare il peso della prossimità tra influencer e nuovi assunti / junior dello stesso team.
- Nel `Proximity Score` introdurre dimensione opzionale `influencerProximity` (peso piccolo, ~5%) — aggiornare memory `spatial-optimization`.

### Climate / cultura
- Quando si calcola il culture fit del team, dare un piccolo extra al team che ha un influencer attivo e culturalmente allineato (segnale di health).

## Permessi
Modifica del flag: `super_admin`, `company_admin`, `hr`. Gli `user` lo vedono read-only.

## Audit
Ogni cambio di `is_influencer` o `influence_type` deve produrre una riga in audit log (motivo: importante per analytics e responsabilità organizzativa).

## Roadmap (ordine di implementazione)
1. Migrazione DB + tipi.
2. Lettura/scrittura in `useRoleAssignments` e `useUnifiedOrgData`.
3. UI: icona su card, sezione su context panel, blocco editor nel modale.
4. Integrazione algoritmi (matching → job rotation → spacesync), uno alla volta con test visivo.
5. Aggiornamento memory files (`features/match-score-calculation-v2`, `spatial-optimization`, nuovo `features/influencer-concept`).

## Aperti — da confermare prima di implementare
1. **Flag a livello assignment o persona globale?** Proposta: per-assignment (un team = un contesto). OK?
2. **Tipi di influenza** suggeriti: `cultural`, `technical`, `social`, `mentor`, `innovator`. Vuoi aggiungerne/toglierne?
3. **Più di un influencer per team**: permesso senza limite, oppure max 1 "principale" + altri "secondari"?
4. **Pesi negli algoritmi**: ok con i default proposti (matching +5%, spacesync +5%, job rotation penalità "ultimo influencer") o vuoi calibrare diversamente?
