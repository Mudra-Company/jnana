
# Miglioramento Gestione Sedi/Piani e Flussi Cross-Location in SpaceSync

## Situazione attuale

Oggi ogni "location" e un'entita piatta con campi opzionali `buildingName`, `address`, `floorNumber`. Le due sedi esistenti sono:
- **HQ** (Via tal dei tali, Concorrezzo) - Piano 1
- **DUOMO** (Piazza Duomo Milano)

Il sistema mostra solo i flussi di collaborazione tra persone sullo **stesso piano/sede**. Se un collaboratore e su un altro piano o in un'altra sede, la connessione e completamente invisibile.

## Cosa cambia

### 1. Ristrutturazione UI del LocationSelector (Sede > Piani)

Trasformare il selettore da lista piatta a **gerarchia a due livelli**: Sede (raggruppata per `address`) > Piano.

```text
SEDI E PIANI
  
  [Sede] HQ - Via tal dei tali, Concorrezzo
    > Piano Terra        [selezionato]
    > Piano 1
    + Aggiungi Piano
  
  [Sede] DUOMO - Piazza Duomo Milano  
    > Piano Unico
    + Aggiungi Piano

  + Nuova Sede
```

- "Nuova Sede" chiede solo nome sede e indirizzo, poi crea automaticamente il primo piano
- "Aggiungi Piano" dentro una sede crea una nuova location con lo stesso `address`/`buildingName` e il `floorNumber` successivo
- Il raggruppamento usa il campo `address` come chiave di sede (gia presente nel DB)

### 2. Flussi Cross-Location nel Canvas (frecce "verso l'esterno")

Quando la vista Flussi e attiva, per ogni collaboratore che ha link verso qualcuno NON presente nel piano corrente:

```text
                    ┌─────────────────────────┐
                    │  [Canvas Piano Terra]    │
                    │                          │
  ← Piano 1        │   [Desk A] ──────────>   │──→ DUOMO
  Claudio V. 20%   │                          │   Michele C. 25%
                    │   [Desk B]               │
                    └─────────────────────────┘
```

- Una freccia tratteggiata parte dal desk dell'utente e va verso il **bordo del canvas**
- Al bordo, un **badge/etichetta** mostra: nome del collaboratore, sede/piano, percentuale
- Colore della freccia basato sull'affinita (come i flussi interni)
- Le frecce esterne sono raggruppate per direzione (sinistra/destra) per evitare sovrapposizioni

### 3. Dati cross-location: caricare la mappa globale dei desk

Per sapere dove si trova ogni collaboratore, serve una **mappa globale** `memberId -> locationInfo` che carichi i desk di TUTTE le sedi dell'azienda (non solo quella selezionata).

### 4. Report Flussi: sezione "Collaborazioni Esterne"

Nel report laterale dei flussi, aggiungere una sezione dedicata:

```text
COLLABORAZIONI ESTERNE
  Stesso edificio, piano diverso (3)
    Claudio V. ↔ Paolo R. — 20% — Piano 1
    ...
  Sede diversa (2)  
    Michele C. ↔ Barbara P. — 25% — DUOMO
    ...
```

## Dettagli tecnici

### File da modificare

| File | Modifiche |
|---|---|
| `src/components/spacesync/LocationSelector.tsx` | Ristrutturare UI con gerarchia Sede > Piano, aggiungere "Aggiungi Piano" |
| `src/hooks/useOfficeDesks.ts` | Aggiungere `fetchAllDesks(companyId)` che carica desk di tutte le sedi |
| `src/types/spacesync.ts` | Aggiungere `ExternalCollaborator` type per i flussi cross-location |
| `src/components/spacesync/CollaborationFlowOverlay.tsx` | Aggiungere rendering frecce esterne verso il bordo canvas con badge |
| `src/components/spacesync/CollaborationFlowReport.tsx` | Aggiungere sezione "Collaborazioni Esterne" con distinzione stesso-edificio / sede-diversa |
| `views/admin/SpaceSyncView.tsx` | Passare `allDesks`, `locations` al flow overlay; caricare dati globali |

### Nessuna migrazione DB necessaria

Il modello dati attuale (`address` + `floorNumber` in `office_locations`) e gia sufficiente. Il raggruppamento per sede avviene nel frontend usando il campo `address` come chiave.

### Logica per le frecce esterne

```text
Per ogni desk assegnato nel piano corrente:
  Per ogni link di collaborazione:
    Se il target member NON ha un desk nel piano corrente:
      Cerca il target in allDesks (tutte le sedi)
      Se trovato:
        locationTarget = locations.find(l => l.id === targetDesk.locationId)
        sameBuilding = locationTarget.address === currentLocation.address
        label = sameBuilding 
          ? "Piano " + locationTarget.floorNumber
          : locationTarget.name
        Disegna freccia tratteggiata dal desk al bordo canvas
        Mostra badge con: nomeTarget, label, percentuale
      Se NON trovato (non ha scrivania):
        Mostra nel report come "non posizionato"
```

### Posizionamento badge sul bordo

I badge esterni vengono distribuiti lungo il bordo destro (o sinistro) del canvas, distanziati verticalmente di 40px l'uno dall'altro per evitare sovrapposizioni. Badge per "stesso edificio" hanno bordo blu, badge per "sede diversa" hanno bordo arancione.
