
# Piano: SpaceSync - Gestione Spaziale degli Uffici con Matching di Compatibilita

## Nome della Feature: **SpaceSync**

Un nome che comunica il concetto di sincronizzazione tra persone e spazi, allineato al vocabolario del prodotto (Jnana = conoscenza, Karma = azione, SpaceSync = armonia spaziale).

---

## Panoramica

SpaceSync permette di:
1. Disegnare planimetrie semplificate degli uffici (rettangoli/quadrati su canvas)
2. Gestire piu piani/edifici/sedi con indirizzi
3. Posizionare scrivanie e associarle a ruoli/persone
4. Calcolare la compatibilita spaziale tra colleghi vicini (basata su RIASEC, soft skills, valori, generazione)
5. Suggerire ricollocazioni ottimali basate sui flussi di comunicazione

---

## Schema Database

Tre nuove tabelle:

```text
office_locations (Sedi/Edifici)
├── id (uuid PK)
├── company_id (FK -> companies)
├── name (es. "Sede Milano - Piano 2")
├── address (indirizzo completo)
├── building_name (nome edificio, nullable)
├── floor_number (numero piano, nullable)
├── sort_order (int)
├── created_at / updated_at

office_rooms (Stanze/Aree sulla planimetria)
├── id (uuid PK)
├── location_id (FK -> office_locations)
├── name (es. "Ufficio Marketing", "Open Space A")
├── x, y, width, height (coordinate e dimensioni in px sul canvas)
├── color (colore di sfondo, nullable)
├── room_type ('office' | 'meeting' | 'common' | 'other')
├── created_at / updated_at

office_desks (Scrivanie con assegnazione)
├── id (uuid PK)
├── room_id (FK -> office_rooms)
├── label (es. "D1", "Scrivania Marco")
├── x, y (posizione relativa alla stanza)
├── company_member_id (FK -> company_members, nullable)
├── company_role_id (FK -> company_roles, nullable)
├── created_at / updated_at
```

RLS: Tutte le tabelle protette per `company_id` tramite join, accessibili solo da admin/membri della stessa azienda.

---

## Algoritmo di Compatibilita Spaziale

Il cuore brevettabile: un **Proximity Compatibility Score** che valuta quanto e efficace la vicinanza tra due persone.

```text
ProximityScore(A, B) = weighted_sum(
  RIASEC_Complementarity(A, B)     * 0.20   // Profili complementari (non identici!)
  SoftSkills_Overlap(A, B)         * 0.15   // Soft skills condivise
  Values_Alignment(A, B)           * 0.15   // Valori personali allineati
  Communication_Flow(A, B)         * 0.30   // Frequenza di collaborazione necessaria
  Generation_Synergy(A, B)         * 0.10   // Bonus intergenerazionale (gia implementato)
  Conflict_Risk(A, B)              * 0.10   // Penalita per risk factors incompatibili
)
```

Aspetto chiave: **Communication Flow** - un nuovo dato che dobbiamo raccogliere:
- Per ogni ruolo, definiamo con quali altri ruoli ha un flusso di comunicazione frequente
- Questo viene configurato dall'admin nella sezione ruoli (campo `communicates_with_roles`)
- Chi comunica spesso dovrebbe stare vicino

---

## Struttura dei File

```text
Nuovi file:
├── src/types/spacesync.ts                    // Tipi TypeScript
├── src/hooks/useOfficeLocations.ts           // CRUD sedi
├── src/hooks/useOfficeRooms.ts               // CRUD stanze
├── src/hooks/useOfficeDesks.ts               // CRUD scrivanie
├── src/hooks/useProximityScoring.ts          // Calcolo compatibilita
├── src/utils/proximityEngine.ts              // Algoritmo di scoring puro
├── views/admin/SpaceSyncView.tsx             // Vista principale
├── src/components/spacesync/LocationSelector.tsx    // Selezione sede/piano
├── src/components/spacesync/FloorPlanCanvas.tsx     // Canvas planimetria
├── src/components/spacesync/RoomEditor.tsx           // Disegno stanze
├── src/components/spacesync/DeskMarker.tsx           // Scrivania sul canvas
├── src/components/spacesync/DeskAssignmentModal.tsx  // Assegna persona
├── src/components/spacesync/ProximityHeatmap.tsx     // Overlay compatibilita
├── src/components/spacesync/ProximityReport.tsx      // Report di ottimizzazione

File da modificare:
├── types.ts                           // Aggiungere ViewState ADMIN_SPACESYNC
├── App.tsx                            // Aggiungere route + import
├── components/layout/Header.tsx       // Aggiungere bottone nav SpaceSync
├── src/components/dashboard/QuickActionsPanel.tsx  // Aggiungere azione rapida
```

---

## UI della Planimetria

L'editor sara basato su un canvas HTML5 semplificato (no librerie pesanti), con:

```text
┌────────────────────────────────────────────────────────────────┐
│  SpaceSync                                    [Sede ▼] [+ Sede]│
│  Ottimizza la disposizione del tuo team                        │
├────────────────────────────────────────────────────────────────┤
│  [Piano Terra] [Piano 1] [Piano 2]              [+ Piano]     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   PLANIMETRIA                                [Edit] [Heatmap]  │
│   ┌──────────────────────┐  ┌──────────────┐                  │
│   │  Ufficio Direzione   │  │  Open Space  │                  │
│   │  ┌──┐ ┌──┐           │  │  ┌──┐┌──┐┌──┐│                  │
│   │  │D1│ │D2│           │  │  │D3││D4││D5││                  │
│   │  │CS│ │MR│           │  │  │GC││LB││--││                  │
│   │  └──┘ └──┘           │  │  └──┘└──┘└──┘│                  │
│   └──────────────────────┘  │  ┌──┐┌──┐    │                  │
│                              │  │D6││D7│    │                  │
│   ┌──────────────────────┐  │  │AP││--│    │                  │
│   │  Sala Riunioni       │  │  └──┘└──┘    │                  │
│   │                      │  └──────────────┘                  │
│   └──────────────────────┘                                    │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│  SUGGERIMENTI DI OTTIMIZZAZIONE                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ! Giuseppe C. (Operations) e Carlotta S. (Direzione)     │  │
│  │   Comunicano frequentemente ma sono su piani diversi.    │  │
│  │   Compatibilita: 87% - [Suggerisci spostamento]          │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### Interazioni Canvas:
- **Modalita Edit**: Click e drag per disegnare rettangoli (stanze), click per posizionare scrivanie
- **Modalita Heatmap**: Overlay colorato che mostra le zone di alta/bassa compatibilita
- **Click su scrivania**: Mostra popup con persona assegnata, compatibilita con vicini, suggerimenti
- **Drag & drop**: Trascina scrivanie per riposizionarle, con aggiornamento live dello score

---

## Integrazione nella Navigazione

### Header (menu admin):
Nuovo bottone tra "Compliance" e "Azienda":
```text
[Organigramma] [Dashboard] [Identity Hub] [SpaceSync] [Compliance] [Azienda]
```

### Quick Actions (dashboard):
Nuova azione rapida con icona `MapPin`:
```text
{ icon: MapPin, label: 'SpaceSync', description: 'Disposizione uffici', view: 'ADMIN_SPACESYNC' }
```

### ViewState:
```typescript
| { type: 'ADMIN_SPACESYNC' }
```

---

## Fasi di Implementazione

Data la complessita, suggerisco di procedere in **3 fasi**:

### Fase 1 - Fondamenta (questa implementazione)
- Schema DB (3 tabelle + RLS)
- ViewState + routing + navigazione
- CRUD sedi/piani
- Canvas base con disegno stanze (rettangoli)
- Posizionamento scrivanie
- Assegnazione persona/ruolo alle scrivanie

### Fase 2 - Scoring (prossima iterazione)
- Algoritmo ProximityScore
- Communication Flow config sui ruoli
- Heatmap overlay
- Report di ottimizzazione

### Fase 3 - Suggerimenti AI (futura)
- Suggerimenti automatici di ricollocazione
- Simulazione "what-if" (drag persona e vedi come cambia lo score globale)
- Export report per management

---

## Dettagli Tecnici

### Canvas Implementation
Il canvas usera un approccio React + SVG (non Canvas 2D) per semplicita e accessibilita:
- Ogni stanza e un `<rect>` SVG con handler di drag/resize
- Ogni scrivania e un `<g>` SVG con icona e label
- Lo zoom/pan sara gestito con viewBox transformation
- Nessuna dipendenza esterna necessaria

### Proximity Engine (src/utils/proximityEngine.ts)
Funzione pura che calcola il punteggio di compatibilita tra due utenti:

```typescript
export function calculateProximityScore(
  userA: ProximityUserData,
  userB: ProximityUserData,
  communicationFlow: boolean  // true se i ruoli comunicano frequentemente
): ProximityResult {
  // 1. RIASEC Complementarity (non identica!)
  // Profili troppo simili = bassa complementarieta
  // Profili complementari (es. S+E, I+R) = alta complementarieta
  
  // 2. Soft Skills overlap
  // Skills condivise = comunicazione piu facile
  
  // 3. Values alignment
  // Valori condivisi = meno friction
  
  // 4. Communication Flow (peso maggiore)
  // Se i ruoli comunicano spesso -> massimo punteggio se vicini
  
  // 5. Generation Synergy (riuso analyzeSynergy esistente)
  
  // 6. Conflict Risk
  // Risk factors incompatibili penalizzano
}
```

### Persistenza
Segue il pattern standard del progetto: update locale immediato -> persist su DB -> rollback se errore.
