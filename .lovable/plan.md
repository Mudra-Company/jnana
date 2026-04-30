# Allineare il badge LEADER al concetto di "Leader Culturale"

## Principio

**Un Leader Culturale è chiunque appartenga a un nodo organizzativo marcato come Cultural Driver.** Nient'altro. Nessun filtro su "manager/head/CEO/..." nel job title.

Questo riflette già la logica analitica esistente in `services/riasecService.ts → calculateCultureAnalysis`, che per costruire la "Cultura Agita" prende **tutti** gli utenti dei nodi `isCulturalDriver` senza filtrare per titolo. Allineamo il badge UI a questo concetto.

## Cosa cambia

### 1. Rimuovere l'euristica sul job title (3 punti)

In tutti questi file, il calcolo di `isLeader` diventa semplicemente: `assignee esiste && nodo è Cultural Driver`.

- **`src/hooks/useUnifiedOrgData.ts`** → `calculateQuickMetrics`: elimino il blocco `matchesLeaderTitle` (head/manager/lead/director/ceo/cto/coo). `isLeader = isCulturalDriverNode && !!assignee`.
- **`views/admin/OrgNodeCard.tsx`** → `rolePositions` (righe 339-346) e `createImplicitPosition` (righe 422-429): stessa semplificazione.
- **`src/components/admin/OrgChartPrintView.tsx`** → `findNodeManagers` (righe 194-...): per i nodi Cultural Driver tutti i membri sono leader; il calcolo di `isLeader` (riga 266) e l'avatar/badge (309, 404) restano collegati solo a `node.isCulturalDriver`.

### 2. Analisi della Cultura Agita: già corretta

`AdminIdentityHub` → sezione **"Cultura Agita (Dai Leader)"** già aggrega i `primaryValues` di tutti gli utenti nei nodi Cultural Driver tramite `calculateCultureAnalysis`. **Nessuna modifica necessaria** — funziona già con la definizione corretta di "Leader Culturale".

Confermo solo che il copy mostrato all'utente sia coerente:
- Card "Cultura Agita (Dai Leader)" → footer recita: *"Basato su N Cultural Drivers identificati nell'Org Chart."* dove `N = leaderUsers.length` (tutti gli utenti dei nodi driver). ✅ già corretto.

### 3. Aggiornare il commento esplicativo

In `useUnifiedOrgData.ts` aggiorno il commento sopra `isLeader` per riflettere la nuova semantica: *"Il badge LEADER è mostrato a chiunque sia assegnato a un ruolo dentro un nodo marcato come Cultural Driver. Questi sono i Leader Culturali, le persone su cui si misura la Cultura Agita aziendale (vedi Identity Hub → Cultura Agita)."*

## Effetti visibili

- Nei nodi **Cultural Driver**: badge LEADER su **tutti** gli assegnatari (es. anche un "Membro CDA" o un "Consigliere" senza job title gerarchico).
- Nei nodi **non** Cultural Driver: nessun badge LEADER, mai.
- L'Identity Hub continuerà a funzionare come oggi, ma ora c'è coerenza visiva 1:1 tra "chi vedo con badge LEADER" e "chi contribuisce alla Cultura Agita".

## File toccati

```text
src/hooks/useUnifiedOrgData.ts
views/admin/OrgNodeCard.tsx
src/components/admin/OrgChartPrintView.tsx
```

Nessuna modifica DB, nessuna modifica ai tipi.
