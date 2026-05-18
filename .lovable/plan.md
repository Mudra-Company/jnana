
## Obiettivo

Sostituire l'attuale modal "Simula Onboarding" (che apre la landing in nuova tab) con un **vero simulatore in-app** che fa percorrere al super admin tutto il flusso aggiornato (Karma AI nuovo, RIASEC, Climate, Karma chat, Risultati) sia in versione **B2C** che **B2B**, usando le viste reali ma senza salvare nulla nel database. Serve come:
- QA per vedere esattamente cosa vede l'utente finale.
- Demo commerciale per presentare la piattaforma a nuovi clienti senza inquinare i dati.

## Approccio

Il super admin è già autenticato → tutte le edge functions (karma-stream, karma-analyze, cv-parse) restano richiamabili col suo JWT. L'unica cosa da evitare sono le scritture a `profiles`, `user_hard_skills`, `karma_sessions`, `riasec_results`, `onboarding_progress`, `company_members`. Le viste presentazionali (RIASEC test, KarmaWelcome, CV Review, KarmaTestChat) si riusano così come sono; quelle che leggono/scrivono Supabase (KarmaOnboarding, KarmaResults, B2BOnboardingFlow) vengono duplicate in versione "Demo" che opera su uno **stato in-memory React**.

Tutto il simulatore vive sotto un nuovo provider `SimulatorContext` che mantiene il `DemoProfile` (nome, avatar base64, headline/bio, skills, riasec score, transcript karma, climate, eventuale ruolo B2B). Un `SimulatorBanner` sticky in alto ricorda "Modalità Anteprima — i dati non vengono salvati. Esci".

## Flussi simulati

### B2C — `/simulate/b2c`
```text
Landing/Signup mock → KarmaWelcome → (CV upload → CVReview) o (manuale → KarmaOnboarding 5 step)
   → PostOnboardingPromo → KarmaTestRiasec → KarmaTestChat (Karma AI nuovo, streaming reale)
   → KarmaResults (radar + insight AI)
```

### B2B — `/simulate/b2b?companyId=<opzionale>`
```text
Email invito mock → InviteAcceptView (token finto, anteprima) → Signup mock
   → B2BOnboardingFlow (role-aware: company name/logo + ruolo demo con required_hard_skills)
   → KarmaTestRiasec → ClimateTestView → KarmaTestChat (scenario role_fit)
   → KarmaResults con match score vs ruolo
```

Il super admin può passare un `companyId` reale dall'elenco aziende per usare nome/logo/valori veri come "vetrina commerciale" — restano comunque scritture zero.

## Cosa creare

**Nuovi file**
- `src/simulator/SimulatorContext.tsx` — provider + tipi `DemoProfile`, `DemoCompany`, `DemoRole`, azioni (`setProfile`, `addSkill`, `setRiasec`, `setKarma`, `reset`).
- `src/simulator/SimulatorBanner.tsx` — banner sticky "Anteprima · Esci".
- `views/simulator/SimulatorB2CView.tsx` — orchestrator del flusso B2C (state machine `welcome | cv-review | onboarding | promo | riasec | chat | results`).
- `views/simulator/SimulatorB2BView.tsx` — orchestrator B2B (`invite | onboarding | riasec | climate | chat | results`).
- `views/simulator/KarmaOnboardingDemo.tsx` — clone di `KarmaOnboarding` con `updateProfile/uploadAvatar/addHardSkill` reindirizzati al context. Skills catalog (`useHardSkillsCatalog`) resta — è read-only.
- `views/simulator/KarmaResultsDemo.tsx` — clone di `KarmaResults` che legge dal context invece che da `useKarmaProfile`.
- `views/simulator/B2BOnboardingFlowDemo.tsx` — clone di `B2BOnboardingFlow` con company/role passati per prop e nessuna scrittura.
- `views/simulator/SimulatorInviteAcceptDemo.tsx` — replica visiva di `InviteAcceptView` con dati statici dell'azienda demo.
- `views/simulator/SimulatorChoiceModal.tsx` — modal aggiornato con scelta B2C/B2B + (per B2B) selezione azienda showcase opzionale.

**Modifiche**
- `views/superadmin/SuperAdminDashboard.tsx` → usa `SimulatorChoiceModal`; "Avvia anteprima" naviga a `/simulate/b2c` o `/simulate/b2b?companyId=…`.
- `src/router/AppRoutes.tsx` → registra 2 nuove route avvolte in `SimulatorProvider`.
- `src/router/accessPolicy.ts` + `viewPathMap.ts` → aggiungere `SIMULATOR_B2C`, `SIMULATOR_B2B` (kind: pubblico se loggato come super_admin; in pratica gating via component guard).
- `App.tsx` → rimuovere/mantenere `handleStartDemoMode` come "legacy" (lo lasciamo solo come comando segreto, non più nel modal principale).
- Le viste reali `KarmaTestChat`, `KarmaTestRiasec`, `KarmaWelcome`, `CVReviewScreen`, `ClimateTestView`, `PostOnboardingPromo` **non vengono toccate** — accettano già callback presentazionali.

## Dettagli tecnici

- **Avatar in demo**: salvato come dataURL in memoria, niente upload Storage.
- **CV parsing**: la edge function di parsing CV viene chiamata col JWT super admin (lettura ok). Il risultato resta in memoria.
- **Karma chat streaming**: usa l'edge function `karma-stream` esistente. Il `onComplete` riceve il transcript e chiama `karma-analyze` con `botType='discovery'` (B2C) o `'role_fit'` (B2B). Risultato salvato nel `SimulatorContext`, non in DB.
- **Match score B2B**: calcolato lato client confrontando `selectedSkills` + risultati Karma con `requiredHardSkills` del ruolo demo (riuso `services/matchService`).
- **Reset**: uscendo dal simulatore (`Esci` nel banner o navigazione manuale) il context viene azzerato; rientrando in `/superadmin` si torna alla console.
- **Guard**: i route `/simulate/*` sono accessibili solo se `canAccessSuperAdminViews` — altrimenti redirect a `/`.

## Out of scope (non in questa fase)

- Persistenza di "sessioni demo salvate" per riapertura successiva.
- Esportazione PDF del risultato demo per il cliente (può seguire come fase 2).
- Localizzazione: resta italiano coerente col resto.

## Ordine di implementazione

1. `SimulatorContext` + `SimulatorBanner` + provider.
2. Cloni demo: `KarmaOnboardingDemo`, `KarmaResultsDemo`, `B2BOnboardingFlowDemo`, `SimulatorInviteAcceptDemo`.
3. Orchestratori `SimulatorB2CView` e `SimulatorB2BView`.
4. Route + access policy + viewPathMap.
5. `SimulatorChoiceModal` aggiornato in `SuperAdminDashboard`.
6. Smoke test in preview (RIASEC → Chat → Risultati, sia B2C sia B2B).
