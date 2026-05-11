
# Evoluzione del tool "Organigramma"

Tutto è **additivo**: nessuna funzionalità o riferimento esistente viene rimosso. Card, modali (UnifiedDetailModal, RoleComparisonModal), badge, metriche e azioni rimangono identici. Cambia il **contenitore** della Tree e si aggiunge una **spalla sinistra contestuale**.

## Obiettivi

1. Navigazione fluida dell'organigramma: zoom in/out, pan, reset, mini-mappa di scroll.
2. Nodi **collassabili** (chiudi/apri rami) con vista compatta riepilogativa.
3. **Spalla sinistra** sempre visibile con dettagli contestuali del livello selezionato (intera azienda → nodo → posizione).

---

## 1. Navigazione: Zoom, Pan, Scroll

### Comportamento
- Wrapper interattivo attorno al `<Tree>` di `react-organizational-chart` con:
  - Zoom in/out (pulsanti + scroll-wheel con `Ctrl/⌘`).
  - Pan trascinando lo sfondo.
  - Reset zoom (fit-to-screen).
  - Indicatore percentuale di zoom corrente.
- Scroll bar sempre presenti come fallback (orizzontale + verticale) quando il contenuto eccede il viewport.
- Toolbar fluttuante in basso a destra del canvas con: `−`, `%`, `+`, `Reset`, `Fit`.
- Stato zoom/pan persistito in `sessionStorage` per non perderlo cambiando tab.

### Nessuna regressione
- La `<Tree>` esistente (riga 1860 di `CompanyOrgView.tsx`) e il rendering di `OrgNodeCard` restano invariati.
- Solo il wrapper esterno cambia (da `div` con overflow a wrapper interattivo).

---

## 2. Nodi Collassabili

### Comportamento
- Ogni nodo dell'organigramma (root/department/team) ha un toggle `▾ / ▸` accanto al titolo.
- **Aperto (default per root/livello 1, chiuso per livelli profondi)**: card identica all'attuale (mostra posizioni, ruoli, hiring, KPI).
- **Chiuso**: card compatta con:
  - Nome nodo + tipo + chevron.
  - Conteggi sintetici: `N persone` · `N ruoli` · `N posizioni aperte`.
  - Mini-badge stato: clima medio (se disponibile), % skill gap, hiring count.
  - Indicatore "+N sotto-nodi nascosti" se il ramo ha figli.
- Click su `▸` o sull'header della card chiusa → riapre il nodo (e tutti i figli restano nello stato precedente).
- "Collapse all" / "Expand all" nella toolbar.
- Stato di collasso per nodo persistito in `sessionStorage` per `companyId`.

### Persistenza dati
Nessuna modifica al DB: lo stato di collasso è puramente client-side.

---

## 3. Spalla Sinistra Contestuale

### Layout
- Pannello laterale fisso a sinistra (larghezza ~340px, collassabile a icona).
- Affiancato al canvas dell'organigramma (resta visibile mentre si naviga e si zooma).
- Collassabile per recuperare spazio (toggle in alto, mini-versione 48px con icona).

### Contenuto dinamico — 3 livelli di selezione

**Livello 0 — nessuna selezione (default): "Vista Azienda"**
- Header: nome azienda + logo.
- KPI globali aggregati (già calcolati altrove, da riusare):
  - Totale persone, ruoli definiti, posizioni aperte.
  - Clima medio aziendale.
  - Skill gap medio.
  - Numero di Cultural Drivers attivi.
  - Distribuzione seniority (mini bar chart).
- Lista "Top hiring needs" (link al matching).
- Azioni rapide: "Esporta organigramma", "Aggiungi dipartimento al root".

**Livello 1 — click su un nodo (department/team): "Dettaglio Nodo"**
- Header: nome nodo + tipo + breadcrumb (Azienda › Parent › Nodo).
- KPI del solo nodo:
  - Persone, ruoli, hiring.
  - Clima del nodo, skill gap del nodo (già calcolati in `OrgNodeCard`).
  - Manager / Cultural Driver del nodo.
  - Sotto-nodi figli (lista cliccabile per navigare).
- Elenco posizioni nel nodo con score Role Fit.
- Azioni: "Modifica nodo", "Aggiungi sotto-nodo", "Aggiungi ruolo".

**Livello 2 — click su una posizione/persona: "Dettaglio Posizione"**
- Riepilogo persona/ruolo: avatar, nome, job title, seniority, status hiring.
- Score: Role Fit, Manager Fit, Culture Fit (gli stessi del card).
- Hard skills matched/missing, soft skills matched/missing (riuso `calculateDetailedMetrics`).
- Pulsante "Apri dettaglio completo" → apre il `UnifiedDetailModal` esistente (full data, immutato).
- Breadcrumb: Azienda › Nodo › Posizione.

### Comportamento
- Click su card nodo (header) → spalla mostra Livello 1.
- Click su singola posizione dentro la card → spalla mostra Livello 2 (modal esistente non si apre automaticamente, solo on demand tramite "Apri dettaglio completo" — evitiamo doppio focus).
- Click su sfondo / pulsante "Vista Azienda" in alto della spalla → torna a Livello 0.
- Selezione corrente evidenziata con ring sulla card nel canvas.

---

## 4. Note tecniche (per implementazione)

### File da modificare/creare
- `views/admin/CompanyOrgView.tsx`: avvolgere la `<Tree>` (riga 1860) nel nuovo wrapper, aggiungere layout 2 colonne (spalla + canvas), gestire stato selezione.
- `views/admin/OrgNodeCard.tsx`: aggiungere prop `collapsed`, `onToggleCollapse`, `onSelect`, `isSelected`; rendering compatto se `collapsed`.
- Nuovi componenti:
  - `src/components/admin/orgchart/OrgChartCanvas.tsx` — wrapper zoom/pan + scroll + toolbar.
  - `src/components/admin/orgchart/OrgChartContextPanel.tsx` — spalla sinistra (3 livelli).
  - `src/components/admin/orgchart/CollapsedNodeCard.tsx` — variante compatta.
- Nuovo hook: `src/hooks/useOrgChartUIState.ts` — gestisce zoom/pan, set di nodi collassati, selezione corrente, persistenza in `sessionStorage`.

### Libreria zoom/pan
Usare `react-zoom-pan-pinch` (leggera, già pattern comune con `react-organizational-chart`). Da aggiungere come dipendenza.

### Riuso logica
- Metriche nodo (clima, skill gap) già in `OrgNodeCard` → estrarre in helper riutilizzabile dalla spalla (`src/utils/orgNodeMetrics.ts`).
- Metriche posizione: riusare `useUnifiedOrgData.calculateDetailedMetrics`.
- Modali esistenti (`UnifiedDetailModal`, `RoleComparisonModal`) restano invariati e si aprono dalla spalla via "Apri dettaglio completo".

### Responsive
- ≥1280px: spalla espansa + canvas.
- 1024–1279px: spalla collassata di default a 48px (icona).
- <1024px: spalla diventa drawer a scomparsa (overlay) con pulsante toggle in alto a sinistra del canvas.

### Persistenza
- `sessionStorage` keys: `orgchart:zoom:{companyId}`, `orgchart:pan:{companyId}`, `orgchart:collapsed:{companyId}`, `orgchart:panel:{companyId}`.
- Nessuna migrazione DB.

### Accessibility
- Toggle collapse via tastiera (Enter/Space sul header).
- Toolbar zoom con `aria-label`.
- Spalla ha `aria-live="polite"` quando cambia selezione.

---

## 5. Fuori scopo (non in questo piano)
- Modifica delle metriche o degli score esistenti.
- Modifica del modello dati `OrgNode` / `CompanyRole`.
- Cambio della libreria di rendering ad albero.
- Editing in-place dalla spalla (rimane via modali esistenti).

