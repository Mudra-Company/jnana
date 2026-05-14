## Problema

Aprendo il profilo di un candidato dal matching di posizione (`/karma/profile/:userId`):
- non compare la **GlobalBar/ContextBar** (header) — l'utente non può navigare;
- non ci sono **azioni HR** (aggiungi/rimuovi shortlist, scarta, rating, note HR) anche se il candidato è entrato dal contesto di una posizione.

## Cause

1. In `App.tsx` (linea 743) il `<Header />` è nascosto per ogni view che inizia con `KARMA_`, incluso `KARMA_PROFILE_VIEW`. La condizione era pensata per il flusso candidato (welcome/onboarding/test/results) ma colpisce anche la vista profilo aperta da admin.
2. In `AppRoutes.tsx` la navigazione dal matching usa `navigate({ type: 'KARMA_PROFILE_VIEW', userId })` senza passare il `positionId` di provenienza, e `KarmaProfileDetailView` non ha alcuna sezione di azioni HR contestuali (è nato come vista read-only super-admin).

## Cosa fare

### 1. Mostrare la chrome (GlobalBar + ContextBar) sulla vista profilo
- In `App.tsx`, escludere esplicitamente `KARMA_PROFILE_VIEW` dalla condizione che nasconde l'header — gli altri `KARMA_*` (welcome, onboarding, dashboard, results, test) restano senza header come oggi.
- Risultato: la pagina profilo eredita la stessa barra superiore delle altre viste admin, con back, home e menu utente.

### 2. Propagare il contesto "posizione di provenienza"
- Estendere `ViewState.KARMA_PROFILE_VIEW` (in `types.ts`) con un campo opzionale `fromPositionId?: string`.
- Aggiornare `viewToPath` / `pathToView` (`src/router/viewPathMap.ts`) per serializzarlo come query param `?position=...`, così l'URL resta condivisibile.
- In `AppRoutes.tsx` (linee 320 e 368), quando il matching apre un candidato passare `fromPositionId: positionId`. Anche `PositionMatchingView` (callback `onViewProfile`) deve propagarlo.
- `KarmaProfileViewRoute` legge il param e lo passa al view.

### 3. Aggiungere il pannello azioni HR in `KarmaProfileDetailView`
Quando la prop `fromPositionId` è presente, mostrare in alto (sopra i Card esistenti, sotto il bottone "Torna") una **action bar** con:
- pulsante **Aggiungi a shortlist** / badge **Già in shortlist** (con `<CandidateStatusBadge>`);
- selettore **stato candidato** (`shortlisted | interviewing | offered | rejected | hired`);
- componente **`<CandidateRatingStars>`** per il rating 0–5;
- textarea **Note HR** con salvataggio onBlur (debounced);
- pulsante secondario **Scarta** (imposta `status='rejected'`).

Tutta l'integrazione passa per il già esistente hook `src/hooks/usePositionShortlist.ts` (stesse API usate da `ShortlistTab` e `CandidateComparisonModal`), nessuna nuova logica di business.

Se `fromPositionId` non è presente (apertura da super-admin/karma talents), il pannello non viene reso e la vista resta read-only come oggi.

## File toccati (frontend only)

- `App.tsx` — condizione di rendering Header.
- `types.ts` — aggiunta campo `fromPositionId` a `KARMA_PROFILE_VIEW`.
- `src/router/viewPathMap.ts` — encode/decode query `?position=`.
- `src/router/AppRoutes.tsx` — leggere il query param, propagare `fromPositionId` nelle due `navigate` verso `KARMA_PROFILE_VIEW`.
- `views/admin/PositionMatchingView.tsx` — callback `onViewCandidate` riceve anche il `positionId` corrente (già disponibile nello scope).
- `views/superadmin/KarmaProfileDetailView.tsx` — nuova prop opzionale `fromPositionId`, render condizionale dell'action bar HR usando `usePositionShortlist`, `CandidateStatusBadge`, `CandidateRatingStars`.

## Fuori scope

- Nessuna modifica DB / RLS / edge functions.
- Nessuna nuova rotta: si riusa `/karma/profile/:userId` con query param opzionale.
- Nessun refactor di `KarmaProfileDetailView` oltre all'aggiunta dell'action bar.
