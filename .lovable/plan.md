# Evoluzione del modal "Dettaglio Posizione"

## Contesto

Il modal aperto dall'organigramma (`UnifiedDetailModal`) ha 6 tab (Persona, Ruolo, Requisiti, Contratto, Collaborazione, Storia) ma il container è largo solo `640px` con `flex` senza overflow → l'ultima tab "Storia" viene **tagliata** e non scorre. Oltre al fix tecnico, l'interfaccia ha margini di miglioramento significativi: header denso ma poco gerarchico, tab visivamente piatte, contenuto del tab "Persona" lungo da scrollare, azioni in fondo poco riconoscibili, nessun colpo d'occhio rapido sulle 3 metriche chiave.

## Obiettivi

1. **Fix immediato**: barra tab sempre completamente accessibile, su tutte le larghezze.
2. **Header più ricco**: trasformarlo in una "vetrina" della posizione con i 3 fit score in evidenza, breadcrumb del nodo organizzativo, status del ruolo.
3. **Tab più chiare** e responsive (con scroll orizzontale e indicatori visivi quando serve).
4. **Tab "Persona" più scansionabile**: sintesi in alto, dettagli a seguire.
5. **Footer azioni** più ordinato, con priorità visive corrette.

## Modifiche dettagliate

### A. Barra tab — fix scroll e leggibilità

`src/components/roles/UnifiedDetailModal.tsx`

- Wrappare i tab in un container con `overflow-x-auto`, `scrollbar-hide`, `scroll-smooth`.
- Sostituire la sottolineatura "absolute bottom-0" con una pill colorata di background sull'attivo (più riconoscibile e non viene tagliata da overflow).
- Aggiungere fade-out gradient laterali (a destra/sinistra) quando la barra è scrollabile, per segnalare visivamente "c'è altro".
- Le label restano sempre visibili (rimuovere `hidden sm:inline` per chiarezza, oppure mantenere icona+label sempre).
- Auto-scroll della tab attiva in vista quando cambia.

### B. Modal container — più aria e responsive

- Larghezza desktop da `640px` → `720px` (più respiro per tab e contenuti).
- Su mobile mantenere `inset-x-4`. Aggiungere `max-w-[95vw]` di sicurezza.

### C. Header riprogettato — "Hero" della posizione

Trasformare l'header in 2 righe:

**Riga 1 (identità)**:
- Avatar quadrato del ruolo (mantenuto).
- Titolo ruolo grande + sottotitolo con: nome persona, codice RIASEC, badge generation, badge LEADER, badge stato (ATTIVO/VACANTE/HIRING/CONGELATO/PIANIFICATO) con colori coerenti.
- Breadcrumb del nodo org (es. `Amaeru › CEO Office › Veterinary`) in piccolo sopra il titolo, per dare contesto immediato.
- Bottone X chiusura in alto a destra.

**Riga 2 (Fit Snapshot)**:
- Tre mini-cards orizzontali con i 3 punteggi chiave: **Fit Ruolo**, **Fit Manager**, **Fit Culturale**. Ognuna con icona, percentuale grande, mini-barra colorata (verde/giallo/rosso) e label. Cliccare su una card scrolla automaticamente alla sezione corrispondente del tab Persona (e attiva il tab Persona se non lo è già).
- Quando la posizione è vacante/hiring le tre card lasciano spazio a un CTA "Avvia Matching" o un riassunto del ruolo.

### D. Tab "Persona" — più scansionabile

- Spostare la sezione "Hard Skills della persona" subito dopo "Fit con il Ruolo" (è l'estensione naturale della valutazione skills).
- Aggiungere icone/header più piccoli (le SECTION attuali hanno tipografia uppercase un po' forte → ridurre size + tracking).
- Per le soft skills mancanti, raggrupparle in un blocco distinto "Da sviluppare" anziché mescolate con quelle matched.
- Per la sezione "Fit con il Manager" (appena introdotta): mantenere spiegazione testuale ma comprimibile (collapsible con chevron, default chiusa) per ridurre scroll.

### E. Footer azioni — gerarchia chiara

- Azione **primaria** (es. "Profilo Completo" o "Avvia Matching") sempre a destra in colore pieno indigo.
- Azione **secondaria** "Modifica" come outline.
- "Elimina" e "Job Rotation" raggruppati in un menu kebab (`...`) per ridurre il rumore visivo.

### F. Micro-fix qualità

- Aggiungere `Esc` per chiudere il modal.
- Aggiungere shadow più morbida e bordo più sottile.
- Rendere lo scroll della content-area meno "duro" (`scroll-padding-top` per le ancore).

## File toccati

- `src/components/roles/UnifiedDetailModal.tsx` — tutte le modifiche sopra (header, tab bar, footer, scroll-to-section, riordino sezioni Persona).

Nessuna modifica al DB, ai tipi o alla logica di calcolo. Tutto puramente UI/UX.

## Cosa resta uguale

- I 6 tab e i loro contenuti (Ruolo, Requisiti, Contratto, Collaborazione, Storia) non cambiano semanticamente.
- La modalità Edit funziona esattamente come ora.
- Le prop del componente restano invariate (nessuna breaking change per chi lo usa).
