

# Piano: Rimozione Sezione "Organico/Headcount" dalla UI

## Contesto

Il modello ruolo-centrico prevede **1 ruolo = 1 posizione = 1 casella**. Il campo `headcount` e' sempre 1 e la sezione "ORGANICO" nella modale di dettaglio e' ridondante. Il conteggio dell'organico ha senso solo a livello di ramo/dipartimento, non sulla singola posizione.

## Modifiche

| File | Azione |
|------|--------|
| `src/components/roles/UnifiedDetailModal.tsx` | Rimuovere la sezione "Organico" (righe 796-799) dal tab Contratto |
| `src/components/roles/UnifiedRolePersonCard.tsx` | Rimuovere il badge `headcount > 1` (righe 159-164) |
| `src/components/roles/RoleCard.tsx` | Rimuovere il badge `headcount > 1` (righe 137-142) |

Nessuna modifica al DB o ai tipi: il campo `headcount` resta nel modello dati per retrocompatibilita' ma non viene piu' mostrato a livello di singola posizione.

