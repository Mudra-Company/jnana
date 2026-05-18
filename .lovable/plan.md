## Obiettivo
Rendere il salvataggio dei parametri influencer affidabile e persistente: quando modifichi flag, ambito, tipi e note e premi **Salva Modifiche**, i dati devono restare nel database e rimanere visibili subito sia nel modal sia nella spalla sinistra dell’organigramma.

## Problema identificato
Il salvataggio verso database parte davvero e va a buon fine, ma subito dopo la UI ricarica i ruoli con una query che non include i campi influencer dell’assegnazione. Il risultato è che il frontend ricostruisce lo stato con assignment incompleti e sembra che il salvataggio sia stato perso.

C’è anche un secondo punto da allineare: dopo il refresh del ruolo, il modal mantiene parzialmente la posizione selezionata precedente invece di riallineare completamente `role + assignment + metrics` con i dati appena ricaricati.

## Piano di fix
1. Correggere il fetch dei ruoli in `useCompanyRoles`
   - Aggiungere ai `select` di `fetchRoles` e `fetchRolesByOrgNode` i campi:
     - `is_influencer`
     - `influence_scope`
     - `influence_type`
     - `influence_notes`
   - In questo modo ogni refresh dell’organigramma manterrà i dati influencer già salvati.

2. Riallineare il modal dopo il salvataggio
   - In `CompanyOrgView`, dopo `fetchRoleWithAssignments(actualRoleId)`, ricostruire la `selectedUnifiedPosition` completa usando il nuovo assignment primario e il relativo assignee aggiornato.
   - Evitare di aggiornare solo `role: refreshed`, perché così `assignment` e `metrics` possono restare stantii.

3. Aggiornare subito anche la selezione del pannello laterale
   - Se la posizione aperta nel modal coincide con quella selezionata nell’organigramma, aggiornare anche la selection corrente, così la spalla sinistra mostra subito l’influencer corretto senza dover richiudere e riaprire.

4. Verificare il comportamento end-to-end
   - Caso 1: attivo influencer + seleziono 2 tipi + salvo.
   - Caso 2: modifico ambito + note + salvo.
   - Caso 3: chiudo e riapro il modal.
   - Caso 4: verifico icona sulla card e sezione “Influencer del team” nella spalla sinistra.

## Risultato atteso
- Il pulsante **Salva Modifiche** salva davvero tutti i campi influencer.
- Uscendo dal modal l’informazione non si perde.
- L’organigramma, il modal e la spalla sinistra restano coerenti subito dopo il salvataggio.

## Dettagli tecnici
File principali da toccare:
- `src/hooks/useCompanyRoles.ts`
- `views/admin/CompanyOrgView.tsx`
- eventualmente `src/hooks/useOrgChartUIState.ts` solo se serve un piccolo supporto per riallineare la selection corrente senza introdurre regressioni.

Non prevedo modifiche al database: i campi ci sono già e il PATCH è già funzionante.