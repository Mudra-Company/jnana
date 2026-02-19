
# Compilazione profili di collaborazione per tutti i ruoli Dürr Dental

## Obiettivo
Aggiornare tutti i 18 ruoli con profili di collaborazione completi: `environmentalImpact`, `operationalFluidity` e `links` (collegamenti verso team/membri con % di tempo e affinita).

## Approccio
Aggiornare la edge function `seed-company-roles` per includere il campo `collaboration_profile` in ogni ruolo, poi ri-eseguirla. Il profilo di Mauro Dorigo (gia compilato manualmente) verra preservato.

## Profili di collaborazione progettati

### Legenda valori
- **Impatto Ambientale** (1=silenzioso, 5=molto rumoroso)
- **Fluidita Operativa** (1=stanziale, 5=sempre in movimento)
- **% Collaborazione**: tempo lavorativo dedicato all'interazione con quel team
- **Affinita**: 1-5 (qualita relazionale tipica del ruolo)

### Mapping completo

| Ruolo | Env.Imp | Op.Fluid | Collegamenti principali |
|---|---|---|---|
| **CEO** (Bertolotto) | 2 | 4 | Dir.Sales 30%, Dir.Service 20%, Dir.Amm 20%, Dir.Logistica 10% |
| **Head of Sales** (Dorigo) | 3 | 3 | GIA COMPILATO - preservare |
| **Resp. Service** (Venturini) | 3 | 3 | Service Trad 35%, Installazioni 15%, Service Digital 15%, Dir.Logistica 10% |
| **Resp. Logistica** (Dose) | 2 | 3 | Magazzino 40%, Gestione Ordini 20%, Service Trad 15% |
| **Resp. Amministrativo** (Sangalli) | 1 | 1 | Supp.Amm 35%, General Mgmt 20%, Dir.Logistica 10% |
| **Area Manager** (Cassano) | 4 | 5 | Dir.Sales 25%, Gestione Ordini 20%, Team Marketing 10%, Service Trad 10% |
| **Sales Specialist** (Fabio) | 4 | 5 | Dir.Sales 25%, Gestione Ordini 25%, Team Marketing 10% |
| **Mktg Specialist** (Bartoli) | 2 | 2 | Dir.Sales 25%, Team Sales 20%, Gestione Ordini 10% |
| **Mktg Specialist** (Cerati) | 2 | 2 | Dir.Sales 25%, Team Sales 20%, Gestione Ordini 10% |
| **Commerciale Interno** (Pasqualini) | 3 | 1 | Team Sales 25%, Dir.Sales 20%, Dir.Logistica 15%, Supp.Amm 10% |
| **Tecnico Service** (Romano) | 4 | 5 | Dir.Service 20%, Installazioni 15%, Service Digital 10%, Magazzino 10% |
| **Tecnico Service** (Griffini) | 4 | 5 | Dir.Service 20%, Installazioni 15%, Service Digital 10%, Magazzino 10% |
| **Tecnico Service** (Piani) | 4 | 5 | Dir.Service 20%, Installazioni 15%, Service Digital 10%, Magazzino 10% |
| **Tecnico Service** (Luppichini) | 4 | 5 | Dir.Service 20%, Installazioni 15%, Service Digital 10%, Magazzino 10% |
| **Product Specialist** (Pagnini) | 2 | 3 | Service Trad 25%, Dir.Service 20%, Team Marketing 15% |
| **Tecnico Repair** (Scudier) | 4 | 5 | Service Trad 25%, Dir.Service 20%, Magazzino 15% |
| **Magazziniere** (Tompetrini) | 3 | 3 | Dir.Logistica 30%, Service Trad 20%, Gestione Ordini 15%, Installazioni 10% |
| **Segreteria** (Ciceri) | 2 | 1 | Dir.Amm 40%, General Mgmt 15%, Dir.Sales 10% |

## Dettagli tecnici

### File da modificare
**`supabase/functions/seed-company-roles/index.ts`**

Per ogni ruolo in `ROLES_TO_CREATE`, aggiungere il campo `collaboration_profile` con la struttura:

```text
collaboration_profile: {
  environmentalImpact: <numero>,
  operationalFluidity: <numero>,
  links: [
    {
      targetType: "team",
      targetId: "<org_node_id>",
      targetLabel: "<nome nodo>",
      collaborationPercentage: <0-100>,
      personalAffinity: <1-5>,
      memberBreakdown: [
        {
          memberId: "<company_member_id>",
          memberLabel: "<Nome Cognome>",
          percentage: <0-100>,
          affinity: <1-5>
        }
      ]
    }
  ]
}
```

### Logica per il memberBreakdown
Ogni link verso un team include il breakdown per membro con:
- La `percentage` indica quanto del tempo di collaborazione col team va a quel specifico membro
- L'`affinity` e una stima realistica della relazione tipica per quei ruoli

### Caso speciale: Head of Sales (Dorigo)
Il suo profilo e gia stato compilato manualmente dall'utente. La edge function NON deve sovrascriverlo: nella logica di update del ruolo esistente, il campo `collaboration_profile` va escluso dall'UPDATE oppure va preservato il valore attuale.

### Ri-esecuzione
Dopo l'aggiornamento della funzione, l'utente clicca "Seed Company Roles" dalla pagina admin per applicare i dati. La funzione e idempotente (cancella e ricrea i ruoli, eccetto Dorigo che viene solo aggiornato).
