
# Fix: "Nessun membro trovato in questo team" nei collegamenti di collaborazione

## Problema

Quando si seleziona un Team (es. "General Management") nel tab Collaborazione, il sistema mostra "Nessun membro trovato in questo team" anche se il team ha membri assegnati.

**Causa**: La mappa `membersByOrgNode` viene costruita iterando su `roles[].assignments`, ma il metodo `fetchRoles()` esegue solo `select('*')` sulla tabella `company_roles` -- non fa join con `company_role_assignments`. Quindi `r.assignments` e sempre `undefined` e la mappa risulta vuota per ogni team.

## Soluzione

Costruire `membersByOrgNode` direttamente dall'array `users` (che e gia disponibile nel componente), usando il campo `departmentId` di ogni utente. Ogni utente ha un `departmentId` che corrisponde all'`id` del nodo organizzativo a cui appartiene -- e questo dato e sempre presente e affidabile.

## Modifica

**File: `views/admin/CompanyOrgView.tsx`** (unico file da modificare)

Sostituire il blocco che calcola `membersByOrgNode` (righe ~2111-2129):

**Prima** (non funzionante):
```
membersByOrgNode - costruito da roles[].assignments (sempre vuoto)
```

**Dopo** (funzionante):
```
membersByOrgNode - costruito da users[].departmentId
```

Per ogni utente con un `departmentId`, lo si aggiunge alla mappa sotto quel nodo. Questo garantisce che selezionando un team, tutti i suoi membri appaiano correttamente con nome e cognome.

## Dettagli Tecnici

La nuova logica:
```text
const map = {};
for (const u of users) {
  if (!u.departmentId || u.isHiring) continue;
  if (!map[u.departmentId]) map[u.departmentId] = [];
  map[u.departmentId].push({
    id: u.memberId || u.id,
    label: firstName + lastName || email
  });
}
return map;
```

Nessuna modifica al database, nessun file aggiuntivo. Fix puntuale su 1 file.
