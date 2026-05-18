# Fix: "Responsabile" nella spalla laterale dell'organigramma

## Problema

Quando si seleziona un team/dipartimento, la spalla sinistra mostra una sezione **"Manager / Lead"** che oggi viene popolata cercando, **all'interno dello stesso nodo selezionato**, le persone il cui `jobTitle` contiene parole tipo `manager`, `lead`, `head`, `director`, `ceo`. 

Risultato sbagliato (vedi screenshot image-304): nel team "Marketing" vengono elencati come "Manager / Lead" **Marco Galli** (Content & Brand Manager) e **Luca Ferrari** (Social Media & Community Manager), che sono semplicemente membri del team con la parola "Manager" nel titolo. Il vero responsabile è **Giulia Ruggi** (Head of Marketing), che vive nel **nodo padre** dell'organigramma (image-303).

Regola da rispettare ovunque: **il responsabile di un nodo è chi sta nel livello immediatamente superiore dell'organigramma**, non chi ha una keyword nel job title dentro lo stesso nodo.

## Audit della logica fallace

Ho cercato l'uso del pattern `jobTitle includes manager|head|lead|director|ceo`:

| File | Uso | Stato |
|---|---|---|
| `src/components/admin/orgchart/OrgChartContextPanel.tsx` linea 334-338 | Identifica i "manager" **dentro** il nodo corrente per mostrarli come Manager / Lead | **BUG da correggere** |
| `views/admin/OrgNodeCard.tsx` `findNodeManagers` (riga 83-103) | Identifica i manager di un nodo per **passarli ai figli** come `parentManagers` (Manager Fit Score) | Uso corretto: serve a determinare chi è il responsabile da passare verso il basso |
| `views/admin/CompanyOrgView.tsx` righe 1525, 1529, 1679 | Calcola `currentManagers` di un nodo per passarli come `parentManagers` ai figli | Uso corretto (stessa logica del punto sopra) |
| `src/components/admin/OrgChartPrintView.tsx` riga 188-193 | Stessa cosa per la stampa | Uso corretto |

Quindi la **logica euristica resta legittima** quando serve a identificare chi-sta-sopra rispetto a un livello inferiore (parentManagers). L'errore è **solo** nel pannello laterale, che la applica al nodo stesso invece che al padre.

## Modifica

### File: `src/components/admin/orgchart/OrgChartContextPanel.tsx`

Nel componente `NodeView` (riga 308+):

1. Eliminare il calcolo attuale di `managers` basato sugli utenti del nodo corrente (righe 334-339).
2. Calcolare i responsabili a partire dal **nodo padre** ricavato da `path`:
   - `parentNode = path[path.length - 2]` (se esiste).
   - `parentUsers = users.filter(u => u.departmentId === parentNode.id)`.
   - `responsabili = findNodeManagers(parentUsers, parentNode)` — riusando la funzione già esportata da `views/admin/OrgNodeCard.tsx`.
   - Per il **nodo root** (nessun padre) la sezione non viene renderizzata (oppure mostra "—"); confermo la scelta di non renderizzarla, coerente con il comportamento attuale quando l'array è vuoto.
3. Rinominare il titolo della sezione:
   - Se `node.isCulturalDriver` → resta `"Leader culturali"` (invariato).
   - Altrimenti → `"Responsabile"` (al posto di `"Manager / Lead"`).
4. Nessun'altra modifica di layout o stile: stessa lista con icona `Award`, nome, e job title.

### Nessun cambio di dati né di backend

La modifica è puramente di presentazione nel pannello laterale. Nessun'altra parte del codice viene toccata, perché — come emerso dall'audit — gli altri usi della stessa euristica sono semanticamente corretti (servono a popolare `parentManagers` per i figli, che è proprio il concetto che vogliamo).

## Verifica attesa dopo l'implementazione

- Selezionando un sotto-team di Marketing, la sezione laterale mostra **"Responsabile: Giulia Ruggi — Head of Marketing"** (presa dal nodo padre).
- Selezionando il dipartimento Marketing stesso, la sezione mostra il/i responsabile/i dell'azienda (nodo radice della catena), se esistono.
- Selezionando il nodo root azienda, la sezione "Responsabile" non appare.
- Nei nodi Cultural Driver il titolo resta "Leader culturali" con il comportamento attuale.
