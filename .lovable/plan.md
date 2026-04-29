# Popolamento completo tenant demo "Amaeru"

## Obiettivo
Trasformare il tenant Amaeru (oggi vuoto: solo nodi "CDA" e "Nuovo Dipartimento") in un ambiente demo completo, coerente con la landing https://amaeru.eu/landing (app freemium AI-powered per la salute di cani e gatti, team italiano, valori: Trasparenza, Innovazione, Amore per gli animali, Rispetto per l'ambiente, Goal Oriented).

## Approccio tecnico
Tutto via una nuova edge function **`seed-amaeru-demo`** (sul modello dell'esistente `seed-company-roles`), idempotente, che:
1. Pulisce/aggiorna org_nodes, company_roles, company_role_assignments e company_members del tenant Amaeru
2. Crea profili, ruoli, persone, sedi/scrivanie e profili di collaborazione
3. Lanciabile dalla pagina `SeedDataView` con un nuovo bottone "Seed Amaeru Demo"

Nessuna modifica allo schema DB.

## 1. Organigramma (org_nodes)

```text
CDA (root)
├── CEO Office (department)
│   └── Executive Assistant (team)
├── Sviluppo Prodotto (department)
│   ├── Engineering (team)
│   ├── AI & Data (team)
│   └── Mobile & Web (team)
├── Marketing & Growth (department)
│   ├── Brand & Content (team)
│   └── Performance & SEO (team)
├── Veterinary & Scientific Advisory (department)
├── Customer Success & Community (department)
└── Operations & Finance (department)
    ├── Finance & Admin (team)
    └── People & Legal (team)
```

## 2. Persone (company_members)

### CDA
- **Giuseppe Ciniero** — Presidente CDA & CEO (tu)
- **Chiara Tacco** — Membro CDA
- **Carlotta Silvestrini** — Membro CDA
- **Diego Barbisan** — Membro CDA

### Sviluppo Prodotto (~7 persone)
- **Lorenzo Marchetti** — CTO / Head of Engineering
- **Sara Bianchi** — Lead AI Engineer (AI & Data)
- **Matteo Greco** — Senior Backend Engineer
- **Federico Romano** — iOS / Mobile Engineer
- **Alessia Conti** — Frontend / Web Engineer
- **Davide Russo** — ML / Computer Vision Engineer (riconoscimento etichette)
- **Elena Marini** — Product Designer (UX/UI)

### Marketing & Growth (guidato da Giulia Ruggi, ~4 persone)
- **Giulia Ruggi** — Head of Marketing
- **Marco Galli** — Content & Brand Manager
- **Sofia De Luca** — Performance & SEO Specialist
- **Luca Ferrari** — Social Media & Community Manager

### Veterinary & Scientific Advisory (2)
- **Dr.ssa Valentina Rossi** — Veterinary Lead (consulenza scientifica, WSAVA)
- **Dr. Andrea Pozzi** — Pet Nutrition Specialist

### Customer Success & Community (2)
- **Martina Gallo** — Customer Success Lead
- **Riccardo Esposito** — Community & Support Specialist

### Operations & Finance (3)
- **Paola Neri** — CFO / Head of Operations
- **Stefano Lombardi** — Finance & Admin
- **Francesca Moretti** — People & Legal

**Totale:** ~22 persone, tutte con email demo `nome.cognome@amaeru.eu`, job_title e department_id valorizzati. Membri come placeholder (no auth user reale) — pattern già usato nel seed Dürr.

## 3. Ruoli (company_roles)

Per ogni persona viene creato un ruolo formale collegato al nodo organizzativo, con:
- `title`, `description`, `responsibilities[]`, `daily_tasks[]`, `kpis[]`
- `required_hard_skills[]` e `required_soft_skills[]` con livelli
- `required_seniority`, `years_experience_min/max`
- `contract_type`, `ral_range_min/max`, `remote_policy` (mix di hybrid/remote/on_site)
- `reports_to_role_id` (gerarchia: CEO→department head→team member)
- `collaboration_profile`: `environmentalImpact` (1-5), `operationalFluidity` (1-5), `links[]` con collegamenti realistici tra ruoli (es. CTO ↔ Lead AI 80%, Head of Marketing ↔ Content 70%, CEO ↔ tutti i department head ~30-50%)

Mansionari coerenti con il prodotto (app pet-tech, AI ingredient analysis, Bristol scale, smart pantry, vet PDF reports).

## 4. Assegnazioni (company_role_assignments)
Una assegnazione `primary` per ogni ruolo → company_member, FTE 100%, start_date 2024-01-01.

## 5. Profilo azienda (companies)
Aggiornare i campi già esistenti se vuoti, ma **NON sovrascrivere** ciò che l'utente ha già impostato:
- `description`: già ok
- `culture_values`: già ok
- `size_range`: aggiornare a "11-50" (più realistico col team proposto)

## 6. SpaceSync — Sedi e scrivanie
Creare:
- **Sede Milano HQ** (Via Cavour 1, Milano) — Piano 1 con sala open-space (Engineering+AI), sala Marketing, ufficio CEO, sala riunioni
- ~15 scrivanie (`office_desks`) assegnate ai membri on-site/hybrid; veterinari e alcuni ingegneri remote (no desk)

Questo permette di mostrare la mappa SpaceSync con flussi di collaborazione attivi.

## 7. Pagina di lancio
In `src/views/admin/SeedDataView.tsx` aggiungere un bottone **"Seed Amaeru Demo"** che chiama l'edge function. La funzione è idempotente (svuota e ricrea).

## File coinvolti

| File | Azione |
|---|---|
| `supabase/functions/seed-amaeru-demo/index.ts` | NUOVO — logica completa di seeding |
| `src/views/admin/SeedDataView.tsx` | MODIFICATO — bottone di lancio |
| `supabase/config.toml` | (eventuale) registrazione function se necessario |

## Esecuzione
1. Deploy automatico della edge function
2. L'utente apre la SeedDataView → click "Seed Amaeru Demo"
3. Refresh dell'organigramma per vedere i risultati
4. Esplorabili: Organigramma, Dashboard, Identity Hub, SpaceSync, Compliance
