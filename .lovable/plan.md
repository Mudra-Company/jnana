
# Fix: Promozione ruolo implicito crea duplicato nell'organigramma

## Problema

Quando si salva il profilo di collaborazione di un ruolo "implicito" (come quello di Mauro Dorigo), il sistema:
1. Crea un **nuovo** ruolo nel database con `createRole({ title, orgNodeId })` 
2. Aggiorna il nuovo ruolo con i dati di collaborazione
3. **NON assegna la persona** al nuovo ruolo creato

Al refresh, il sistema mostra:
- Il nuovo ruolo DB "Head of Sales" **senza assegnatario** (appare come vacante/hiring)
- L'utente Mauro Dorigo che genera ancora un ruolo implicito (perche non risulta assegnato a nessun ruolo esplicito)

## Soluzione

Nel blocco di promozione del ruolo implicito in `CompanyOrgView.tsx` (righe ~2135-2151), dopo aver creato il ruolo nel DB, bisogna anche **creare l'assignment** che collega la persona al nuovo ruolo.

## Modifica

**File: `views/admin/CompanyOrgView.tsx`**

Dopo `createResult.role.id` (riga ~2150), aggiungere la chiamata per assegnare la persona:

```text
// Dopo createRole:
if (pos.assignee) {
  await assignPersonToRole(
    createResult.role.id, 
    pos.assignee.memberId || pos.assignee.id
  );
}
```

Questo usa il `memberId` dell'assegnatario corrente (estratto dalla posizione implicita) per creare un record in `company_role_assignments` con `assignment_type = 'primary'`.

Bisogna verificare che `assignPersonToRole` (o la funzione equivalente dal hook `useCompanyRoles`) sia disponibile nel componente. Se non c'e un metodo diretto, si puo usare una insert diretta su `company_role_assignments` oppure il callback `onAssignPerson` gia presente.

## Dettagli Tecnici

Il flusso corretto diventa:
1. `createRole({ companyId, title, orgNodeId })` -- crea il ruolo
2. `assignPersonToRole(newRoleId, memberId)` -- assegna la persona
3. `updateRole(newRoleId, updatedRole)` -- salva le modifiche (collaborazione, etc.)
4. Refresh della posizione selezionata con il nuovo `roleId`

Nessuna migrazione DB. Un solo file da modificare.
