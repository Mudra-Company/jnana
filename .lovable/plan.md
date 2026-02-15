

# Miglioramento UX SpaceSync: Tooltip, Stats, Heatmap e Scrivanie

## Problemi Identificati

### 1. Tooltip Score Illeggibile (immagine 1)
Il `DeskTooltip` usa `hsl(var(--popover))` come sfondo e `hsl(var(--foreground))` per il testo -- le stesse classi shadcn non supportate dal progetto. Il risultato e uno sfondo nero/trasparente con testo quasi invisibile. Anche la dimensione del font (8-10px) e troppo piccola.

### 2. Nessuna Informazione di Contesto (immagine 2)
Nella vista canvas non c'e nessun indicatore rapido di:
- Quante scrivanie ci sono e quante assegnate
- Score medio di prossimita
- Occupazione percentuale

Il "Riepilogo" nella sidebar e troppo nascosto e non ha dati di matching.

### 3. Scrivanie Non Informative in Vista Base
Nella vista normale (senza heatmap), le scrivanie sono quadratini blu/grigi da 32px con solo una sigla minuscola (D1, D2...). Non si capisce chi ci siede, ne il livello di compatibilita.

### 4. Heatmap Troppo Debole
L'overlay heatmap sono semplici cerchi semitrasparenti (`r=40`, `alpha=0.35`). L'effetto e quasi invisibile. Inoltre l'heatmap dovrebbe essere la vista di default.

### 5. Canvas Wrapper Ancora con Classi Shadcn
La riga 331 del canvas usa ancora `border-border bg-background` -- stessi colori rotti.

## Soluzione

### A. Fix DeskTooltip (DeskTooltip.tsx)
- Sfondo: `#ffffff` (bianco solido) con bordo `#e5e7eb`
- Testo nome: `#1e293b`, font 11px bold
- Testo ruolo: `#64748b`, font 9px
- Testo score: colore dinamico basato sul punteggio, font 10px bold
- Dimensioni aumentate per leggibilita (larghezza 160px, altezza adeguata)
- Angolo/freccia verso la scrivania

### B. Barra Stats Informativa sul Canvas (FloorPlanCanvas.tsx)
Aggiungere una barra info compatta sopra il canvas SVG (sotto la toolbar) con:
- Icona stanze + conteggio
- Icona scrivanie + assegnate/totali
- Barra occupazione mini
- Score medio prossimita (se disponibile) con colore indicativo
Questo usa le props gia disponibili (`rooms`, `desks`, `deskScores`).

### C. Scrivanie Piu Informative (FloorPlanCanvas.tsx)
Nella vista base (senza heatmap):
- Aumentare la dimensione a 36px per dare piu spazio al testo
- Mostrare le iniziali del nome assegnato in modo piu visibile
- Aggiungere un sottile bordo colorato basato sullo score (se calcolato) anche in vista normale
- Colori piu morbidi e leggibili (non solo blu pieno)

In modalita heatmap:
- Colorare lo sfondo della scrivania in base allo score
- Mostrare il valore dello score direttamente sulla scrivania

### D. Heatmap Potenziata e Default (ProximityHeatmap.tsx + FloorPlanCanvas.tsx + SpaceSyncView.tsx)
- Heatmap attiva di default quando ci sono scrivanie assegnate
- Raggi glow piu grandi (60px invece di 40px)
- Opacita piu alta (0.5 invece di 0.35)
- Aggiungere linee di connessione tra scrivanie vicine, colorate per score

### E. Fix Classi Shadcn Residue (FloorPlanCanvas.tsx)
- `border-border` -> `border-gray-200`
- `bg-background` -> `bg-white`
- `hsl(var(--primary))` nei vari punti -> `#4a7c59` (jnana-sage)
- `hsl(var(--border))` nella griglia SVG -> `#e5e7eb`

## File da Modificare

### 1. `src/components/spacesync/canvas/DeskTooltip.tsx`
Riscrittura completa con colori solidi, dimensioni maggiori e freccia direzionale.

### 2. `src/components/spacesync/FloorPlanCanvas.tsx`
- Aggiungere barra info stats tra toolbar e canvas SVG
- Modificare rendering scrivanie (dimensioni, colori, info visibili)
- Fix classi shadcn residue nel wrapper e nella griglia SVG
- Fix colori `hsl(var(--primary))` nei bordi stanze selezionate e nel drawing preview

### 3. `src/components/spacesync/ProximityHeatmap.tsx`
- Aumentare raggio glow e opacita
- Aggiungere linee di connessione tra scrivanie vicine con colore basato sullo score

### 4. `views/admin/SpaceSyncView.tsx`
- Attivare heatmap di default (`useState(true)`) quando ci sono scrivanie assegnate
- Fix classi shadcn residue nell'header (`text-foreground`, `bg-primary/10`, `text-primary`, `text-muted-foreground`)
- Aggiungere score medio di prossimita nella sidebar Riepilogo

## Dettagli Tecnici

Nessuna modifica al database. Nessuna nuova dipendenza. 4 file da modificare.

Mappatura colori per i fix residui:
```text
hsl(var(--primary))     -> #4a7c59 (jnana-sage)
hsl(var(--border))      -> #e5e7eb (gray-200)
hsl(var(--popover))     -> #ffffff (white)
hsl(var(--foreground))  -> #1e293b (slate-800)
hsl(var(--muted-foreground)) -> #64748b (slate-500)
bg-background           -> bg-white
border-border            -> border-gray-200
text-foreground          -> text-jnana-text
text-primary             -> text-jnana-sage
bg-primary/10            -> bg-jnana-sage/10
text-muted-foreground    -> text-gray-500
```

