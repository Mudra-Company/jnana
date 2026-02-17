

# Evoluzione Proximity Engine: Collaboration Profile

## Panoramica

Questa feature aggiunge un sistema di profilazione collaborativa per ogni ruolo/membro, collegando matematicamente l'organigramma alla disposizione fisica degli uffici in SpaceSync. I dati di collaborazione vengono salvati a livello di `company_role` (come JSONB) e consumati dal Proximity Engine per ottimizzare le scrivanie.

---

## 1. Database: Nuova colonna su `company_roles`

Aggiungere una colonna JSONB `collaboration_profile` alla tabella `company_roles`:

```sql
ALTER TABLE public.company_roles
ADD COLUMN collaboration_profile jsonb DEFAULT '{"links":[],"environmentalImpact":3,"operationalFluidity":3}'::jsonb;
```

Struttura del JSONB:
```text
{
  "links": [
    {
      "targetType": "team" | "member",
      "targetId": "<org_node_id o company_member_id>",
      "targetLabel": "Sales Team",
      "collaborationPercentage": 40,
      "personalAffinity": 4,
      "memberBreakdown": [           // solo per targetType "team"
        { "memberId": "xxx", "memberLabel": "Mario Rossi", "percentage": 60 },
        { "memberId": "yyy", "memberLabel": "Luigi Bianchi", "percentage": 40 }
      ]
    }
  ],
  "environmentalImpact": 3,    // 1-5 Likert (rumore/disturbo)
  "operationalFluidity": 3     // 1-5 Likert (call/uscite/interruzioni)
}
```

Le policy RLS esistenti su `company_roles` coprono gia lettura/scrittura per admin, HR e super_admin.

---

## 2. Types (src/types/roles.ts)

Aggiungere le nuove interfacce:

```text
CollaborationLink {
  targetType: 'team' | 'member'
  targetId: string
  targetLabel: string
  collaborationPercentage: number  // 0-100
  personalAffinity: number         // 1-5
  memberBreakdown?: { memberId, memberLabel, percentage }[]
}

CollaborationProfile {
  links: CollaborationLink[]
  environmentalImpact: number      // 1-5
  operationalFluidity: number      // 1-5
}
```

Aggiungere `collaborationProfile?: CollaborationProfile` a `CompanyRole`, `CreateRoleInput` e `UpdateRoleInput`.

---

## 3. Hook: useCompanyRoles (src/hooks/useCompanyRoles.ts)

- Aggiungere `collaboration_profile` nel mapping `mapDbRowToRole` e `mapInputToDbRow`
- I dati vengono letti/scritti come parte del normale CRUD dei ruoli (nessun endpoint aggiuntivo)

---

## 4. UI: Nuovo Tab "Collaborazione" in UnifiedDetailModal

Aggiungere un sesto tab alla modale con id `collaborazione`:

**Sezione A - Parametri Personali (Sliders)**
- Impatto Ambientale (1-5): slider con icona Volume2, labels da "Silenzioso" a "Molto rumoroso"
- Fluidita Operativa (1-5): slider con icona Activity, labels da "Stabile/fisso" a "Molto dinamico"

**Sezione B - Collegamenti di Collaborazione**
- Lista delle connessioni esistenti con % e affinita
- Bottone "+ Aggiungi Connessione" che apre un selettore:
  - Tipo: Team (org_node) o Persona (company_member)
  - Target: dropdown con ricerca tra i nodi/membri dell'azienda
  - % Collaborazione: slider numerico
  - Affinita Personale: slider 1-5
- Per connessioni di tipo "Team": opzione di espandere e distribuire la % tra singoli membri del team
- Barra di validazione: mostra la somma totale delle % (con warning se supera 100%)
- Ogni connessione ha un bottone di rimozione

**Props necessarie:**
- `orgNodes` (lista dei nodi organizzativi per il selettore Team)
- I `companyMembers` gia passati vengono riusati per il selettore Persona

---

## 5. Proximity Engine (src/utils/proximityEngine.ts)

### 5A. Aggiornare ProximityUserData
Aggiungere:
```text
collaborationProfile?: CollaborationProfile
```

### 5B. Nuova funzione: calculateCollaborationFlow
Sostituisce `calculateCommunicationFlow`. Calcola uno score 0-100 basato su:
- Se A ha un link verso il team/membro di B (o viceversa), lo score e proporzionale alla % di collaborazione
- Bonus per alta affinita personale (Likert 4-5)
- Fallback a 40 se non ci sono link diretti

### 5C. Nuova funzione: calculateEnvironmentalFriction
Aggiunge una penalita (0-100) quando:
- Un utente ha alto Impatto Ambientale (4-5) e l'altro ha un profilo Karma con need di focus/silenzio (rilevato dai riskFactors o softSkills come "Concentrazione", "Analytical Thinking")
- Due utenti con Fluidita Operativa molto diversa (delta >= 3)
- Due utenti entrambi con Impatto Ambientale 5 (amplificazione rumore)

### 5D. Aggiornare pesi
```text
RIASEC_COMPLEMENTARITY: 0.15  (era 0.20)
SOFT_SKILLS_OVERLAP:    0.10  (era 0.15)
VALUES_ALIGNMENT:       0.10  (era 0.15)
COLLABORATION_FLOW:     0.30  (resta 0.30, ma ora basato su %)
GENERATION_SYNERGY:     0.10  (resta 0.10)
CONFLICT_RISK:          0.10  (resta 0.10)
ENVIRONMENTAL_FRICTION: 0.15  (NUOVO)
```

### 5E. Aggiornare ProximityResult.breakdown
Aggiungere `collaborationFlow` (rinominato da `communicationFlow`) e `environmentalFriction`.

### 5F. Nuovi insight
- "Alto flusso collaborativo (X%) -- ottimo averli vicini"
- "Rischio Frizione Ambientale: stili operativi incompatibili"
- "Attenzione: potenziale disturbo sonoro per il vicino"

---

## 6. Hook useProximityScoring (src/hooks/useProximityScoring.ts)

Aggiornare `loadUserData` per:
- Fetch dei `company_roles` con `collaboration_profile` per ogni membro assegnato
- Popolare `collaborationProfile` nel `ProximityUserData`

---

## 7. Visual Feedback in SpaceSync

### 7A. Heatmap Alerts (src/components/spacesync/ProximityReport.tsx)
- Nella lista delle coppie critiche, aggiungere icone specifiche:
  - `Volume2` (rosso) se c'e frizione ambientale
  - `Activity` (ambra) se c'e incompatibilita di fluidita operativa
- Insight testuale dedicato nel report

### 7B. OptimizationSuggestions (src/components/spacesync/OptimizationSuggestions.tsx)
- Passare i dati di environmental friction all'AI per suggerimenti piu mirati
- Mostrare alert visivi nei suggerimenti quando il motivo e ambientale

### 7C. Canvas DeskTooltip (src/components/spacesync/canvas/DeskTooltip.tsx)
- Mostrare piccole icone (Volume2, Activity) nel tooltip della scrivania se il profilo ha valori estremi (4-5) di impatto ambientale o fluidita

---

## 8. Fix Build Errors Pre-esistenti

Correggere tutti gli errori TypeScript elencati nei build errors per permettere la compilazione, inclusi:
- `riasecService.ts`: cast corretto per evitare `never`
- `OrgChartPrintView.tsx`: default boolean
- `useProfiles.ts`: filtrare null prima di `.in()`
- `useQuestionnaires.ts`: null vs undefined e overload
- `useUnifiedOrgData.ts`: `notes: string | null` vs `string | undefined`
- `questionnaireImportExport.ts`: null vs undefined
- `OrgNodeCard.tsx` e `PositionMatchingView.tsx`: optional chaining
- `KarmaProfileEdit.tsx`: tipo proficiency e campi mancanti
- `QuestionnaireEditorView.tsx`: tipo ritorno Promise

---

## File da Modificare

| File | Modifica |
|---|---|
| **Migration SQL** | Nuova colonna `collaboration_profile` su `company_roles` |
| `src/types/roles.ts` | Nuove interfacce + campo in CompanyRole/Input |
| `src/hooks/useCompanyRoles.ts` | Mapping collaboration_profile |
| `src/components/roles/UnifiedDetailModal.tsx` | Nuovo tab "Collaborazione" con sliders e link editor |
| `src/utils/proximityEngine.ts` | Nuove funzioni scoring, nuovi pesi, nuovi insight |
| `src/hooks/useProximityScoring.ts` | Fetch collaboration_profile nei dati utente |
| `src/components/spacesync/ProximityReport.tsx` | Icone alert frizione |
| `src/components/spacesync/OptimizationSuggestions.tsx` | Dati ambientali nel prompt AI |
| `src/components/spacesync/canvas/DeskTooltip.tsx` | Icone impatto nel tooltip |
| + ~10 file per fix build errors |

Nessuna nuova dipendenza. 1 migrazione DB (aggiunta colonna JSONB). ~12-15 file da modificare.

