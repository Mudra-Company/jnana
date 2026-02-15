
# Redesign UX/UI SpaceSync: Sidebar, Header e Stats Bar

## Analisi Problemi Attuali

Dallo screenshot emerge un'interfaccia piatta e anonima:

1. **Header**: Testo semplice con icona generica, nessuna personalita visiva, il bottone "Simula Scambio" e isolato e poco visibile
2. **Sidebar**: Card bianche piatte una dopo l'altra senza gerarchia visiva -- sembra una lista di debug, non un pannello di controllo professionale
3. **Riepilogo**: Lista testo puro con numeri allineati a destra -- zero data visualization, nessun indicatore visivo del tasso di occupazione (la progress bar c'e ma e quasi invisibile)
4. **Report Prossimita**: Card annodate dentro card (ProximityReport renderizza Card dentro Card gia wrappata nel parent) creando un effetto "scatola dentro scatola" bruttissimo
5. **Suggerimenti AI**: Stesso problema di annidamento card + il bottone "Analizza" e troppo piccolo e anonimo
6. **Stats Bar sul canvas**: Riga piatta con emoji (!) e testo grigio, zero appeal
7. **Location header**: "DUOMO / Piazza Duomo Milano" appare come testo isolato sopra le card, senza contesto visivo

## Soluzione: Redesign Completo

### A. Header Rinnovato (SpaceSyncView.tsx)

Trasformare l'header in un componente hero compatto con:
- Sfondo con gradiente sottile (jnana-sage -> sage/80) e bordo arrotondato
- Icona in un cerchio con sfondo solido
- Titolo + sottotitolo inline con la location selezionata (es. "SpaceSync -- DUOMO")
- Badge con stats chiave (stanze, scrivanie, score) direttamente nell'header come pill colorate
- Il bottone "Simula Scambio" integrato con stile coerente

### B. Sidebar con Gerarchia Visiva (SpaceSyncView.tsx)

Riprogettare la sidebar come pannello coeso:
- **Location Selector**: Mantenere ma aggiungere un'icona edificio piu grande e uno sfondo colorato per la sede selezionata
- **Dashboard Card (nuovo)**: Sostituire il "Riepilogo" noioso con una mini-dashboard visiva:
  - Tre mini-stat con icone colorate (stanze, scrivanie, occupazione)
  - Anello/gauge circolare SVG per il tasso di occupazione al posto della barra lineare
  - Score di prossimita medio con colore e icona stella (se in modalita heatmap)
- **Report e Suggerimenti**: Rimuovere l'annidamento Card-dentro-Card, usare sezioni con bordo laterale colorato invece di card separate

### C. Mini-Dashboard Visiva (sostituzione Riepilogo)

Creare un layout a griglia 2x2 con:
- **Stanze**: Icona + numero grande + label piccola
- **Scrivanie**: Icona + frazione (assegnate/totali)
- **Occupazione**: Anello SVG circolare con percentuale al centro (colore dinamico)
- **Score Medio**: Numero grande colorato con stella (visibile solo con heatmap attiva)

### D. Fix ProximityReport (ProximityReport.tsx)

- Rimuovere i `<Card>` interni -- il componente e gia wrappato in una Card dal parent
- Usare `<div>` con classi di styling diretto: bordi laterali colorati, sfondo leggero
- Score Globale: numero grande a sinistra con gradiente di colore, dettagli a destra
- Coppie critiche/ottimali: pill inline invece di card separate
- Insight: lista compatta con icona e testo

### E. Fix OptimizationSuggestions (OptimizationSuggestions.tsx)

- Rimuovere il `<Card>` interno (gia wrappato dal parent)
- Bottone "Analizza" piu visibile: sfondo jnana-sage, icona fulmine, dimensione maggiore
- Assessment AI: box con gradiente ambra leggero e icona AI
- Suggerimenti: card con bordo laterale spesso colorato per impatto (verde/ambra/blu)

### F. Stats Bar Canvas Migliorata (FloorPlanCanvas.tsx)

- Sostituire le emoji con icone Lucide
- Usare pill/badge con sfondo colorato per ogni stat
- Aggiungere un mini indicatore colorato per lo score (dot + valore)
- Border-radius piu arrotondato, sfondo con gradiente sottile

### G. Fix Classi Shadcn Residue

Nella sidebar e nei report ci sono ancora classi broken:
- `text-muted-foreground` -> `text-gray-500`
- `text-foreground` -> `text-jnana-text`
- `text-primary` -> `text-jnana-sage`
- `bg-primary/5` e `border-primary/10` -> `bg-jnana-sage/5` e `border-jnana-sage/10`
- `text-destructive` e `bg-destructive/5` -> `text-red-500` e `bg-red-50`
- `bg-muted` -> `bg-gray-100`

## File da Modificare

### 1. `views/admin/SpaceSyncView.tsx`
- Ridisegnare header con gradiente e stats inline
- Sostituire la card Riepilogo con mini-dashboard a griglia con anello SVG
- Rimuovere duplicazione location header (gia visibile nel LocationSelector)
- Fix tutte le classi shadcn residue

### 2. `src/components/spacesync/ProximityReport.tsx`
- Rimuovere tutti i `<Card>` interni
- Ridisegnare con div stilizzati, bordi laterali colorati
- Score globale in layout hero con numero grande
- Fix classi shadcn (`text-muted-foreground`, `text-foreground`, `text-primary`, `text-destructive`, `bg-destructive/5`)

### 3. `src/components/spacesync/OptimizationSuggestions.tsx`
- Rimuovere il `<Card>` wrapper interno
- Bottone Analizza piu prominente
- Fix classi shadcn (`text-muted-foreground`)

### 4. `src/components/spacesync/FloorPlanCanvas.tsx`
- Stats bar: sostituire emoji con icone Lucide, usare pill/badge colorati
- Migliorare la presentazione visiva

Nessuna modifica al database. Nessuna nuova dipendenza. 4 file da modificare.
