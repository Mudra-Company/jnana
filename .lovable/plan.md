# Aggiungere "Fit con il Manager" nel dettaglio posizione

## Problema rilevato

Aprendo il modal di dettaglio di una posizione (es. "Pet Nutrition Specialist" → Andrea Pozzi), nel tab **Persona** sono visibili "Fit con il Ruolo" e "Fit Culturale", ma **manca completamente il "Fit con il Manager"**.

Indagando il codice:

- Il calcolo esiste già in `src/hooks/useUnifiedOrgData.ts` (`managerFitScore` + `managerFitBreakdown`), basato sulla compatibilità RIASEC tra il `profileCode` della persona e quello dei manager parent.
- La sezione "Compatibilità Responsabili" è già renderizzata in `UnifiedDetailModal.tsx` (righe 487–517), ma è **condizionata a `managerFitBreakdown.length > 0`**.
- La causa: in `views/admin/CompanyOrgView.tsx` riga 2106, `<UnifiedDetailModal>` viene aperto **senza passare la prop `parentManagers`**. Quindi il breakdown è sempre vuoto e la sezione non appare.
- Stesso motivo per cui nella card preview (`UnifiedRolePersonCard`) il badge `metrics.managerFitScore` non viene mostrato: la posizione è costruita senza `parentManagers` quando l'utente clicca.

## Cosa cambiare

### 1. Passare `parentManagers` al modal (`CompanyOrgView.tsx`)

- Quando si apre `UnifiedDetailModal`, calcolare i manager del nodo **padre** della posizione selezionata, riusando `findNodeManagers` (già usato in `renderOrgTreeChildren`).
- Costruire una mappa `nodeId → managers` partendo da `company.structure` con un walk ricorsivo, così possiamo risalire dal `selectedUnifiedPosition.role.orgNodeId` al nodo padre e prelevarne i manager.
- Passare l'array risultante come prop `parentManagers={...}` al modal.
- Ricalcolare anche `metrics.managerFitScore` della posizione selezionata prima di aprirla, così la card preview mostra correttamente il badge "Fit Manager" anche al primo render (il valore ora rimane `null` perché `parentManagers` non era noto nel build originale delle posizioni).

### 2. Riprogettare la sezione nel tab "Persona" (`UnifiedDetailModal.tsx`)

Promuovere "Fit con il Manager" allo stesso livello visivo di "Fit con il Ruolo" e "Fit Culturale":

- Rinominare la sezione da "Compatibilità Responsabili" a **"Fit con il Manager"** con icona `Handshake`.
- Mostrarla **sempre** quando esiste almeno un manager parent (se la persona o il manager non ha `profileCode`, mostrare uno stato "Dati insufficienti" invece di nascondere tutto).
- Layout coerente con le altre due sezioni:
  - Barra "Compatibilità" con percentuale grande in alto (verde / giallo / rosso).
  - Sotto, breakdown per singolo manager (già presente).
- Aggiungere una **breve spiegazione testuale** in italiano sotto il titolo, ad esempio:
  > Misura quanto il profilo comportamentale RIASEC della persona è compatibile con quello dei suoi responsabili diretti. Un valore alto indica stili di lavoro, motivazioni e modalità decisionali allineati, riducendo attriti e migliorando la collaborazione quotidiana.
- Quando manca il `profileCode` di una delle due parti, mostrare un avviso inline ("Completa il colloquio Karma per calcolare il fit con i responsabili").

### 3. Card preview (`UnifiedRolePersonCard.tsx`)

Nessuna modifica strutturale: il badge `<MetricBadge value={metrics.managerFitScore} ... label="Fit Manager" />` esiste già (riga 219). Verrà valorizzato automaticamente non appena al punto 1 viene passato `parentManagers` al calcolo delle metriche.
Aggiungere però un `title` più descrittivo sull'hover (tooltip nativo) per chiarire cosa significa il numero.

## File toccati

- `views/admin/CompanyOrgView.tsx` — calcolo e passaggio `parentManagers` al modal + ricalcolo metriche della posizione selezionata.
- `src/components/roles/UnifiedDetailModal.tsx` — promozione/restyling della sezione "Fit con il Manager", testo esplicativo, gestione stati "dati insufficienti".
- `src/components/roles/UnifiedRolePersonCard.tsx` — solo miglioramento del tooltip del badge Manager Fit.

## Note tecniche

- Nessuna modifica al DB né al motore di calcolo (`calculateUserCompatibility`, `useUnifiedOrgData`): la logica esiste già ed è corretta.
- I "manager parent" sono definiti come gli utenti del nodo padre identificati da `findNodeManagers` (utilizzato già negli altri rendering dell'organigramma), garantendo coerenza con i dati della card.
