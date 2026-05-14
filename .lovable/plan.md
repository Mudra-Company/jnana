## Problema

Nel pannello dettagli dell'Organigramma, per il nodo "Marketing & Growth" il box **Collaboratori** mostra **4** mentre dovrebbero essere **3** (Marco Galli, Luca Ferrari, Sofia De Luca). Il quarto contato è Giulia Ruggi, che è il Head of Marketing assegnato al nodo stesso e quindi già rappresentata dal box "In questo nodo" (1).

## Causa

In `src/components/admin/orgchart/OrgChartContextPanel.tsx` la funzione `collectNodeUsers(node, users)` raccoglie tutti gli utenti il cui `departmentId` appartiene al sottoalbero **incluso il nodo radice della selezione**. Quindi `subtreeUsers` = persone del nodo + persone dei figli, e il KPI "Collaboratori" finisce per essere `direct + descendants`.

## Fix

Cambiare la semantica di "Collaboratori" in **solo persone dei nodi figli** (descendants, escluso il nodo corrente), come confermato dall'utente.

Modifica unica in `OrgChartContextPanel.tsx`, dentro `NodeView`:

- Calcolare `descendantUsers` partendo dai soli `node.children` (dedup + `isRealPerson`), invece di `collectNodeUsers(node, users)` che include anche `node.id`.
- Usare quel valore nel `KpiTile label="Collaboratori"`.
- `directUsers` e il box "In questo nodo" restano invariati.

Risultato atteso sul nodo selezionato dello screenshot:
- In questo nodo: 1 (Giulia Ruggi)
- Collaboratori: 3 (Marco Galli, Luca Ferrari, Sofia De Luca)

Nessuna modifica a dati, hook o backend: solo presentazione nel pannello.
