
# Popolamento completo organigramma Dürr Dental con dati dal mansionario

## Obiettivo
Creare tutti i ruoli nel database con mansionario completo (responsabilita, KPI, competenze, requisiti) estratto dal PDF allegato, e assegnare ogni ruolo alla persona corretta. L'unico ruolo gia esistente nel DB e "Head of Sales" (Mauro Dorigo) che verra aggiornato.

## Analisi del documento

Il PDF contiene i mansionari dettagliati per le seguenti figure:

| Mansionario dal PDF | Persona/e nell'organigramma | Nodo organizzativo |
|---|---|---|
| Magazziniere | Andrea Tompetrini | Magazzino |
| Segreteria e Amministrazione | Alessandra Ciceri | Supporto Amministrativo |
| Responsabile Amministrativo | Tessa Sangalli | Direzione Amministrativa |
| Commerciale Interno (Gestione Ordini) | Barbara Pasqualini | Gestione Ordini |
| Service & Technical Support | Paolo Romano, Matteo Griffini, Gabriele Piani, Alberto Luppichini | Service Tradizionale / Service Digital |
| Service & Repair | Alberto Scudier | Installazioni |
| Responsabile Service | Claudio Venturini | Direzione Service |
| Area Manager | Michele Cassano | Team Sales |
| Product Specialist | Ivan Carlo Pagnini | Service Digital & R&D |
| Marketing (Addetto) | Giulia Bartoli, Massimiliano Cerati | Team Marketing |

Ruoli NON presenti nel PDF ma presenti nell'organigramma (da compilare con dati sensati):
- **CEO / AD** (Nicola Bertolotto) -- General Management
- **Head of Sales & Marketing** (Mauro Dorigo) -- gia in DB, da aggiornare
- **Sales Specialist** (Marco Fabio) -- Team Sales

## Piano di implementazione

### 1. Creare un edge function `seed-company-roles`

Una funzione backend che:
- Per il ruolo gia esistente di Mauro Dorigo: esegue un UPDATE con tutti i campi dal mansionario
- Per tutti gli altri 17 utenti: crea un nuovo record in `company_roles` e il corrispondente record in `company_role_assignments`
- Tutti i dati (responsibilities, daily_tasks, kpis, required_hard_skills, required_soft_skills, required_languages, required_education, required_certifications) sono hardcoded nella funzione direttamente dal PDF

### 2. Dati per ogni ruolo

Per ogni ruolo verra popolato:
- `title`: titolo dal mansionario
- `org_node_id`: nodo organizzativo corretto (UUID dal DB)
- `responsibilities`: lista responsabilita dal PDF
- `daily_tasks`: funzioni e compiti principali dal PDF
- `kpis`: KPI con nome, descrizione e target dal PDF
- `required_hard_skills`: competenze tecniche dal PDF (con livello 3-5)
- `required_soft_skills`: competenze trasversali dal PDF (con livello 3-5)
- `required_languages`: lingue richieste dal PDF (con livello)
- `required_education`: requisiti formativi dal PDF
- `required_certifications`: certificazioni dal PDF
- `required_seniority`: seniority appropriata
- `contract_type`: "permanent" (indeterminato per tutti)
- `work_hours_type`: "full_time"
- `remote_policy`: "on_site"
- `status`: "active"

### 3. Aggiungere bottone nel SeedDataView

Aggiungere un terzo bottone "Seed Company Roles (19)" nella pagina di seed che chiama la nuova edge function.

### 4. Ruoli senza mansionario nel PDF

Per CEO, Head of Sales e Sales Specialist, creo mansionari sensati basati sul contesto aziendale e le best practices per quei ruoli nel settore dental/medicale B2B.

## Dettagli tecnici

### Mapping persona -> ruolo -> nodo

```text
Nicola Bertolotto  -> CEO / AD                    -> d0000001-...-000000000001 (General Management)
Mauro Dorigo       -> Head of Sales & Marketing   -> d0000001-...-000000000002 (Dir. Sales) [UPDATE]
Claudio Venturini  -> Resp. Service               -> d0000001-...-000000000003 (Dir. Service)
Fabrizio Dose      -> Resp. Logistica             -> d0000001-...-000000000004 (Dir. Logistica)
Tessa Sangalli     -> Resp. Amministrativo        -> d0000001-...-000000000005 (Dir. Amm.)
Michele Cassano    -> Area Manager                -> d0000001-...-000000000006 (Team Sales)
Marco Fabio        -> Sales Specialist            -> d0000001-...-000000000006 (Team Sales)
Giulia Bartoli     -> Marketing Specialist        -> d0000001-...-000000000007 (Team Marketing)
Massimiliano Cerati-> Marketing Specialist        -> d0000001-...-000000000007 (Team Marketing)
Barbara Pasqualini -> Commerciale Interno         -> d0000001-...-000000000008 (Gestione Ordini)
Paolo Romano       -> Tecnico Service Trad.       -> d0000001-...-000000000009 (Service Trad.)
Matteo Griffini    -> Tecnico Service             -> d0000001-...-000000000009 (Service Trad.)
Gabriele Piani     -> Tecnico Service             -> d0000001-...-000000000009 (Service Trad.)
Alberto Luppichini -> Tecnico Service             -> d0000001-...-000000000009 (Service Trad.)
Ivan Carlo Pagnini -> Product Specialist          -> d0000001-...-000000000010 (Service Digital)
Alberto Scudier    -> Installatore / Service Rep. -> d0000001-...-000000000011 (Installazioni)
Andrea Tompetrini  -> Magazziniere                -> d0000001-...-000000000012 (Magazzino)
Alessandra Ciceri  -> Segreteria e Amm.           -> d0000001-...-000000000013 (Supp. Amm.)
```

### File da creare/modificare

| File | Azione |
|---|---|
| `supabase/functions/seed-company-roles/index.ts` | Nuovo - Edge function con tutti i dati |
| `src/views/admin/SeedDataView.tsx` | Aggiungere bottone per chiamare la funzione |
| `supabase/config.toml` | NON toccare (auto-gestito) |

### Struttura dati di esempio per un ruolo

```text
{
  title: "Magazziniere",
  company_id: "11111111-...",
  org_node_id: "d0000001-...-000000000012",
  responsibilities: ["Integrita fisica e conservazione della merce", ...],
  daily_tasks: ["Ricevimento e controllo merce", "Stoccaggio prodotti", ...],
  kpis: [
    { name: "Accuratezza inventariale", target: ">98%" },
    { name: "Tempo medio evasione ordini", target: "<24h" },
    ...
  ],
  required_hard_skills: [
    { name: "Gestionale magazzino IFS", level: 4 },
    { name: "Movimentazione merci", level: 4 },
    ...
  ],
  required_soft_skills: [
    { name: "Precisione e attenzione ai dettagli", level: 4 },
    ...
  ],
  required_languages: [
    { language: "Italiano", level: "native" }
  ],
  required_education: [
    { degree: "Diploma scuola secondaria superiore", mandatory: false }
  ],
  required_certifications: ["Patentino carrelli elevatori"],
  required_seniority: "Mid",
  contract_type: "permanent",
  work_hours_type: "full_time",
  remote_policy: "on_site",
  status: "active",
  headcount: 1,
  is_hiring: false
}
```

Nessuna migrazione DB necessaria. 1 edge function nuova, 1 file UI modificato.
