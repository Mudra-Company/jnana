
## Diagnosi: dati seed sbagliati, non bug grafico

Ho confrontato i questionari reali con i dati nel DB. Il problema **non è grafico**: i dati di mockup sono stati inseriti su scale completamente diverse da quelle che il sondaggio reale produce. La UI mostra correttamente "/5", ma riceve numeri da 7 a 9.5 perché chi ha seedato ha usato una scala 0-100.

### Cosa producono i questionari reali

| Test | Scala per dimensione | Sezioni / Dimensioni |
|---|---|---|
| **Clima Aziendale** (`ClimateTestView` + `data/climateContent.ts`) | media **1.0 – 5.0** | 9 sezioni: Senso di Appartenenza, Organizzazione e Cambiamento, Il Mio Lavoro, La Mia Remunerazione, Rapporto con il Capo, La Mia Unità, Responsabilità, Aspetto Umano, Identità |
| **RIASEC** (`services/riasecService.ts → calculateScore`) | conteggio item: max teorico **R 46, I 38, A 47, S 44, E 44, C 33**. La UI (`KarmaResults`, radar) assume **0–30** | R, I, A, S, E, C |

### Cosa c'è effettivamente nel DB

- `climate_responses`: **22/41 righe hanno `overall_average > 5`** (max 8.96). Le `section_averages` usano nomi inventati (Innovazione, Cultura, Leadership, Compensation, Worklife, Comunicazione, Crescita, Riconoscimento, Soddisfazione) **che non esistono nel sondaggio reale**.
- `riasec_results`: **59/62 righe con almeno una dimensione > 47** (max 95). Anche il tuo profilo CEO ha `score_e = 95` (impossibile).

### Origine del problema

`supabase/functions/seed-amaeru-full/index.ts`:

```ts
// Line 111 — sezioni inventate
const CLIMATE_SECTIONS = ['Soddisfazione','Leadership','Comunicazione','Crescita',
  'Worklife','Compensation','Cultura','Riconoscimento','Innovazione'];

// Line 224 — clima generato in scala 50–98 invece di 1–5
const v = Math.max(50, Math.min(98, p.climateBase + (Math.random()*10 - 5)));

// Line 201–206 — RIASEC inserito in scala 0–100 invece di 0–30
score_r: p.riasec.R, // p.riasec.R = 55, 75, 95 ...
```

Anche `seed-demo-users` segue lo stesso pattern.

## Piano di intervento

### 1. Correggere gli script di seed (sorgente del problema)

**`supabase/functions/seed-amaeru-full/index.ts`**
- Sostituire `CLIMATE_SECTIONS` con gli **9 titoli reali** importati da `data/climateContent.ts` (o copiati 1:1).
- Trasformare `climateBase` (0–100) in scala 1–5: `score_1_5 = 1 + (climateBase / 100) * 4`, con piccolo jitter ±0.3 per sezione, clamp [1, 5], arrotondato a 1 decimale.
- `overall_average` ricalcolato come media delle sezioni in scala 1–5.
- Trasformare i punteggi RIASEC dei profili (`riasec: {R:55, I:75, ...}`, attualmente 0–100) in scala 0–30: `score_30 = Math.round((value/100) * 30)`. In alternativa ribilanciare i numeri seed direttamente (preferibile per leggibilità: `R:17, I:23, ...`).

**`supabase/functions/seed-demo-users/index.ts`**
- Stesso trattamento: sezioni reali, scala 1–5, RIASEC 0–30.

### 2. Bonificare i dati già inseriti nel DB (migration)

Una migration SQL che fa due cose:

a) **Climate**: per ogni riga con `overall_average > 5`, riscalare:
```sql
UPDATE climate_responses
SET overall_average = ROUND((1 + (overall_average / 100.0) * 4)::numeric, 1),
    section_averages = (
      SELECT jsonb_object_agg(key, ROUND((1 + (value::numeric / 100) * 4), 1))
      FROM jsonb_each_text(section_averages)
    )
WHERE overall_average > 5;
```
(Le chiavi inventate restano, ma almeno saranno in scala corretta. La UI non si rompe perché itera dinamicamente su `Object.entries(sectionAverages)`.)

b) **RIASEC**: riscalare ogni `score_*` da 0–100 a 0–30 per le righe palesemente fuori scala (`GREATEST(...) > 47`):
```sql
UPDATE riasec_results
SET score_r = ROUND(score_r * 30.0 / 100),
    score_i = ROUND(score_i * 30.0 / 100),
    -- ... idem A,S,E,C
WHERE GREATEST(score_r,score_i,score_a,score_s,score_e,score_c) > 47;
```

### 3. Hardening della UI (difesa in profondità)

In `views/user/UserResultView.tsx` (linee 286–291, 620, 626–630):
- Aggiungere `Math.min(item.score, 5)` prima di calcolare la barra di progresso.
- Mostrare un piccolo badge "⚠ dato fuori scala" se `score > 5`, così se in futuro arrivassero ancora dati sporchi non si ripresenta lo stesso bug silenzioso.

In `views/karma/KarmaResults.tsx` (radar) — già usa `domain=[0,30]`, ma se arriva 95 il radar va fuori grafico: clampare `value: Math.min(riasecScore[dim], 30)`.

### 4. Verifica

Dopo migration + redeploy, query di verifica:
```sql
SELECT MAX(overall_average) FROM climate_responses;          -- atteso ≤ 5
SELECT MAX(GREATEST(score_r,score_i,score_a,score_s,score_e,score_c))
FROM riasec_results;                                          -- atteso ≤ 47
```

## Cosa NON tocco

- Le chiavi italiane inventate nelle `section_averages` storiche resteranno (rappresentano dati seed, non utenti reali). I prossimi seed useranno le chiavi corrette. Se preferisci, posso aggiungere uno step che cancella e ricrea i `climate_responses` seed-only invece di riscalare — fammelo sapere.
- I dati Karma (`karma_sessions.soft_skills`, `primary_values`, ecc.) sono già stringhe semantiche, non numeriche → nessun problema di scala.

## File coinvolti

- `supabase/functions/seed-amaeru-full/index.ts` (correzioni linee 111, 201–206, 221–230)
- `supabase/functions/seed-demo-users/index.ts` (analogo)
- nuova migration SQL `fix_test_data_scales.sql`
- `views/user/UserResultView.tsx` (clamp + warning badge)
- `views/karma/KarmaResults.tsx` (clamp radar)

Procedo?
