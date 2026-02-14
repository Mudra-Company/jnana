
# Miglioramento Drag & Drop Scrivanie

## Problemi Attuali

### 1. Movimento strano / non segue il mouse
La scrivania durante il drag e vincolata ai limiti della stanza originale (linee 153-154 del canvas). La posizione viene calcolata come `pt.x - room.x - offset` e poi clampata con `Math.min(room.width - DESK_SIZE, ...)`. Questo significa che se il mouse si muove fuori dalla stanza, la scrivania "si ferma" al bordo -- ed e per questo che il movimento sembra strano.

### 2. Non si puo spostare una scrivania tra stanze
Le scrivanie sono renderizzate dentro il gruppo SVG della loro stanza (`desks.filter(d => d.roomId === room.id)`). Durante il drag, la scrivania resta sempre nel suo gruppo originale. Non esiste logica per cambiarle stanza.

### 3. Nessun feedback visivo sulla stanza di destinazione
Non c'e nessuna indicazione visiva di quale stanza ricevera la scrivania quando la si rilascia.

## Soluzione

### A. Drag in coordinate assolute (canvas-level)
Durante il drag, la scrivania verra renderizzata a livello di canvas (fuori dai gruppi delle stanze), usando coordinate assolute. Questo elimina il clamping ai bordi della stanza originale e fa seguire il mouse correttamente.

### B. Rilevamento stanza di destinazione
Ad ogni mousemove durante il drag, calcolare quale stanza contiene il centro della scrivania. Memorizzare questa "hoveredRoom" nello stato.

### C. Feedback visivo
- La stanza di destinazione viene evidenziata con un bordo verde e uno sfondo piu opaco
- Se la scrivania e fuori da qualsiasi stanza, mostrare un indicatore rosso (non rilasciabile)
- "Ghost" semitrasparente nella posizione originale della scrivania

### D. Rilascio con cambio stanza
Al mouseup, se la stanza di destinazione e diversa da quella originale:
- Calcolare la posizione relativa alla nuova stanza
- Aggiornare `roomId`, `x`, `y` nel database
- Se la scrivania e fuori da tutte le stanze, annullare e tornare alla posizione originale

### E. Aggiornamento hook database
Aggiungere supporto per `roomId` in `useOfficeDesks.updateDesk` per permettere il cambio stanza.

## File da Modificare

### 1. `src/components/spacesync/FloorPlanCanvas.tsx`

**Nuovo stato:**
- `dragTargetRoomId: string | null` -- stanza sotto il cursore durante il drag
- `dragAbsolutePos: {x, y} | null` -- posizione assoluta della scrivania sul canvas durante il drag

**Modifiche a handleMouseMove (sezione draggingDesk):**
- Calcolare posizione assoluta (senza clamping alla stanza originale)
- Rilevare la stanza sotto il centro della scrivania
- Aggiornare `dragTargetRoomId` e `dragAbsolutePos`

**Modifiche a handleMouseUp:**
- Se `dragTargetRoomId` esiste e la scrivania si e mossa:
  - Calcolare posizione relativa alla stanza di destinazione (con snap alla griglia)
  - Clampare ai limiti della stanza di destinazione
  - Chiamare `onUpdateDesk` con `{ x, y, roomId: nuovaStanza }` se la stanza e cambiata, oppure solo `{ x, y }` se e la stessa
- Se il mouse e fuori da tutte le stanze, annullare il drag (nessun aggiornamento DB)

**Modifiche al rendering:**
- La scrivania in drag viene renderizzata in un gruppo SVG separato a livello canvas (fuori dalle stanze), con coordinate assolute
- "Ghost" semitrasparente nella posizione originale
- La stanza target viene evidenziata con bordo verde/blu

### 2. `src/hooks/useOfficeDesks.ts`

Aggiungere supporto per `roomId` nel metodo `updateDesk`:
```
if (updates.roomId !== undefined) dbUpdates.room_id = updates.roomId;
```

### 3. `src/types/spacesync.ts`

Nessuna modifica necessaria -- `OfficeDesk` ha gia `roomId`.

## Dettagli Tecnici

```text
Flusso drag attuale:
  mousedown -> salva offset relativo alla stanza originale
  mousemove -> calcola pos relativa alla stanza originale, clampa ai bordi
  mouseup   -> salva x,y (relativi alla stanza originale)

Flusso drag migliorato:
  mousedown -> salva offset e posizione assoluta iniziale
  mousemove -> calcola pos assoluta sul canvas (nessun clamping)
            -> rileva stanza sotto il centro della scrivania
            -> evidenzia stanza target
  mouseup   -> se dentro una stanza:
                 calcola pos relativa alla stanza target + snap + clamp
                 se stanza cambiata: onUpdateDesk({x, y, roomId})
                 se stessa stanza:   onUpdateDesk({x, y})
              se fuori da tutte le stanze:
                 annulla (nessuna modifica)
```

Nessuna modifica al database. Solo 2 file da modificare.
