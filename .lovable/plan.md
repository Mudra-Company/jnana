
## Problema

Il grafico "Media Aziendale" in `views/admin/AdminIdentityHub.tsx` ha l'asse X configurato su scala **0–5** (`domain={[0,5]}`, `ticks={[0,1,2,3,4,5]}`), ma i dati prodotti da `calculateClimateAnalytics` sono già su scala **0–10** (es. 8.69, 8.88, 7.50). Risultato: le barre escono dall'asse e l'etichetta "Punteggio medio (1-5)" è ingannevole.

L'errore è solo lato visualizzazione/soglie nel componente `AdminIdentityHub.tsx`. Il motore di scoring (`services/tricamService.ts`) resta invariato.

## Cosa cambierà — `views/admin/AdminIdentityHub.tsx`

Tutte le soglie e i riferimenti vengono "raddoppiati" per allinearsi alla scala 0–10 (3 → 6, 3.5 → 7, 3.8 → 7.6, 4 → 8, 4.2 → 8.4, 5 → 10).

### 1. Asse X del bar chart (riga ~290)
- `domain={[0, 10]}`, `ticks={[0, 2, 4, 6, 8, 10]}`
- `ReferenceLine` di soglia neutra: `x={6}` (era `x={3}`)
- Sottotitolo: "Punteggio medio (0-10) per dimensione." (era "1-5")

### 2. Soglie colore delle barre (riga ~308)
- Verde: `value >= 8` (era `>= 4`)
- Rosso: `value < 6` (era `< 3`)
- Giallo: resto

### 3. Climate Index nel header (riga ~205)
- Verde: `>= 8`, Giallo: `>= 7`, Rosso: altrimenti
- Display: `{value.toFixed(2)}/10`

### 4. Logica `generateClimateInsight` (righe 130-172)
- Soglie overview: `>= 8.4` eccellente, `>= 8.0` positivo, `>= 7.0` discreto, altrimenti critico
- `criticalDimensions`: `value < 6.0`
- `mediocreDimensions`: `value >= 6.0 && value < 7.0`
- Etichette inline: `(${dim.value.toFixed(2)}/10)`

### 5. Tabella team breakdown (righe ~351-352)
- Pallino verde: `team.score >= 8`
- Pallino giallo: `team.score >= 7`
- Rosso: altrimenti

### 6. Insight di chiusura (righe 756 e 772)
- Riga 756: icona rossa se `overallAverage < 7` (era `< 3.5`)
- Riga 772: condizione `overallAverage < 7.6` (era `< 3.8`)

## Fuori scopo

- Nessuna modifica al calcolo dei punteggi né al DB.
- Nessuna modifica ad altri grafici/viste (verificato che le soglie 1-5 sono usate solo qui).
