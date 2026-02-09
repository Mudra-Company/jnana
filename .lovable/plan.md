

# Piano: Fix KPI Dashboard - Dati Duplicati tra Sorgenti

## Problema Identificato

La dashboard e l'organigramma usano **due sorgenti dati diverse** per le posizioni:

| Componente | Sorgente Dati | Tabella DB | Risultato |
|------------|---------------|------------|-----------|
| Organigramma | `users[]` (prop da App.tsx) | `company_members` | Mostra "Stagista" in HIRING |
| Dashboard KPI | `useCompanyRoles()` | `company_roles` | Mostra 0 (tabella vuota!) |

La tabella `company_roles` e' vuota perche' i ruoli sono stati creati nel vecchio sistema (come record `company_members` con `is_hiring=true` e `user_id=null`), non nella nuova tabella `company_roles`.

## Soluzione

Rendere i KPI della dashboard **consapevoli di entrambe le sorgenti dati**: la nuova tabella `company_roles` E i dati legacy dalla prop `users[]`.

### Logica di Calcolo KPI Corretta

```text
Posizioni Totali = roles.length + hiringUsersLegacy.length
Posizioni Vacanti = roles.filter(vacant).length + hiringUsersLegacy.length
In Hiring = roles.filter(isHiring).length + hiringUsersLegacy.length
```

Dove `hiringUsersLegacy` sono gli utenti con `isHiring === true` dalla prop `users[]` che NON hanno un corrispondente record in `company_roles`.

### Modifiche

**File: `views/admin/AdminDashboard.tsx`**

Aggiungere il calcolo dei dati legacy dalla prop `users`:

```typescript
// Legacy hiring positions from company_members (not yet in company_roles)
const legacyHiringPositions = useMemo(() => 
  users.filter(u => u.companyId === activeCompany.id && u.isHiring === true),
  [users, activeCompany.id]
);

// Combined KPI values (new roles + legacy)
const totalRolesCount = roles.length + legacyHiringPositions.length;
const vacantRolesCount = vacantRoles.length + legacyHiringPositions.length;
const hiringRolesCount = hiringRoles.length + legacyHiringPositions.length;
```

Poi passare questi valori combinati al componente `DashboardKPIGrid`:

```typescript
<DashboardKPIGrid
  totalRoles={totalRolesCount}
  vacantRoles={vacantRolesCount}
  hiringRoles={hiringRolesCount}
  // ... resto invariato
/>
```

Fare lo stesso per `AlertsPanel` e `RolesByDepartment`, includendo le posizioni legacy come ruoli virtuali per una visualizzazione coerente.

**File: `src/components/dashboard/RolesByDepartment.tsx`**

Aggiungere una prop per le posizioni legacy in hiring, e mostrarle come righe aggiuntive nella sezione del dipartimento corretto (o in "Non assegnato" se non hanno `departmentId`).

**File: `src/components/dashboard/AlertsPanel.tsx`**

Includere le posizioni legacy negli alert per le vacancy.

---

## Riepilogo

| File | Modifica |
|------|----------|
| `views/admin/AdminDashboard.tsx` | Calcolare KPI combinati da `company_roles` + `users[]` legacy |
| `src/components/dashboard/RolesByDepartment.tsx` | Mostrare posizioni legacy hiring come righe nell'accordion |
| `src/components/dashboard/AlertsPanel.tsx` | Includere posizioni legacy negli alert vacancy |

Il risultato: i KPI mostreranno i dati corretti indipendentemente dal fatto che le posizioni siano state create nel nuovo sistema (`company_roles`) o nel vecchio (`company_members` con `is_hiring`).

