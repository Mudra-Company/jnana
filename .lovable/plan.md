## Problema

Sul profilo candidato aperto dal matching, se il candidato non è ancora in shortlist non si può fare nulla: bisogna tornare indietro per aggiungerlo, e non c'è modo di prendere appunti / rating prima di metterlo in shortlist. UX rotta.

## Obiettivo

**Tutti i comandi HR sempre disponibili sul profilo**, indipendentemente dallo stato shortlist:
- Se non in shortlist → form "draft" (rating, note, status iniziale) + bottone primario **Aggiungi alla shortlist** che persiste tutto in un colpo.
- Se già in shortlist → modifiche live (auto-save, come già fatto).

Niente costringere l'utente a uscire dalla pagina.

## Implementazione

### 1. Estendere `usePositionShortlist` con un metodo unico di add
Nuovo metodo `addCandidate(input)` accetta:
```ts
{
  type: 'internal' | 'external',
  userId: string,                  // user.id (internal) o profile.id (external)
  matchScore: number,
  matchDetails: StoredMatchDetails,
  initialStatus?: CandidateStatus, // default 'shortlisted'
  initialRating?: number,
  initialNotes?: string,
}
```
Inserisce direttamente in `shortlist_candidates` con tutti i campi (status/rating/hr_notes inclusi) → un solo round-trip, niente add+update separati. I metodi esistenti restano per retro-compatibilità.

### 2. `KarmaProfileDetailView` calcola al volo i dati di match
Quando `fromPositionId` è presente:
- Carica la posizione (`company_roles` + requisiti) via un nuovo hook leggero `usePositionMatchingContext(positionId)` che restituisce `{ position, requiredSkills, targetRiasec, requiredSeniority }`.
- Determina il tipo candidato: query `company_members` per `(user_id = candidateUserId, company_id = activeCompanyData.id)`. Se trovato → `internal`, altrimenti → `external`.
- Calcola `MatchResult` con `matchingEngine.calculateMatchScore` usando i dati già in `profileData` (RIASEC, hardSkills, seniority, yearsExperience).
- Passa tutto a `CandidateHRActionPanel`.

### 3. Riscrivere `CandidateHRActionPanel` (full-feature)
Stato sempre visibile, due modalità interne:

**Modalità A — non in shortlist (draft)**
- Badge informativo "Non ancora in shortlist" (discreto, niente warning giallo invasivo).
- Mostra match score calcolato (es. "Match 65%").
- Controlli editabili in stato locale: stato iniziale (default `shortlisted`), rating stelle, textarea note HR.
- Bottone primario **"Aggiungi alla shortlist"** → chiama `addCandidate` con i valori draft. Al successo passa a modalità B senza ricaricare la pagina.

**Modalità B — già in shortlist (live)**
- Badge stato corrente.
- Stesso layout di controlli, ma ogni modifica chiama `updateCandidate` (auto-save su blur per le note, immediato per status/rating).
- Bottoni: **Scarta** (status='rejected'), **Rimuovi dalla shortlist** (con conferma).

Layout unico, niente switch visivo brusco — solo il CTA principale cambia (Aggiungi → stato badge).

### 4. Propagare il context
- `KarmaProfileDetailView` passa `profileData`, `candidateType`, `matchScore`, `matchDetails` come props al panel.
- Il panel non fa più data fetching proprio (a parte la lista shortlist via hook).

## File toccati

- `src/hooks/usePositionShortlist.ts` — nuovo `addCandidate` unificato.
- `src/components/shortlist/CandidateHRActionPanel.tsx` — riscrittura per gestire entrambe le modalità.
- `src/hooks/usePositionMatchingContext.ts` *(nuovo)* — fetch posizione + requisiti per uso "single candidate".
- `views/superadmin/KarmaProfileDetailView.tsx` — calcolo tipo candidato + match score, passa al panel.

## Fuori scope
- Nessuna modifica DB / RLS / edge functions.
- Nessuna modifica al matching della lista (PositionMatchingView resta com'è).
- Nessun nuovo URL.
