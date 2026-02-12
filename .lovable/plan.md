
# Piano: SpaceSync UX/UI Overhaul + Room Resize

## Problema Principale
Le stanze non possono essere ridimensionate dopo il disegno. L'interfaccia e' funzionale ma basica, con toolbar piatta, sidebar poco strutturata e mancanza di feedback visivi moderni.

---

## 1. Room Resize (Funzionalita Critica)

Aggiungere **8 handle di resize** (4 angoli + 4 lati) visibili quando una stanza e' selezionata in modalita "Seleziona".

**Implementazione in `FloorPlanCanvas.tsx`:**
- Quando `selectedRoomId` corrisponde a una stanza, renderizzare 8 piccoli quadrati SVG sugli angoli e sui punti medi dei lati
- Ogni handle ha un `onMouseDown` che attiva un nuovo stato `resizingRoom` con la direzione (es. `'nw'`, `'se'`, `'e'`, etc.)
- Durante `handleMouseMove`, se `resizingRoom` e' attivo, ricalcolare `x, y, width, height` della stanza in base alla direzione del drag
- Su `mouseUp`, chiamare `onUpdateRoom(id, { x, y, width, height })` per persistere
- Le scrivanie dentro la stanza restano nelle loro posizioni relative (non serve spostarle)
- Aggiungere anche la possibilita di **trascinare l'intera stanza** (drag dalla superficie della stanza, non dagli handle)

**Cursori contestuali:** `nwse-resize`, `nesw-resize`, `ew-resize`, `ns-resize` sugli handle appropriati.

---

## 2. Redesign Toolbar del Canvas

Trasformare la toolbar da una riga piatta a un design piu moderno e organizzato:

- **Raggruppamento visivo**: Strumenti di disegno | Zoom | Visualizzazione | Azioni
- **Icone piu grandi** (18px) con tooltip al hover
- **Indicatore di modalita attiva** piu evidente con pill colorata e animazione
- **Slider zoom** al posto dei due bottoni +/-, con reset rapido a 100% al click sul valore
- **Separatori** con label di gruppo leggibili
- Dimensione minima touch-friendly (min 36px per target)

---

## 3. Redesign Sidebar Sinistra

La sidebar attuale ha card separate senza gerarchia visiva chiara.

**Miglioramenti:**
- **Header sidebar** con titolo della sede selezionata e indirizzo come sottotitolo
- **LocationSelector** con card piu compatte, icona edificio/piano distinta, hover con azioni inline (edit/delete) piu visibili
- **RoomEditor** integrato come pannello espandibile (collapsible) invece di card separata, con:
  - Campi dimensioni (larghezza x altezza) editabili manualmente
  - Color picker per il colore della stanza
  - Conteggio scrivanie nella stanza
- **Riepilogo** con progress bar visuale per il tasso di occupazione (assegnate/totali)
- **Collapsible sections** con Radix Collapsible per ProximityReport e OptimizationSuggestions

---

## 4. Miglioramenti Canvas SVG

- **Snap to grid**: Quando si disegna o ridimensiona, le coordinate si allineano alla griglia di 40px (con possibilita di disattivare tenendo premuto Shift)
- **Tooltip on hover** sulle scrivanie: mostra nome persona, ruolo e score senza dover cliccare
- **Room move**: Click e drag sulla superficie della stanza per spostarla (solo in modalita Seleziona)
- **Feedback visivo** quando si trascina una scrivania: ombra e leggero ingrandimento
- **Dimensioni room** visibili come testo piccolo (es. "240x160") nell'angolo in basso a destra della stanza selezionata

---

## 5. Miglioramenti Generali UX

- **Empty state** piu accattivante quando non ci sono sedi, con illustrazione e CTA chiara
- **Toast di conferma** per azioni distruttive (elimina stanza/scrivania) con conferma
- **Keyboard shortcuts**: Canc/Delete per eliminare stanza/scrivania selezionata, Esc per deselezionare, 1/2/3 per cambiare modalita

---

## File da Modificare

| File | Modifiche |
|------|-----------|
| `src/components/spacesync/FloorPlanCanvas.tsx` | Room resize handles, room drag, snap-to-grid, toolbar redesign, desk tooltips, keyboard shortcuts |
| `src/components/spacesync/RoomEditor.tsx` | Aggiungere campi dimensioni editabili, color picker, conteggio scrivanie |
| `src/components/spacesync/LocationSelector.tsx` | Card piu compatte, hover actions migliori |
| `views/admin/SpaceSyncView.tsx` | Sidebar ristrutturata con collapsible sections, progress bar occupazione |
| `src/types/spacesync.ts` | Aggiungere tipo `ResizeDirection` |

Nessuna modifica al database necessaria.

---

## Dettagli Tecnici: Room Resize

```text
Handle layout su stanza selezionata:

  [NW]────[N]────[NE]
   |                |
  [W]    stanza    [E]
   |                |
  [SW]────[S]────[SE]

Stato nuovo in FloorPlanCanvas:
  resizingRoom: {
    roomId: string,
    direction: 'nw'|'n'|'ne'|'e'|'se'|'s'|'sw'|'w',
    startX: number,
    startY: number,
    originalRoom: { x, y, width, height }
  } | null

Logica resize:
- 'e': width = original.width + (currentX - startX), min 60px
- 'w': x = original.x + delta, width = original.width - delta
- 's': height = original.height + (currentY - startY)
- 'n': y = original.y + delta, height = original.height - delta
- Angoli: combinazione dei due assi
- Snap: Math.round(value / 40) * 40 (se shift non premuto)
```
