## Diagnosi

I flussi di collaborazione **non si vedono** in SpaceSync per Amaeru per tre motivi sovrapposti:

### 1. Bug nel codice — `targetType: 'role'` non viene mai processato
I link di collaborazione possono avere tre `targetType`: `member`, `team`, `role`. Nei dati di Amaeru il **95% dei link è di tipo `role`** (CTO, Backend, Designer, ecc.), perché modellano "questo ruolo collabora con quel ruolo". Ma in tre punti del codice il branch `role` non esiste — vengono gestiti solo `member` e `team`:

- `src/components/spacesync/CollaborationFlowOverlay.tsx` (disegno frecce interne)
- la helper `buildFlowConnections()` nello stesso file (alimenta il Report Flussi)
- `views/admin/SpaceSyncView.tsx` (frecce esterne cross-sede + conteggio "mancanti")

Risultato: tutti i link `role` vengono silenziosamente scartati e non viene disegnata alcuna freccia.

### 2. Dati seed sbagliati per i link `member` (Membri CDA → CEO)
Gli unici link di tipo `member` puntano a un `targetId` UUID v5 calcolato con un namespace che **non coincide** con l'`id` reale del member CEO in DB. Anche fixando il punto 1, questi link resterebbero "rotti".

### 3. Tre Membri CDA senza scrivania
I 3 ruoli "Membro CDA" (che generano link verso CEO/CFO/CTO) non hanno scrivania assegnata in nessuna sede di Amaeru → anche con dati corretti non potrebbero comparire frecce dai/verso di loro.

## Cosa sistemare

### Fix A — Codice: gestione uniforme di `targetType: 'role'`
Per i tre file sopra, trattare `role` come `team`: se il link ha `memberBreakdown`, espanderlo sui member elencati con la stessa formula `effectivePct = round(collaborationPercentage * mb.percentage / 100)` e soglia minima 3%. Se `memberBreakdown` mancasse, fallback: risolvere il `targetId` (role) cercando i `company_members` assegnati a quel ruolo via `company_role_assignments` (caricati una sola volta in `useProximityScoring`) e distribuendo equamente la percentuale.

In pratica un'unica funzione helper `expandLinkToTargets(link, roleAssignmentMap)` riusata nei tre punti, così evitiamo divergenze future.

### Fix B — Dati seed Amaeru
Nella `supabase/functions/seed-amaeru-full/index.ts`, per i link `Membro CDA → CEO/CFO/CTO`:
- o convertirli a `targetType: 'role'` con `memberBreakdown` (coerente con tutti gli altri link),
- o calcolare il `targetId` con lo stesso identico helper UUID v5 usato per generare `company_members.id` (così matcha il record reale).

Adottiamo la prima opzione: più coerente con il resto del seed.

### Fix C — Scrivanie per i Membri CDA
Nella seed delle sedi/scrivanie di Amaeru, assegnare i 3 Membri CDA a 3 desk nella stanza "Sala CDA" (Piano 2 di Milano HQ — già visibile nello screenshot, attualmente vuota). Senza scrivania, qualsiasi flusso che li coinvolge resta invisibile per definizione.

### Fix D (piccolo) — Coerenza Membro CDA → tutti gli altri Membri CDA
Aggiungere link reciproci tra i 3 Membri CDA (collaborazione board interna) così che la "Sala CDA" mostri davvero un cluster di flussi una volta popolata.

## Output atteso dopo il fix

- Toggle "Flussi" in SpaceSync → si vedono le frecce tra le scrivanie già visibili a Piano 2 (CTO ↔ Backend ↔ Frontend ↔ iOS ↔ ML/CV ↔ Designer; Marketing ↔ Brand ↔ SEO ↔ Social; CEO ↔ CFO ↔ Head of Marketing; Vet Lead ↔ Pet Nutrition ↔ Customer Success).
- Frecce esterne (badge a destra) per le collaborazioni cross-piano/cross-sede.
- "Report Flussi" con elenco connessioni interne, esterne e collaboratori distanti popolato.
- Sala CDA non più vuota: 3 desk assegnati ai Membri CDA con flussi verso CEO.
- Conteggio "mancanti" → 0 (tutti i target risolti).

## File toccati

- `src/components/spacesync/CollaborationFlowOverlay.tsx` — branch `role` + helper condiviso
- `views/admin/SpaceSyncView.tsx` — branch `role` in `externalArrows` e `flowMissingCount`
- `src/hooks/useProximityScoring.ts` — caricare `company_role_assignments` ed esporre la mappa `roleId → memberIds[]` come fallback per i link role senza `memberBreakdown`
- `supabase/functions/seed-amaeru-full/index.ts` — link Membri CDA + scrivanie Sala CDA + link board interni
- Nuova migration "soft": script di re-seed per Amaeru (l'utente la lancia con il bottone esistente di seed)

## Note tecniche

- Nessuna modifica di schema DB richiesta: `collaboration_profile` jsonb già supporta `targetType: 'role'`.
- Le `RLS` non sono toccate (lettura/scrittura sono già autorizzate per company_admin).
- Il fix codice è retro-compatibile: i link `member` e `team` continuano a funzionare come prima; aggiungiamo solo il branch `role` mancante.
