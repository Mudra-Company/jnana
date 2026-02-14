

# Fix: Drag & Drop delle Scrivanie

## Problema

Lo spostamento delle scrivanie ha **due bug critici** che lo rendono inutilizzabile:

1. **Il click apre immediatamente il modale**: `handleDeskMouseDown` chiama `onSelectDesk(desk)` al mousedown, il che apre il `DeskAssignmentModal`. Il modale si sovrappone al canvas e "ruba" tutti gli eventi mouse, impedendo il drag.

2. **Ogni pixel di movimento fa una query al database**: `onUpdateDesk` nella gestione del mousemove (linea 150) chiama `updateDesk` che fa un UPDATE su Supabase + un refetch completo di tutte le scrivanie ad ogni movimento del mouse. Questo rende il drag lentissimo e inaffidabile.

## Soluzione

### 1. Distinguere click da drag (FloorPlanCanvas.tsx)

- Al `mousedown` su una scrivania: **non** chiamare `onSelectDesk` subito. Salvare solo lo stato di drag.
- Al `mouseup`: se il mouse si e mosso di meno di 5px, era un click -> aprire il modale (`onSelectDesk`). Se si e mosso di piu, era un drag -> persistere la posizione finale.

### 2. Stato locale durante il drag (FloorPlanCanvas.tsx)

- Introdurre un `deskPositionOverride: Map<string, {x, y}>` nello stato locale.
- Durante il drag, aggiornare solo questo stato locale (nessuna chiamata DB).
- Usare le posizioni override per il rendering delle scrivanie nel canvas.
- Al `mouseup` (fine drag), chiamare `onUpdateDesk` una sola volta con la posizione finale, poi svuotare l'override.

### 3. Aggiornare useOfficeDesks (opzionale, minor)

- Rimuovere il `fetchDesks` dal `updateDesk` quando si aggiornano solo x/y, per evitare il flickering. Oppure, accettare l'approccio "optimistic" gia presente dato che il refetch ricarica i dati corretti.

## File da Modificare

### `src/components/spacesync/FloorPlanCanvas.tsx`

- Aggiungere stato `deskPositionOverride: Map<string, {x: number, y: number}>`
- Aggiungere flag `hasDragged` per distinguere click da drag
- Modificare `handleDeskMouseDown`: non chiamare `onSelectDesk`, solo inizializzare il drag
- Modificare `handleMouseMove` (sezione draggingDesk): aggiornare solo `deskPositionOverride` locale invece di `onUpdateDesk`
- Modificare `handleMouseUp`: se `hasDragged` -> `onUpdateDesk` con posizione finale; se non ha draggato -> `onSelectDesk`
- Nel rendering delle scrivanie: usare `deskPositionOverride.get(desk.id) ?? {x: desk.x, y: desk.y}` per le coordinate

## Dettagli Tecnici

```text
Flusso attuale (rotto):
  mousedown -> onSelectDesk (apre modale!) + inizia drag
  mousemove -> onUpdateDesk (DB query per ogni pixel!)
  mouseup   -> niente

Flusso corretto:
  mousedown -> salva offset, inizia drag locale
  mousemove -> aggiorna Map locale (zero DB calls, rendering fluido)
  mouseup   -> se spostamento > 5px: onUpdateDesk(posizione finale) [1 sola DB call]
              se spostamento < 5px: onSelectDesk (apre modale)
```

Solo 1 file da modificare. Nessuna modifica al database.

