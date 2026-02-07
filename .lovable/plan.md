
# Piano: Unificazione Flusso Creazione Ruoli/Persone

## Analisi del Problema

Attualmente esistono **due percorsi separati** per aggiungere posizioni all'organigramma:

| Modal 1: "Aggiungi Ruolo/Persona" | Modal 2: "Nuovo Ruolo" (Wizard) |
|-----------------------------------|----------------------------------|
| Form singolo che mescola ruolo + persona | Wizard 4 step solo per ruolo |
| Crea un `company_member` con job_title | Crea un `company_role` strutturato |
| Profilo richiesto base | Mansionario completo, CCNL, KPI |
| Può avere persona assegnata subito | Solo ruolo, persona da assegnare dopo |

Questa duplicazione:
- Confonde l'utente ("quale uso?")
- Crea dati incoerenti (alcuni utenti hanno ruoli formali, altri no)
- Viola la filosofia ruolo-centrica (la persona NON dovrebbe esistere senza ruolo)

---

## Soluzione: Flusso Unico "Prima il Ruolo, poi la Persona"

### Principio Cardine
**Ogni posizione nell'organigramma DEVE essere un Ruolo formale.**  
La persona è sempre assegnata a un ruolo, mai l'inverso.

### Nuovo Flusso Utente

```text
[Clicco +]
    │
    ▼
┌─────────────────────────────────────┐
│  STEP 1: Definisci il Ruolo         │
│  ─────────────────────────────────  │
│  Titolo Ruolo*: [____________]      │
│  Codice: [____]                     │
│  Stato: [Attivo ▼] Headcount: [1]   │
│  ☐ Posizione in Hiring              │
│                                     │
│  [Configurazione Avanzata ▼]        │
│  (espande: mansionario, CCNL, etc.) │
│                                     │
│         [Avanti >]                  │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  STEP 2: Assegna Persona (opz.)     │
│  ─────────────────────────────────  │
│  ○ Nessuno (posizione vacante)      │
│  ○ Seleziona dipendente esistente   │
│  ○ Invita nuova persona             │
│                                     │
│  [Se "Invita nuova persona":]       │
│  Nome: [______] Cognome: [______]   │
│  Email: [____________]              │
│                                     │
│  [< Indietro]     [Conferma]        │
└─────────────────────────────────────┘
```

---

## Implementazione Tecnica

### File da Modificare

| File | Azione |
|------|--------|
| `views/admin/OrgNodeCard.tsx` | Rimuovere il pulsante "UserPlus" separato |
| `views/admin/CompanyOrgView.tsx` | Rimuovere tutto il modal "Aggiungi Ruolo/Persona al Nodo" |
| `src/components/roles/RoleCreationModal.tsx` | Trasformare in "Aggiungi Posizione" con Step 2 per assegnazione persona |

### Modifiche Dettagliate

#### 1. OrgNodeCard.tsx
**Rimuovere** il pulsante "Aggiungi/Invita Persona" (UserPlus).  
Mantenere solo il pulsante "Aggiungi Ruolo" (Briefcase), rinominandolo in **"Aggiungi Posizione"**.

```text
PRIMA:
[📋 Aggiungi Ruolo] [👤 Aggiungi Persona] [✏️ Modifica] [+ Aggiungi Team]

DOPO:
[📋 Aggiungi Posizione] [✏️ Modifica] [+ Aggiungi Team]
```

#### 2. CompanyOrgView.tsx
**Rimuovere** completamente:
- Lo stato `inviteNodeId`
- Il modal "Aggiungi Ruolo/Persona al Nodo" (linee 1865-2006)
- Tutti gli stati correlati (`inviteRole`, `inviteName`, `inviteEmail`, `isHiring`, etc.)

#### 3. RoleCreationModal.tsx → Trasformare in "PositionWizard"
Rinominare e ristrutturare in **5 step**:

| Step | Contenuto | Obbligatorio |
|------|-----------|--------------|
| 1 | **Base**: Titolo, Codice, Stato, Hiring | Solo Titolo |
| 2 | **Requisiti**: Skills, Seniority | No |
| 3 | **Mansionario**: Responsabilità, KPI | No |
| 4 | **Contratto**: CCNL, RAL, Remote | No |
| 5 | **Persona**: Assegna/Invita (NEW!) | No |

Il wizard mostrerà:
- Step 1 e 5 sempre visibili nella progress bar
- Step 2-4 collassabili sotto "Configurazione Avanzata" per uso rapido

**Modalità Rapida vs Completa:**

```text
Modalità Rapida (default):
Step 1 (Base) → Step 5 (Persona) → Fine

Modalità Completa (click su "Configurazione Avanzata"):
Step 1 → Step 2 → Step 3 → Step 4 → Step 5 → Fine
```

### Nuovo Step 5: Assegnazione Persona

```typescript
// Nuova sezione nel RoleCreationModal

// Step 5: Assign Person
const [assignmentMode, setAssignmentMode] = useState<'none' | 'existing' | 'invite'>('none');
const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
const [inviteData, setInviteData] = useState({ name: '', email: '' });

// Render Step 5
const renderAssignmentStep = () => (
  <div className="space-y-4">
    <div className="text-center py-4">
      <h4 className="font-bold text-gray-700 mb-2">Chi occuperà questo ruolo?</h4>
      <p className="text-sm text-gray-500">Puoi assegnare subito o lasciare vacante</p>
    </div>
    
    <div className="space-y-3">
      <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50">
        <input type="radio" checked={assignmentMode === 'none'} onChange={() => setAssignmentMode('none')} />
        <div>
          <div className="font-bold">Posizione Vacante</div>
          <div className="text-xs text-gray-500">Assegna qualcuno in un secondo momento</div>
        </div>
      </label>
      
      <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50">
        <input type="radio" checked={assignmentMode === 'existing'} onChange={() => setAssignmentMode('existing')} />
        <div>
          <div className="font-bold">Dipendente Esistente</div>
          <div className="text-xs text-gray-500">Seleziona da lista dipendenti azienda</div>
        </div>
      </label>
      
      <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50">
        <input type="radio" checked={assignmentMode === 'invite'} onChange={() => setAssignmentMode('invite')} />
        <div>
          <div className="font-bold">Invita Nuova Persona</div>
          <div className="text-xs text-gray-500">Inserisci nome e email per invito</div>
        </div>
      </label>
    </div>
    
    {assignmentMode === 'existing' && (
      <EmployeeSelector 
        companyId={companyId} 
        selectedId={selectedUserId}
        onChange={setSelectedUserId}
      />
    )}
    
    {assignmentMode === 'invite' && (
      <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
        <input placeholder="Nome e Cognome" value={inviteData.name} onChange={...} />
        <input placeholder="Email Aziendale" value={inviteData.email} onChange={...} />
      </div>
    )}
  </div>
);
```

### Flusso Dati al Salvataggio

Quando l'utente conferma:

```typescript
const handleSave = async () => {
  // 1. Crea il Ruolo
  const roleResult = await createRole({ ...roleData });
  if (!roleResult.success) return;
  
  const roleId = roleResult.role!.id;
  
  // 2. Se persona assegnata, crea l'assignment
  if (assignmentMode === 'existing' && selectedUserId) {
    await createAssignment({
      roleId,
      userId: selectedUserId,
      assignmentType: 'primary',
      startDate: new Date().toISOString()
    });
  }
  
  // 3. Se invito nuova persona
  if (assignmentMode === 'invite' && inviteData.email) {
    // Crea company_member provvisorio e invia invito
    await inviteNewEmployee({
      companyId,
      email: inviteData.email,
      name: inviteData.name,
      roleId // Collegato al ruolo appena creato
    });
  }
  
  onClose();
};
```

---

## Migrazione Dati Legacy

Per le aziende che hanno già utenti in `company_members` senza ruolo formale:
- Il sistema continuerà a mostrare questi come "ruoli impliciti" (già implementato)
- Nel tempo, gli HR potranno convertirli in ruoli formali tramite la modale di dettaglio

---

## Benefici della Nuova Architettura

| Aspetto | Prima | Dopo |
|---------|-------|------|
| Entry Point | 2 pulsanti, 2 modali | 1 pulsante, 1 wizard |
| Coerenza Dati | Mix ruoli formali + membri legacy | Sempre ruolo formale |
| UX | Confusa ("quale uso?") | Chiara e lineare |
| Filosofia | Ambigua | Puro ruolo-centrica |
| Configurazione | Separata (base vs avanzata) | Unificata con opzione rapida |

---

## Riepilogo Modifiche

1. **Rimuovere** pulsante "Aggiungi Persona" da OrgNodeCard
2. **Rimuovere** modal legacy "Aggiungi Ruolo/Persona" da CompanyOrgView
3. **Estendere** RoleCreationModal con Step 5 per assegnazione persona
4. **Aggiungere** modalità rapida (skip Step 2-4) per creazione veloce
5. **Rinominare** "Aggiungi Ruolo" → "Aggiungi Posizione" per chiarezza
