# Ridisegno del Profilo Personale ("Il Mio Spazio")

## 1. Diagnosi attuale

Oggi il profilo (`KarmaDashboard` + `KarmaResults` + `UserResultView`) è uno **specchio dei test**: RIASEC, Karma AI, Clima. La persona compila → vede il risultato → fine. Mancano completamente:

- Il **contesto aziendale** della persona (ruolo, mansionario, KPI, inquadramento, reporting line).
- Il senso di **appartenenza a un team** (chi sono i miei colleghi, chi è il mio capo, chi riporta a me).
- Un **canale di feedback bottom-up** verso l'azienda (compatibilità con i colleghi, segnali per SpaceSync e Job Rotation).
- Strumenti **azionabili** per la persona (sviluppo, mobilità interna, riconoscimenti, gestione dei propri dati).

---

## 2. Lettura "Head of HR" — cosa serve all'organizzazione

Un HR strategico vuole che la pagina-profilo del dipendente generi **dati strutturati e affidabili** per:

- **Engagement & retention**: pulse periodici, percezione del proprio ruolo (chiarezza, carico, allineamento valoriale).
- **SpaceSync / collaborazione**: chi lavora davvero con chi, con che frequenza, con che affinità. Oggi è inferito; chiediamolo alla fonte.
- **Job Rotation & mobilità interna**: aspirazioni dichiarate, skill che la persona vorrebbe sviluppare, ruoli a cui si candiderebbe, compatibilità relazionale interna.
- **Compliance & HR ops**: dati personali sempre aggiornati (recapiti emergenza, documenti, formazione obbligatoria), riducendo i ticket all'HR.
- **Performance / mansionario vivente**: il dipendente vede e firma il proprio job description e KPI → riduce ambiguità di ruolo (uno dei principali driver di turnover).
- **Riconoscimento culturale**: rendere visibili gli "influencer" e i driver culturali già modellati nel sistema (coroncina) anche al singolo, in chiave costruttiva.

Vincoli HR non negoziabili:
- Le **valutazioni tra pari** non devono diventare un ranking pubblico. Aggregazione anonimizzata, soglia minima di voti, mai esposte 1-a-1.
- Lo storico psicometrico (RIASEC, Karma, Clima) resta visibile alla persona ma con un **layer interpretativo**, non solo numeri.
- Confine chiaro tra "cosa vede solo la persona", "cosa vede il manager", "cosa vede l'HR".

---

## 3. Lettura "Dipendente" — cosa serve a me

Da impiegato voglio aprire il mio profilo e capire in 10 secondi:

- **Chi sono qui dentro**: ruolo, team, capo, posto sull'organigramma. Mi dà sicurezza.
- **Cosa ci si aspetta da me**: mansionario, KPI, obiettivi del trimestre. Mi dà focus.
- **Come sto andando**: skill che ho vs richieste, gap, clima percepito, riconoscimenti.
- **Con chi lavoro**: facce, nomi, ruoli del team — possibilità di taggare colleghi con cui collaboro davvero (anche fuori dal mio team).
- **Dove posso andare**: ruoli aperti compatibili con me, percorsi di sviluppo, possibilità di job rotation.
- **Voce**: poter dire all'azienda "questo collega è un moltiplicatore per me", "questo ruolo mi interesserebbe", "ho bisogno di formazione su X" — senza dover scrivere una mail all'HR.

---

## 4. Sintesi integrata — la nuova architettura del profilo

Trasformiamo il profilo da pagina-risultato a **cockpit personale a 5 macro-aree**, con una nav a tab orizzontale (sostituisce le attuali Overview / RIASEC / Karma / Clima).

```text
┌────────────────────────────────────────────────────────────────┐
│ HEADER IDENTITARIO                                             │
│ Foto · Nome · Ruolo · Dipartimento · Sede · Manager · [badge]  │
│ (coroncina se cultural driver, icona se influencer)            │
└────────────────────────────────────────────────────────────────┘
 [ Io ] [ Il mio Ruolo ] [ Il mio Team ] [ Crescita ] [ Dati ]
```

### Tab 1 — "Io" (sostituisce Overview)
Sintesi identitaria, non un mero recap:
- **Profilo attitudinale** (RIASEC code + 3 dimensioni top, con micro-narrativa generata).
- **Le mie soft skill / hard skill / valori** (chip, da Karma).
- **Il mio clima percepito** (ultimo Climate Index + delta vs media azienda, vista solo personale).
- **CTA contestuali**: "Aggiorna il colloquio Karma" se >6 mesi, "Compila il clima" se aperto.

### Tab 2 — "Il mio Ruolo" (NUOVA)
La persona vede finalmente il suo `CompanyRole`:
- **Mansionario**: descrizione, responsibilities, daily tasks.
- **KPI assegnati** (dal `kpis` del ruolo) con stato dichiarato dalla persona (auto-check trimestrale leggero: "sto raggiungendo / a rischio / in ritardo").
- **Skill richieste vs presenti** (riuso del componente `SkillsComparison` già creato per l'org chart, con copy "Le tue skill rispetto al ruolo").
- **Inquadramento**: CCNL, contratto, FTE, sede, policy remote — sola lettura, con CTA "segnala incongruenza".
- **Reporting line**: chi è il mio responsabile (card cliccabile), eventuali deleghe se sono manager.

### Tab 3 — "Il mio Team" (NUOVA)
Il punto più chiesto dall'utente. Tre sotto-sezioni:

a) **Il mio responsabile** — card grande con foto, ruolo, contatti, eventuale coroncina/badge influencer.

b) **I miei colleghi diretti** — chi condivide il mio `org_node` (peer). Per ognuno:
   - card con foto, ruolo, anzianità nel ruolo.
   - chip "collaboriamo spesso" se emerge da `collaboration_profile` o da auto-dichiarazione (vedi punto c).
   - hover: micro-stats di compatibilità potenziale (es. complementarità RIASEC), **senza esporre punteggi degli altri**.

c) **Dipartimento allargato** — altri team dello stesso nodo padre, in formato lista compatta.

d) **Il mio team riportante** (visibile solo se manager) — chi riporta a me.

e) **Voto di compatibilità collaborativa** (la feature suggerita dall'utente, ben perimetrata):
   - Su ogni card collega: stelle 1–5 "Quanto è fluida la nostra collaborazione?" + tag opzionali ("ci capiamo al volo", "ci completiamo", "preferisco async", ecc.).
   - **Privacy**: il singolo voto non è mai mostrato al destinatario.
   - Aggregato esposto a HR/SpaceSync solo con ≥3 voti ricevuti, in forma di **indice di affinità collaborativa** (0–100), usato come input addizionale di `proximityEngine` e `jobRotationAnalyzer`.
   - Cadenza: pulse trimestrale (push lieve), modificabile in qualsiasi momento.
   - **Override** del valore stimato in `collaboration_profile.links[].personalAffinity` (oggi inserito dall'admin) quando esiste dato sufficiente dai peer.

### Tab 4 — "Crescita" (NUOVA)
La voce della persona verso l'azienda:
- **Aspirazioni**: ruoli interni che mi interesserebbero (lista dalle `open_positions` + libero), seniority a cui aspiro.
- **Skill che voglio sviluppare** (free + dal catalogo `hard_skills_catalog`).
- **Disponibilità a job rotation / mobilità geografica** (toggle).
- **Match interno**: top 3 ruoli aperti più compatibili (riuso `matchingEngine`).
- **Riconoscimenti ricevuti** (se attiviamo i badge culturali / kudos peer-to-peer in futuro — predisporre solo la slot).

### Tab 5 — "Dati & Privacy"
- Dati anagrafici, contatti, contatto di emergenza, documenti compliance personali (riuso modulo Compliance già esistente, vista filtrata "i miei documenti").
- Impostazioni di visibilità (già abbiamo `VisibilitySettingsCard` lato Karma — estenderla).
- Storico test (RIASEC, Karma, Clima) con possibilità di ri-compilare.
- Export del proprio profilo (PDF, in stile `riasecPdfExportService`).

---

## 5. Piano di implementazione

### Fase 0 — Fondamenta dati (backend)

1. **`peer_collaboration_ratings`** (nuova tabella):
   - `rater_user_id`, `rated_user_id`, `company_id`, `rating` (1–5), `tags` (text[]), `note` (text, opzionale), `created_at`, `updated_at`.
   - UNIQUE (`rater`, `rated`), aggiornabile.
   - RLS: il rater vede/modifica solo i propri voti; il rated **non** vede i singoli voti; HR/admin vede solo aggregati via view.
   - View `peer_affinity_aggregates` (rated_user_id, avg_rating, count) esposta solo con `count >= 3`.

2. **`user_growth_preferences`** (nuova tabella):
   - `user_id`, `interested_role_ids` (uuid[]), `interested_role_titles_free` (text[]), `skills_to_develop` (text[]), `rotation_open` (bool), `relocation_open` (bool), `target_seniority`, `updated_at`.
   - RLS: solo il proprietario in scrittura; HR aggregato in lettura.

3. **`user_kpi_self_checkins`** (leggero, opzionale fase 2):
   - `user_id`, `role_kpi_key`, `status` ('on_track'|'at_risk'|'late'), `note`, `period` (YYYY-Q), `updated_at`.

4. Estensione `proximityEngine` e `matchingEngine`: leggere `peer_affinity_aggregates` come segnale aggiuntivo (peso ~10–15%).

### Fase 1 — Refactor del frontend del profilo

5. Nuovo container `views/user/MyProfileView.tsx` che sostituisce `UserResultView` come destinazione principale del profilo dipendente. Header identitario condiviso + tab router locale.

6. Componenti dedicati (`src/components/profile/`):
   - `ProfileHeader.tsx` (con badge cultural driver / influencer già presenti nel sistema).
   - `IoTab.tsx` (riusa parti di `KarmaResults` e widget clima).
   - `MyRoleTab.tsx` (legge `useRoleAssignments` + `useCompanyRoles`, riusa `SkillsComparison`).
   - `MyTeamTab.tsx` (legge `useUnifiedOrgData`, card peer/manager, modale di rating).
   - `PeerRatingModal.tsx` (stelle + tag, write su `peer_collaboration_ratings`).
   - `GrowthTab.tsx` (form preferenze + lista match interni).
   - `DataPrivacyTab.tsx` (riusa `VisibilitySettingsCard` + sezione compliance personale).

7. Hook nuovi:
   - `usePeerRatings.ts` (CRUD voti).
   - `useGrowthPreferences.ts`.
   - `useMyTeam.ts` (deriva manager/peer/reports dal nodo del ruolo della persona).

### Fase 2 — Integrazioni a valle

8. **SpaceSync**: `proximityEngine` usa `peer_affinity_aggregates` come override del `personalAffinity` stimato.
9. **Job Rotation**: `jobRotationAnalyzer` boosta i match dove rater e rated hanno alta affinità reciproca; espone "Disponibile a rotation" dai growth preferences.
10. **HR Dashboard**: nuovo widget "Segnali dai dipendenti" (aspirazioni interne dichiarate, coppie ad alta affinità, ruoli con KPI segnalati a rischio).

### Fase 3 — Polish & adozione

11. Pulse trimestrale automatico (banner soft) per ricompilare rating e check-in KPI.
12. Export PDF "Il mio profilo" completo.
13. Onboarding tour della nuova pagina (3 step) per gli utenti esistenti.

---

## 6. Sezione tecnica (per riferimento)

- File principali nuovi: `views/user/MyProfileView.tsx`, `src/components/profile/*`, `src/hooks/usePeerRatings.ts`, `src/hooks/useGrowthPreferences.ts`, `src/hooks/useMyTeam.ts`.
- File toccati: `App.tsx` / routing utente (sostituzione destinazione `/me`), `src/utils/proximityEngine.ts`, `src/utils/matchingEngine.ts`, `src/utils/jobRotationAnalyzer.ts`.
- Migrazioni Supabase: `peer_collaboration_ratings`, `user_growth_preferences`, `user_kpi_self_checkins`, view aggregata `peer_affinity_aggregates`, policy RLS dedicate, trigger `updated_at`.
- Riuso: `SkillsComparison` (org chart), `VisibilitySettingsCard` (Karma), `useUnifiedOrgData`, `useCompanyRoles`, `useRoleAssignments`, badge influencer/cultural-driver.
- Design system: tailwind Jnana (`jnana-sage`, `jnana-bg`, ecc.), no shadcn generico.
- Privacy by design: nessun voto individuale leggibile dal destinatario; aggregati solo con n≥3; tutte le RLS scritte di default chiuse.

---

## 7. Ordine consigliato di consegna

1. Fase 0 (migrazioni) → 2. Scheletro `MyProfileView` + tab Io e Ruolo (riuso massivo) → 3. Tab Team (read-only) → 4. Peer rating + Growth → 5. Integrazione engine SpaceSync/Rotation → 6. Dashboard HR e polish.

Ogni step è rilasciabile in autonomia e dà valore percepito al dipendente già dallo step 2.
