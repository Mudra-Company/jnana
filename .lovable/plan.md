
# Piano: Rimozione Toggle e Vista Unificata Definitiva

## Problema Identificato

L'organigramma ha attualmente due viste separate con un toggle:
- **Vista Persone** (legacy): mostra solo le persone
- **Vista Ruoli**: mostra solo i ruoli

Questo approccio frammentato obbliga l'utente a cambiare vista per vedere informazioni diverse.

## Soluzione

Rimuovere il toggle ed avere **sempre** una vista unificata dove:
- Ogni card mostra **Ruolo + Persona + Metriche**
- Al click si apre la **UnifiedDetailModal** con tutte le informazioni

## Gestione Retrocompatibilita

Per le aziende che non hanno ancora definito ruoli in `company_roles`:
- Le posizioni esistenti in `company_members` vengono mostrate come "ruoli impliciti"
- Il titolo del job diventa il nome del ruolo
- Le informazioni della persona rimangono visibili

## Modifiche Necessarie

### 1. CompanyOrgView.tsx

**Rimuovere:**
- Lo stato `useRoleCentric` e il toggle button (linee 2017-2028)
- I parametri `useRoleCentric` passati a OrgNodeCard

**Modificare:**
- Passare sempre i ruoli + gli utenti a OrgNodeCard
- Gestire il click per aprire sempre UnifiedDetailModal

### 2. OrgNodeCard.tsx

**Rimuovere:**
- La prop `useRoleCentric` e tutta la logica condizionale
- La vista legacy delle user cards (linee 519-762)

**Modificare:**
- Usare sempre `UnifiedRolePersonCard`
- Per gli utenti senza ruolo esplicito, creare un "ruolo implicito" dal loro job_title

### 3. Logica di Fallback

Quando un nodo non ha ruoli definiti ma ha utenti:

```text
User in company_members {
  job_title: "Senior Developer"
  first_name: "Marco"
  ...
}
          ↓
Converted to UnifiedPosition {
  role: {
    title: "Senior Developer" (from job_title)
    status: 'active'
    isHiring: user.isHiring
    requiredSoftSkills: (from requiredProfile)
  }
  assignee: User (stesso utente)
  metrics: calculated
}
```

## Flusso Dati Unificato

```text
Per ogni org_node:
1. Carica ruoli da company_roles (se esistono)
2. Carica utenti da company_members
3. Per ogni ruolo: trova l'assignee tramite company_role_assignments
4. Per ogni utente SENZA ruolo: crea un ruolo implicito
5. Mostra tutto con UnifiedRolePersonCard
```

## File da Modificare

| File | Azione |
|------|--------|
| `views/admin/CompanyOrgView.tsx` | Rimuovere toggle, usare sempre vista unificata |
| `views/admin/OrgNodeCard.tsx` | Rimuovere biforcazione, usare solo UnifiedRolePersonCard |
| `src/hooks/useUnifiedOrgData.ts` | Aggiungere funzione per convertire utenti legacy in UnifiedPosition |

## Risultato Atteso

Una sola vista dell'organigramma dove ogni card mostra:

```text
┌────────────────────────────────────┐
│  📋 Senior Frontend Developer      │
│  Codice: DEV-001                   │
├────────────────────────────────────┤
│  👤 Marco Rossi         I-A-R     │
│  📊 85%  👥 75%  🏢 60%  ★ LEADER │
└────────────────────────────────────┘
```

E al click si apre la modale completa con le 5 tab.
