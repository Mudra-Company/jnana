
# Piano: Trasformazione AdminDashboard in Dashboard Completa

## Problema Identificato

L'attuale `AdminDashboard` è estremamente limitato:
- Mostra solo 5 KPI di base (Dipendenti, Test Completati, Admin, Posizioni Aperte, Culture Match)
- Ha solo una tabella dipendenti con funzionalità minime
- Non mostra i **Ruoli** (entità primaria nel modello ruolo-centrico)
- Non mostra la **struttura organizzativa** per dipartimento
- Non fornisce accesso rapido alle altre sezioni (Compliance, Organigramma, etc.)
- Non offre una panoramica delle attività recenti o delle urgenze

## Soluzione: Dashboard Completa Multi-Sezione

Trasformeremo la dashboard in un hub operativo completo con:

1. **KPI Cards Espanse** - Più metriche con trend e navigazione
2. **Sezione Ruoli per Dipartimento** - Accordion con ruoli raggruppati per nodo organizzativo
3. **Quick Actions Panel** - Accesso rapido alle funzionalità principali
4. **Activity Feed / Urgenze** - Posizioni vacanti, compliance in scadenza, etc.
5. **Tabella Dipendenti Migliorata** - Con più filtri e informazioni sul ruolo assegnato

---

## Architettura della Nuova Dashboard

```text
┌────────────────────────────────────────────────────────────────────────────┐
│  Dashboard [Company Name]                          [+ Invita] [+ Nuova Pos]│
│  Panoramica del capitale umano                                             │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐  │
│  │DIPEND.  │TEST OK  │POSIZ.   │VACANTI  │HIRING   │COMPLIANCE│CULTURE │  │
│  │   12    │   8     │  15     │   3     │   2     │  85%    │  78%   │  │
│  │ ▲2      │ 67%     │ Tot.    │ Urgenti │ Attive  │  Score  │ Match  │  │
│  └─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘  │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────┐  ┌─────────────────────────────────┐ │
│  │ 🚨 ATTENZIONE RICHIESTA          │  │ ⚡ AZIONI RAPIDE               │ │
│  │ ─────────────────────────────    │  │ ─────────────────────────────  │ │
│  │ • 3 posizioni vacanti da >30gg   │  │ [📊 Organigramma]              │ │
│  │ • 2 documenti compliance scaduti │  │ [🎯 Identity Hub]              │ │
│  │ • 1 test RIASEC in attesa        │  │ [📋 Compliance]                │ │
│  └──────────────────────────────────┘  │ [🔍 Talent Search]             │ │
│                                        └─────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  📁 RUOLI PER DIPARTIMENTO                                    [Cerca...]  │
│  ─────────────────────────────────────────────────────────────────────────│
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ ▼ Direzione (3 ruoli, 2 assegnati, 1 vacante)                      │  │
│  │   ├─ CEO                    Carlotta Silvestrini   ● Attivo        │  │
│  │   ├─ CFO                    —                       ○ Vacante 🔥    │  │
│  │   └─ COO                    Marco Rossi             ● Attivo        │  │
│  ├─────────────────────────────────────────────────────────────────────┤  │
│  │ ▶ Operations (5 ruoli, 4 assegnati, 1 in hiring)                   │  │
│  ├─────────────────────────────────────────────────────────────────────┤  │
│  │ ▶ Sales & Marketing (4 ruoli, 3 assegnati, 1 vacante)              │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  👥 ELENCO DIPENDENTI                                [Filtri] [Cerca...]  │
│  ─────────────────────────────────────────────────────────────────────────│
│  │ TIPO │ UTENTE           │ RUOLO ASSEGNATO │ DIPARTIMENTO │ STATO │ ••• │
│  ├──────┼──────────────────┼─────────────────┼──────────────┼───────┼─────│
│  │  🛡️  │ Carlotta S.      │ CEO             │ Direzione    │ ✓     │ ··· │
│  │  👤  │ Giuseppe C.      │ Stagista        │ Operations   │ ⏳    │ ··· │
│  │  ...                                                                   │
│  └─────────────────────────────────────────────────────────────────────────┘
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementazione Tecnica

### 1. Nuovi Hook da Utilizzare

La dashboard dovrà integrare dati da molteplici fonti:

| Hook | Dati Forniti |
|------|--------------|
| `useCompanyRoles` | Lista ruoli, status (active/vacant), isHiring |
| `useRoleAssignments` | Mapping ruolo-persona |
| `useOrgNodes` | Struttura dipartimenti/team |
| `useCompliance` | Score compliance, items in scadenza |
| `calculateCultureAnalysis` | Culture match score |

### 2. Nuovi Componenti da Creare

```text
src/components/dashboard/
├── DashboardKPIGrid.tsx        # Griglia espansa delle metriche
├── AlertsPanel.tsx             # Pannello urgenze/attenzione richiesta
├── QuickActionsPanel.tsx       # Azioni rapide con navigazione
├── RolesByDepartment.tsx       # Accordion ruoli per dipartimento
└── EnhancedEmployeeTable.tsx   # Tabella dipendenti migliorata
```

### 3. File da Modificare

| File | Azione |
|------|--------|
| `views/admin/AdminDashboard.tsx` | Refactor completo con nuova struttura |
| `types.ts` | Nessuna modifica necessaria |

---

## Dettaglio Componenti

### 3.1 DashboardKPIGrid

7 KPI cards invece di 5:

```typescript
const kpiData = [
  { label: 'Dipendenti', value: companyUsers.length, trend: '+2 questo mese', icon: Users },
  { label: 'Test Completati', value: completedCount, subValue: `${completionRate}%`, icon: CheckCircle },
  { label: 'Posizioni Totali', value: totalRoles, onClick: () => setView({ type: 'ADMIN_ORG_CHART' }) },
  { label: 'Posizioni Vacanti', value: vacantRoles, variant: vacantRoles > 0 ? 'warning' : 'default' },
  { label: 'In Hiring', value: hiringRoles, variant: 'accent', onClick: () => setView({ type: 'ADMIN_OPEN_POSITIONS' }) },
  { label: 'Compliance Score', value: `${complianceScore}%`, onClick: () => setView({ type: 'ADMIN_COMPLIANCE' }) },
  { label: 'Culture Match', value: `${cultureScore}%`, onClick: () => setView({ type: 'ADMIN_IDENTITY_HUB' }) },
];
```

### 3.2 AlertsPanel

Mostra situazioni che richiedono attenzione:

```typescript
interface Alert {
  type: 'warning' | 'error' | 'info';
  message: string;
  action?: { label: string; onClick: () => void };
}

const alerts: Alert[] = [
  // Posizioni vacanti da più di 30 giorni
  ...vacantRolesOver30Days.map(role => ({
    type: 'warning',
    message: `${role.title} vacante da ${daysSinceCreation} giorni`,
    action: { label: 'Trova candidati', onClick: () => goToMatching(role.id) }
  })),
  // Documenti compliance in scadenza
  ...expiringCompliance.map(item => ({
    type: 'error',
    message: `${item.name} scade tra ${item.daysUntilExpiry} giorni`,
    action: { label: 'Carica documento', onClick: () => goToCompliance() }
  })),
  // Test in attesa
  ...pendingTests.map(user => ({
    type: 'info',
    message: `${user.firstName} non ha completato il test RIASEC`,
    action: { label: 'Invia reminder', onClick: () => sendReminder(user) }
  })),
];
```

### 3.3 QuickActionsPanel

Grid di pulsanti per navigazione rapida:

```typescript
const quickActions = [
  { icon: Briefcase, label: 'Organigramma', view: { type: 'ADMIN_ORG_CHART' } },
  { icon: Fingerprint, label: 'Identity Hub', view: { type: 'ADMIN_IDENTITY_HUB' } },
  { icon: Shield, label: 'Compliance', view: { type: 'ADMIN_COMPLIANCE' } },
  { icon: Building, label: 'Profilo Azienda', view: { type: 'ADMIN_COMPANY_PROFILE' } },
  { icon: Search, label: 'Talent Search', view: { type: 'COMPANY_TALENT_SEARCH' } },
];
```

### 3.4 RolesByDepartment (Componente Principale)

Accordion collassabile con ruoli raggruppati per dipartimento:

```typescript
interface DepartmentRolesSection {
  nodeId: string;
  nodeName: string;
  totalRoles: number;
  assignedCount: number;
  vacantCount: number;
  hiringCount: number;
  roles: {
    role: CompanyRole;
    assignee: User | null;
    status: 'active' | 'vacant' | 'hiring';
  }[];
}

// Raggruppamento ruoli per org_node_id
const departmentSections = useMemo(() => {
  const grouped = new Map<string, DepartmentRolesSection>();
  
  roles.forEach(role => {
    const nodeId = role.orgNodeId || 'unassigned';
    const nodeName = orgNodesMap.get(nodeId)?.name || 'Non assegnato';
    
    if (!grouped.has(nodeId)) {
      grouped.set(nodeId, {
        nodeId,
        nodeName,
        totalRoles: 0,
        assignedCount: 0,
        vacantCount: 0,
        hiringCount: 0,
        roles: []
      });
    }
    
    const section = grouped.get(nodeId)!;
    section.totalRoles++;
    
    const assignment = assignmentsMap.get(role.id);
    const isVacant = role.status === 'vacant' || !assignment;
    
    if (isVacant) section.vacantCount++;
    else section.assignedCount++;
    if (role.isHiring) section.hiringCount++;
    
    section.roles.push({
      role,
      assignee: assignment?.user || null,
      status: role.isHiring ? 'hiring' : (isVacant ? 'vacant' : 'active')
    });
  });
  
  return Array.from(grouped.values());
}, [roles, assignments, orgNodes]);
```

UI dell'accordion:

```typescript
{departmentSections.map(section => (
  <Collapsible key={section.nodeId}>
    <CollapsibleTrigger className="w-full">
      <div className="flex justify-between items-center p-4 hover:bg-gray-50">
        <div className="flex items-center gap-3">
          <ChevronRight className="transition-transform" />
          <Folder className="text-amber-500" />
          <span className="font-bold">{section.nodeName}</span>
        </div>
        <div className="flex gap-4 text-sm">
          <span>{section.totalRoles} ruoli</span>
          <span className="text-green-600">{section.assignedCount} assegnati</span>
          {section.vacantCount > 0 && (
            <span className="text-red-600">{section.vacantCount} vacanti</span>
          )}
          {section.hiringCount > 0 && (
            <span className="text-blue-600">{section.hiringCount} in hiring</span>
          )}
        </div>
      </div>
    </CollapsibleTrigger>
    <CollapsibleContent>
      {section.roles.map(({ role, assignee, status }) => (
        <div 
          key={role.id} 
          className="flex items-center justify-between px-6 py-3 border-t cursor-pointer hover:bg-gray-50"
          onClick={() => openRoleDetail(role.id)}
        >
          <div className="flex items-center gap-3">
            <Briefcase size={16} className="text-gray-400" />
            <span className="font-medium">{role.title}</span>
            {role.code && <span className="text-xs text-gray-400">{role.code}</span>}
          </div>
          <div className="flex items-center gap-4">
            {assignee ? (
              <span className="text-sm">{assignee.firstName} {assignee.lastName}</span>
            ) : (
              <span className="text-sm text-gray-400">—</span>
            )}
            <RoleStatusBadge status={status} isHiring={role.isHiring} />
          </div>
        </div>
      ))}
    </CollapsibleContent>
  </Collapsible>
))}
```

### 3.5 EnhancedEmployeeTable

Tabella migliorata con:
- Colonna "Ruolo Assegnato" (dal sistema ruoli, non da jobTitle legacy)
- Colonna "Dipartimento" (dal nodo organizzativo del ruolo)
- Filtri per dipartimento e stato
- Badge RIASEC profile code

```typescript
<thead>
  <tr>
    <th>Tipo</th>
    <th>Dipendente</th>
    <th>Ruolo Assegnato</th>    {/* NUOVO */}
    <th>Dipartimento</th>       {/* NUOVO */}
    <th>Stato Test</th>
    <th>Profilo RIASEC</th>
    <th>Azioni</th>
  </tr>
</thead>
```

---

## Flusso Dati

```text
AdminDashboard
    │
    ├── useCompanyRoles(companyId) ──► roles[]
    │
    ├── useRoleAssignments() 
    │   └── fetchByRole(roleId) ──► assignments[]
    │
    ├── useOrgNodes()
    │   └── fetchOrgNodes(companyId) ──► orgNodes[]
    │
    ├── useCompliance(companyId) ──► { items, riskScore }
    │
    └── calculateCultureAnalysis(company, users) ──► cultureScore
```

---

## Effetto al Caricamento

1. **Mount**: Fetch parallelo di roles, assignments, orgNodes
2. **Loading State**: Skeleton placeholders per ogni sezione
3. **Data Ready**: Render delle sezioni con dati aggregati
4. **Click su Ruolo**: Apre `UnifiedDetailModal` per dettaglio/modifica

---

## File Risultanti

| File | Linee Stimate | Descrizione |
|------|---------------|-------------|
| `AdminDashboard.tsx` | ~600 | Componente principale refactorato |
| `DashboardKPIGrid.tsx` | ~150 | Griglia KPI riutilizzabile |
| `AlertsPanel.tsx` | ~100 | Pannello urgenze |
| `QuickActionsPanel.tsx` | ~80 | Azioni rapide |
| `RolesByDepartment.tsx` | ~250 | Accordion ruoli per dipartimento |

---

## Benefici

1. **Visione completa**: Tutti i dati HR in un'unica schermata
2. **Navigazione rapida**: Accesso diretto a tutte le funzionalità
3. **Urgenze evidenti**: Pannello alert per azioni immediate
4. **Ruoli centrali**: I ruoli sono ora protagonisti (modello ruolo-centrico)
5. **Mansionari accessibili**: Click su qualsiasi ruolo apre il dettaglio completo
