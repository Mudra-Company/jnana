## Riordino e rinomina tab Admin nella Context Bar

Modifica unica in `components/layout/ContextBar.tsx`, ramo `showAdminNav`. Nessuna logica, route o `view.type` cambia: solo ordine e label visibili.

### Nuovo ordine e label

1. **Dashboard** (era 2ª) — invariato
2. **Struttura** (era "Organigramma", 1ª) — rinominato
3. **Identity Hub** — invariato
4. **Brand Identity** (era "Azienda") — rinominato
5. **SpaceSync** — invariato
6. **Compliance** — invariato

### Dettaglio tecnico

Nel array `tabs` dentro `else if (showAdminNav)` riordinare le voci come sopra e aggiornare due `label`:
- `key: 'org'` → `label: 'Struttura'`
- `key: 'co'` → `label: 'Brand Identity'`

Le `key`, le icone, gli `onClick` e gli `active` (basati su `view.type`) restano invariati per non rompere stato attivo, routing e callback. Nessun altro file toccato.
