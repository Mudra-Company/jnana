

# Piano: Organigramma Unificato Ruolo-Persona

## Problema Attuale

L'implementazione corrente separa le informazioni in due viste distinte ("Vista Persone" vs "Vista Ruoli"), rendendo difficile avere una visione d'insieme. Inoltre, il popover attuale mostra solo informazioni limitate sulla persona, senza contesto sul ruolo.

## Obiettivo

Creare un **unico organigramma** dove:
1. Ogni card mostra chiaramente il **RUOLO** (entità primaria) con la **PERSONA** assegnata
2. Al click, si apre una **modale completa** con tutte le informazioni organizzate in modo logico

---

## Design della Soluzione

### 1. Card Unificata nell'Organigramma

Nuova struttura visiva per ogni posizione:

```text
┌──────────────────────────────────────────┐
│  📋 TITOLO RUOLO          [HIRING/BADGE] │
│  Codice: DEV-SR-001                      │
├──────────────────────────────────────────┤
│  👤 Marco Rossi           I-A-R          │
│     CEO                                  │
│  📊 Fit 85%   👥 Mgr 75%   🏢 Cultura 0% │
│                              ★ LEADER    │
└──────────────────────────────────────────┘
```

**Elementi visibili nella card:**
- **RUOLO**: Titolo (primario), codice, stato (hiring/vacant)
- **PERSONA**: Nome, avatar, codice RIASEC
- **Metriche rapide**: Fit ruolo %, Fit manager %, Fit culturale %, Badge Leader

### 2. Modale Dettagliata Unificata

Quando l'utente clicca sulla card, si apre una modale completa con **due macro-sezioni**:

```text
┌─────────────────────────────────────────────────────┐
│  🎯 Senior Frontend Developer                   ✕   │
│  Marco Rossi • I-A-R • LEADER                       │
├─────────────────────────────────────────────────────┤
│  [Persona] [Ruolo] [Requisiti] [Contratto] [Storia] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  TAB PERSONA:                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │ FIT CON IL RUOLO                            │   │
│  │ Aderenza: ████████████░░░░ 85%              │   │
│  │ Soft Skills: ✓Leadership ✓Problem Solving   │   │
│  │              ✗Negoziazione                  │   │
│  │ Seniority: Senior → Senior (Match)         │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │ COMPATIBILITÀ RESPONSABILI                  │   │
│  │ Media: ████████████████░░ 75%               │   │
│  │ • Carlotta S. (CEO): 75%                   │   │
│  │ • Diego B.: N/A (profilo incompleto)       │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │ FIT CULTURALE                               │   │
│  │ Allineamento: ░░░░░░░░░░░░░░░░░░ 0%        │   │
│  │ Valori: Innovazione, Eccellenza, Teamwork  │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │ HARD SKILLS                                 │   │
│  │ React ★★★★★ Esperto                         │   │
│  │ TypeScript ★★★★☆ Avanzato                   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  TAB RUOLO (Mansionario):                           │
│  • Responsabilità del ruolo                         │
│  • Attività quotidiane                              │
│  • KPI e obiettivi                                  │
│                                                     │
│  TAB REQUISITI:                                     │
│  • Hard Skills richieste                            │
│  • Soft Skills richieste                            │
│  • Seniority, esperienza, formazione                │
│                                                     │
│  TAB CONTRATTO:                                     │
│  • Tipo contratto, orario, CCNL                     │
│  • Range RAL, modalità lavoro                       │
│                                                     │
│  TAB STORIA:                                        │
│  • Chi ha ricoperto questo ruolo nel tempo          │
│                                                     │
├─────────────────────────────────────────────────────┤
│  [Modifica Ruolo] [Visualizza Profilo] [Rotazione] │
└─────────────────────────────────────────────────────┘
```

---

## Architettura Informativa

### Informazioni RUOLO (dalla tabella `company_roles`)
| Sezione | Dati |
|---------|------|
| **Base** | Titolo, Codice, Descrizione, Stato |
| **Mansionario** | Responsabilità, Tasks quotidiani, KPI |
| **Requisiti** | Hard/Soft skills, Seniority, Formazione, Certificazioni |
| **Contratto** | CCNL, RAL, Tipo contratto, Orario, Remote policy |
| **Gerarchia** | Reports to, Headcount |

### Informazioni PERSONA (calcolate live da `profiles` + `karma_sessions`)
| Sezione | Dati |
|---------|------|
| **Anagrafica** | Nome, Avatar, Codice RIASEC, Generazione |
| **Fit Ruolo** | Match score, Skills matched/gaps, Seniority comparison |
| **Fit Manager** | Compatibilità con ciascun responsabile (breakdown) |
| **Fit Culturale** | Allineamento valori aziendali |
| **Competenze** | Hard skills con livello, Soft skills |

---

## Implementazione Tecnica

### File da Modificare/Creare

1. **`src/components/roles/UnifiedRolePersonCard.tsx`** (NUOVO)
   - Card che mostra Ruolo + Persona + Metriche rapide
   - Sostituisce sia le card utente attuali che le RoleCard

2. **`src/components/roles/UnifiedDetailModal.tsx`** (NUOVO)
   - Modale con 5 tabs: Persona, Ruolo, Requisiti, Contratto, Storia
   - Integra logica di EmployeeProfilePopover + RoleDetailModal

3. **`views/admin/OrgNodeCard.tsx`** (MODIFICA)
   - Rimuovere logica `useRoleCentric` (toggle)
   - Usare sempre `UnifiedRolePersonCard`
   - Passare sia dati ruolo che dati persona

4. **`views/admin/CompanyOrgView.tsx`** (MODIFICA)
   - Rimuovere toggle "Vista Persone"/"Vista Ruoli"
   - Usare `UnifiedDetailModal` invece di popover separati
   - Unificare la gestione click

5. **`src/hooks/useUnifiedOrgData.ts`** (NUOVO)
   - Hook che combina ruoli + assegnazioni + calcoli metriche
   - Prepara i dati per la vista unificata

### Logica di Binding Dati

Per ogni nodo dell'organigramma:

```typescript
interface UnifiedPosition {
  // RUOLO
  role: CompanyRole;
  
  // PERSONA (opzionale - può essere vacante)
  assignee?: User;
  assignment?: RoleAssignment;
  
  // METRICHE CALCOLATE (per card preview)
  metrics: {
    roleFitScore: number;
    managerFitScore: number | null;
    cultureFitScore: number;
    isLeader: boolean;
  };
}
```

### Flusso Dati

```text
company_roles (DB)
      │
      ├──► useCompanyRoles() ──► Ruoli per company
      │
company_role_assignments (DB)
      │
      ├──► useRoleAssignments() ──► Assegnazioni attive
      │
profiles + karma_sessions (DB)
      │
      ├──► useProfiles() ──► Dati persona + Karma
      │
      ▼
useUnifiedOrgData() ──► UnifiedPosition[] per ogni nodo
      │
      ▼
OrgNodeCard ──► [UnifiedRolePersonCard, ...]
      │
      (click)
      ▼
UnifiedDetailModal ──► Tabs con tutte le info
```

---

## Migrazione Graduale

### Fase 1: Componenti Base
- Creare `UnifiedRolePersonCard` (card unificata)
- Creare `UnifiedDetailModal` (modale completa)

### Fase 2: Integrazione
- Modificare `OrgNodeCard` per usare i nuovi componenti
- Rimuovere toggle da `CompanyOrgView`
- Creare `useUnifiedOrgData` per preparare i dati

### Fase 3: Pulizia
- Rimuovere codice legacy (popover separati, RoleCard isolata)
- Aggiornare i tipi TypeScript

---

## Vantaggi della Nuova Architettura

| Aspetto | Prima | Dopo |
|---------|-------|------|
| Viste | 2 separate (toggle) | 1 unificata |
| Info visibili | Solo persona O solo ruolo | Entrambi sempre |
| Click → Info | Popover piccolo | Modale completa |
| Contesto lavoro | Assente | Mansionario, CCNL, RAL |
| Contesto persona | Limitato | Fit, compatibilità, skills |
| Navigazione | Confusa | Lineare e intuitiva |

---

## Struttura Tabs della Modale

### Tab "Persona" (Default per ruoli assegnati)
- Fit con il ruolo (score + breakdown skills)
- Compatibilità responsabili (media + breakdown per manager)
- Fit culturale (allineamento valori)
- Hard Skills del dipendente

### Tab "Ruolo" (Mansionario)
- Descrizione del ruolo
- Responsabilità
- Attività quotidiane
- KPI e obiettivi

### Tab "Requisiti"
- Hard Skills richieste (con livello e mandatory)
- Soft Skills richieste
- Seniority ed esperienza
- Formazione e certificazioni
- Lingue

### Tab "Contratto" (Inquadramento)
- Tipo contratto
- Orario (full/part-time)
- Livello CCNL
- Range RAL
- Modalità lavoro (on-site/hybrid/remote)

### Tab "Storia"
- Timeline delle assegnazioni
- Chi ha ricoperto il ruolo
- Date di inizio/fine

