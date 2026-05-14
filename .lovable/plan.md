# Fix dati mancanti nel modale "Confronta Candidati"

## Diagnosi

Nel modale di confronto Riccardo appare con **Profilo RIASEC: N/A**, **Hard Skills: "Nessuna skill richiesta"** e nessun avatar/esperienza, mentre la stessa persona nel `UnifiedDetailModal` ha tutti i dati. La causa è in `views/admin/PositionMatchingView.tsx`, funzione `buildUC` (riga ~476):

```ts
const buildUC = (row: UnifiedRow): UnifiedCandidate => ({
  id, type, name, jobTitle, matchScore,
  skills, matchedSkills, missingSkills,
  softSkills: row.softMatched,   // ← solo le matched, e per gli interni è []
  seniority, seniorityMatch, location, status,
  internalUserId, externalProfileId,
});
```

Mancano: `riasecScore`, `profileCode`, `avatarUrl`, `yearsExperience` e le **soft skills complete** del candidato. La fonte (`row.internal.user` / `row.external.profile`) li espone già — semplicemente non vengono mappati.

In più: per la posizione "Stagista" `requiredSkills.length === 0`, quindi la sezione "Hard Skills Richieste" mostra solo "Nessuna skill richiesta" e perde l'informazione su cosa il candidato sa fare.

## Modifiche

### 1. `views/admin/PositionMatchingView.tsx` — arricchire `buildUC`

Mappare i campi mancanti leggendo da `row.internal?.user` e `row.external?.profile`:

```ts
const buildUC = (row: UnifiedRow): UnifiedCandidate => {
  const u = row.internal?.user;
  const p = row.external?.profile;
  const src: any = u || p;
  return {
    id: row.id,
    type: row.kind,
    name: row.name,
    jobTitle: row.subtitle,
    avatarUrl: src?.avatarUrl,
    matchScore: row.score,
    riasecScore: src?.riasecScore,
    profileCode: src?.profileCode,
    skills: [...row.hardMatched, ...row.hardMissing],
    matchedSkills: row.hardMatched,
    missingSkills: row.hardMissing,
    softSkills: src?.karmaData?.softSkills || row.softMatched,
    seniority: row.seniority,
    seniorityMatch: row.seniorityMatch === 'match',
    yearsExperience: src?.yearsExperience ?? src?.karmaData?.yearsExperience,
    location: row.location,
    status: 'shortlisted',
    internalUserId: row.kind === 'internal' ? row.id : undefined,
    externalProfileId: row.kind === 'external' ? row.id : undefined,
  };
};
```

### 2. `src/components/shortlist/CandidateComparisonModal.tsx` — fallback hard skills

Quando `requiredSkills` è vuota, mostrare le hard skill del candidato (semplice elenco testuale dai `matchedSkills` se presenti, altrimenti il messaggio attuale). Mini-modifica al blocco "Hard Skills Richieste":

- Se la posizione **ha** skill richieste → comportamento attuale (✓/✗ per ogni richiesta).
- Se **non ha** skill richieste ma il candidato ha `matchedSkills.length > 0` → titolo cambia in "Hard Skills del candidato" e si mostra l'elenco con icona ✓ neutra.
- Solo se entrambi vuoti → "Nessuna skill richiesta / disponibile".

Nessuna modifica strutturale, solo branching del render.

## Fuori scope

- Caricare extra dati dal DB: tutti i campi necessari sono già nei row.
- Riscrivere la logica di matching o il layout del modale.
- Confronto >2 candidati (già flagged come "in arrivo").

## Verifica

Aprire il matching della posizione "Stagista", selezionare Riccardo + un altro candidato, lanciare "Confronta": il profilo RIASEC, l'avatar, le soft skill complete e le hard skill del candidato devono comparire come nello screenshot del `UnifiedDetailModal`.
