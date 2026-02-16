

# Rendere Modificabile il Ruolo dall'Organigramma

## Problema

Dallo screenshot si vede che la modale mostra "Ruolo implicito" -- questo significa che il ruolo non e stato creato formalmente nel sistema, ma generato automaticamente dal job title del dipendente. I ruoli impliciti hanno un ID che inizia con `implicit-` e la logica attuale li rende NON modificabili: il bottone "Modifica Ruolo" e nascosto perche `canEdit = false`.

Il bottone "Profilo Completo" in basso serve solo per aprire il profilo della persona, non per modificare il ruolo.

## Soluzione: Bottone "Promuovi a Ruolo Formale"

Per i ruoli impliciti, aggiungere un'azione che permetta di convertirli in ruoli formali (salvati nel database), rendendoli poi modificabili.

### Flusso Utente

1. L'utente apre la card nell'organigramma
2. Vede "Ruolo implicito" con i campi vuoti
3. In basso appare un bottone "Crea Ruolo Formale" (al posto di "Modifica Ruolo")
4. Click sul bottone: il sistema crea un nuovo `company_role` nel DB con i dati base (titolo dal job title, company_id, org_node_id)
5. La modale si ricarica con il ruolo formale appena creato, e ora il bottone "Modifica Ruolo" e visibile
6. L'utente puo editare descrizione, responsabilita, skill, KPI, etc.

### File da Modificare

#### 1. `src/components/roles/UnifiedDetailModal.tsx`
- Nella sezione Actions (footer), quando `isImplicitRole` e `true`, mostrare un bottone "Crea Ruolo Formale" con icona e stile prominente
- Aggiungere una nuova prop `onPromoteToFormalRole` che accetta il ruolo implicito e lo converte
- Aggiungere un banner informativo nel tab "Ruolo" quando e implicito: "Questo ruolo e stato generato automaticamente. Crealo come ruolo formale per modificarlo."

#### 2. `views/admin/CompanyOrgView.tsx`
- Passare la nuova prop `onPromoteToFormalRole` alla `UnifiedDetailModal`
- Implementare la logica: chiamare `createRole()` con i dati del ruolo implicito (titolo, companyId, orgNodeId), poi aggiornare il `company_member` con il nuovo `role_id`
- Dopo la creazione, ricaricare la posizione unificata con il ruolo formale

#### 3. Fix Errori di Build Pre-esistenti
I seguenti errori di build non sono legati a questa feature ma devono essere risolti per far compilare il progetto:

- **`CompanyOrgView.tsx:2099`**: Firma `onEdit` incompatibile -- il tipo atteso e `() => void` ma viene passata una funzione con parametro
- **`CompanyOrgView.tsx:2149`**: `updateRole` chiamato con 3 argomenti invece di 2
- Vari errori di tipo in altri file (PositionMatchingView, KarmaProfileEdit, riasecService, etc.) che sono pre-esistenti

### Dettagli Tecnici

Nuovo bottone nel footer della modale:
```text
Se isImplicitRole:
  [Crea Ruolo Formale]  -- bottone verde prominente
  [Profilo Completo]     -- se assegnee presente

Se !isImplicitRole:
  [Modifica Ruolo]       -- come oggi
  [Elimina]              -- come oggi
  [Profilo Completo]     -- se assegnee presente
```

Banner nel tab Ruolo per ruoli impliciti:
```text
+----------------------------------------------+
| (i) Questo ruolo e generato dal job title.   |
|     Crea un ruolo formale per modificare      |
|     mansionario, KPI e requisiti.             |
|                          [Crea Ruolo Formale] |
+----------------------------------------------+
```

Nessuna modifica al database. 2 file principali da modificare.
