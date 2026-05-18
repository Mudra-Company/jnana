# Fix bug "Leader culturali" + coroncina sui responsabili Cultural Driver

## Bug

Nel nodo **CEO Office** (che è marcato `isCulturalDriver = true`) il titolo della sezione laterale mostra ancora `"Leader culturali"` invece di `"Responsabile"`. La condizione attuale in `OrgChartContextPanel.tsx` (riga 421) è:

```ts
node.isCulturalDriver ? 'Leader culturali' : 'Responsabile'
```

Ma ora la sezione mostra i responsabili presi dal nodo **padre**, quindi la natura "cultural driver" del nodo corrente non c'entra più con l'etichetta.

## Modifiche in `src/components/admin/orgchart/OrgChartContextPanel.tsx`

### 1. Titolo sempre "Responsabile"

Sostituire:
```tsx
<Section title={node.isCulturalDriver ? 'Leader culturali' : 'Responsabile'}>
```
con:
```tsx
<Section title="Responsabile">
```

### 2. Coroncina accanto al responsabile se è Cultural Driver

Il responsabile vive nel `parentNode` (calcolato già nel fix precedente). Se `parentNode.isCulturalDriver === true`, accanto al nome di ciascun responsabile mostriamo una piccola icona `Crown` viola (`text-purple-500`), coerente con l'iconografia già usata altrove nel pannello (vedi `Crown` accanto al titolo del nodo Cultural Driver, riga 375).

Pseudocodice nel render della lista `managers`:
```tsx
<li>
  <Award size={12} className="text-amber-500" />
  {parentNode?.isCulturalDriver && (
    <Crown size={12} className="text-purple-500" titleAttr="Driver culturale" />
  )}
  {m.firstName} {m.lastName}
  {m.jobTitle && <span>— {m.jobTitle}</span>}
</li>
```

La coroncina compare **solo** se il nodo padre è effettivamente un Cultural Driver.

## Nessun'altra modifica

Niente cambi di dati, niente cambi al calcolo di `managers`, niente cambi agli altri rami del pannello (la sezione "Influencer del team" resta invariata).

## Verifica attesa

- Selezionando **CEO Office** (padre = CDA, che è Cultural Driver): la sezione si chiama "Responsabile" e ogni nome (es. Diego Barbisan, Chiara Tacco) ha la coroncina viola.
- Selezionando un qualunque sotto-team di Marketing (padre = Marketing, non Cultural Driver): "Responsabile: Giulia Ruggi" senza coroncina.
- Selezionando il nodo root: la sezione non appare (come oggi).
