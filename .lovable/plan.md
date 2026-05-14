# Fix: dati interno mancanti nel "Confronta Candidati"

## Diagnosi

Per il candidato esterno (Giuseppe da Karma) ora arriva tutto perché `KarmaProfile` espone già `riasecScore` e `hardSkills` con la stessa nomenclatura usata dal modale.

Per il candidato interno (Riccardo) i campi sono diversi nello schema `User`:

| Modale si aspetta | `KarmaProfile` (esterno) | `User` (interno)        |
|-------------------|--------------------------|-------------------------|
| `riasecScore`     | `riasecScore` ✓          | **`results`** ✗         |
| `hardSkills` (string[]) | `hardSkills: UserHardSkill[]` | `hardSkills: UserHardSkillBasic[]` (oggetti) |

In `buildUC` (`views/admin/PositionMatchingView.tsx`) attualmente facciamo `src?.riasecScore` — per gli interni è `undefined`, quindi le 6 barre RIASEC non appaiono (compare solo il `profileCode` "SAE"). Per le hard skills, `candidate.skills = [...row.hardMatched, ...row.hardMissing]` è vuoto quando la posizione non ha skill richieste, e il fallback nel modale legge `candidate.skills` che resta vuoto → "Nessuna skill richiesta o disponibile".

## Modifica (1 file)

`views/admin/PositionMatchingView.tsx` — funzione `buildUC` (~riga 476): normalizzare le due shape.

```ts
const buildUC = (row: UnifiedRow): UnifiedCandidate => {
  const u = row.internal?.user;
  const p = row.external?.profile;
  const src: any = u || p;

  // RIASEC: interno usa `results`, esterno usa `riasecScore`
  const riasec = (u as any)?.results || (p as any)?.riasecScore;

  // Hard skills proprie del candidato (per il fallback quando la posizione non ha richieste)
  const ownHardRaw: any[] = u?.hardSkills || p?.hardSkills || [];
  const ownHardNames = ownHardRaw
    .map(s => (typeof s === 'string' ? s : s?.name || s?.skill || ''))
    .filter(Boolean);

  return {
    id: row.id,
    type: row.kind,
    name: row.name,
    jobTitle: row.subtitle,
    avatarUrl: src?.avatarUrl,
    matchScore: row.score,
    riasecScore: riasec,
    profileCode: src?.profileCode,
    // skills = unione richieste + skill possedute → garantisce il fallback nel modale
    skills: Array.from(new Set([...row.hardMatched, ...row.hardMissing, ...ownHardNames])),
    matchedSkills: row.hardMatched.length ? row.hardMatched : ownHardNames,
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

Nessun'altra modifica: il modale `CandidateComparisonModal` ha già il branch "no required skills → mostra le skill del candidato dal `skills`/`matchedSkills`" introdotto nella patch precedente, quindi appena `matchedSkills` è popolato con le hard skill di Riccardo apparirà l'elenco; le 6 barre RIASEC compariranno appena `riasecScore` è valorizzato.

## Fuori scope

- Caricamento dati extra dal DB.
- Riallineamento dei tipi `User` ↔ `KarmaProfile` (refactor strutturale, non necessario per il fix).

## Verifica

Stessa posizione "Stagista", confronto Riccardo + Giuseppe: per Riccardo devono apparire le 6 barre RIASEC (come per Giuseppe) e l'elenco "Hard Skills del candidato" con Excel Advanced + Social Media Marketing.
