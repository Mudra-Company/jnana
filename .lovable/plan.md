## Obiettivo

Trasformare la barra in alto (oggi monolitica e mista: logo + tema + nav contestuale + nome azienda + "Il mio profilo" + Esci) in un sistema a **due livelli**, come nelle piattaforme SaaS moderne (Linear, Notion, Vercel, Lovable):

- **Livello 1 — Global Bar (persistente, identità e account)**: identità prodotto a sinistra, controlli personali a destra. Sempre uguale ovunque.
- **Livello 2 — Context Bar (contestuale alla sezione)**: navigazione della sezione corrente (Super Admin / Admin Azienda / User), eventuale chip azienda attiva, breadcrumb / back.

Il banner arancione "Modalità Supervisione" resta invariato sopra tutto.

## Stato attuale (cosa non va)

In `components/layout/Header.tsx` un'unica `<nav>` contiene:

- Logo + back arrow
- Toggle dark/light
- Tutta la nav del Super Admin (DB Lavori, Aziende, Karma Talents, Karma AI, Analytics, Questionari)
- Tutta la nav dell'Admin Azienda (Organigramma, Dashboard, Identity Hub, Azienda, SpaceSync, Compliance, Il Mio Profilo)
- Pillola con nome dell'azienda attiva
- Pulsante "Esci"

→ Mescola identità globale, controlli personali e navigazione contestuale. Diventa affollata, ambigua ("Il Mio Profilo" è un'azione personale ma sta tra le voci di sezione), e l'utente non ha un punto unico per i suoi controlli.

## Nuova architettura

```text
┌──────────────────────────────────────────────────────────────────────────┐
│  [BANNER SUPERVISIONE — solo se super_admin sta impersonando]            │
├──────────────────────────────────────────────────────────────────────────┤
│  GLOBAL BAR (h-14)                                                       │
│  [Logo mudra/jnana]                          [🔔] [Avatar ⌄]             │
├──────────────────────────────────────────────────────────────────────────┤
│  CONTEXT BAR (h-12)                                                      │
│  [← Back] [Sezione: Organigramma | Dashboard | Identity Hub | …]  [🏢 Amaeru ⌄] │
└──────────────────────────────────────────────────────────────────────────┘
```

### Livello 1 — Global Bar

Contenuto fisso, identico in tutte le viste autenticate:

- **Sinistra**: logo Hexagon + wordmark (`mudra` per super_admin in modalità super, `jnana` altrimenti). Click = home del ruolo (super admin dashboard / admin home / user home). Niente sottotitolo "Admin Console" qui (va nella context bar).
- **Destra**: due soli controlli
  1. *(Opzionale, futuro)* Icona campanella per notifiche — per ora placeholder nascosto, predisposto.
  2. **User Menu** (avatar circolare con iniziali o avatar_url) → click apre **dropdown** con:
     - Header del menu: nome cognome + email + badge ruolo (`Super Admin` / `Admin di Amaeru` / `Membro`)
     - Voce **"Il mio profilo"** (sempre presente; per super_admin senza membership porta alla pagina account/profilo personale; per admin con membership al proprio profilo utente; per user al proprio profilo)
     - Voce **"Tema"** con sotto-toggle Chiaro / Scuro / Sistema (manteniamo solo Chiaro/Scuro per compatibilità con `isDark` già esistente, etichetta "Modalità scura" con switch)
     - Separatore
     - Voce **"Esci"** in rosso

La global bar **non cambia mai** in base alla sezione: questo è il punto chiave che oggi manca.

### Livello 2 — Context Bar

Mostra la navigazione della sezione corrente. Tre profili di navigazione, mutuamente esclusivi:

1. **Super Admin Nav** (quando `view.type` è `SUPER_ADMIN_*`):
   - Tab: Aziende · DB Lavori · Karma Talents · Karma AI · Analytics · Questionari
   - A destra niente chip azienda (siamo nel "mondo super").

2. **Admin Azienda Nav** (quando c'è `activeCompany` e view è `ADMIN_*` o `USER_RESULT`):
   - Tab: Organigramma · Dashboard · Identity Hub · Azienda · SpaceSync · Compliance
   - **Rimossa** dalla nav la voce "Il Mio Profilo" (ora vive nello user menu globale)
   - A destra: **chip azienda attiva** `🏢 Amaeru` cliccabile → apre selettore (se l'utente appartiene a più aziende; altrimenti è solo un'etichetta).

3. **User Nav** (utente semplice, `view.type` `USER_*`):
   - Tab: Il Mio Profilo · (futuri tab utente)
   - Niente chip azienda.

Elementi comuni della context bar:

- A sinistra di tutto, **back arrow** (`canGoBack`) — spostato qui perché è azione contestuale di navigazione, non globale.
- Sotto-titolo opzionale "Admin Console" / "Super Admin" (testo piccolo grigio sopra le tab) per dare contesto del ruolo, sostituendo l'attuale label sotto il logo.

Quando una sezione non ha tab (es. pagina di onboarding), la context bar collassa: si mostrano solo back arrow + titolo della pagina.

### Comportamento responsivo

- **≥ md**: layout descritto sopra, due barre.
- **< md**: la global bar resta; la context bar diventa scrollabile orizzontale (tab a scorrimento). Lo user menu funziona uguale.

### Stati visivi

- Global bar: bianco/grigio scuro come oggi, sticky `top-0 z-50`, h-14, ombra leggera sotto.
- Context bar: leggermente più chiara/integrata (`bg-white dark:bg-gray-900` con `border-b` solo sotto), sticky `top-14 z-40`, h-12. Tab attiva con underline + colore Jnana (verde sage per admin, ambra per super, viola per Karma) — già presente come convenzione.
- Banner Supervisione: invariato, sopra a entrambi.

## Nuova struttura file

Refactoriamo il monolitico `components/layout/Header.tsx` in:

- `components/layout/AppShell.tsx` — orchestratore: rende banner + GlobalBar + ContextBar e wrappa lo `<main>`. Riceve gli stessi props attuali di `<Header>`.
- `components/layout/GlobalBar.tsx` — logo a sinistra, UserMenu a destra. Niente nav.
- `components/layout/ContextBar.tsx` — back + tab nav della sezione corrente + chip azienda. Riceve `view`, `userRole`, `activeCompany`, callback nav.
- `components/layout/UserMenu.tsx` — dropdown avatar (Headless: usiamo `Popover` esistente o un piccolo dropdown custom controllato; nessuna dipendenza shadcn/ui generica per rispettare la memory "Design System Usage").
- `components/layout/SupervisionBanner.tsx` — il banner arancione attuale, isolato.
- Il vecchio `Header.tsx` diventa un re-export sottile di `AppShell` per non rompere `App.tsx`, oppure aggiorniamo direttamente l'import (preferito: aggiornamento secco di `App.tsx`).

`App.tsx` chiama `<AppShell ... />` con gli stessi props che oggi passa a `<Header>`. Nessun cambio di logica di routing/state.

## Dettagli funzionali rilevanti

- **"Il Mio Profilo" (admin con membership)**: oggi è un bottone in nav. Nel nuovo design diventa una voce dello User Menu. La navigazione `view.type === 'USER_RESULT' | 'USER_WELCOME'` continua a funzionare; semplicemente l'entry point cambia.
- **Avatar nello user menu**: prendiamo `profiles.avatar_url` se presente, altrimenti iniziali su sfondo `bg-jnana-sage` (super_admin: ambra). Hook esistente `useAuth` espone l'utente; se serve recuperare profilo aggiungiamo una piccola query (lettura singola, già esiste pattern simile).
- **Toggle tema nello user menu**: usiamo l'`isDark` / `toggleTheme` già passati ad `Header` (che giro a `UserMenu` via `AppShell`).
- **Logout**: già `onLogout`.
- **Chip azienda**: per ora solo display + tooltip. Predisponiamo l'apertura di un selettore se `hasMultipleCompanies` (logica futura, non implementata in questo step).

## Cosa NON cambia in questo step

- Nessuna modifica a routing, ruoli, RLS, dati.
- Nessuna modifica al banner Supervisione (resta identico).
- Nessuna modifica alle pagine di destinazione (Org Chart, Identity Hub, ecc.).
- Nessuna nuova dipendenza UI esterna; rispettiamo il design system Jnana custom (memory "Design System Usage": niente classi shadcn/ui generiche, niente `bg-background`).

## Verifica post-implementazione

1. Ogni vista autenticata mostra le due barre nell'ordine corretto, banner sopra solo in supervisione.
2. Su super admin (`/superadmin`): global bar con avatar a destra, context bar con tab Super Admin (Aziende attiva).
3. Su admin (`/admin/*`): global bar con avatar, context bar con tab Admin + chip Amaeru a destra. "Il Mio Profilo" non è più tra le tab ma nello user menu.
4. Su user: global bar + context bar minimale.
5. Click sull'avatar apre dropdown con profilo / tema / esci. Click fuori lo chiude.
6. Dark mode toggle nello user menu funziona.
7. Logout dallo user menu funziona.
8. Back arrow nella context bar resta funzionante (`canGoBack`).
9. Mobile (<768px): context bar scrollabile, user menu funzionante.

## File toccati

- **Nuovi**:
  - `components/layout/AppShell.tsx`
  - `components/layout/GlobalBar.tsx`
  - `components/layout/ContextBar.tsx`
  - `components/layout/UserMenu.tsx`
  - `components/layout/SupervisionBanner.tsx`
- **Modificati**:
  - `components/layout/Header.tsx` → svuotato, re-export di `AppShell` per backward compat (oppure rimosso e aggiornato l'import in `App.tsx`).
  - `App.tsx` → import di `AppShell` al posto di `Header` (props identici).
