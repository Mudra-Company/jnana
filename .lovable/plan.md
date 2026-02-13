
# Fix: Anteprima Live delle Modifiche Manuali nel Room Editor

## Problema
Quando modifichi larghezza/altezza/colore nei campi testuali della sidebar, il canvas non si aggiorna fino a quando non premi "Salva" (che fa un round-trip al database). L'utente vuole vedere l'effetto visivo in tempo reale mentre digita.

## Soluzione
Aggiungere un callback `onPreview` al `RoomEditor` che viene chiamato ad ogni modifica dei campi (dimensioni, colore, nome). Il parent `SpaceSyncView` mantiene un override locale che viene applicato alla lista `rooms` passata al canvas, senza toccare il database fino al "Salva".

---

## Modifiche

### 1. `src/components/spacesync/RoomEditor.tsx`
- Aggiungere prop `onPreview?: (updates: Partial<OfficeRoom>) => void`
- Nei handler `onChange` di width, height e color, chiamare `onPreview` con i valori correnti
- Usare un piccolo helper che chiama onPreview con tutti i campi attuali ad ogni cambio

### 2. `views/admin/SpaceSyncView.tsx`
- Aggiungere stato locale `roomPreviewOverrides: Partial<OfficeRoom> | null`
- Creare `displayRooms = useMemo(...)` che applica gli override alla stanza selezionata
- Passare `displayRooms` invece di `rooms` al `FloorPlanCanvas`
- Passare un callback `handleRoomPreview` al `RoomEditor` che aggiorna gli override
- Al "Salva", gli override vengono persistiti e resettati
- Al "Annulla" o cambio stanza, gli override vengono resettati

---

## Dettagli Tecnici

```text
Flusso dati:

RoomEditor (campo width cambia)
  -> onPreview({ width: 300 })
  -> SpaceSyncView aggiorna roomPreviewOverrides
  -> displayRooms = rooms.map(r => r.id === selectedRoomId ? {...r, ...overrides} : r)
  -> FloorPlanCanvas riceve rooms aggiornate
  -> Canvas si ri-renderizza con le nuove dimensioni

Al "Salva":
  -> onUpdate persiste nel DB
  -> roomPreviewOverrides si resetta a null
  -> rooms dal DB si aggiorna (useOfficeRooms.fetchRooms)
```

Nessuna modifica al database. Solo 2 file da toccare.
