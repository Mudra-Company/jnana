# Riepilogo "Competenze richieste" nel tab Ruolo

## Contesto

Le hard skills e soft skills **richieste dal ruolo** esistono e sono attive: vivono in `role.requiredHardSkills` / `role.requiredSoftSkills` e sono il riferimento che il motore di matching usa per calcolare il "Fit con il Ruolo" (vedi `useUnifiedOrgData.ts`).

Oggi però sono **visibili e modificabili solo nel tab "Requisiti"**. Nel tab "Ruolo" (mansionario) non compaiono — quindi a colpo d'occhio sembra che il ruolo non le abbia, anche se esistono.

## Obiettivo

Rendere visibili nel tab **Ruolo** (in read-only) le competenze attese dal ruolo, mantenendo il tab **Requisiti** come unica fonte di editing (no duplicazione).

## Cosa cambia

### In `src/components/roles/UnifiedDetailModal.tsx` → `renderRuoloTab()`

Aggiungere, **subito dopo i KPI**, una nuova sezione mostrata solo in modalità lettura:

**"Competenze richieste"** — con due sotto-blocchi:

- **Hard Skills** (chip indigo): nome skill + livello richiesto (es. "Liv. 4") + stellina ⭐ se obbligatoria.
- **Soft Skills** (chip viola): nome + stellina ⭐ se obbligatoria.

Sotto la sezione, una nota con link/CTA testuale:
> "Per modificare le competenze richieste vai al tab **Requisiti**."

Se sia hard che soft sono vuote, la sezione non viene mostrata (zero rumore visivo).

In **modalità Edit** la sezione resta nascosta nel tab Ruolo (l'editing avviene solo nel tab Requisiti, dov'è già completo).

## Cosa NON cambia

- Il tab **Requisiti** resta com'è: unica fonte di editing per hard/soft skills, seniority, formazione, certificazioni, lingue.
- La logica di matching (`useUnifiedOrgData.ts`) e i campi del DB non vengono toccati.
- Nessuna modifica a tipi, RLS, edge functions.

## File toccati

- `src/components/roles/UnifiedDetailModal.tsx` — solo aggiunta sezione read-only in `renderRuoloTab`.
