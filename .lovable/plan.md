

# Fix: "Posiziona Scrivania" non funziona

## Causa
In `FloorPlanCanvas.tsx`, la funzione `handleRoomMouseDown` (linea 195-207) chiama `e.stopPropagation()` **prima** del controllo della modalita. Quando sei in modalita "place-desk" e clicchi su una stanza:

1. Il click arriva al `<rect>` della stanza (che ha `onMouseDown={handleRoomMouseDown}`)
2. `e.stopPropagation()` viene chiamato immediatamente (linea 196)
3. Il controllo `if (mode !== 'select') return;` esce dalla funzione (linea 197)
4. L'evento **non raggiunge mai** il `<svg>` dove `handleMouseDown` gestisce il posizionamento delle scrivanie

## Soluzione
Spostare `e.stopPropagation()` **dopo** il controllo della modalita, in modo che in modalita "place-desk" (e "draw-room") l'evento possa propagarsi fino all'SVG.

## Modifica

**File:** `src/components/spacesync/FloorPlanCanvas.tsx`

Cambiare le linee 195-197 da:
```typescript
const handleRoomMouseDown = (e: React.MouseEvent, room: OfficeRoom) => {
    e.stopPropagation();
    if (mode !== 'select') return;
```

A:
```typescript
const handleRoomMouseDown = (e: React.MouseEvent, room: OfficeRoom) => {
    if (mode !== 'select') return;
    e.stopPropagation();
```

Una sola riga spostata. Nessun altro file da modificare.

## Note
Gli errori WebSocket 412 nel log sono relativi a Supabase Realtime e non sono collegati a questo bug. Sono errori di connessione che non impattano la funzionalita.

I numerosi errori di build elencati sono pre-esistenti e non correlati a SpaceSync.
