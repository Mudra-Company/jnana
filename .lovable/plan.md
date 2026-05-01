## Report tecnico: stato attuale dell'architettura

Hai ragione: **non è un monolite "gigantesco" nel senso peggiore del termine, ma è un monolite di routing**. Il codice è ben modularizzato a livello di componenti (hai 100+ file, view, hook, servizi separati), ma **tutta la navigazione passa per un unico file enorme**: `App.tsx`.

### Numeri chiave

| Metrica | Valore | Giudizio |
|---|---|---|
| Righe in `App.tsx` | **1.582** | Critico (limite sano: ~300) |
| ViewState distinti | **42** stringhe in un'unione discriminata | Da spezzare |
| Router dichiarato | **Nessuno** (`react-router-dom` non installato) | Causa root del problema |
| Componenti view modulari | ~50 file in `views/` e `src/views/` | Buono |
| Hook custom | ~30 in `src/hooks/` | Buono |
| Edge functions | ~12 ben separate | Buono |

### Cosa funziona (NON va toccato)

- **Componenti, view, hook, servizi**: già ben separati per dominio (karma, admin, spacesync, compliance, roles, ecc.).
- **Backend (Supabase + edge functions)**: pulito e modulare.
- **Design system Tailwind custom**: rispettato secondo memory.
- **Auth provider**: ora a livello root in `index.tsx`, stabile.

### Cosa NON funziona (causa di lentezza, fragilità, URL identici)

1. **Routing fatto a mano con `useState<ViewState>`**
   - 42 tipi di view in un'unica unione, gestiti da uno switch implicito di ~800 righe in `App.tsx`.
   - Nessun cambio di URL → niente deep link, niente back/forward del browser, niente bookmark, niente condivisione, niente analytics per pagina, niente SEO.
   - Refresh = perdita di stato (riparte da `LOADING`).

2. **`App.tsx` è il "god component"**
   - Carica auth, profili, companies, org nodes, test results, demo state, CV onboarding, invite handling, route guard, e fa il rendering di tutte le 42 view.
   - Ogni modifica a una qualsiasi view rischia di rompere le altre e ricompila l'intero file.
   - `loadCurrentUserData` decide la view di destinazione con una catena di `if` su intent + ruolo + dati: logica di routing nascosta nei dati.

3. **Bundle pesante / lazy loading assente**
   - Tutte le view sono `import` statici in cima ad `App.tsx` → un utente che apre il login scarica anche SpaceSync, Compliance, Org Chart, editor questionari, ecc.
   - Nessun `React.lazy` / code-splitting → first paint più lento del necessario.

4. **State globale duplicato**
   - `currentUserData`, `companyUsers`, `activeCompanyData`, `companies`, `jobDb` vivono in `App.tsx` e vengono passati prop-drilling alle view. Le view ricaricano spesso dati già in memoria.

5. **Route guard reattivo, non dichiarativo**
   - `useEffect` che osserva `view.type` e fa `setView` di redirect → flicker e doppi render.

### Verdetto

Non c'è da riscrivere niente: il 90% del codice è sano. **Va estratto il routing** dal monolite e introdotto un router vero. Tutto il resto rimane.

---

## Piano di refactoring (incrementale, zero perdita di funzionalità)

Lavoreremo in **5 fasi indipendenti**, ognuna deployabile da sola. Dopo ogni fase l'app funziona come prima, ma meglio.

### Fase 1 — Introduzione di React Router (URL reali)

- Installare `react-router-dom`.
- Creare `src/router/AppRouter.tsx` con `<BrowserRouter>` e una mappa `ViewState → path`:
  ```text
  /                          → LANDING
  /login                     → LOGIN
  /auth/reset-password       → RESET_PASSWORD
  /admin                     → ADMIN_DASHBOARD
  /admin/org                 → ADMIN_ORG_CHART
  /admin/identity            → ADMIN_IDENTITY_HUB
  /admin/positions           → ADMIN_OPEN_POSITIONS
  /admin/positions/:id       → ADMIN_POSITION_MATCHING
  /admin/compliance          → ADMIN_COMPLIANCE
  /admin/spacesync           → ADMIN_SPACESYNC
  /admin/users/:id           → ADMIN_USER_DETAIL
  /admin/company             → ADMIN_COMPANY_PROFILE
  /superadmin                → SUPER_ADMIN_DASHBOARD
  /superadmin/jobs           → SUPER_ADMIN_JOBS
  /superadmin/karma          → SUPER_ADMIN_KARMA_TALENTS
  /superadmin/karma/:userId  → SUPER_ADMIN_KARMA_PROFILE
  /superadmin/analytics      → SUPER_ADMIN_ANALYTICS
  /superadmin/questionnaires → SUPER_ADMIN_QUESTIONNAIRES
  /superadmin/questionnaires/:id → SUPER_ADMIN_QUESTIONNAIRE_EDIT
  /karma                     → KARMA_DASHBOARD
  /karma/welcome             → KARMA_WELCOME
  /karma/onboarding          → KARMA_ONBOARDING
  /karma/profile             → KARMA_PROFILE_EDIT
  /karma/test/riasec         → KARMA_TEST_RIASEC
  /karma/test/chat           → KARMA_TEST_CHAT
  /karma/results             → KARMA_RESULTS
  /company/talent            → COMPANY_TALENT_SEARCH
  /company/candidate/:userId → COMPANY_CANDIDATE_VIEW
  /test/welcome              → USER_WELCOME
  /test/riasec               → USER_TEST
  /test/chat                 → USER_CHAT
  /test/climate              → USER_CLIMATE_TEST
  /me                        → USER_RESULT
  /demo/*                    → DEMO_*
  ```
- Mantenere `ViewState` come tipo legacy per le view che non sono ancora migrate, con uno **shim** `setView({type})` che fa internamente `navigate(path)`. Così le view interne continuano a funzionare invariate.
- Aggiungere `<ScrollRestoration>` e gestire `404 → /`.

### Fase 2 — Estrazione del Layout e dei Route Guards

- Creare `src/router/guards/`:
  - `RequireAuth.tsx` (redirect a `/login`)
  - `RequireAdmin.tsx` (usa già `useRouteGuard`)
  - `RequireSuperAdmin.tsx`
- Creare `src/layouts/`:
  - `AppLayout.tsx` (Header + `<Outlet/>`)
  - `AuthLayout.tsx` (per login/reset)
- Le rotte si scrivono dichiarativamente:
  ```text
  <Route element={<RequireAdmin/>}>
    <Route path="/admin" element={<AdminDashboardView/>}/>
    ...
  </Route>
  ```
- Eliminare l'`useEffect` di route-guard reattivo dentro `App.tsx`.

### Fase 3 — Spezzettamento di `App.tsx`

- Estrarre da `App.tsx` in file dedicati:
  - `src/app/adapters.ts` → `profileToLegacyUser`, `companyToLegacy` (~130 righe).
  - `src/app/hooks/useCurrentUserData.ts` → `loadCurrentUserData` + state correlato.
  - `src/app/hooks/useSuperAdminData.ts` → `loadAllCompaniesForSuperAdmin`, `loadAllUsersForSuperAdmin`.
  - `src/app/hooks/useInviteHandler.ts` → invite + pendingInvite.
  - `src/app/hooks/useDemoMode.ts` → demo state isolato.
- Obiettivo: `App.tsx` < 200 righe, solo provider + router.

### Fase 4 — Code-splitting con `React.lazy`

- Convertire ogni view importata in `App.tsx` in `lazy(() => import(...))`.
- Wrappare il `<Outlet/>` in `<Suspense fallback={<Loading/>}/>`.
- Risultato atteso: bundle iniziale ridotto del 50–70%, login/landing più veloci.

### Fase 5 — State management leggero (opzionale, alta resa)

- Spostare `currentUserData`, `companyUsers`, `activeCompanyData`, `companies` da prop-drilling a un context dedicato (`AppDataContext`) o, meglio, **introdurre `@tanstack/react-query`** per cache, dedup e refetch automatici.
- Le view leggono i dati con hook (`useCurrentUser()`, `useCompanyUsers()`) invece che da props → meno re-render globali, niente ricariche duplicate.

---

## Rischi e mitigazioni

| Rischio | Mitigazione |
|---|---|
| Rotture in view che chiamano `setView({type:...})` | Lo shim di compatibilità fa partire ogni `setView` come `navigate()`. Migrazione view-per-view senza big-bang. |
| Reset password che usa già `window.location.pathname` | Diventa una rotta dichiarativa `/auth/reset-password`. Comportamento identico. |
| Invite link `?invite=...&company=...` | Gestiti in un `useEffect` dentro `RequireAuth` o nel layout root, identico a oggi. |
| Demo mode con view dedicate | Restano sotto `/demo/*` con propria mini-routing. |
| Auth flow + redirect post-login | `loadCurrentUserData` non chiama più `setView(...)`: ritorna il path target e il chiamante fa `navigate(target)`. |

## Tempi indicativi

- Fase 1: 1 sessione (l'unica con qualche rischio, va testata bene)
- Fase 2: 0.5 sessione
- Fase 3: 1 sessione
- Fase 4: 0.5 sessione
- Fase 5: 1 sessione (può essere fatta dopo, anche molto dopo)

Totale per arrivare a un'app con URL veri, App.tsx pulito e bundle splittato: **~3 sessioni**.

## Cosa propongo come prossimo passo

Partire **solo dalla Fase 1** (React Router + shim di compatibilità). È il cambiamento con più valore percepito (URL veri, back/forward, deep link, bookmark) e zero rischio sulle altre view. Le fasi 2–5 le decidiamo dopo aver visto il risultato.

Confermi che procedo con la **Fase 1**?
---

## ✅ Fase 1 — Completata

URL routing reale con shim di compatibilità. Ogni view ha un path bookmarkable, back/forward del browser funzionano.

## ✅ Fase 2 — Completata

Guards dichiarativi e layouts riusabili (additivi, non rompono nulla).

**File creati:**
- `src/router/accessPolicy.ts` — mappa centralizzata `ViewType → roles`, copre tutti i 46 view types. Funzione `canAccessView(viewType, isAuthenticated, role)`.
- `src/router/guards.tsx` — `<RequireAuth>`, `<RequireGuest>`, `<RequireAdmin>`, `<RequireSuperAdmin>`, `<RequireRole>`, `<RequireViewAccess>`. I guards rendono `fallback` (default `null`) quando il check fallisce — non navigano mai da soli, così App.tsx mantiene il controllo dei redirect.
- `src/router/layouts.tsx` — `<AppLayout>`, `<AuthLayout>`, `<LoadingLayout>`.
- `src/router/index.ts` — barrel export per import puliti.

**Risultato:** abbiamo i building block per la Fase 3 senza aver toccato il render switch di `App.tsx`. Ogni guard può essere usato in modo incrementale per sostituire i `&& canAccessAdminViews` inline.

**Prossimo passo:** Fase 3 — estrarre la logica di `App.tsx` in hook (`useCurrentUserData`, `useInviteHandler`, `useImpersonation`) e migrare il render switch a un albero `<Routes>` reale che sfrutta i guard appena creati.

## 🔄 Fase 3 — In corso (step 1 di 3)

### Step 1 ✅ — Estrazione adapters puri

- Creato `src/app/adapters.ts` con `profileToLegacyUser` e `companyToLegacy`.
- Rimosse le definizioni inline da `App.tsx`.
- **App.tsx: 1591 → 1460 righe** (-131, -8%). Zero rischio: funzioni pure, stessa firma, tutti i 6 call site continuano a funzionare via import.

### Step 2 (prossimo) — Hook di data loading

Estrarre da `App.tsx`:
- `useCurrentUserData` — `loadCurrentUserData` + state correlato (`currentUserData`, `companyUsers`, `activeCompanyData`).
- `useSuperAdminData` — caricamento companies/users per super admin.
- `useInviteHandler` — `pendingInviteData` + check localStorage.

### Step 3 — Route switch dichiarativo

Sostituire il mega switch di rendering con un albero `<Routes>` reale che sfrutta i guard della Fase 2. Lo shim `useViewRouter` continua a sincronizzare `view ↔ URL` durante la migrazione.

### Step 2 ✅ — Estrazione data loaders puri

- Creato `src/app/dataLoaders.ts` con `loadAllCompanies`, `loadAllUsersForSuperAdmin`, `loadCompanyUsersWithDetails` — async puri, zero state React, accettano solo argomenti primitivi.
- `App.tsx` ora importa i loader e mantiene solo wrapper sottili che chiamano i setter (`setCompanies`, `setCompanyUsers`, `setActiveCompanyData`).
- Aggiornato anche il call site `onRefreshUsers` nell'AdminIdentityHub.
- **App.tsx: 1460 → 1335 righe** (-125, ulteriore -8.5%). Cumulativo dal Phase 3 start: 1591 → 1335 (-256, -16%).

### Step 3a ✅ — AppDataContext (Fase 5 anticipata)

- Creato `src/app/AppDataContext.tsx` con `AppDataProvider`, `useAppData()`, `useAppDataOptional()`. Espone tutto lo state e gli handler oggi inline in `AppContent`: auth-derived, routing (`view`/`navigate`/`goBack`), domain (`currentUserData`, `companyUsers`, `activeCompanyData`, `companies`, `jobDb`), tema, super-admin (impersonate, create company), demo mode, handler di flow utente, invite, CV parsed.
- `AppContent` ora costruisce `appDataValue` e wrappa il return col `<AppDataProvider>`. Comportamento invariato.
- Build pulita.

### Step 3b (prossimo) — Migrazione progressiva del switch a `<Routes>`

Ogni view sarà un componente di route che legge i dati con `useAppData()`. Procederemo per gruppi: prima le view "leaf" (analytics, questionnaires, karma profile/results), poi admin, poi user flow, poi demo. Lo shim `useViewRouter` resta attivo finché tutte le view non sono migrate.
