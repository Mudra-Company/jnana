
# Fix: Ruolo duplicato nell'organigramma dopo salvataggio collaborazione

## Problema reale

Il bug non e nella promozione del ruolo implicito -- quella parte funziona e crea correttamente il ruolo + assignment nel DB. Il problema e che **dopo il refresh**, l'organigramma non sa che Mauro Dorigo e assegnato al ruolo esplicito "Head of Sales", quindi lo mostra DUE volte:

1. **Ruolo DB "Head of Sales"** (senza persona, perche `currentAssignee` e vuoto)
2. **Ruolo implicito "Head of Sales"** (generato dal job title di Mauro, perche risulta "non assegnato")

**Causa tecnica**: `fetchRoles()` esegue solo `select('*')` sulla tabella `company_roles` senza il join con `company_role_assignments`. Quindi `role.currentAssignee` e sempre `null`. Di conseguenza, in `OrgNodeCard`, il set `assignedUserIds` e sempre vuoto e tutti gli utenti finiscono come "non assegnati a nessun ruolo esplicito", generando ruoli impliciti duplicati.

## Soluzione

Modificare `fetchRoles()` in `useCompanyRoles.ts` per eseguire il join con `company_role_assignments` e `company_members`, cosi da popolare `currentAssignee` per ogni ruolo. Questo e il fix strutturale: una volta che il fetch restituisce chi e assegnato a ogni ruolo, `OrgNodeCard` lo esclude automaticamente dagli "unassigned users" e non genera piu duplicati.

## File da modificare

### 1. `src/hooks/useCompanyRoles.ts`

Modificare il metodo `fetchRoles()` e `fetchRolesByOrgNode()`:

**Prima:**
```
select('*')
```

**Dopo:**
```
select(`
  *,
  company_role_assignments!role_id (
    id, user_id, company_member_id, assignment_type, end_date,
    company_members!company_member_id ( user_id )
  )
`)
```

Dopo il fetch, per ogni ruolo con un assignment attivo (`end_date IS NULL`), estrarre lo `user_id` (direttamente dall'assignment o tramite `company_members`) e impostare `role.currentAssignee = { id: userId }`. Questo basta perche `OrgNodeCard` usa `users.find(u => u.id === role.currentAssignee?.id)` per arricchire i dati.

### 2. Pulizia dati orfani

Verificare e cancellare eventuali ruoli "Head of Sales" duplicati rimasti nel DB da tentativi precedenti (senza assignment valido).

## Dettagli tecnici

La logica post-fetch per popolare currentAssignee:

```text
for each role:
  assignments = role's joined assignment rows where end_date is null
  primaryAssignment = first assignment with type 'primary'
  if primaryAssignment:
    userId = primaryAssignment.user_id 
             || primaryAssignment.company_members?.user_id
    if userId:
      role.currentAssignee = { id: userId }
```

In `OrgNodeCard` (riga 358-361), il codice gia esistente:
```text
const assignedUserIds = new Set(
  nodeRoles.filter(r => r.currentAssignee?.id).map(r => r.currentAssignee!.id)
);
```
...funzionera automaticamente una volta che `currentAssignee` e popolato.

Nessuna migrazione DB. Nessun file nuovo. Fix su 1 file (`useCompanyRoles.ts`).
