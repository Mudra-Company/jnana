

# Piano: Evoluzione Architetturale - Da Persone a Ruoli

## Analisi della Situazione Attuale

Dopo un'esplorazione approfondita del codebase, ecco come funziona oggi:

### Struttura Dati Attuale

```
company_members (tabella ibrida persona-ruolo)
├── user_id (persona assegnata - nullable)
├── job_title (titolo del ruolo)
├── required_profile (competenze richieste: JSONB)
│   ├── hardSkills
│   ├── softSkills
│   └── seniority
├── is_hiring (segnaposto per posizioni aperte)
├── department_id (nodo organigramma)
└── placeholder_* (dati temporanei pre-assegnazione)
```

### Problema Concettuale

Oggi `company_members` mescola due concetti distinti:
- **La posizione/ruolo** (cosa l'azienda ha bisogno)
- **La persona** (chi la occupa)

Questo crea confusione quando:
- Si vuole definire l'organigramma PRIMA di avere le persone
- Si vogliono gestire mansionari, inquadramenti, sostituzioni
- Una stessa persona può coprire più ruoli (ad interim)
- Un ruolo può essere coperto a rotazione

---

## Nuova Architettura Proposta

### Cambio di Paradigma

**Prima (attuale)**: Persona → ha un Ruolo
**Dopo (proposta)**: Ruolo → può avere una Persona assegnata

### Nuove Entità

```
company_roles (NUOVA - entità primaria)
├── id
├── company_id
├── org_node_id (dipartimento/team)
├── title (nome del ruolo, es. "Senior Developer")
├── code (codice interno, es. "DEV-SR-001")
├── description (descrizione estesa del ruolo)
│
├── -- MANSIONARIO --
├── responsibilities (JSONB: lista di responsabilità)
├── daily_tasks (JSONB: attività quotidiane tipiche)
├── kpis (JSONB: indicatori di performance)
│
├── -- REQUISITI COMPETENZE --
├── required_hard_skills (JSONB: [{skill, level, mandatory}])
├── required_soft_skills (JSONB: [{skill, importance}])
├── required_seniority
├── required_education (JSONB: [{degree, field, mandatory}])
├── required_certifications (JSONB: array)
├── required_languages (JSONB: [{lang, level}])
├── years_experience_min
├── years_experience_max
│
├── -- INQUADRAMENTO CONTRATTUALE --
├── ccnl_level (livello CCNL, es. "Quadro", "Impiegato 3°")
├── ral_range_min (RAL minima)
├── ral_range_max (RAL massima)
├── contract_type (Indeterminato, Determinato, etc.)
├── work_hours_type (Full-time, Part-time, Flexible)
├── remote_policy (On-site, Hybrid, Remote)
│
├── -- RELAZIONI GERARCHICHE --
├── reports_to_role_id (ruolo superiore diretto)
├── manages_roles (array di ruoli subordinati)
│
├── -- STATO --
├── status (active, vacant, frozen, planned)
├── headcount (numero di persone per questo ruolo, default 1)
├── is_hiring (sta cercando attivamente)
│
├── created_at
└── updated_at

company_role_assignments (NUOVA - associazione persona-ruolo)
├── id
├── role_id (FK → company_roles)
├── user_id (FK → profiles) - nullable per slot vuoti
├── company_member_id (FK → company_members per retrocompatibilità)
├── assignment_type (primary, interim, backup, training)
├── start_date
├── end_date (null = corrente)
├── fte_percentage (100% default, può essere 50% etc.)
├── notes
├── created_at
└── updated_at
```

### Migrazione di company_members

La tabella `company_members` rimane ma cambia significato:
- Diventa il "contratto" della persona con l'azienda
- Mantiene: user_id, company_id, role (admin/user/hr), status, invited_at, joined_at
- Rimuove (migra a company_roles): job_title, required_profile, department_id, is_hiring

---

## Impatto sulla UI

### Organigramma - Nuovo Flusso

1. **Creazione Ruolo** (non più "Aggiungi Persona")
   - Apro modale "Nuovo Ruolo"
   - Definisco: Titolo, Descrizione, Mansionario
   - Definisco: Requisiti (skills, seniority, education)
   - Definisco: Inquadramento (CCNL, RAL, contratto)
   - Il ruolo appare nell'organigramma come "Da assegnare"

2. **Assegnazione Persona al Ruolo**
   - Clicco sul ruolo → Modale dettaglio ruolo
   - Sezione "Assegna Persona":
     - Cerca tra dipendenti esistenti
     - Invita nuova persona
     - Cerca tra candidati Karma

3. **Vista Ruolo nell'Organigramma**
   - Card mostra RUOLO come entità primaria
   - Persona assegnata (se presente) come attributo secondario
   - Badge: HIRING, VACANT, INTERIM, etc.

### Nuovo Componente: RoleDetailModal

```
┌─────────────────────────────────────────────┐
│  🎯 Senior Frontend Developer               │
│  Codice: DEV-SR-001 | Team: Engineering     │
├─────────────────────────────────────────────┤
│                                              │
│  👤 PERSONA ASSEGNATA                        │
│  ┌─────────────────────────────────────┐    │
│  │ 👤 Marco Rossi                      │    │
│  │ Assegnato dal: 01/03/2024           │    │
│  │ Tipo: Primary (100% FTE)            │    │
│  │ Fit con ruolo: 85%                  │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  📋 MANSIONARIO                              │
│  • Sviluppo frontend React/TypeScript        │
│  • Code review e mentoring junior            │
│  • Architettura componenti UI                │
│  • Collaborazione con UX team                │
│                                              │
│  🎓 REQUISITI                                │
│  Hard Skills: React, TypeScript, Testing     │
│  Soft Skills: Leadership, Problem Solving    │
│  Seniority: Senior (3-5 anni)                │
│  Certificazioni: AWS preferibile             │
│                                              │
│  💼 INQUADRAMENTO                            │
│  CCNL: Metalmeccanico - Livello 6°           │
│  RAL: €45.000 - €55.000                      │
│  Contratto: Indeterminato                    │
│  Modalità: Hybrid (3gg ufficio)              │
│                                              │
│  📊 STORICO ASSEGNAZIONI                     │
│  • Luca Bianchi (2022-2024) - Promosso       │
│  • [Vacant] (2024) - 3 mesi                  │
│  • Marco Rossi (2024-oggi) - Current         │
│                                              │
├─────────────────────────────────────────────┤
│ [Modifica Ruolo] [Gestisci Assegnazione]    │
└─────────────────────────────────────────────┘
```

---

## Piano di Implementazione (Fasi)

### Fase 1: Schema Database (Migrazione)

1. **Creare nuove tabelle**
   - `company_roles` con tutti i campi del mansionario
   - `company_role_assignments` per le associazioni
   - Enum per stati, tipi contratto, policy remote

2. **Migrare dati esistenti**
   - Ogni `company_members` con `job_title` diventa un `company_roles`
   - Creare `company_role_assignments` per persone assegnate
   - Mantenere riferimenti per retrocompatibilità

3. **RLS Policies**
   - Stesse regole di company_members
   - Admins/HR possono gestire ruoli
   - Users possono vedere ruoli del proprio team

### Fase 2: TypeScript Types

```typescript
interface CompanyRole {
  id: string;
  companyId: string;
  orgNodeId: string;
  title: string;
  code?: string;
  description?: string;
  
  // Mansionario
  responsibilities?: string[];
  dailyTasks?: string[];
  kpis?: string[];
  
  // Requisiti
  requiredHardSkills?: RequiredSkill[];
  requiredSoftSkills?: RequiredSkill[];
  requiredSeniority?: SeniorityLevel;
  requiredEducation?: EducationRequirement[];
  requiredCertifications?: string[];
  requiredLanguages?: LanguageRequirement[];
  yearsExperienceMin?: number;
  yearsExperienceMax?: number;
  
  // Inquadramento
  ccnlLevel?: string;
  ralRangeMin?: number;
  ralRangeMax?: number;
  contractType?: ContractType;
  workHoursType?: WorkHoursType;
  remotePolicy?: RemotePolicy;
  
  // Gerarchie
  reportsToRoleId?: string;
  
  // Stato
  status: 'active' | 'vacant' | 'frozen' | 'planned';
  headcount: number;
  isHiring: boolean;
  
  // Meta
  createdAt: string;
  updatedAt: string;
  
  // Relazioni (populated)
  assignments?: RoleAssignment[];
  currentAssignee?: User;
}

interface RoleAssignment {
  id: string;
  roleId: string;
  userId?: string;
  assignmentType: 'primary' | 'interim' | 'backup' | 'training';
  startDate: string;
  endDate?: string;
  ftePercentage: number;
  notes?: string;
  
  // Populated
  user?: User;
}
```

### Fase 3: Nuovi Hooks

- `useCompanyRoles(companyId)` - CRUD ruoli
- `useRoleAssignments(roleId)` - Gestione assegnazioni
- `useRoleHistory(roleId)` - Storico assegnazioni
- Refactoring di `useCompanyMembers` per nuova struttura

### Fase 4: Componenti UI

1. **RoleCreationModal** - Wizard creazione ruolo con sezioni:
   - Info base (titolo, codice, descrizione)
   - Mansionario (responsabilità, tasks, KPI)
   - Requisiti (skills, seniority, education)
   - Inquadramento (CCNL, RAL, contratto)

2. **RoleDetailModal** - Vista completa ruolo con:
   - Header con persona assegnata (se presente)
   - Tabs: Mansionario | Requisiti | Inquadramento | Storico

3. **RoleAssignmentModal** - Assegnazione persona:
   - Ricerca dipendenti interni
   - Match score con requisiti
   - Tipo assegnazione (primary/interim/backup)
   - Percentuale FTE

4. **OrgNodeCard** - Aggiornato per mostrare ruoli:
   - Lista ruoli invece che lista persone
   - Ogni ruolo mostra la persona assegnata (se presente)
   - Badge stato: ACTIVE, VACANT, HIRING, INTERIM

### Fase 5: Integrazione CCNL

- Collegare `ccnlLevel` ai CCNL già configurati in `company_ccnl_selections`
- Auto-suggest livelli in base al CCNL selezionato
- Validazione RAL rispetto ai minimi contrattuali

---

## Vantaggi di questa Architettura

| Aspetto | Prima | Dopo |
|---------|-------|------|
| Modellazione | Persona-centrica | Ruolo-centrica |
| Organigramma vuoto | Impossibile | Definibile prima di assumere |
| Mansionario | Non esistente | Strutturato e ricercabile |
| Inquadramento | Non tracciato | CCNL, RAL, contratto |
| Storico | Nessuno | Chi ha ricoperto il ruolo |
| Copertura multipla | Workaround | Interim, backup nativi |
| FTE parziale | Non supportato | % configurabile |
| Compliance | Manuale | Automatica con CCNL |

---

## File da Creare/Modificare

### Nuovi File
- `src/types/roles.ts` - Tipi per ruoli e assegnazioni
- `src/hooks/useCompanyRoles.ts` - CRUD ruoli
- `src/hooks/useRoleAssignments.ts` - Gestione assegnazioni
- `src/components/roles/RoleCreationModal.tsx` - Wizard creazione
- `src/components/roles/RoleDetailModal.tsx` - Vista dettaglio
- `src/components/roles/RoleAssignmentModal.tsx` - Assegnazione
- `src/components/roles/RoleCard.tsx` - Card per organigramma

### File da Modificare
- `views/admin/CompanyOrgView.tsx` - Integrare nuova logica ruoli
- `views/admin/OrgNodeCard.tsx` - Mostrare ruoli invece che persone
- `types.ts` - Aggiungere tipi ruoli
- `App.tsx` - Nuovi view states per gestione ruoli

### Migrazioni Database
- Creazione tabelle `company_roles` e `company_role_assignments`
- Migrazione dati da `company_members`
- Nuove RLS policies

---

## Retrocompatibilità

Per non rompere il sistema esistente:

1. **Fase transitoria**: `company_members` continua a funzionare
2. **Sincronizzazione**: I nuovi ruoli sincronizzano con company_members
3. **Feature flag**: Nuova UI attivabile gradualmente
4. **Migrazione dati**: Script per convertire dati esistenti

---

## Domanda per te

Prima di procedere con l'implementazione, vorrei confermare:

1. **Priorità**: Vuoi iniziare dalla struttura database o dalla UI?
2. **Gradualità**: Preferisci un rilascio incrementale o un big-bang?
3. **CCNL Integration**: Quanto profonda deve essere l'integrazione con i livelli contrattuali?

