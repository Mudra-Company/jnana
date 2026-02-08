

# Piano: Semplificazione Wizard Creazione Posizione

## Analisi del Problema

I campi **Stato** e **Headcount** nel wizard attuale creano confusione per l'utente:

### Problema 1: Campo "Stato" Ambiguo

| Stato | Significato Attuale | Problema |
|-------|---------------------|----------|
| Attivo | Il ruolo ha qualcuno assegnato | Ridondante: se assegno persona diventa "attivo" automaticamente |
| Vacante | Il ruolo non ha nessuno | Ridondante: se non assegno persona è vacante per definizione |
| Congelato | Il ruolo non è attualmente operativo | Caso raro, non necessario in creazione |
| Pianificato | Ruolo previsto ma non ancora attivato | Caso raro, può essere derivato dal fatto che non c'è budget |

**Il "Stato" può essere calcolato automaticamente:**
- Se c'è persona assegnata → **Attivo**
- Se non c'è persona ma isHiring = true → **In Hiring** (che mostriamo già col badge)
- Se non c'è persona e isHiring = false → **Vacante**
- Congelato/Pianificato → Casi rari da gestire solo in modifica, non in creazione

### Problema 2: "Headcount" Incoerente

Nel modello ruolo-centrico attuale:
- **1 Ruolo = 1 Posizione = 1 Casella nell'organigramma**
- Se servono 3 sviluppatori → si creano 3 ruoli separati (es. "Senior Developer #1", "#2", "#3")
- Oppure si crea 1 ruolo "Senior Developer" con 3 assignments diversi

Il campo `headcount > 1` implica che un singolo ruolo possa avere più occupanti, ma:
1. Nella pratica poi chiediamo di assegnare UNA persona
2. L'organigramma mostra UNA card per ruolo
3. Non c'è supporto UI per gestire più persone su stesso ruolo

**Headcount quindi non serve in fase di creazione.**

---

## Soluzione Proposta

### Eliminare dal wizard questi campi:

| Campo | Azione | Motivazione |
|-------|--------|-------------|
| **Stato** | Rimuovere | Calcolato automaticamente in base a presenza assignment |
| **Headcount** | Rimuovere | Sempre 1 (1 ruolo = 1 posizione) |
| **In Hiring** | Mantenere | Indica se stiamo cercando candidati esterni |

### Nuovo Comportamento

Quando si crea un ruolo:

```text
┌────────────────────────────────────────────────────────────┐
│ Step 1: DEFINISCI IL RUOLO                                 │
│ ────────────────────────────────────────────────────────── │
│ Titolo Posizione*: [________________________]              │
│                                                            │
│ ┌──────────────────┐  ┌──────────────────────────────────┐ │
│ │ Codice (opz.)    │  │ Dipartimento/Team               │ │
│ │ [______________] │  │ [Seleziona... ▼]                │ │
│ └──────────────────┘  └──────────────────────────────────┘ │
│                                                            │
│ Descrizione:                                               │
│ [___________________________________________________]     │
│                                                            │
│ ☐ Posizione in Hiring (stiamo cercando candidati)         │
│                                                            │
│ ⚙️ Mostra configurazione avanzata ▼                       │
└────────────────────────────────────────────────────────────┘
```

### Logica di Stato Automatica

Nel salvataggio, il campo `status` viene derivato:

```typescript
const handleSave = async () => {
  const hasAssignment = assignmentMode !== 'none';
  
  const input: CreateRoleInput = {
    ...formData,
    status: hasAssignment ? 'active' : (isHiring ? 'vacant' : 'vacant'),
    headcount: 1, // Sempre 1
    isHiring: assignmentMode === 'none' ? true : isHiring
  };
  
  // Se non assegno persona, automaticamente è in hiring
  // (a meno che l'utente non lo abbia esplicitamente disattivato)
};
```

### Casi d'Uso Residui per Stato

Per i casi rari (Congelato, Pianificato), l'utente può modificare lo stato dalla **modale di dettaglio** dopo la creazione. Non serve in fase di creazione iniziale.

---

## Modifiche Tecniche

### File da Modificare

| File | Azione |
|------|--------|
| `src/components/roles/RoleCreationModal.tsx` | Rimuovere Stato e Headcount dall'UI, impostare valori di default |
| `src/types/roles.ts` | Nessuna modifica (i campi restano nel DB per retrocompatibilità e modifica post-creazione) |

### Modifiche nel RoleCreationModal

**Rimuovere** dai campi form:
- `status` e relativo `<select>`
- `headcount` e relativo `<input type="number">`

**Mantenere**:
- `isHiring` checkbox (posizione per cui cerchiamo candidati)

**Aggiornare** il salvataggio:

```typescript
const handleSave = async () => {
  const input: CreateRoleInput = {
    companyId,
    title,
    code: code || undefined,
    description: description || undefined,
    orgNodeId: orgNodeId || undefined,
    // Status derivato automaticamente
    status: assignmentMode !== 'none' ? 'active' : 'vacant',
    // Headcount sempre 1 per design
    headcount: 1,
    // Se nessuno assegnato e hiring non esplicitamente impostato, default a true
    isHiring: assignmentMode === 'none' ? true : isHiring,
    // ...resto dei campi
  };
  
  await onSave(input, assignment);
};
```

---

## UI Risultante

**Prima (confusa):**
```text
┌─────────────────┬─────────────────┬───────────────────┐
│ Stato           │ Headcount       │                   │
│ [Attivo ▼]      │ [1]             │ ☐ In Hiring       │
└─────────────────┴─────────────────┴───────────────────┘
```

**Dopo (semplificata):**
```text
┌─────────────────────────────────────────────────────────┐
│ ☐ Posizione in Hiring (stiamo cercando candidati)       │
└─────────────────────────────────────────────────────────┘
```

---

## Riepilogo

1. **Rimuovere** il dropdown "Stato" dal wizard (calcolato automaticamente)
2. **Rimuovere** il campo "Headcount" (sempre 1 nel modello ruolo-centrico)
3. **Mantenere** la checkbox "In Hiring" con label più chiara
4. Il sistema **calcola automaticamente** lo stato in base alla presenza di assignment

Questo semplifica drasticamente l'esperienza utente mantenendo la flessibilità (gli stati speciali come "Congelato" restano modificabili dalla modale di dettaglio).

