## Diagnosi

Due problemi distinti emersi dallo screenshot:

**1. Scala grafico sbagliata in Identity Hub.**
`views/admin/AdminIdentityHub.tsx` mostra "Media Aziendale" con asse `domain={[0, 10]}` e label "Punteggio medio (0-10)". Anche le soglie di colore (verde ≥ 8, rosso < 6), gli insight testuali ("eccellente ≥ 8.4"), e l'header "Climate Index x.xx/10" usano scala 0-10. Ma il sondaggio reale (`ClimateTestView` + `data/climateContent.ts`) produce medie **1-5**. Quindi una media reale di 3.5 (buona) appare come "rosso, critico" e un dato seedato a 1.30 si vede minuscolo a sinistra del grafico.

**2. Dati clima Amaeru schiacciati a 1.30.**
La migration di "fix" precedente ha riapplicato la formula `1 + (overall/100)*4` su valori che erano già in scala 1-5, comprimendo tutto a ~1.05-1.4. Risultato: tutti i 22 dipendenti Amaeru hanno medie clima identiche e bassissime, mostrate come "tutto rosso ovunque". Anche le `section_averages` usano ancora le chiavi inventate (Cultura, Worklife, Leadership, Compensation, Crescita, Innovazione, Comunicazione, Riconoscimento, Soddisfazione) anziché le 9 sezioni reali del sondaggio (Senso di Appartenenza, Organizzazione e Cambiamento, Il Mio Lavoro, La Mia Remunerazione, Rapporto con il Capo, La Mia Unità, Responsabilità, Aspetto Umano, Identità).

I RIASEC invece sono ok: distribuiti 8-29, in scala corretta 0-30.

## Piano

### 1. Allineare l'UI di Identity Hub alla scala 1-5

In `views/admin/AdminIdentityHub.tsx`:
- Cambiare grafico clima: `domain={[0, 5]}`, `ticks={[0,1,2,3,4,5]}`, label "(1-5)".
- Aggiornare soglie colore (verde ≥ 4.0, giallo 3.0-3.9, rosso < 3.0) e `ReferenceLine x={3}`.
- Aggiornare formula tooltip e LabelList su `toFixed(2)` (già ok).
- Climate Index nell'header: `/5` invece di `/10`, soglie ricalibrate (verde ≥ 4, giallo ≥ 3).
- Funzione `generateClimateInsight`: nuove soglie su scala 1-5 (eccellente ≥ 4.2, positivo ≥ 3.8, vulnerabile ≥ 3.0, critico < 3.0). Critical dimensions: `< 3.0`. Mediocri: `3.0-3.5`. Tutti i `.toFixed(2)/10` → `/5`.
- Commento `// scale 0-10` → `// scale 1-5`.

### 2. Ripopolare il clima Amaeru con dati realistici e variati

Riscrivere il blocco "Climate" in `supabase/functions/seed-amaeru-full/index.ts` per:
- Sostituire `CLIMATE_SECTIONS` (chiavi inventate) con le **9 sezioni reali** importate o copiate da `data/climateContent.ts`: Senso di Appartenenza, Organizzazione e Cambiamento, Il Mio Lavoro, La Mia Remunerazione, Rapporto con il Capo, La Mia Unità, Responsabilità, Aspetto Umano, Identità.
- Generare punteggi **realistici per una "buona azienda con margini di miglioramento"**, non perfetta:
  - Media globale target: ~3.7 (azienda sana ma reale).
  - Variazione per persona: usare `climateBase` esistente (60-95) mappato in 3.0-4.6 invece di 1-5 lineare → formula: `personalBase = 3.0 + (climateBase - 60) / 35 * 1.6`, clamp [3.0, 4.6].
  - Variazione per sezione: jitter ±0.4, ma con **bias realistici per sezione** (es. "La Mia Remunerazione" tendenzialmente più bassa -0.3, "Senso di Appartenenza" e "Identità" leggermente più alte +0.2, "Organizzazione e Cambiamento" -0.2 — pattern tipici di scale-up).
  - Per 2-3 dipendenti su 22 (es. 1 del CDA poco coinvolto + 1-2 detractor), generare medie più basse (2.4-3.0) per realismo.
  - Clamp finale [1.0, 5.0], arrotondamento a 1 decimale.
- Aggiornare `overall_average` come media delle 9 sezioni reali.

### 3. Migration SQL per bonificare i dati esistenti

Nuova migration che, per `company_id = '02b47082-c1d5-4e63-bc78-b6e9dfe602a7'`:
- `DELETE FROM climate_responses` (i 22 record schiacciati a 1.3).
- Inserisce 22 nuovi record direttamente in SQL con la stessa logica del seed aggiornato (un blocco `INSERT INTO climate_responses ... VALUES (...)` generato in modo deterministico, mappando ogni `user_id` a un `climateBase` riproducendo la stessa distribuzione del seed).

Alternativa più pulita: lasciare la migration solo come `DELETE`, e chiedere all'utente di rilanciare "Seed Amaeru Full Demo" dal pannello SeedDataView per ricreare clima + tutto il resto. Questo è più sicuro perché evita di duplicare la logica fra TS e SQL e garantisce coerenza.

**Scelta consigliata**: migration di solo cleanup (`DELETE FROM climate_responses WHERE company_id = '...'`) + invito a rilanciare il seed. Il seed è già idempotente.

### 4. Verifica

Dopo deploy + reseed:
- `SELECT MIN, MAX, AVG(overall_average) FROM climate_responses WHERE company_id='...'` → atteso range realistico (es. min ~2.5, max ~4.5, avg ~3.7).
- Aprire `/admin/identity` su Amaeru: il grafico mostra barre distribuite tra 2.5 e 4.5, con mix di verdi/gialli/rossi, scala asse 0-5.

### Tabella file modificati

| File | Cosa cambia |
|---|---|
| `views/admin/AdminIdentityHub.tsx` | Asse 0-5, soglie colore/insight ricalibrate, label "/5" |
| `supabase/functions/seed-amaeru-full/index.ts` | 9 sezioni reali + distribuzione realistica con bias per sezione |
| nuova migration `cleanup_amaeru_climate.sql` | DELETE dei 22 record clima Amaeru |

### Cosa NON tocco

- I dati RIASEC Amaeru (già corretti, distribuiti 0-30).
- I dati Karma (testuali, non in scala).
- Gli altri tenant (es. Dürr Dental): la `seed-demo-users` è già stata sistemata in precedenza, e i suoi dati clima non risultano problematici nel preview attuale.
- La dashboard `KarmaResults` (RIASEC, già in scala 0-30 corretta).

Procedo?