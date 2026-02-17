
# Redesign Collegamenti di Collaborazione: Team-First con Breakdown Membri

## Cosa cambia

Attualmente il selettore permette di scegliere "Team" o "Persona" come entita indipendenti. Questo non riflette la realta organizzativa: le persone fanno parte di team.

### Nuovo flusso

1. L'utente clicca "+ Aggiungi Connessione"
2. Appare un dropdown con i **Team** disponibili (org nodes)
3. Selezionato un Team, il sistema carica automaticamente tutti i **membri** di quel team (trovati tramite i ruoli assegnati a quel `org_node_id`)
4. Per ogni membro del team, l'utente puo specificare:
   - **% Collaborazione** individuale (slider)
   - **Affinita Personale** (stelle 1-5)
5. La **% totale del team** e la somma delle % dei singoli membri
6. L'utente puo deselezionare membri con cui non collabora

### Struttura dati (invariata)

Il `CollaborationLink` rimane con `targetType: 'team'`, e il campo `memberBreakdown` gia previsto viene utilizzato pienamente:

```text
{
  targetType: 'team',
  targetId: '<org_node_id>',
  targetLabel: 'Sales Team',
  collaborationPercentage: 45,   // somma automatica dei breakdown
  personalAffinity: 3,           // media dei breakdown (o non usato)
  memberBreakdown: [
    { memberId: 'xxx', memberLabel: 'Mario Rossi', percentage: 30, affinity: 4 },
    { memberId: 'yyy', memberLabel: 'Luigi Bianchi', percentage: 15, affinity: 3 }
  ]
}
```

Piccola estensione: aggiungere `affinity` al tipo `CollaborationMemberBreakdown` per tracciare l'affinita per singolo membro.

## File da modificare

### 1. `src/types/roles.ts`
- Aggiungere `affinity?: number` (1-5) a `CollaborationMemberBreakdown`

### 2. `src/components/roles/UnifiedDetailModal.tsx`

**Edit mode (sezione Collegamenti):**
- Rimuovere il selettore "Persona/Team" -- ora si seleziona solo un Team
- Selezionato un team, fare lookup dei membri: filtrare `companyMembers` i cui ruoli appartengono a quel `org_node_id` (serve passare anche i ruoli, oppure una mappa `orgNodeId -> membri`)
- Mostrare la lista dei membri del team come righe espandibili, ognuna con slider % e stelle affinita
- La `collaborationPercentage` del link viene calcolata automaticamente come somma dei breakdown
- `personalAffinity` del link diventa la media delle affinita dei breakdown

**Nuova prop necessaria:**
- `rolesByOrgNode?: Record<string, string[]>` -- mappa da `org_node_id` a lista di `user_id` o `member_id` dei membri assegnati a ruoli in quel nodo. Oppure piu semplice: passare l'intera lista `roles` con le assignments per fare il lookup nel componente.

Alternativa piu pragmatica: passare una prop `membersByOrgNode?: Record<string, {id: string, label: string}[]>` gia calcolata dal parent.

**View mode:**
- Mostrare ogni connessione come card Team con i membri espansi sotto, ognuno con la sua % e stelle

### 3. `views/admin/CompanyOrgView.tsx`
- Calcolare `membersByOrgNode` dalla lista dei ruoli e assignments (o dalla `company_members` con i loro `org_node_id` se disponibile) e passarla alla modale
- Se i dati non sono facilmente derivabili lato client, fare una query ai ruoli per `org_node_id` con join sulle assignments

## Dettagli Tecnici

### Lookup membri per team
Per sapere chi appartiene a un team, il sistema:
1. Prende tutti i `company_roles` con `org_node_id = X`
2. Per ogni ruolo, prende le `company_role_assignments` attive
3. Mappa gli `user_id` delle assignments ai `companyMembers` per ottenere nome/cognome

Questo viene pre-calcolato nel parent (`CompanyOrgView`) e passato come prop `membersByOrgNode`.

### UI del singolo collegamento (edit mode)

```text
+----------------------------------------------+
| Team: [Dropdown Team]                    [X]  |
| Collab totale: 45%                            |
+----------------------------------------------+
|  Mario Rossi                                  |
|  Collab: [===|=========] 30%  Affinita: ***   |
|  Luigi Bianchi                                |
|  Collab: [==|==========] 15%  Affinita: **    |
|  Anna Verdi (deselezionato/0%)                |
|  Collab: [|============]  0%  Affinita: -     |
+----------------------------------------------+
```

### UI del singolo collegamento (view mode)

```text
+----------------------------------------------+
| [TEAM] Sales Team                  45%  ***   |
|   Mario Rossi            30%      ****        |
|   Luigi Bianchi          15%      ***         |
+----------------------------------------------+
```

Nessuna migrazione DB necessaria (il campo `memberBreakdown` esiste gia). 3 file da modificare, di cui 1 minimo (`types`).
