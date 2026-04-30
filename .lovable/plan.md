## Obiettivo

Oggi quando si valuta un candidato interno per la Job Rotation vediamo solo "Match Totale 100% — Soft skills, Seniority". Manca tutto ciò che un Head of HR userebbe per **decidere davvero se spostare la persona**:

1. Come si integrerebbe con il **futuro manager** (chi dirige il nodo target)
2. Cosa il candidato **lascia scoperto** nel suo ruolo attuale
3. Se la rotazione **fa crescere la persona** (stretch vs comfort)
4. Una **raccomandazione sintetica** (Procedi / Valuta / Sconsigliato) con razionale

L'infrastruttura per molti di questi calcoli c'è già (`analyzeSynergy`, `calculateInternalMatch`, `companyUsers`, struttura org), va solo orchestrata e mostrata.

---

## Cosa vedrà l'Head of HR (UX)

Cliccando su un candidato interno della Job Rotation si apre un **report esteso** (sostituisce l'attuale popover stretto), strutturato in 5 blocchi verticali:

```text
┌────────────────────────────────────────────────────┐
│ Riccardo Esposito  ·  Interno  ·  Junior          │
│ Da: Customer Success  →  A: Brand & Content        │
├────────────────────────────────────────────────────┤
│ 1. RACCOMANDAZIONE                                 │
│   [Procedi] 87/100  · "Stretch sano, manager forte"│
├────────────────────────────────────────────────────┤
│ 2. FIT CON IL RUOLO (esistente, già calcolato)     │
│   Hard 90% · Soft 100% · Seniority Match           │
├────────────────────────────────────────────────────┤
│ 3. FIT CON IL NUOVO MANAGER  ←  NUOVO              │
│   Manager: Laura Bianchi (Gen X)                   │
│   Sinergia: Mentoring  · 78/100                    │
│   Stili comunicativi compatibili (RIASEC)          │
├────────────────────────────────────────────────────┤
│ 4. IMPATTO SUL RUOLO LASCIATO  ←  NUOVO            │
│   Customer Success perde: Junior unico del team    │
│   Skill critiche scoperte: "pazienza", "empatia"   │
│   Backup interno: 2 candidati pronti / 0           │
│   Rischio: Medio                                   │
├────────────────────────────────────────────────────┤
│ 5. CRESCITA DEL CANDIDATO  ←  NUOVO                │
│   Stretch: +1 nuova hard skill da imparare        │
│   Allineamento RIASEC: Alto                       │
│   Categoria: "Sviluppo laterale"                  │
└────────────────────────────────────────────────────┘
[Aggiungi a Shortlist]  [Profilo completo]  [Esporta PDF]
```

I 4 blocchi nuovi (Raccomandazione + 3 analisi) appaiono **solo per i candidati interni**. Gli esterni mantengono la vista attuale.

---

## Logica HR (regole interpretabili, non black-box)

### Manager-Fit (blocco 3)
- Riusiamo `analyzeSynergy(candidato, manager)` già esistente.
- Aggiungiamo confronto stili RIASEC (se entrambi hanno il profilo): coppie complementari = +bonus, opposte = warning.
- Se il manager non esiste ancora (posizione nuova senza capo assegnato) → mostriamo "Manager non definito — fit non calcolabile".

### Impatto sul ruolo lasciato (blocco 4)
- Identifichiamo il `departmentId` corrente del candidato.
- Contiamo quante altre persone nel nodo coprono le **stesse hard/soft skills** del candidato.
- Se è l'unico portatore di una skill → quella skill diventa "scoperta critica".
- Cerchiamo backup interni: altri dipendenti con seniority compatibile per coprire il ruolo lasciato (riuso di `calculateInternalMatch` invertito).
- Rischio: Basso (≥2 backup pronti) · Medio (1 backup) · Alto (0 backup + skill critiche scoperte).

### Crescita del candidato (blocco 5)
- Stretch = nuove hard skill richieste dal ruolo target che il candidato NON ha (delta tra `requiredProfile.hardSkills` e `candidate.hardSkills`).
- 0 nuove skill = "Movimento laterale puro" (rischio noia).
- 1-3 nuove = "Stretch sano" (ideale).
- 4+ nuove = "Stretch aggressivo" (alto rischio fallimento).
- Allineamento RIASEC tra ruolo attuale e target.

### Raccomandazione finale (blocco 1)
Score composito 0-100, pesi ragionati come farebbe un Head of HR:
- 35% Match con il ruolo (skill+seniority)
- 25% Fit con il nuovo manager
- 25% Impatto sul ruolo lasciato (invertito: rischio alto = penalità)
- 15% Crescita del candidato

Soglie:
- ≥75 → **Procedi** (verde)
- 50-74 → **Valuta** (giallo, con razionale dei rischi)
- <50 → **Sconsigliato** (rosso, con ragione principale)

Il razionale è una frase generata componendo i 3-4 fattori più rilevanti (no AI, regole if/then per essere veloce e prevedibile). In una fase 2 si potrà sostituire con Lovable AI per un commento narrativo.

---

## Esportabile (Phase 1.5, opzionale ora)

Pulsante "Esporta PDF" che genera un report di 1 pagina con i 5 blocchi → utile per discussione in comitato HR. Riusiamo `jspdf + html2canvas` già nel progetto (PDF organigramma).

---

## Implementazione tecnica

**File nuovo: `src/utils/jobRotationAnalyzer.ts`**
- `analyzeRotation(candidate, position, manager, companyUsers, nodeNames): RotationAnalysis`
- Esporta tipi `RotationAnalysis`, `ManagerFit`, `RoleImpact`, `GrowthAnalysis`, `Recommendation`.
- Pure function, testabile, zero side effects.

**File nuovo: `src/components/shortlist/JobRotationReportModal.tsx`**
- Modal full-report (sostituisce `MatchScorePopover` solo per candidati interni in Job Rotation).
- 5 blocchi come da UX sopra.
- Stile: palette `jnana-sage`/`jnana-powder` come da design system del progetto.

**Modifiche a `views/admin/PositionMatchingView.tsx`**
- In `handleOpenInternalPopover`: chiamare `analyzeRotation(...)` e passare il risultato a un nuovo state `selectedRotationReport`.
- Renderizzare `<JobRotationReportModal>` quando `selectedRotationReport` è settato.
- `MatchScorePopover` resta in uso solo per candidati esterni.

**Riuso esistente (zero nuovo da costruire):**
- `analyzeSynergy()` → manager-fit
- `calculateInternalMatch()` → backup interni per ruolo lasciato
- `companyUsers`, `nodeNames`, `position.requiredProfile` → già in scope

**Nessuna modifica al DB.** Tutta la logica è derivata da dati già query-ati.

---

## Out of scope (per ora)

- Salvare lo storico delle valutazioni di rotation → da fare quando l'HR vorrà tracciare le decisioni nel tempo.
- Coinvolgere AI generativa per il commento narrativo → fase successiva.
- Notifiche al manager target → fase successiva.
