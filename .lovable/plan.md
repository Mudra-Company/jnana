# Redesign – Candidati per Posizione (`PositionMatchingView`)

## 1. Prospettiva Head of HR — cosa serve davvero

Quando apro la pagina di una posizione aperta sto cercando di rispondere a **cinque domande operative**, oggi tutte difficili:

1. **"Cosa sto cercando esattamente?"** — Oggi vedo solo `Junior` in un pillino. Mancano: hard skills richieste, soft skills, descrizione del ruolo, hiring manager, dipartimento, urgenza, data apertura, target di chiusura.
2. **"Quanto sono messo bene?"** — Vorrei un mini-cruscotto: n. candidati totali, miglior match interno, miglior match esterno, candidati in shortlist, copertura skills (% requisiti già coperti almeno da un candidato), tempo medio di apertura.
3. **"Chi devo guardare per primo?"** — Una sola lista non basta: voglio **3 corsie di raccomandazione**: *Pronti subito* (≥75%), *Da valutare/sviluppare* (50–74%), *Non adatti* (<50%) con motivo del downgrade.
4. **"Perché questo candidato matcha o non matcha?"** — Oggi vedo solo `35%`, `✓0 ⚠1`. Voglio breakdown immediato sulla card: % skills, ✓/✗ per skill chiave, gap di seniority, sinergia generazionale col manager, generazione, tempo nel ruolo attuale (per gli interni → impatto rotazione).
5. **"Cosa faccio adesso?"** — Azioni chiare e *contestuali*: Shortlist, Apri profilo completo, Avvia matching avanzato, Confronta selezionati, Invita a colloquio, Chiudi/Pausa posizione.

Aggiunte funzionali mancanti:
- **Filtri & ordinamento** (per dipartimento di provenienza, generazione, seniority, % match, "solo in cerca", "solo non in shortlist").
- **Confronto multiplo** fino a 4 candidati (interni + esterni nella stessa griglia).
- **Empty state intelligente**: se 0 esterni → suggerire pubblicare l'annuncio; se 0 interni → suggerire skill di gap critiche.
- **Insight panel laterale** "Suggerimenti AI": "3 dipendenti hanno il 70% delle skill ma seniority bassa — valuta affiancamento", "Skill X non coperta da nessun candidato".
- **Storico**: candidati già visti / scartati con motivo.

## 2. Prospettiva Senior FE — Gap Analysis sull'as-is

| Area | As-is | Gap |
|---|---|---|
| Header | Titolo + breadcrumb minimale | Manca contesto ruolo, KPI, azioni globali |
| Requisiti posizione | 1 pill `Junior`, hard skills spesso assenti | Non scannerizzabile, no descrizione, no hiring manager, no urgenza |
| Tab counter | OK ma piatti | Nessun KPI, nessun "best match" |
| Card interna | Riga densa, font 9–10px, 2 azioni | Bassa leggibilità, mix di info, badge piccoli, no hard skills, no breakdown skill |
| Card esterna | Card grande con 3 numeri (RIASEC/Skills/Seniority) | Stile incoerente con quella interna, doppio layout da mantenere |
| Filtri | Solo "in cerca" + search testo per esterni; **assenti per interni** | Servono filtri condivisi e ordinamento |
| Confronto | Inesistente | Funzione hr-critical mancante |
| Stati vuoti | Generici | Nessuna call-to-action utile |
| Mobile | Layout regge ma denso | Necessita riordino responsive |
| Design tokens | Mix di colori hard-coded (`bg-purple-100`, `text-green-600`) | Allineare a palette `jnana-*` come da memoria progetto |

## 3. Piano di implementazione (To-Be)

### 3.1 Nuovo layout pagina

```text
┌─────────────────────────────────────────────────────────────┐
│  ← Back   Stagista · Veterinary & Scientific Advisory       │
│  [Junior] [Aperta da 12gg] [Hiring Mgr: Mario Rossi]        │
│  Azioni:  [Confronta (0)]  [Pubblica Annuncio]  [Pausa]     │
├─────────────────────────────────────────────────────────────┤
│  KPI STRIP (4 tile)                                         │
│  Candidati  | Best Internal | Best External | In Shortlist  │
│     7       |     100%      |      82%      |       2       │
├─────────────────────────────────────────────────────────────┤
│  REQUISITI (collapsible)                                    │
│   Hard skills • Soft skills • Seniority • Descrizione       │
├─────────────────────────────────────────────────────────────┤
│  Tabs: Tutti | Interni (4) | Esterni (3) | Shortlist (2)    │
│  Toolbar: 🔍 search · ⌃ ordina · ⛁ filtri · ◇ vista lista/grid│
├──────────────────────────────────────────┬──────────────────┤
│  LISTA CANDIDATI (card uniforme)         │  INSIGHT PANEL   │
│   ▸ Pronti (≥75)                         │  • Skill gap     │
│   ▸ Da valutare (50-74)                  │  • Suggerimenti  │
│   ▸ Non adatti (<50, collapsed)          │  • Storico       │
└──────────────────────────────────────────┴──────────────────┘
```

### 3.2 Componenti nuovi (sotto `src/components/positionMatching/`)

- `PositionHeader.tsx` — titolo, meta (dipartimento, hiring manager, giorni aperta, urgenza), action bar.
- `PositionKPIStrip.tsx` — 4 tile (Candidati totali, Best internal %, Best external %, Shortlist count + delta).
- `PositionRequirementsCard.tsx` — collapsible con tab Hard/Soft/Seniority/Descrizione + "skill coperte da X candidati".
- `CandidateToolbar.tsx` — search, sort (match desc/asc, seniority, recente), filter chips (generazione, dipartimento, "solo in cerca", "non in shortlist"), toggle vista.
- `CandidateCard.tsx` — **card unica** parametrizzata con `variant: 'internal' | 'external'`. Mostra: avatar, nome, generazione, badge tipo, ruolo attuale/headline, location, score circolare, mini-breakdown skill (chip ✓/✗), sinergia col manager, badge "in shortlist", azioni `Shortlist / Confronta / Profilo / Assegna`.
- `CandidateGroup.tsx` — wrapper con header collassabile per le 3 corsie (Pronti / Da valutare / Non adatti) + count.
- `InsightSidePanel.tsx` — pannello sticky a destra (lg+): skill non coperte, top suggerimento AI (placeholder per future Lovable AI call), shortcut.
- `ComparisonBar.tsx` — barra fluttuante in basso quando ≥1 candidato selezionato per confronto, con CTA "Confronta N candidati" → riusa `CandidateComparisonModal`.

### 3.3 Refactor di `PositionMatchingView.tsx`

- Estrarre tutta la logica di calcolo (`calculateInternalMatch`, raggruppamenti per fascia di score) in `src/utils/positionMatching.ts`.
- Stato nuovo: `selectedForComparison: Set<string>`, `sortBy`, `filters`, `viewMode`.
- Sostituire `renderInternalCandidate`/`renderExternalCandidate` con `<CandidateCard>` unica.
- Tab "Tutti" che mostra interni+esterni in un'unica lista ordinata per match.
- Mantenere invariati: `usePositionShortlist`, `useTalentSearch`, `JobRotationReportModal`, `MatchScorePopover`.

### 3.4 Design system

- Sostituire i colori hard-coded con tokens `jnana-*` (sage, powder, bg, text) per coerenza con la memoria di progetto.
- Tipografia: titoli `text-xl/2xl font-bold`, testo card `text-sm`, meta `text-xs text-muted-foreground`.
- Score circolare con SVG ring, colori `jnana-sage` ≥75, `amber-500` 50–74, `rose-500` <50.
- Spaziature uniformi (`gap-3`, `p-4`), bordi `rounded-xl`, ombre soft.

### 3.5 Responsive

- ≥1280px: 2 colonne (lista + insight panel).
- 768–1279px: 1 colonna, insight panel collapsato in accordion sopra la lista.
- <768px: KPI strip in 2x2, card con azioni in dropdown `…`.

### 3.6 Out of scope (questa iterazione)

- Pubblicazione effettiva annuncio esterno (solo CTA placeholder).
- Chiamata AI reale per suggerimenti (placeholder con dati derivati dal client).
- Storico candidati scartati (richiede schema DB — da pianificare a parte).

### 3.7 File toccati / creati

- **Nuovi**: 8 componenti in `src/components/positionMatching/` + `src/utils/positionMatching.ts`.
- **Modificati**: `views/admin/PositionMatchingView.tsx` (orchestrazione + nuovo layout).
- **Nessuna** modifica a backend, RLS, hook dati, tipi DB.

Confermi il piano? Posso procedere con l'implementazione.
