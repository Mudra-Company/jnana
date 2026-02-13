

# Fix: Stile Brutto nei Componenti SpaceSync

## Problema Identificato

La causa radice e chiara: i componenti SpaceSync usano classi Tailwind come `bg-background`, `text-foreground`, `border-border`, `bg-muted`, `text-primary`, `text-destructive` -- queste sono convenzioni **shadcn/ui** che dipendono da variabili CSS custom (es. `--background`, `--border`). 

Il progetto Jnana pero **non definisce queste variabili CSS**. Il Tailwind e configurato tramite CDN in `index.html` con un sistema colori personalizzato (`jnana-sage`, `jnana-bg`, `jnana-text`, etc.). Di conseguenza, classi come `bg-background` non risolvono a nessun colore e il risultato e trasparenza, bordi neri e font senza stile.

## Soluzione

Sostituire tutte le classi shadcn/ui con le classi del design system Jnana nei 5 componenti SpaceSync affetti. Ecco la mappatura:

```text
bg-background     -> bg-white dark:bg-gray-800
text-foreground    -> text-jnana-text dark:text-gray-100
border-border      -> border-gray-200 dark:border-gray-700
bg-muted           -> bg-gray-100 dark:bg-gray-700
bg-muted/30        -> bg-gray-50 dark:bg-gray-800
text-muted-foreground -> text-gray-500 dark:text-gray-400
bg-primary         -> bg-jnana-sage
text-primary       -> text-jnana-sage
text-primary-foreground -> text-white
bg-primary/10      -> bg-jnana-sage/10
bg-primary/5       -> bg-jnana-sage/5
border-primary/20  -> border-jnana-sage/20
text-destructive   -> text-red-500
bg-destructive/10  -> bg-red-50 dark:bg-red-900/20
hover:bg-primary/90 -> hover:bg-jnana-sageDark
focus:ring-primary/20 -> focus:ring-jnana-sage/20
focus:border-primary -> focus:border-jnana-sage
```

## File da Modificare

### 1. `src/components/spacesync/DeskAssignmentModal.tsx`
- Modal container: `bg-background` -> `bg-white dark:bg-gray-800`
- Bordi: `border-border` -> `border-gray-200 dark:border-gray-700`
- Titolo: `text-foreground` -> `text-jnana-text dark:text-gray-100`
- Input: sostituire tutte le classi shadcn
- Bottoni: usare `bg-jnana-sage`, `text-white`
- Stile arrotondato: `rounded-xl` -> `rounded-2xl` per coerenza col design system

### 2. `src/components/spacesync/RoomEditor.tsx`
- Tutti gli input e label: stessa mappatura
- Bottoni salva/annulla: colori Jnana
- Select dropdown: sfondo solido bianco

### 3. `src/components/spacesync/LocationSelector.tsx`
- Input di creazione location: stessa mappatura
- Bordi e sfondi pannelli

### 4. `src/components/spacesync/SwapSimulationModal.tsx`
- Modal e contenuti interni

### 5. `src/components/spacesync/canvas/CanvasToolbar.tsx`
- Toolbar e bottoni

Tutti i 5 file seguiranno la stessa mappatura colori per garantire coerenza visiva col resto dell'app.

## Sezione Tecnica

- Nessuna modifica a `index.html` o al config Tailwind
- Nessuna nuova dipendenza
- Circa 80 sostituzioni di classi CSS distribuite su 5 file
- Le classi dark mode vengono mantenute con i colori gray standard gia usati nel resto del progetto
