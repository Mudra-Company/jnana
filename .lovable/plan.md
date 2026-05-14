# Redesign Dashboard Admin

## Parte 1 — Report "Head of HR"

Mi metto nei panni di un Head of HR che apre la dashboard ogni mattina. Cosa mi serve davvero?

### Cosa NON mi serve in primo piano

- **Test completati 22/22 (100%)**: dato vanity una volta a regime. Va spostato giù o nascosto se = 100%.
- **"Posizioni Totali 22"**: numero statico, non azionabile.
- **Compliance 79%** isolato, senza contesto: non mi dice cosa fare.
- **Culture Match 80%** senza trend: è alto? basso? rispetto a quando?

### Cosa mi serve davvero ogni giorno (in ordine di priorità)

1. **Cosa devo fare OGGI** — alert azionabili, ordinati per urgenza/scadenza (compliance in scadenza, posizioni vacanti da troppo, inviti pending).
2. **Stato di salute dell'organizzazione** — un colpo d'occhio: copertura ruoli, compliance, clima/cultura, "skill gap" complessivo.
3. **Pipeline attiva** — quante posizioni in hiring, quanti candidati shortlist pronti, quanti colloqui da fare.
4. **People insights** — chi è nuovo, chi sta per andarsene (turnover), chi ha completato test recentemente, anniversari.
5. **Accesso rapido** — ai moduli che uso quotidianamente (organigramma, talent search, compliance, identity hub).
6. **Esplorare la popolazione** — vedere ruoli e persone con filtri, switchando facilmente tra le due viste perché spesso la domanda è la stessa ("chi/cosa c'è in vendite?").

### KPI che voglio davvero in hero

- **Headcount** (con delta mese: +/- N) → trend
- **Posizioni Aperte** (vacanti + hiring) con tempo medio di copertura
- **Compliance Risk Score** con # scadenze < 30gg
- **Engagement / Culture** (con trend vs baseline)
- **Coverage Ruoli** (% ruoli con titolare assegnato)
- **Skill Coverage** (% requisiti coperti) — il vero KPI HR

Test completati e Posizioni Totali → metriche secondarie nelle viste di dettaglio, NON in hero.

---

## Parte 2 — Analisi As-Is (front-end)


| Sezione                | Problema                                                                                                                                                                                     |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| KPI Grid (7 tile)      | Layout a 7 colonne troppo denso, gerarchia piatta, 2 tile gradient (blue/purple) sembrano CTA ma sono solo decorative, ordine non basato su priorità HR.                                     |
| Attenzione Richiesta   | Buona idea, ma è in colonna 1/2 della stessa riga di Azioni Rapide → competono visivamente. Lista grezza, niente raggruppamento per categoria, niente livello di priorità.                   |
| Azioni Rapide          | Si confondono con i KPI: stesso card style, icone colorate generiche, label "AZIONI RAPIDE" minuscola in alto. Non si capisce che sono shortcut di navigazione.                              |
| Ruoli per Dipartimento | Accordion verboso, conta info utile ma layout "lista densa" anonima. Click su ruolo → naviga a `ADMIN_ORG_CHART` SENZA passare il roleId (vedi `AdminDashboard.tsx` riga `handleRoleClick`). |
| Elenco Dipendenti      | Tabella separata, duplica navigazione. Spesso la domanda dell'utente è la stessa: "fammi vedere chi/cosa c'è qui dentro".                                                                    |
| Stile generale         | Mancanza di gerarchia tipografica, troppi `<Card padding="sm">` impilati identici, niente "above the fold" focus.                                                                            |


---

## Parte 3 — To-Be (struttura)

```
┌──────────────────────────────────────────────────────────────────┐
│ HEADER: Dashboard {Company}            [Organigramma] [+ Invita] │
│ "Buongiorno {nome}, ecco il riepilogo di oggi · {data}"          │
├──────────────────────────────────────────────────────────────────┤
│ HERO STRIP — 4 KPI grandi (no 7), focalizzati                    │
│ [Headcount] [Posizioni Aperte] [Compliance Risk] [Culture]       │
│ Ogni tile: valore grande, sub-label trend, mini sparkline/badge  │
├──────────────────────────────────────────────────────────────────┤
│ FOCUS DI OGGI (full-width, dominante)                            │
│ Tab: [Urgenti N] [Compliance N] [Hiring N] [People N]            │
│ - Lista azionabile con priorità (rosso/giallo/blu)               │
│ - Ogni riga: icona, descrizione, "scade tra X", CTA inline       │
│ - "Vedi tutti" in fondo                                          │
├──────────────────────────────────────────────────────────────────┤
│ AZIONI RAPIDE (riprogettate come "moduli" con badge contatori)   │
│ Grid orizzontale, card più grandi, gradient sottile, contatore   │
│ live (es. Compliance: 6 in scadenza · Talent Search: 12 nuovi)   │
├──────────────────────────────────────────────────────────────────┤
│ ESPLORA L'ORGANIZZAZIONE  (UNICA finestra con TABS)              │
│ [👥 Persone (22)] [💼 Ruoli (22)] [🏢 Dipartimenti (5)]          │
│ + filtro stato + ricerca globale                                 │
│ - Tab Persone: tabella attuale migliorata                        │
│ - Tab Ruoli: lista per dipartimento, click → org chart sul ruolo │
│ - Tab Dipartimenti: aggregazione (head count, vacanti, hiring)   │
├──────────────────────────────────────────────────────────────────┤
│ INSIGHTS (secondaria, opzionale, collassabile)                   │
│ - Mini trend test completion · Skill gap top 3 · Anniversari     │
└──────────────────────────────────────────────────────────────────┘
```

### Principi di design

- **Una sola "spina dorsale" verticale**: focus → azione → esplora.
- **Hero KPI a 4 tile** (non 7): più respiro, valori grandi, trend incluso.
- **Focus di oggi** diventa il blocco protagonista (full-width, sopra azioni).
- **Azioni Rapide** ridisegnate come "moduli operativi" con badge contatore live, non come icone generiche.
- **Esplora**: una sola card a tab → riduce duplicazione e dà controllo.
- **Card design**: niente più gradient blue/purple casuali; uso semantic tokens, hover sottile, ombra elegante coerente con Jnana style.

---

## Parte 4 — Piano Implementazione

### Step 1 — Fix bug navigazione (quick win)

- `AdminDashboard.tsx` `handleRoleClick`: passare il `roleId` via `setView({ type: 'ADMIN_ORG_CHART', focusRoleId })` o equivalente.
- Verificare in `OrgChartCanvas` / hook `useOrgChartUIState` come ricevere e auto-selezionare il nodo del ruolo.

### Step 2 — Hero KPI ridisegnati (`DashboardHeroKPI.tsx` — nuovo)

Sostituisce `DashboardKPIGrid`. 4 tile:

1. **Headcount** — N dipendenti, sub: "+X questo mese" (placeholder se non disponibile)
2. **Posizioni Aperte** — vacanti + hiring, sub: "tempo medio copertura" o "X in shortlist"
3. **Compliance Risk** — score % + N scadenze ≤30gg con colore semantico
4. **Culture / Engagement** — score + delta vs baseline

Stile: card più larghe, valore 3xl/4xl, icona discreta, micro-sparkline o badge trend.

### Step 3 — Focus di Oggi (`TodaysFocusPanel.tsx` — nuovo)

Riusa logica di `AlertsPanel` ma:

- Layout full-width, non più colonna laterale.
- Tab interni: Urgenti / Compliance / Hiring / People.
- Ordinamento per priorità (errore > warning > info) e scadenza crescente.
- Empty state celebrativo per tab vuota.

### Step 4 — Azioni Rapide (`QuickModulesPanel.tsx` — refactor di QuickActionsPanel)

- Card più grandi, label "MODULI" più visibile.
- Badge contatore live (es. compliance items in scadenza, ruoli vacanti, talenti nuovi).
- Hover: leggera elevazione + accent stripe.

### Step 5 — Esplora l'Organizzazione (`OrgExplorerPanel.tsx` — nuovo)

Wrapper unico con tab system (riusa `Collapsible` o componente tab semplice in-house, no shadcn generico):

- **Persone** → riusa `EnhancedEmployeeTable` (rimossa header card duplicata)
- **Ruoli** → riusa `RolesByDepartment` (rimossa header card duplicata)
- **Dipartimenti** → nuova vista aggregata (per ogni org node: headcount, ruoli totali, vacanti, hiring, % compliance)
Ricerca e filtro globale a livello del wrapper.

### Step 6 — Insights (opzionale, fase 2)

Mini panel collassabile sotto Esplora con 3 widget piccoli: trend test, top skill gap, anniversari del mese. Se manca dato → nascondere card per non sporcare.

### Step 7 — Pulizia `AdminDashboardView`

- Rimuovere `DashboardKPIGrid`, `AlertsPanel`, `QuickActionsPanel`, `RolesByDepartment`, `EnhancedEmployeeTable` dall'import diretto.
- Comporre con i nuovi componenti.
- Saluto contestuale + data nel header.

### File toccati

- `views/admin/AdminDashboard.tsx` (refactor composizione + fix `handleRoleClick`)
- **Nuovi**: `src/components/dashboard/DashboardHeroKPI.tsx`, `TodaysFocusPanel.tsx`, `QuickModulesPanel.tsx`, `OrgExplorerPanel.tsx`, `DepartmentsOverview.tsx`
- **Modificati**: `EnhancedEmployeeTable.tsx`, `RolesByDepartment.tsx` (rimuovo intestazione/wrapper Card per integrazione in tab)
- **Eventualmente** estensione `ViewState` per `ADMIN_ORG_CHART` con `focusRoleId?: string` e gestione in `OrgChartCanvas`.

### Cosa NON tocco

- Backend, hooks dati esistenti, schema DB.
- Logica calcolo compliance, roles, assignments.
- Design tokens globali (rispetto la palette Jnana esistente, no shadcn generic classes).

### Approccio incrementale (consigliato)

Fase A (questo loop): Step 1 (fix bug) + Step 2 (Hero) + Step 3 (Focus) + Step 7 (composizione).
Fase B (loop successivo): Step 4 (Azioni) + Step 5 (Esplora con tabs).
Fase C (eventuale): Step 6 (Insights).

Confermi che procediamo con la **Fase A** subito, poi B in un secondo passaggio? Oppure preferisci che faccia tutto A+B in un colpo solo? procedi con a e b insieme