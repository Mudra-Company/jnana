## Obiettivo

Due fix mirati all'organigramma:

1. **Collasso "vero" del singolo riquadro**: quando l'utente collassa un nodo, deve ridursi **solo quel riquadro** (il card di quel nodo passa al suo summary compatto). I nodi figli sotto, le linee gerarchiche e gli altri rami **restano visibili e invariati**.
2. **Eliminare lo spazio bianco sprecato** sotto l'organigramma generato dalla spalla sinistra più alta del canvas.

## Comportamento attuale (problema)

- In `views/admin/CompanyOrgView.tsx`, il render dei figli è gated da `!rootCollapsed && renderOrgTreeChildren(...)` (riga 1932) e dentro `renderOrgTreeChildren` da `!childCollapsed && renderOrgTreeChildren(...)` (riga 1560). Risultato: collassare un nodo nasconde l'intero sotto-albero, non solo quel riquadro.
- Il pannello laterale ha `h-[calc(100vh-140px)] min-h-[600px]` (riga 608 di `OrgChartContextPanel.tsx`), mentre il canvas ha `h-[calc(100vh-220px)] min-h-[500px]`. Quando il contenuto della sidebar è corto, la sidebar resta comunque alta e il canvas finisce molto sopra il fondo del contenitore → grande area bianca sotto l'organigramma.

## Modifiche

### 1. `views/admin/CompanyOrgView.tsx` — collasso solo del riquadro

- Rimuovere il gate `!rootCollapsed` davanti a `renderOrgTreeChildren(...)` (riga 1932): i figli del root vanno renderizzati sempre.
- Dentro `renderOrgTreeChildren` (riga 1560) rimuovere il gate `!childCollapsed`: la ricorsione continua sempre.
- Lo stato `collapsed` continua a essere passato a `OrgNodeCard` (`collapsed={childCollapsed}` / `collapsed={rootCollapsed}`) → il card userà la sua vista "summary compatta" già esistente, ma le linee verso i figli e i sotto-rami restano visibili.

Nessun cambio a `OrgNodeCard.tsx` (la logica della vista compatta del singolo riquadro è già presente). Nessun cambio al hook `useOrgChartUIState` né alle azioni "Collassa tutti / Espandi tutti" del toolbar (che continueranno a comprimere ogni singolo card mantenendo le linee).

### 2. Sidebar e canvas — niente spazio sprecato

Obiettivo: la sidebar e il canvas devono condividere la stessa altezza, e l'intero blocco organigramma deve riempire lo spazio disponibile fino in fondo, senza vuoti sotto.

- `views/admin/CompanyOrgView.tsx`:
  - Cambiare il container esterno (riga 1882) in un layout flex verticale che occupa l'altezza piena disponibile:
    - `min-h-screen` → `h-[calc(100vh-64px)]` (o equivalente in base all'header globale) e aggiungere `flex flex-col`.
    - Rimuovere `overflow-x-auto` dal wrapper esterno (lo gestisce il canvas).
  - Sul container `flex gap-0 …` (riga 1885) aggiungere `flex-1 min-h-0` così sidebar e canvas stirano fino in fondo.

- `src/components/admin/orgchart/OrgChartContextPanel.tsx` (riga 608):
  - Sostituire `h-[calc(100vh-140px)] min-h-[600px]` con `h-full` (eredita l'altezza del genitore flex).
  - Header fisso resta `shrink-0`; il contenuto dinamico interno usa `flex-1 overflow-y-auto min-h-0`.

- `src/components/admin/orgchart/OrgChartCanvas.tsx` (riga 38):
  - Sostituire `h-[calc(100vh-220px)] min-h-[500px]` con `h-full min-h-0`.
  - Mantenere `overflow-hidden` interno (zoom/pan).

Risultato: sidebar e canvas hanno la stessa altezza, pari allo spazio verticale residuo della pagina. Niente più area bianca sotto l'organigramma.

## Fuori scopo

- Nessuna modifica a metriche, dati, modali, OrgNodeCard, esportazione PDF.
- Nessuna modifica DB.
- Le azioni "Collassa tutti / Espandi tutti" continuano a funzionare ma ora collassano solo i riquadri (i sotto-alberi restano visibili).
