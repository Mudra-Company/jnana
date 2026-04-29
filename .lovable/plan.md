
# Popolamento completo Amaeru: 22 account auth reali + SpaceSync multi-piano + Compliance + Survey

## Obiettivo
Trasformare i 22 placeholder Amaeru in account utente reali navigabili, con profilo completo, hard/soft skills, esperienze, formazione, lingue, certificazioni, RIASEC, sessione Karma e risposta Climate. Espandere SpaceSync su 2 piani con stanze e scrivanie ridistribuite. Popolare Compliance con CCNL Commercio e mix di stati documenti.

## Approccio tecnico
Una nuova edge function **`seed-amaeru-full`** orchestrerà tutto in modo idempotente. Userà `service_role_key` per creare gli auth user e bypassare le RLS. Lanciabile dal bottone già presente in `SeedDataView` (rinominato "Seed Amaeru Full").

## 1. Account auth reali (22 utenti)

Per ognuno dei 22 membri:
1. `supabase.auth.admin.createUser` con email `nome.cognome@amaeru.eu`, password demo unica `Amaeru2026!`, `email_confirm: true`
2. Il trigger `handle_new_user` crea automaticamente il record in `profiles` e in `user_roles` (default `user`)
3. UPDATE `company_members` settando `user_id` = nuovo auth uid, e svuotando i campi `placeholder_*`
4. UPDATE `profiles` con tutti i campi: `first_name`, `last_name`, `gender` (M/F coerente col nome), `birth_date` (età 28-58 distribuite), `age`, `job_title`, `bio` (3-4 righe descrittive del ruolo), `headline`, `location` (Milano/Roma/remoto), `region`, `years_experience` (3-25), `is_karma_profile: false`, `looking_for_work: false`

## 2. Dati professionali per ogni utente

Per ognuno dei 22 utenti popolare:

### Hard skills (`user_hard_skills`)
4-8 skill da `hard_skills_catalog` coerenti col ruolo + 1-2 custom. Livelli 3-5.
Esempi: CTO → Python, AWS, System Design, Team Leadership; Vet Lead → Veterinary Medicine, Pet Nutrition, Clinical Research.

### Soft skills (campo nel profilo / `user_hard_skills` con flag) 
3-5 soft skill testuali coerenti.

### Esperienze (`user_experiences`)
2-3 esperienze passate per ognuno (azienda fittizia ma plausibile, ruolo, date, descrizione).

### Formazione (`user_education`)
1-2 titoli (es. CTO → MSc Computer Science Politecnico Milano; Vet → Laurea Medicina Veterinaria UniMi).

### Lingue (`user_languages`)
Italiano (native) + Inglese (professional/fluent). Alcuni con Spagnolo o Francese (intermediate).

### Certificazioni (`user_certifications`)
0-3 a seconda del ruolo (AWS Certified, PMP, WSAVA, Google Ads, ecc.).

### Social links (`social_links`)
LinkedIn per tutti, GitHub per ingegneri, portfolio per Designer/Marketing.

## 3. Risultati test per ogni utente

### RIASEC (`riasec_results`)
Punteggi R/I/A/S/E/C plausibili e differenziati per ruolo:
- Ingegneri: I/R/C dominanti
- Designer: A/I/S
- Marketing: E/A/S
- Vet: I/S/R
- CFO/Finance: C/E/I
- CEO/CDA: E/S/I
`profile_code` calcolato dai 3 più alti.

### Karma session (`karma_sessions`)
Per ognuno: trascrizione minima 3 messaggi (placeholder), `summary` di 2 righe, `soft_skills[]` 4-5 voci, `primary_values[]` 3 voci coerenti coi valori Amaeru (Trasparenza, Innovazione, Amore animali, Rispetto ambiente, Goal Oriented), `risk_factors[]` 1-2 voci, `seniority_assessment` (Junior/Mid/Senior/Lead/C-Level), `completed_at` = now.

### Climate (`climate_responses`)
9 sezioni con punteggi 60-95 differenziati per ruolo (i C-level più alti, i junior leggermente più bassi). `overall_average` calcolato. `raw_scores` placeholder JSONB.

## 4. SpaceSync multi-piano

Aggiornare la location esistente "Milano HQ" e aggiungere il **Piano 2**:

### Piano 1 (esistente, ridistribuito) — Engineering & Product
- Open Space Engineering (8 scrivanie)
- AI/ML Lab (3 scrivanie)
- Sala riunioni "Bristol"
- Phone booth × 2

### Piano 2 (NUOVO `office_locations` con `floor_number=2`, stesso `building_name="Milano HQ"`, stesso indirizzo)
Canvas 1200×800. Stanze:
- Ufficio CEO (Giuseppe)
- Sala CDA (no scrivanie permanenti)
- Open Space Marketing (4 scrivanie: Giulia, Marco, Sofia, Luca)
- Vet Lab (2 scrivanie: Valentina, Andrea)
- Customer Success Hub (2 scrivanie: Martina, Riccardo)
- Operations & Finance (3 scrivanie: Paola, Stefano, Francesca)
- Lounge / Sala caffè (no scrivanie)
- Sala riunioni "Duomo"

Totale ~22 scrivanie con label = `Nome Cognome` e `company_member_id` valorizzato. CDA non operativi (Chiara, Carlotta, Diego) restano senza scrivania.

Questo permette di mostrare flussi cross-piano (CEO ↔ CTO, Marketing ↔ Engineering) usando la feature `ExternalFlowArrow` già esistente.

## 5. Compliance

### CCNL
INSERT in `company_ccnl_selections`: CCNL Commercio Confcommercio (`is_primary: true`).

### Stati compliance
Per OGNI riga di `compliance_requirements` con `ccnl_scope` matching ('all' o 'commercio'):
INSERT in `company_compliance_status` con mix realistico:
- 60% `compliant` (con `valid_from`/`valid_until` futuri)
- 25% `expiring_soon` (scadenza nei prossimi 30gg)
- 10% `expired`
- 5% `missing`

Aggiungere 5-10 righe in `company_compliance_history` per mostrare attività recente.

## 6. UI

Modificare `src/views/admin/SeedDataView.tsx`: il bottone esistente "Seed Amaeru Demo" diventa "Seed Amaeru Full" e chiama la nuova function `seed-amaeru-full`. Mostra loader e toast con conteggio finale (es. "22 utenti, 22 ruoli, 22 scrivanie, 18 documenti compliance").

## File coinvolti

| File | Azione |
|---|---|
| `supabase/functions/seed-amaeru-full/index.ts` | NUOVO — orchestrazione completa |
| `src/views/admin/SeedDataView.tsx` | MODIFICATO — bottone aggiornato |

## Note operative
- Function idempotente: prima cancella i dati Amaeru esistenti (auth user via `auth.admin.deleteUser` su email `*@amaeru.eu`, poi righe nelle tabelle dipendenti) e ricrea tutto da zero
- Password demo unica: `Amaeru2026!` per tutti — comunicata in toast finale
- Tempi di esecuzione attesi: 60-120 sec (22 createUser sequenziali + INSERT batch)
- Nessuna modifica a schema DB necessaria
- Le RLS sono bypassate dal service_role_key, nessun problema di permessi

## Cosa potrai fare in demo dopo
- Login come qualunque dipendente Amaeru (es. `giulia.ruggi@amaeru.eu` / `Amaeru2026!`) e vedere il suo profilo personale completo, RIASEC, Karma session
- Login come Giuseppe (CEO/admin) e vedere dashboard popolata, organigramma con 22 persone, talent search, compliance dashboard con risk score realistico
- SpaceSync con 2 piani navigabili e flussi cross-piano visibili
- Ogni persona cliccabile dall'organigramma con scheda ricca (skill, esperienze, RIASEC chart, Karma summary)
