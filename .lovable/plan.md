
# Piano Implementazione: Live Simulation e Scoring Engine

## Panoramica
Questo piano implementa le funzionalita richieste per rendere il modulo "Jnana Survey Builder" completamente operativo: simulazione live, motore di scoring, e miglioramenti UI.

---

## FASE A: Scoring Engine Service

### File da creare: `src/services/scoringEngine.ts`

Questo servizio e il cuore del sistema di calcolo punteggi.

**Struttura del Service:**

```text
+------------------------------------------+
|           scoringEngine.ts               |
+------------------------------------------+
| Inputs:                                  |
|  - Questionnaire (con sections,          |
|    questions, options, weights)          |
|  - SwipeAnswer[] (risposte utente)       |
+------------------------------------------+
| Process:                                 |
|  1. Inizializza accumulatori per dim     |
|  2. Per ogni risposta:                   |
|     - Likert: value * weight             |
|     - Option: somma pesi opzione         |
|  3. Normalizza 0-100                     |
|  4. Ordina e genera profileCode          |
+------------------------------------------+
| Output:                                  |
|  - DimensionScore[] (scores normaliz.)   |
|  - profileCode (top 3 dim: "R-I-A")      |
|  - rawAnswers[]                          |
+------------------------------------------+
```

**Funzioni principali:**

1. `calculateScores(questionnaire, answers)` - Calcolo completo
2. `normalizeScore(raw, max)` - Normalizzazione 0-100  
3. `generateProfileCode(scores, topN)` - Genera codice profilo

**Gestione casi speciali:**
- Domande Likert: moltiplica `likertValue` (1-5) per peso dimensione della domanda
- Opzioni selezionate: somma i `weights` associati all'opzione
- Domande skippate: non contribuiscono al punteggio
- Pesi negativi: supportati per penalizzazioni

---

## FASE B: Simulation Modal Component

### File da creare: `components/questionnaire/SimulationModal.tsx`

Modal full-screen che permette di testare il questionario senza salvare dati.

**Architettura del componente:**

```text
+--------------------------------------------------+
|                  SimulationModal                 |
+--------------------------------------------------+
| Props:                                           |
|  - questionnaire: Questionnaire                  |
|  - isOpen: boolean                               |
|  - onClose: () => void                           |
+--------------------------------------------------+
| State:                                           |
|  - phase: 'simulate' | 'results'                 |
|  - answers: SwipeAnswer[]                        |
|  - scores: DimensionScore[]                      |
+--------------------------------------------------+
| Renders:                                         |
|  phase === 'simulate':                           |
|    -> QuestionnaireSwipeRenderer (if swipe)      |
|    -> QuestionnaireStepRenderer (if step)        |
|    -> GenericRenderer (fallback)                 |
|  phase === 'results':                            |
|    -> DebugResultsView                           |
+--------------------------------------------------+
```

**Layout del Modal:**

```text
+--------------------------------------------------+
| [X Chiudi]     ANTEPRIMA - {title}    [Restart]  |
+--------------------------------------------------+
|                                                  |
|   +------------------------------------------+   |
|   |                                          |   |
|   |      QuestionnaireSwipeRenderer          |   |
|   |              (o altro renderer)          |   |
|   |                                          |   |
|   +------------------------------------------+   |
|                                                  |
+--------------------------------------------------+
```

**Layout Debug Results:**

```text
+--------------------------------------------------+
|        DEBUG RISULTATI SIMULAZIONE               |
+--------------------------------------------------+
|                                                  |
|  RISPOSTE ({count}):                             |
|  +--------------------------------------------+  |
|  | Q1: "Preferisci..."  -> Opzione A          |  |
|  | Q2: "Quanto ti..."   -> Likert: 4/5        |  |
|  | Q3: "Scegli..."      -> Opzione C          |  |
|  +--------------------------------------------+  |
|                                                  |
|  PUNTEGGI PER DIMENSIONE:                        |
|  +--------------------------------------------+  |
|  | R (Realistico)     |=============|  72/100 |  |
|  | I (Investigativo)  |========|       45/100 |  |
|  | A (Artistico)      |================|89/100|  |
|  +--------------------------------------------+  |
|                                                  |
|  PROFILO CALCOLATO: A-R-I                        |
|                                                  |
|  [Ripeti Simulazione]           [Chiudi]         |
+--------------------------------------------------+
```

---

## FASE C: Integration in QuestionnaireEditorView

### Modifiche a: `views/superadmin/QuestionnaireEditorView.tsx`

**Nuovo stato e handler:**

```typescript
// Nuovo stato
const [showSimulation, setShowSimulation] = useState(false);

// Handler per preview
const handlePreview = () => {
  if (!questionnaire?.sections?.length) {
    toast({ 
      title: 'Nessuna domanda', 
      description: 'Aggiungi almeno una sezione con domande',
      variant: 'destructive'
    });
    return;
  }
  setShowSimulation(true);
};
```

**Nuovo pulsante nell'header (linea ~340):**

Aggiungere accanto al pulsante Pubblica/Disattiva:

```tsx
<button
  onClick={handlePreview}
  className="flex items-center gap-2 px-4 py-2.5 rounded-xl 
             bg-indigo-100 hover:bg-indigo-200 text-indigo-700 
             dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 
             dark:text-indigo-400 text-sm font-medium transition-all"
>
  <Play size={16} />
  Anteprima
</button>
```

**Import e render del modal:**

```tsx
// Import
import { SimulationModal } from '@/components/questionnaire/SimulationModal';

// Nel return, prima della chiusura del div principale
{showSimulation && questionnaire && (
  <SimulationModal
    questionnaire={questionnaire}
    isOpen={showSimulation}
    onClose={() => setShowSimulation(false)}
  />
)}
```

---

## FASE D: UI Polishing - Weight Badge in OptionEditor

### Modifiche a: `OptionEditor` (linee 994-1023)

Aggiungere badge visivo per mostrare numero di dimensioni impattate.

**Prima del pulsante Palette (linea ~997):**

```tsx
{/* Weight Count Badge */}
{option.weights && option.weights.filter(w => w.weight !== 0).length > 0 && (
  <span 
    className="px-2 py-0.5 bg-gradient-to-r from-indigo-100 to-purple-100 
               dark:from-indigo-900/30 dark:to-purple-900/30
               text-indigo-600 dark:text-indigo-400 text-[10px] 
               font-bold rounded-full flex items-center gap-1"
    title={`${option.weights.filter(w => w.weight !== 0).length} dimensioni impattate`}
  >
    <BarChart3 size={10} />
    {option.weights.filter(w => w.weight !== 0).length}
  </span>
)}
```

**Mini-badge inline per pesi (dopo linea 996, fuori edit mode):**

```tsx
{/* Inline weight preview badges */}
{!editMode && option.weights && option.weights.filter(w => w.weight !== 0).length > 0 && (
  <div className="flex gap-1 ml-2">
    {option.weights.filter(w => w.weight !== 0).slice(0, 4).map(w => {
      const dim = dimensions.find(d => d.id === w.dimensionId);
      return (
        <span 
          key={w.id}
          className="text-[9px] px-1.5 py-0.5 rounded font-medium"
          style={{ 
            backgroundColor: `${dim?.color}15`, 
            color: dim?.color 
          }}
        >
          {dim?.code}: {w.weight > 0 ? '+' : ''}{w.weight}
        </span>
      );
    })}
    {option.weights.filter(w => w.weight !== 0).length > 4 && (
      <span className="text-[9px] text-muted-foreground">
        +{option.weights.filter(w => w.weight !== 0).length - 4}
      </span>
    )}
  </div>
)}
```

---

## Riepilogo File

| Azione | File | Descrizione |
|--------|------|-------------|
| **Creare** | `src/services/scoringEngine.ts` | Motore di calcolo punteggi |
| **Creare** | `components/questionnaire/SimulationModal.tsx` | Modal full-screen simulazione |
| **Modificare** | `views/superadmin/QuestionnaireEditorView.tsx` | Pulsante Preview + integrazione modal + badge pesi |

---

## Note Tecniche

1. **Nessun salvataggio DB**: La simulazione e puramente client-side per testing rapido

2. **SwipeAnswer**: Il tipo gia esiste in `QuestionnaireSwipeRenderer.tsx` (linee 13-19), verra esportato per riuso

3. **Fallback Renderer**: Per uiStyle `step` e `chat`, inizialmente si usera un renderer generico (lista di opzioni), con possibilita di implementare renderer dedicati in futuro

4. **Errori TypeScript Edge Functions**: Gli errori su `Deno` sono falsi positivi del type-checker. Le edge functions funzionano correttamente dopo il deploy

5. **Dimensions lookup**: Il `SimulationModal` riceve il questionario completo incluse le dimensioni per il calcolo

---

## Risultato Atteso

- Pulsante "Anteprima" visibile nell'header dell'editor
- Click apre modal full-screen con simulazione interattiva  
- Al completamento, schermata Debug con punteggi calcolati e normalizzati
- Badge visivi sulle opzioni per feedback immediato sui pesi configurati
- Possibilita di ripetere la simulazione senza chiudere il modal

