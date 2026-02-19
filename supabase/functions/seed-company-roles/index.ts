// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COMPANY_ID = "11111111-1111-1111-1111-111111111111";

// Existing role to UPDATE
const EXISTING_ROLE_ID = "45389400-b856-48aa-959b-a891d4a98818"; // Head of Sales (Mauro Dorigo)

// Member IDs from DB
const MEMBERS = {
  bertolotto: { memberId: "c1cfc760-685e-464d-972e-7d78851b3848", userId: "0d18c89c-5db7-4bb6-a311-dd9c01fc9684" },
  dorigo:     { memberId: "ba4fefb5-b8c9-4538-96c7-ea0ed62cefc0", userId: "c37041d3-545b-4de2-b3ce-073fdfc2359a" },
  venturini:  { memberId: "6bc1394a-aa03-49dd-9710-e07f8f2af5f7", userId: "ade27e3c-229c-45ea-b072-2f5a683a2c42" },
  dose:       { memberId: "92ee699c-fc57-47ab-9c3e-201ac4ae9e29", userId: "8d09e41d-4fc9-4fb4-b7f3-ac17e92886dc" },
  sangalli:   { memberId: "619bf9df-1566-4f62-9580-262f5132237c", userId: "11e6c8ad-7595-4f65-a178-f9c4d21b13eb" },
  cassano:    { memberId: "112f678f-0215-4bab-b169-def3c8e9d051", userId: "e928d90b-448a-4f6b-8f6e-d9bd9a6d60db" },
  fabio:      { memberId: "849e1287-4e13-402e-bf97-83df5ab27719", userId: "df714f0b-d13e-44d3-aee1-97eb3151a944" },
  bartoli:    { memberId: "da0db6d9-d2cb-406d-883a-8932ca735f1f", userId: "176b6535-0d71-47ef-a5b4-037258b8b57b" },
  cerati:     { memberId: "6c144506-4262-4cd2-b8ff-e8db04c1f804", userId: "3d357cfe-fbc7-41e2-91c9-110d13570bff" },
  pasqualini: { memberId: "90e9d607-9b06-4429-8cd9-3b0b3d5bc7d5", userId: "55e00363-e242-4785-bbb8-9bad5293d6c4" },
  romano:     { memberId: "37fcc9bb-0708-4502-b554-6e2e27551ab9", userId: "29ea6030-21d2-45bd-a4ff-955f1cf079a3" },
  griffini:   { memberId: "65467fc3-9aae-4d83-a047-b267ff5edf31", userId: "072b0342-6cff-40c7-9717-2d046f1b0f13" },
  piani:      { memberId: "b495d50b-578e-4b4e-9844-ff49c96e6daa", userId: "c101dede-66d2-46c6-acf4-73d12d58dbc2" },
  luppichini: { memberId: "c34980fd-ab9a-4c66-9724-025de8241d0b", userId: "55f9afa8-2c30-42ea-8eab-f2a4d3dc4d69" },
  pagnini:    { memberId: "577c6499-8861-4e3e-ba47-5ca8113b4eb5", userId: "d169184b-212f-4272-a469-75b2fc635297" },
  scudier:    { memberId: "a7bfbc71-0fd2-44a7-b5a7-0c262064b3ec", userId: "b2f893ff-5cdf-4cf0-b094-74517e5643d1" },
  tompetrini: { memberId: "9f0c2fcb-93d5-4ed2-9b0d-c175e2950edd", userId: "05560b30-4614-4a39-af28-b6743c54a73c" },
  ciceri:     { memberId: "dea561bd-4ecc-4a77-a9c6-c99a06d82863", userId: "d255078f-e05a-4912-b425-a606d19e25e7" },
};

// Org node IDs
const NODES = {
  generalMgmt:    "d0000001-0000-0000-0000-000000000001",
  dirSales:       "d0000001-0000-0000-0000-000000000002",
  dirService:     "d0000001-0000-0000-0000-000000000003",
  dirLogistica:   "d0000001-0000-0000-0000-000000000004",
  dirAmm:         "d0000001-0000-0000-0000-000000000005",
  teamSales:      "d0000001-0000-0000-0000-000000000006",
  teamMarketing:  "d0000001-0000-0000-0000-000000000007",
  gestioneOrdini: "d0000001-0000-0000-0000-000000000008",
  serviceTrad:    "d0000001-0000-0000-0000-000000000009",
  serviceDigital: "d0000001-0000-0000-0000-000000000010",
  installazioni:  "d0000001-0000-0000-0000-000000000011",
  magazzino:      "d0000001-0000-0000-0000-000000000012",
  suppAmm:        "d0000001-0000-0000-0000-000000000013",
};

// ===================== ROLE DEFINITIONS (from PDF) =====================

const ROLES_TO_CREATE = [
  // 1. CEO / AD - Nicola Bertolotto (non nel PDF, dati sensati)
  {
    member: MEMBERS.bertolotto,
    role: {
      title: "CEO / Amministratore Delegato",
      company_id: COMPANY_ID,
      org_node_id: NODES.generalMgmt,
      description: "Amministratore Delegato della filiale italiana di Dürr Dental, responsabile della strategia aziendale, delle performance commerciali e del coordinamento con la casa madre tedesca.",
      responsibilities: [
        "Definizione e implementazione della strategia aziendale per il mercato italiano",
        "Coordinamento e supervisione di tutte le direzioni aziendali",
        "Rapporti con la casa madre Dürr Dental SE in Germania",
        "Raggiungimento degli obiettivi di fatturato e redditività",
        "Rappresentanza legale e istituzionale dell'azienda",
        "Gestione delle relazioni con clienti strategici e key account",
        "Approvazione del budget annuale e monitoraggio performance",
        "Sviluppo del business e identificazione nuove opportunità di mercato"
      ],
      daily_tasks: [
        "Riunioni di allineamento con i responsabili di direzione",
        "Analisi dei KPI aziendali e delle performance commerciali",
        "Reporting verso la casa madre tedesca",
        "Incontri con clienti chiave e partner strategici",
        "Revisione e approvazione delle politiche commerciali",
        "Supervisione dei progetti strategici in corso",
        "Gestione delle relazioni con stakeholder esterni"
      ],
      kpis: [
        { name: "Fatturato annuale", target: "Budget annuale con crescita YoY" },
        { name: "EBITDA margin", target: ">15%" },
        { name: "Market share Italia", target: "Crescita anno su anno" },
        { name: "Employee satisfaction", target: ">80%" },
        { name: "Customer retention rate", target: ">90%" }
      ],
      required_hard_skills: [
        { name: "Strategic management", level: 5 },
        { name: "Business development B2B", level: 5 },
        { name: "Financial analysis e budgeting", level: 4 },
        { name: "Conoscenza mercato dentale/medicale", level: 5 },
        { name: "ERP e sistemi gestionali", level: 3 }
      ],
      required_soft_skills: [
        { name: "Leadership strategica", level: 5 },
        { name: "Visione d'insieme e pensiero strategico", level: 5 },
        { name: "Negoziazione ad alto livello", level: 5 },
        { name: "Comunicazione istituzionale", level: 5 },
        { name: "Decision making", level: 5 },
        { name: "People management", level: 4 }
      ],
      required_languages: [
        { language: "Italiano", level: "native" },
        { language: "Inglese", level: "advanced" },
        { language: "Tedesco", level: "advanced" }
      ],
      required_education: [{ degree: "Laurea in Economia, Ingegneria o MBA", mandatory: true }],
      required_certifications: [],
      required_seniority: "C-Level",
      years_experience_min: 10,
      contract_type: "permanent",
      work_hours_type: "full_time",
      remote_policy: "on_site",
      status: "active",
      headcount: 1,
      is_hiring: false
    }
  },

  // 2. Responsabile Service - Claudio Venturini (dal PDF)
  {
    member: MEMBERS.venturini,
    role: {
      title: "Responsabile Service & Technical Support",
      company_id: COMPANY_ID,
      org_node_id: NODES.dirService,
      description: "Coordinamento e ottimizzazione delle attività del team di assistenza tecnica, garantendo elevati standard di qualità nel servizio post-vendita.",
      responsibilities: [
        "Qualità complessiva del servizio di assistenza tecnica",
        "Raggiungimento degli obiettivi economici del reparto",
        "Sviluppo professionale e motivazione del team",
        "Rispetto degli standard di sicurezza negli interventi",
        "Gestione efficiente delle risorse (personale, mezzi, materiali)",
        "Soddisfazione e fidelizzazione dei clienti",
        "Conformità alle procedure aziendali e normative di settore"
      ],
      daily_tasks: [
        "Gestione, coordinamento e supervisione del team tecnico",
        "Pianificazione e ottimizzazione delle attività di assistenza e degli interventi",
        "Gestione dello smistamento delle richieste di assistenza",
        "Monitoraggio delle performance individuali e di team",
        "Gestione delle escalation e dei casi tecnici complessi",
        "Formazione tecnica continua del personale",
        "Rapporti con la casa madre per supporto tecnico avanzato",
        "Gestione delle garanzie e delle politiche di assistenza",
        "Ottimizzazione dello stock ricambi e materiali tecnici",
        "Sviluppo e promozione di contratti di manutenzione",
        "Analisi dei dati service e reportistica per il management",
        "Gestione del budget del reparto service",
        "Assistenza telefonica, remota, via WhatsApp e mail con clienti/fornitori",
        "Controllo apparecchi/ricambi per invio in Germania",
        "Corsi tecnici in presenza e webinar",
        "Gestione magazzino ricambi digitale"
      ],
      kpis: [
        { name: "Customer Satisfaction complessiva", target: ">90%" },
        { name: "Efficienza team: ore fatturabili/ore lavorate", target: ">70%" },
        { name: "First Time Fix Rate del team", target: ">80%" },
        { name: "Fatturato service (interventi + ricambi)", target: "Budget annuale" },
        { name: "Marginalità del service", target: ">40%" },
        { name: "Tempo medio di risposta del team", target: "<4h" },
        { name: "Tasso retention contratti manutenzione", target: ">85%" },
        { name: "Reclami service", target: "<2% degli interventi" }
      ],
      required_hard_skills: [
        { name: "Apparecchiature odontoiatriche Dürr Dental", level: 5 },
        { name: "Conoscenze elettromeccaniche ed elettroniche avanzate", level: 4 },
        { name: "Software gestionali service", level: 4 },
        { name: "Analisi dati tecnici e KPI operativi", level: 4 },
        { name: "Normative dispositivi medici (MDR, CEI)", level: 4 },
        { name: "Gestione scorte tecniche e ricambi", level: 4 },
        { name: "Processi di qualità e procedure ISO", level: 3 }
      ],
      required_soft_skills: [
        { name: "Leadership e gestione team", level: 5 },
        { name: "Pianificazione e organizzazione risorse", level: 5 },
        { name: "People management e sviluppo competenze", level: 4 },
        { name: "Problem solving strategico e operativo", level: 4 },
        { name: "Orientamento al risultato e al cliente", level: 5 },
        { name: "Negoziazione e gestione conflitti", level: 4 },
        { name: "Resilienza e gestione dello stress", level: 4 }
      ],
      required_languages: [
        { language: "Italiano", level: "native" },
        { language: "Inglese", level: "advanced" },
        { language: "Tedesco", level: "intermediate" }
      ],
      required_education: [{ degree: "Diploma tecnico superiore o Laurea in Ingegneria", mandatory: false }],
      required_certifications: ["Abilitazione PES/PAV"],
      required_seniority: "Senior",
      years_experience_min: 5,
      contract_type: "permanent",
      work_hours_type: "full_time",
      remote_policy: "on_site",
      status: "active",
      headcount: 1,
      is_hiring: false
    }
  },

  // 3. Responsabile Logistica - Fabrizio Dose (non nel PDF, dati sensati)
  {
    member: MEMBERS.dose,
    role: {
      title: "Responsabile Logistica",
      company_id: COMPANY_ID,
      org_node_id: NODES.dirLogistica,
      description: "Coordinamento delle attività logistiche della filiale italiana, gestione del magazzino e ottimizzazione dei flussi di merce.",
      responsibilities: [
        "Coordinamento delle operazioni logistiche e di magazzino",
        "Ottimizzazione dei flussi di approvvigionamento e distribuzione",
        "Gestione dei rapporti con corrieri e spedizionieri",
        "Supervisione delle scorte e politiche di riordino",
        "Rispetto delle normative di sicurezza in magazzino",
        "Gestione del budget logistico"
      ],
      daily_tasks: [
        "Supervisione delle attività quotidiane di magazzino",
        "Pianificazione spedizioni e coordinamento con corrieri",
        "Monitoraggio livelli di scorta e riordini",
        "Coordinamento con il reparto commerciale per consegne urgenti",
        "Analisi dei costi logistici e ottimizzazione",
        "Gestione inventari e controllo qualità merce"
      ],
      kpis: [
        { name: "Puntualità consegne", target: ">95%" },
        { name: "Accuratezza inventariale", target: ">98%" },
        { name: "Costi logistici su fatturato", target: "Riduzione YoY" },
        { name: "Tempo evasione ordini", target: "<24h" }
      ],
      required_hard_skills: [
        { name: "Supply chain management", level: 4 },
        { name: "Gestionale magazzino (IFS)", level: 4 },
        { name: "Logistica e trasporti", level: 4 },
        { name: "Gestione scorte e inventari", level: 4 }
      ],
      required_soft_skills: [
        { name: "Organizzazione e pianificazione", level: 5 },
        { name: "Problem solving operativo", level: 4 },
        { name: "Coordinamento team", level: 4 },
        { name: "Precisione e attenzione ai dettagli", level: 4 }
      ],
      required_languages: [
        { language: "Italiano", level: "native" },
        { language: "Inglese", level: "intermediate" }
      ],
      required_education: [{ degree: "Diploma o Laurea in Logistica/Ingegneria Gestionale", mandatory: false }],
      required_certifications: [],
      required_seniority: "Senior",
      years_experience_min: 5,
      contract_type: "permanent",
      work_hours_type: "full_time",
      remote_policy: "on_site",
      status: "active",
      headcount: 1,
      is_hiring: false
    }
  },

  // 4. Responsabile Amministrativo - Tessa Sangalli (dal PDF)
  {
    member: MEMBERS.sangalli,
    role: {
      title: "Responsabile Amministrativo",
      company_id: COMPANY_ID,
      org_node_id: NODES.dirAmm,
      description: "Gestione amministrativa, contabile e fiscale della filiale italiana, con supervisione del team amministrativo e reporting verso la casa madre.",
      responsibilities: [
        "Correttezza e veridicità delle informazioni contabili e finanziarie",
        "Conformità alle normative fiscali e alle procedure aziendali",
        "Tutela del patrimonio aziendale",
        "Ottimizzazione del capitale circolante",
        "Supervisione e sviluppo del team amministrativo",
        "Gestione del rischio di credito"
      ],
      daily_tasks: [
        "Contabilità generale (tutte le registrazioni contabili)",
        "Inserimento fatture manuali fornitori IT + autofatture IT",
        "Controlli fornitori IT: DDT, ordini, utenze, contratti, consulenze",
        "Gestione cassa contanti",
        "Gestione Banca Intesa + conto cash pool (incassi, pagamenti)",
        "Carte di credito: controllo e registrazione",
        "Assicurazioni: rapporti con Broker Funk per RC, autovetture, polizze dirigenti",
        "Rapporti con Consulente Fiscale e Revisore",
        "Rapporti con DE: controllo fatturato e Jedox, verifiche IC mensili e quadrimestrali",
        "Redazione Budget annuale (esclusa parte sales)",
        "Dichiarazione trimestrale CONAI",
        "HR: rapporti consulente lavoro, gestione portale paghe, cedolini",
        "Bonifici stipendi, note spese, fondi pensione",
        "Gestione ticket Edenred e fringe benefit"
      ],
      kpis: [
        { name: "Rispetto scadenze fiscali e amministrative", target: "100%" },
        { name: "DSO (Days Sales Outstanding)", target: "<60 giorni" },
        { name: "Scaduto oltre 90 giorni", target: "<5%" },
        { name: "Accuratezza chiusure mensili", target: "Entro 5 gg lavorativi" },
        { name: "Riduzione costi amministrativi su fatturato", target: "YoY" },
        { name: "Tasso conformità audit", target: "100%" }
      ],
      required_hard_skills: [
        { name: "Contabilità generale e analitica", level: 5 },
        { name: "Normative fiscali e tributarie italiane", level: 5 },
        { name: "Budgeting e controllo di gestione", level: 4 },
        { name: "Software gestionali ERP (IFS)", level: 5 },
        { name: "Excel avanzato e analisi dati", level: 5 },
        { name: "Standard IAS/IFRS", level: 3 },
        { name: "Diritto commerciale e contrattualistica", level: 3 }
      ],
      required_soft_skills: [
        { name: "Leadership e coordinamento team", level: 4 },
        { name: "Capacità analitiche e problem solving", level: 5 },
        { name: "Visione strategica", level: 4 },
        { name: "Capacità decisionali e gestione stress", level: 4 },
        { name: "Integrità e senso etico", level: 5 },
        { name: "Capacità di negoziazione", level: 4 },
        { name: "Comunicazione efficace con il management", level: 4 }
      ],
      required_languages: [
        { language: "Italiano", level: "native" },
        { language: "Inglese", level: "advanced" },
        { language: "Tedesco", level: "intermediate" }
      ],
      required_education: [{ degree: "Laurea in Economia, Finanza o equipollenti", mandatory: true }],
      required_certifications: [],
      required_seniority: "Senior",
      years_experience_min: 5,
      contract_type: "permanent",
      work_hours_type: "full_time",
      remote_policy: "on_site",
      status: "active",
      headcount: 1,
      is_hiring: false
    }
  },

  // 5. Area Manager - Michele Cassano (dal PDF)
  {
    member: MEMBERS.cassano,
    role: {
      title: "Area Manager",
      company_id: COMPANY_ID,
      org_node_id: NODES.teamSales,
      description: "Sviluppo e gestione del portafoglio clienti nell'area geografica assegnata, con focus sulla massimizzazione del fatturato e l'acquisizione di nuovi clienti.",
      responsibilities: [
        "Raggiungimento target di vendita dell'area",
        "Qualità delle relazioni con i clienti chiave",
        "Corretta rappresentazione del brand Dürr Dental",
        "Accuratezza delle previsioni di vendita (forecast)",
        "Gestione del budget spese dell'area",
        "Applicazione corretta delle politiche commerciali",
        "Condivisione di informazioni strategiche sul mercato",
        "Collaborazione con gli altri reparti aziendali"
      ],
      daily_tasks: [
        "Gestione e sviluppo del portafoglio clienti nell'area assegnata",
        "Visite commerciali presso studi dentistici",
        "Identificazione e acquisizione di nuovi clienti (prospect)",
        "Negoziazione commerciale e chiusura contratti",
        "Presentazione gamma prodotti e soluzioni Dürr Dental",
        "Elaborazione offerte commerciali personalizzate",
        "Analisi del territorio e della concorrenza",
        "Collaborazione con Product Specialist per progetti complessi",
        "Partecipazione a fiere, congressi ed eventi di settore",
        "Gestione reclami e mantenimento relazioni clienti",
        "Reportistica commerciale e aggiornamento CRM",
        "Raccolta feedback dal mercato per sviluppo prodotti"
      ],
      kpis: [
        { name: "Fatturato area", target: "Budget annuale con crescita YoY" },
        { name: "Nuovi clienti acquisiti", target: "Target annuale" },
        { name: "Tasso di crescita vs anno precedente", target: ">8%" },
        { name: "Coverage area: visite/clienti attivi", target: "1 visita/trimestre" },
        { name: "Tasso conversione opportunità/ordini", target: ">40%" },
        { name: "Customer retention rate", target: ">90%" }
      ],
      required_hard_skills: [
        { name: "Gamma prodotti Dürr Dental", level: 4 },
        { name: "Tecniche di vendita consultiva e relazionale", level: 5 },
        { name: "CRM e strumenti di sales automation", level: 4 },
        { name: "Negoziazione commerciale avanzata", level: 5 },
        { name: "Account management", level: 4 },
        { name: "Analisi di mercato e competitive intelligence", level: 3 }
      ],
      required_soft_skills: [
        { name: "Eccellenti capacità relazionali e comunicative", level: 5 },
        { name: "Orientamento ai risultati e alla crescita", level: 5 },
        { name: "Autogestione e disciplina personale", level: 5 },
        { name: "Resilienza e tenacia", level: 4 },
        { name: "Problem solving orientato al cliente", level: 4 },
        { name: "Intelligenza emotiva", level: 4 }
      ],
      required_languages: [
        { language: "Italiano", level: "native" },
        { language: "Inglese", level: "intermediate" }
      ],
      required_education: [{ degree: "Laurea in discipline economiche, scientifiche o ingegneristiche", mandatory: false }],
      required_certifications: ["Patente B"],
      required_seniority: "Mid",
      years_experience_min: 3,
      contract_type: "permanent",
      work_hours_type: "full_time",
      remote_policy: "flexible",
      status: "active",
      headcount: 1,
      is_hiring: false
    }
  },

  // 6. Sales Specialist - Marco Fabio (non nel PDF, dati sensati)
  {
    member: MEMBERS.fabio,
    role: {
      title: "Sales Specialist",
      company_id: COMPANY_ID,
      org_node_id: NODES.teamSales,
      description: "Supporto commerciale specializzato nella vendita di soluzioni Dürr Dental, con focus su clienti del territorio assegnato.",
      responsibilities: [
        "Raggiungimento obiettivi di vendita assegnati",
        "Gestione e sviluppo del portafoglio clienti",
        "Rappresentazione professionale del brand Dürr Dental",
        "Supporto agli Area Manager nelle trattative complesse"
      ],
      daily_tasks: [
        "Visite commerciali presso studi dentistici e laboratori",
        "Presentazione della gamma prodotti ai clienti",
        "Elaborazione di preventivi e offerte commerciali",
        "Follow-up su trattative in corso",
        "Aggiornamento CRM con dati clienti e opportunità",
        "Partecipazione a eventi e fiere di settore",
        "Reportistica commerciale periodica"
      ],
      kpis: [
        { name: "Fatturato personale", target: "Budget assegnato" },
        { name: "Nuovi clienti acquisiti", target: "Target trimestrale" },
        { name: "Tasso conversione offerte/ordini", target: ">35%" },
        { name: "Numero visite settimanali", target: ">15" }
      ],
      required_hard_skills: [
        { name: "Gamma prodotti Dürr Dental", level: 4 },
        { name: "Tecniche di vendita B2B", level: 4 },
        { name: "CRM e gestione pipeline", level: 3 },
        { name: "Conoscenza settore dentale", level: 3 }
      ],
      required_soft_skills: [
        { name: "Capacità relazionali e comunicative", level: 4 },
        { name: "Orientamento ai risultati", level: 4 },
        { name: "Proattività e spirito commerciale", level: 4 },
        { name: "Autonomia operativa", level: 4 }
      ],
      required_languages: [
        { language: "Italiano", level: "native" },
        { language: "Inglese", level: "basic" }
      ],
      required_education: [{ degree: "Diploma o Laurea", mandatory: false }],
      required_certifications: ["Patente B"],
      required_seniority: "Mid",
      years_experience_min: 2,
      contract_type: "permanent",
      work_hours_type: "full_time",
      remote_policy: "flexible",
      status: "active",
      headcount: 1,
      is_hiring: false
    }
  },

  // 7. Marketing Specialist - Giulia Bartoli (dal PDF)
  {
    member: MEMBERS.bartoli,
    role: {
      title: "Marketing Specialist",
      company_id: COMPANY_ID,
      org_node_id: NODES.teamMarketing,
      description: "Sviluppo e implementazione delle strategie di marketing operativo per il brand Dürr Dental sul mercato italiano.",
      responsibilities: [
        "Coerenza della comunicazione con i valori e l'immagine del brand Dürr Dental",
        "Qualità dei contenuti e materiali prodotti",
        "Rispetto dei budget assegnati alle attività marketing",
        "Risultati delle campagne in termini di lead generation",
        "Puntualità nell'organizzazione di eventi e iniziative",
        "Aggiornamento e correttezza dei dati nel CRM",
        "Collaborazione efficace con il team commerciale"
      ],
      daily_tasks: [
        "Pianificazione ed esecuzione di campagne marketing multicanale",
        "Creazione di contenuti per social media, website, newsletter, brochure",
        "Gestione dei canali social aziendali (LinkedIn, Facebook, Instagram)",
        "Coordinamento con agenzie esterne per materiali grafici e video",
        "Supporto alla forza vendita con materiali di presentazione",
        "Gestione del CRM HubSpot: lead nurturing, campagne email",
        "Analisi di mercato e monitoraggio competitor",
        "Reportistica su performance campagne",
        "Organizzazione eventi: fiere, congressi, corsi e attività promozionali",
        "Gestione Academy aziendale per formazione tecnici",
        "Profilazione e gestione contatti nel CRM",
        "Ideazione e realizzazione di grafiche e video aziendali"
      ],
      kpis: [
        { name: "Lead qualificati generati", target: "Target mensile/trimestrale" },
        { name: "Tasso conversione lead → opportunità", target: ">25%" },
        { name: "Reach e engagement canali digitali", target: "Crescita trimestrale" },
        { name: "ROI campagne marketing", target: ">1:3" },
        { name: "Utilizzo materiali marketing dalla rete vendita", target: ">80%" }
      ],
      required_hard_skills: [
        { name: "Marketing digitale (Google Ads, Meta, LinkedIn Ads)", level: 4 },
        { name: "CRM e marketing automation (HubSpot)", level: 4 },
        { name: "Grafica (Canva, Adobe Creative Suite)", level: 3 },
        { name: "Analytics e monitoring (Google Analytics)", level: 4 },
        { name: "Copywriting multicanale", level: 4 },
        { name: "SEO e content marketing", level: 3 },
        { name: "Organizzazione eventi", level: 4 },
        { name: "Email marketing e automation", level: 3 }
      ],
      required_soft_skills: [
        { name: "Creatività e pensiero innovativo", level: 4 },
        { name: "Capacità comunicative scritte e orali", level: 5 },
        { name: "Organizzazione e gestione progetti multipli", level: 4 },
        { name: "Orientamento ai dati e approccio analitico", level: 4 },
        { name: "Flessibilità e adattabilità", level: 4 },
        { name: "Team working interfunzionale", level: 4 },
        { name: "Attenzione ai dettagli", level: 4 }
      ],
      required_languages: [
        { language: "Italiano", level: "native" },
        { language: "Inglese", level: "advanced" },
        { language: "Tedesco", level: "basic" }
      ],
      required_education: [{ degree: "Laurea in Marketing, Comunicazione o Economia", mandatory: false }],
      required_certifications: [],
      required_seniority: "Mid",
      years_experience_min: 2,
      contract_type: "permanent",
      work_hours_type: "full_time",
      remote_policy: "on_site",
      status: "active",
      headcount: 1,
      is_hiring: false
    }
  },

  // 8. Marketing Specialist - Massimiliano Cerati (dal PDF, stesso mansionario)
  {
    member: MEMBERS.cerati,
    role: {
      title: "Marketing Specialist",
      company_id: COMPANY_ID,
      org_node_id: NODES.teamMarketing,
      description: "Sviluppo e implementazione delle strategie di marketing operativo per il brand Dürr Dental, con focus su contenuti digitali e comunicazione.",
      responsibilities: [
        "Coerenza della comunicazione con i valori e l'immagine del brand",
        "Qualità dei contenuti e materiali prodotti",
        "Rispetto dei budget assegnati",
        "Risultati delle campagne in termini di lead generation",
        "Collaborazione efficace con il team commerciale"
      ],
      daily_tasks: [
        "Creazione contenuti per social media e canali digitali",
        "Produzione e montaggio video aziendali e reel",
        "Gestione canali social aziendali",
        "Ideazione e realizzazione di grafiche e banner",
        "Supporto organizzazione eventi e fiere",
        "Collaborazione e networking con partner nazionali",
        "Coordinamento con casa madre per allineamento strategico",
        "Reportistica performance campagne digitali"
      ],
      kpis: [
        { name: "Engagement rate social media", target: "Crescita mensile" },
        { name: "Contenuti prodotti", target: "Target settimanale" },
        { name: "Lead generati da campagne", target: "Target trimestrale" },
        { name: "Reach organico", target: "Crescita trimestrale" }
      ],
      required_hard_skills: [
        { name: "Marketing digitale e social media", level: 4 },
        { name: "Grafica e video editing", level: 4 },
        { name: "CRM HubSpot", level: 3 },
        { name: "Content creation e copywriting", level: 4 },
        { name: "Analytics e monitoring", level: 3 }
      ],
      required_soft_skills: [
        { name: "Creatività e pensiero innovativo", level: 5 },
        { name: "Capacità comunicative", level: 4 },
        { name: "Organizzazione e gestione progetti", level: 4 },
        { name: "Flessibilità e adattabilità", level: 4 },
        { name: "Problem solving e proattività", level: 4 }
      ],
      required_languages: [
        { language: "Italiano", level: "native" },
        { language: "Inglese", level: "intermediate" }
      ],
      required_education: [{ degree: "Laurea o Diploma in Marketing/Comunicazione", mandatory: false }],
      required_certifications: [],
      required_seniority: "Mid",
      years_experience_min: 2,
      contract_type: "permanent",
      work_hours_type: "full_time",
      remote_policy: "on_site",
      status: "active",
      headcount: 1,
      is_hiring: false
    }
  },

  // 9. Commerciale Interno - Barbara Pasqualini (dal PDF)
  {
    member: MEMBERS.pasqualini,
    role: {
      title: "Commerciale Interno (Gestione Ordini)",
      company_id: COMPANY_ID,
      org_node_id: NODES.gestioneOrdini,
      description: "Gestione delle attività di backoffice commerciale, supporto alla forza vendite e customer experience nelle interazioni con i clienti.",
      responsibilities: [
        "Accuratezza nella preparazione di offerte e ordini",
        "Qualità della relazione con i clienti assegnati",
        "Corretta applicazione delle politiche commerciali e dei listini",
        "Collaborazione con il team commerciale",
        "Aggiornamento costante sulla gamma prodotti"
      ],
      daily_tasks: [
        "Ricezione e inserimento ordini a sistema IFS, verifica prezzi e condizioni",
        "Invio conferme ordine e archiviazione documentazione",
        "Coordinamento quotidiano con il magazzino per pianificazione spedizioni",
        "Monitoraggio stato ordini e aggiornamento clienti",
        "Supporto ai Product Specialist e Area Manager",
        "Gestione reclami commerciali di primo livello",
        "Identificazione opportunità di vendita (prodotti in scadenza, rigenerati)",
        "Controllo fatturato ogni 15 gg a verifica raggiungimento obiettivo mensile",
        "Controllo pre-fatturazione definitiva",
        "Controllo scadenze e recupero crediti",
        "Preparazione portafoglio riba e quadratura contabile",
        "Gestione COFACE con trasmissione dati in Germania",
        "Gestione ordini acquisti fornitore Dürr Dental",
        "Gestione contabile carichi-scarichi magazzino",
        "Quadratura mensile contabilità/magazzino/COFACE",
        "Inventario di fine anno"
      ],
      kpis: [
        { name: "Tempestività gestione richieste", target: "<24h" },
        { name: "Accuratezza ordini inseriti", target: ">99%" },
        { name: "Errori di fatturazione", target: "<0,5%" },
        { name: "Quadratura contabile mensile", target: "100%" }
      ],
      required_hard_skills: [
        { name: "Gamma prodotti Dürr Dental", level: 4 },
        { name: "Software CRM e gestionali (IFS)", level: 5 },
        { name: "Office (Excel, Word, PowerPoint)", level: 4 },
        { name: "Elaborazione preventivi e offerte", level: 4 },
        { name: "Settore dentale e dinamiche di mercato", level: 3 },
        { name: "Vendita telefonica e digitale", level: 3 },
        { name: "Contabilità di magazzino", level: 4 }
      ],
      required_soft_skills: [
        { name: "Capacità comunicative e relazionali", level: 5 },
        { name: "Orientamento al cliente e al servizio", level: 5 },
        { name: "Proattività e spirito commerciale", level: 4 },
        { name: "Organizzazione e gestione del tempo", level: 5 },
        { name: "Orientamento agli obiettivi", level: 4 },
        { name: "Resilienza e gestione dello stress", level: 4 },
        { name: "Team working", level: 4 }
      ],
      required_languages: [
        { language: "Italiano", level: "native" },
        { language: "Inglese", level: "intermediate" },
        { language: "Tedesco", level: "basic" }
      ],
      required_education: [{ degree: "Diploma di scuola secondaria superiore o Laurea triennale", mandatory: false }],
      required_certifications: [],
      required_seniority: "Mid",
      years_experience_min: 3,
      contract_type: "permanent",
      work_hours_type: "full_time",
      remote_policy: "on_site",
      status: "active",
      headcount: 1,
      is_hiring: false
    }
  },

  // 10-13. Service & Technical Support - 4 tecnici (dal PDF)
  ...["romano", "griffini", "piani", "luppichini"].map((key) => ({
    member: MEMBERS[key],
    role: {
      title: "Tecnico Service & Technical Support",
      company_id: COMPANY_ID,
      org_node_id: NODES.serviceTrad,
      description: "Assistenza tecnica qualificata su apparecchiature Dürr Dental, con interventi di installazione, manutenzione e riparazione presso studi dentistici.",
      responsibilities: [
        "Qualità e sicurezza degli interventi tecnici",
        "Corretta gestione delle apparecchiature e strumentazioni in dotazione",
        "Rispetto degli appuntamenti e puntualità negli interventi",
        "Rappresentanza professionale dell'azienda presso i clienti",
        "Riservatezza sulle informazioni acquisite presso gli studi",
        "Segnalazione di opportunità commerciali al team sales",
        "Gestione accurata dei materiali e ricambi assegnati"
      ],
      daily_tasks: [
        "Assistenza telefonica e remota per troubleshooting",
        "Pianificazione e esecuzione interventi on-site presso studi dentistici",
        "Installazione e collaudo di nuove apparecchiature",
        "Manutenzione preventiva programmata secondo contratti",
        "Diagnosi guasti e riparazione di apparecchiature",
        "Sostituzione componenti e parti di ricambio",
        "Formazione tecnica di base ai clienti",
        "Compilazione report d'intervento dettagliati",
        "Gestione stock personale di ricambi e materiali",
        "Aggiornamento del sistema gestionale con interventi",
        "Collaborazione con supporto tecnico casa madre",
        "Assistenza IT interna ai colleghi",
        "Assistenza servizi esterni (allarme, sicurezza, antincendio)"
      ],
      kpis: [
        { name: "Fidelity vendute", target: "Target mensile" },
        { name: "First Time Fix Rate", target: ">80%" },
        { name: "Tempo medio risposta chiamate", target: "<4h" },
        { name: "Tempo medio risoluzione problemi", target: "<48h" },
        { name: "Customer Satisfaction post-intervento", target: ">4,5/5" },
        { name: "Contratti manutenzione rinnovati", target: ">85%" },
        { name: "Chiamate ripetute stesso problema", target: "<5%" }
      ],
      required_hard_skills: [
        { name: "Competenze elettromeccaniche e/o elettroniche", level: 4 },
        { name: "Apparecchiature odontoiatriche (compressori, aspiratori, sterilizzatori, radiologia)", level: 4 },
        { name: "Diagnosi guasti e troubleshooting", level: 4 },
        { name: "Strumenti di misura e diagnostica", level: 4 },
        { name: "Componentistica tecnica e ricambi", level: 4 },
        { name: "Assistenza remota informatica", level: 3 },
        { name: "Normative sicurezza elettrica e dispositivi medici", level: 3 },
        { name: "Lettura schemi elettrici e tecnici", level: 4 }
      ],
      required_soft_skills: [
        { name: "Problem solving pratico e rapido", level: 5 },
        { name: "Manualità e precisione", level: 5 },
        { name: "Capacità relazionali con i clienti", level: 4 },
        { name: "Orientamento al servizio e customer satisfaction", level: 4 },
        { name: "Autonomia operativa", level: 4 },
        { name: "Capacità di lavorare sotto pressione", level: 4 },
        { name: "Flessibilità e disponibilità (trasferte)", level: 4 },
        { name: "Approccio metodico e analitico", level: 3 }
      ],
      required_languages: [
        { language: "Italiano", level: "native" },
        { language: "Inglese", level: "basic" },
        { language: "Tedesco", level: "basic" }
      ],
      required_education: [{ degree: "Diploma tecnico (elettrico, elettronico, meccanico, meccatronico)", mandatory: true }],
      required_certifications: ["Abilitazione PES/PAV", "Patente B"],
      required_seniority: "Mid",
      years_experience_min: 2,
      contract_type: "permanent",
      work_hours_type: "full_time",
      remote_policy: "on_site",
      status: "active",
      headcount: 1,
      is_hiring: false
    }
  })),

  // 14. Product Specialist - Ivan Carlo Pagnini (dal PDF)
  {
    member: MEMBERS.pagnini,
    role: {
      title: "Product Specialist",
      company_id: COMPANY_ID,
      org_node_id: NODES.serviceDigital,
      description: "Promozione e vendita di linee di prodotti ad alto contenuto tecnologico (CBCT e imaging digitale), consulenza specialistica e formazione tecnica avanzata.",
      responsibilities: [
        "Raggiungimento obiettivi di vendita sulle linee di prodotto assegnate",
        "Qualità della consulenza tecnica fornita",
        "Posizionamento premium dei prodotti ad alto valore",
        "Mantenimento di elevate competenze tecniche specialistiche",
        "Collaborazione efficace con il team commerciale",
        "Rappresentanza dell'eccellenza tecnologica Dürr Dental",
        "Gestione di progetti complessi rispettando tempi e specifiche",
        "Trasferimento di conoscenze tecniche al team interno"
      ],
      daily_tasks: [
        "Vendita consultiva di soluzioni complesse e ad alto valore tecnologico",
        "Analisi fabbisogni specifici dei clienti e progettazione soluzioni",
        "Dimostrazioni tecniche presso studi dentistici e cliniche",
        "Supporto tecnico-commerciale specialistico agli Area Manager",
        "Formazione tecnica ai clienti sull'utilizzo avanzato dei prodotti",
        "Gestione trattative complesse con decision maker multipli",
        "Far crescere il team nelle conoscenze della tecnologia CBCT",
        "Ottimizzare qualità e stabilità della CBCT",
        "Application Specialist per formazione utenti finali (Dentisti)",
        "Formazione tecnici specializzati per installazione prodotti High Tech",
        "Ricerca soluzioni alternative per ampliare potenzialità CBCT",
        "Supporto al Marketing per articoli e video sui canali social",
        "Preparazione PC di ricostruzione per CBCT",
        "Realizzazione PowerPoint per Area Manager"
      ],
      kpis: [
        { name: "Fatturato linee di prodotto assegnate", target: "Budget annuale" },
        { name: "Progetti complessi chiusi", target: "Target trimestrale" },
        { name: "Dimostrazioni/training eseguiti", target: "Target mensile" },
        { name: "Tasso conversione demo/vendita", target: ">50%" },
        { name: "Penetrazione prodotti su clienti chiave", target: "Incremento YoY" },
        { name: "Customer satisfaction supporto specialistico", target: ">90%" }
      ],
      required_hard_skills: [
        { name: "Tecnologie odontoiatriche avanzate (imaging, CBCT)", level: 5 },
        { name: "Progettazione soluzioni integrate complesse", level: 4 },
        { name: "Normative tecniche e di installazione", level: 4 },
        { name: "Diagnostica per immagini dentale", level: 5 },
        { name: "Workflow digitale odontoiatrico", level: 4 },
        { name: "Vendita consultiva e solution selling", level: 4 },
        { name: "Gestione trattative multi-stakeholder", level: 4 }
      ],
      required_soft_skills: [
        { name: "Comunicazione tecnica e commerciale", level: 5 },
        { name: "Capacità didattiche e di formazione", level: 5 },
        { name: "Problem solving complesso", level: 4 },
        { name: "Gestione progetti articolati", level: 4 },
        { name: "Orientamento all'innovazione", level: 5 },
        { name: "Credibilità e autorevolezza tecnica", level: 5 },
        { name: "Networking ad alto livello", level: 4 }
      ],
      required_languages: [
        { language: "Italiano", level: "native" },
        { language: "Inglese", level: "advanced" },
        { language: "Tedesco", level: "basic" }
      ],
      required_education: [{ degree: "Laurea in Ingegneria o discipline scientifiche/tecniche", mandatory: false }],
      required_certifications: ["Patente B"],
      required_seniority: "Senior",
      years_experience_min: 3,
      contract_type: "permanent",
      work_hours_type: "full_time",
      remote_policy: "flexible",
      status: "active",
      headcount: 1,
      is_hiring: false
    }
  },

  // 15. Service & Repair - Alberto Scudier (dal PDF)
  {
    member: MEMBERS.scudier,
    role: {
      title: "Tecnico Service & Repair",
      company_id: COMPANY_ID,
      org_node_id: NODES.installazioni,
      description: "Assistenza tecnica specializzata con focus su installazioni, riparazioni e progettazione CAD di studi dentistici.",
      responsibilities: [
        "Qualità e sicurezza degli interventi tecnici",
        "Corretta gestione delle apparecchiature in dotazione",
        "Rispetto degli appuntamenti e puntualità",
        "Rappresentanza professionale dell'azienda",
        "Riservatezza sulle informazioni acquisite presso gli studi",
        "Segnalazione opportunità commerciali al team sales"
      ],
      daily_tasks: [
        "Customer Service Specialist e progettazione CAD studi dentistici",
        "Analisi completa e implementazione progetti, supervisione lavori",
        "Collaborazione con architetti e ingegneri per monitoraggio lavori",
        "Installazione e collaudo apparecchiature elettromedicali",
        "Assistenza e supporto risoluzione problemi prodotto/servizio",
        "Disinfezione e pulizia attrezzature con prodotti dedicati",
        "Manutenzione e riparazione motori elettrici CC e CA",
        "Diagnostica e misurazioni elettriche, riparazioni meccaniche",
        "Formazione tecnica di alto livello per professionisti del settore",
        "Supporto magazzino in caso di necessità (patentino carrelli)",
        "Supervisione allestimento stand fiera di Rimini"
      ],
      kpis: [
        { name: "Fidelity vendute", target: "Target mensile" },
        { name: "First Time Fix Rate", target: ">80%" },
        { name: "Tempo medio risposta chiamate", target: "<4h" },
        { name: "Tempo medio risoluzione problemi", target: "<48h" },
        { name: "Customer Satisfaction post-intervento", target: ">4,5/5" },
        { name: "Contratti manutenzione rinnovati", target: ">85%" },
        { name: "Chiamate ripetute stesso problema", target: "<5%" }
      ],
      required_hard_skills: [
        { name: "Competenze elettromeccaniche e/o elettroniche", level: 5 },
        { name: "Apparecchiature odontoiatriche", level: 5 },
        { name: "Progettazione CAD studi dentistici", level: 4 },
        { name: "Diagnosi guasti e troubleshooting", level: 5 },
        { name: "Strumenti di misura e diagnostica", level: 4 },
        { name: "Normative sicurezza elettrica e dispositivi medici", level: 4 },
        { name: "Lettura schemi elettrici e tecnici", level: 5 }
      ],
      required_soft_skills: [
        { name: "Problem solving pratico e rapido", level: 5 },
        { name: "Manualità e precisione", level: 5 },
        { name: "Capacità relazionali con clienti", level: 4 },
        { name: "Autonomia operativa", level: 5 },
        { name: "Flessibilità e disponibilità (trasferte)", level: 4 },
        { name: "Approccio metodico e analitico", level: 4 }
      ],
      required_languages: [
        { language: "Italiano", level: "native" },
        { language: "Inglese", level: "basic" },
        { language: "Tedesco", level: "basic" }
      ],
      required_education: [{ degree: "Diploma tecnico (elettrico, elettronico, meccanico)", mandatory: true }],
      required_certifications: ["Abilitazione PES/PAV", "Patente B", "Patentino carrelli elevatori"],
      required_seniority: "Senior",
      years_experience_min: 5,
      contract_type: "permanent",
      work_hours_type: "full_time",
      remote_policy: "on_site",
      status: "active",
      headcount: 1,
      is_hiring: false
    }
  },

  // 16. Magazziniere - Andrea Tompetrini (dal PDF)
  {
    member: MEMBERS.tompetrini,
    role: {
      title: "Magazziniere",
      company_id: COMPANY_ID,
      org_node_id: NODES.magazzino,
      description: "Gestione delle scorte e dei flussi di merce in entrata e uscita, garantendo disponibilità prodotti e ordine dell'area di stoccaggio.",
      responsibilities: [
        "Integrità fisica e conservazione della merce",
        "Corretta identificazione e tracciabilità dei prodotti",
        "Rispetto delle norme di sicurezza sul lavoro",
        "Accuratezza della documentazione di carico e scarico",
        "Segnalazione tempestiva di anomalie o danneggiamenti",
        "Mantenimento dell'ordine e della pulizia del magazzino"
      ],
      daily_tasks: [
        "Ricevimento, controllo qualitativo e quantitativo della merce in arrivo",
        "Stoccaggio dei prodotti secondo procedure e criteri di ottimizzazione spazi",
        "Preparazione degli ordini (picking e packing) secondo le bolle di consegna",
        "Gestione delle spedizioni e coordinamento con i corrieri",
        "Monitoraggio delle scorte e segnalazione necessità di riordino",
        "Esecuzione inventari periodici e di fine anno",
        "Gestione dei resi e delle non conformità",
        "Manutenzione ordinaria degli strumenti di movimentazione",
        "Controllo scadenze prodotti e rotazione FIFO",
        "Aggiornamento del gestionale di magazzino",
        "Confronto periodico pianificato con il service"
      ],
      kpis: [
        { name: "Accuratezza inventariale", target: ">98%" },
        { name: "Tempo medio evasione ordini", target: "<24h" },
        { name: "Errori di spedizione", target: "<1%" }
      ],
      required_hard_skills: [
        { name: "Gestionale magazzino (IFS)", level: 4 },
        { name: "Strumenti di movimentazione (transpallet, carrelli elevatori)", level: 4 },
        { name: "Tecniche di stoccaggio e ottimizzazione spazi", level: 4 },
        { name: "Gestione delle scorte", level: 3 },
        { name: "Procedure di sicurezza sul lavoro", level: 4 }
      ],
      required_soft_skills: [
        { name: "Precisione e attenzione ai dettagli", level: 5 },
        { name: "Organizzazione e metodo di lavoro", level: 4 },
        { name: "Ordine e pulizia", level: 4 },
        { name: "Affidabilità e puntualità", level: 5 },
        { name: "Capacità di lavorare in autonomia", level: 4 },
        { name: "Problem solving operativo", level: 3 }
      ],
      required_languages: [
        { language: "Italiano", level: "native" }
      ],
      required_education: [{ degree: "Diploma di scuola secondaria superiore", mandatory: false }],
      required_certifications: ["Patentino carrelli elevatori"],
      required_seniority: "Mid",
      years_experience_min: 1,
      contract_type: "permanent",
      work_hours_type: "full_time",
      remote_policy: "on_site",
      status: "active",
      headcount: 1,
      is_hiring: false
    }
  },

  // 17. Segreteria e Amministrazione - Alessandra Ciceri (dal PDF)
  {
    member: MEMBERS.ciceri,
    role: {
      title: "Segreteria e Amministrazione",
      company_id: COMPANY_ID,
      org_node_id: NODES.suppAmm,
      description: "Supporto amministrativo all'intera struttura commerciale, gestione documentale e accoglienza secondo gli standard aziendali.",
      responsibilities: [
        "Riservatezza delle informazioni aziendali",
        "Accuratezza e precisione nella gestione dei dati",
        "Rispetto delle scadenze amministrative",
        "Professionalità nella comunicazione con clienti e fornitori",
        "Corretto utilizzo dei sistemi informatici aziendali"
      ],
      daily_tasks: [
        "Gestione corrispondenza in entrata e uscita (email, telefonate, posta)",
        "Inserimento ordini a sistema e verifica corretta elaborazione",
        "Supporto nella preparazione di offerte e preventivi",
        "Gestione agenda e appuntamenti",
        "Archiviazione e gestione documentale",
        "Supporto predisposizione contratti e documentazione commerciale",
        "Gestione anagrafiche clienti e fornitori",
        "Accoglienza visitatori e centralinista",
        "Fatturazione merce/servizi/affitto con invio SDI XML",
        "Registrazione fatture acquisti casa madre con autofattura e invio XML SDI",
        "Controllo file XML SDI con esito positivo",
        "Preparazione Intrastat da inviare alla commercialista",
        "Controllo note spese e invio dati",
        "Gestione assicurazione auto e sinistri",
        "Gestione contratti fornitori",
        "Ordini cancelleria e caffè",
        "Prenotazioni hotel",
        "Invio dichiarazioni di conformità e certificati garanzia 5 anni",
        "Gestione CRM"
      ],
      kpis: [
        { name: "Tempo medio risposta richieste", target: "<4h" },
        { name: "Accuratezza gestione documentale", target: "100%" },
        { name: "Errori in fatturazione", target: "<0,5%" },
        { name: "Pratiche amministrative evase nei tempi", target: ">95%" }
      ],
      required_hard_skills: [
        { name: "Pacchetto Office (Excel, Word, Outlook, PowerPoint)", level: 5 },
        { name: "Gestionale IFS", level: 4 },
        { name: "Gestione documentale e archiviazione", level: 4 },
        { name: "Procedure amministrative di base", level: 4 },
        { name: "Fatturazione elettronica e SDI", level: 4 }
      ],
      required_soft_skills: [
        { name: "Capacità organizzative e multitasking", level: 5 },
        { name: "Attenzione ai dettagli e precisione", level: 5 },
        { name: "Capacità comunicative scritte e orali", level: 4 },
        { name: "Orientamento al cliente interno ed esterno", level: 4 },
        { name: "Riservatezza e discrezione", level: 5 },
        { name: "Gestione delle priorità", level: 4 },
        { name: "Flessibilità e adattabilità", level: 4 }
      ],
      required_languages: [
        { language: "Italiano", level: "native" },
        { language: "Inglese", level: "intermediate" },
        { language: "Tedesco", level: "basic" }
      ],
      required_education: [{ degree: "Diploma di scuola secondaria superiore (indirizzo amministrativo)", mandatory: false }],
      required_certifications: [],
      required_seniority: "Mid",
      years_experience_min: 2,
      contract_type: "permanent",
      work_hours_type: "full_time",
      remote_policy: "on_site",
      status: "active",
      headcount: 1,
      is_hiring: false
    }
  },
];

// ===================== COLLABORATION PROFILES =====================
// Keyed by memberId - these get merged into roles during insertion
// Dorigo (Head of Sales) is excluded - his profile was manually configured

const SERVICE_TECH_COLLAB_PROFILE = {
  environmentalImpact: 4,
  operationalFluidity: 5,
  links: [
    {
      targetType: "team", targetId: NODES.dirService, targetLabel: "Direzione Service",
      collaborationPercentage: 20, personalAffinity: 4,
      memberBreakdown: [{ memberId: MEMBERS.venturini.memberId, memberLabel: "Claudio Venturini", percentage: 100, affinity: 4 }]
    },
    {
      targetType: "team", targetId: NODES.installazioni, targetLabel: "Installazioni",
      collaborationPercentage: 15, personalAffinity: 4,
      memberBreakdown: [{ memberId: MEMBERS.scudier.memberId, memberLabel: "Alberto Scudier", percentage: 100, affinity: 4 }]
    },
    {
      targetType: "team", targetId: NODES.serviceDigital, targetLabel: "Service Digital & R&D",
      collaborationPercentage: 10, personalAffinity: 3,
      memberBreakdown: [{ memberId: MEMBERS.pagnini.memberId, memberLabel: "Ivan Carlo Pagnini", percentage: 100, affinity: 3 }]
    },
    {
      targetType: "team", targetId: NODES.magazzino, targetLabel: "Magazzino",
      collaborationPercentage: 10, personalAffinity: 3,
      memberBreakdown: [{ memberId: MEMBERS.tompetrini.memberId, memberLabel: "Andrea Tompetrini", percentage: 100, affinity: 3 }]
    },
  ]
};

const COLLABORATION_PROFILES: Record<string, any> = {
  // CEO (Bertolotto)
  [MEMBERS.bertolotto.memberId]: {
    environmentalImpact: 2,
    operationalFluidity: 4,
    links: [
      {
        targetType: "team", targetId: NODES.dirSales, targetLabel: "Direzione Sales & Marketing",
        collaborationPercentage: 30, personalAffinity: 4,
        memberBreakdown: [{ memberId: MEMBERS.dorigo.memberId, memberLabel: "Mauro Dorigo", percentage: 100, affinity: 4 }]
      },
      {
        targetType: "team", targetId: NODES.dirService, targetLabel: "Direzione Service",
        collaborationPercentage: 20, personalAffinity: 4,
        memberBreakdown: [{ memberId: MEMBERS.venturini.memberId, memberLabel: "Claudio Venturini", percentage: 100, affinity: 4 }]
      },
      {
        targetType: "team", targetId: NODES.dirAmm, targetLabel: "Direzione Amministrativa",
        collaborationPercentage: 20, personalAffinity: 4,
        memberBreakdown: [{ memberId: MEMBERS.sangalli.memberId, memberLabel: "Tessa Sangalli", percentage: 100, affinity: 4 }]
      },
      {
        targetType: "team", targetId: NODES.dirLogistica, targetLabel: "Direzione Logistica",
        collaborationPercentage: 10, personalAffinity: 3,
        memberBreakdown: [{ memberId: MEMBERS.dose.memberId, memberLabel: "Fabrizio Dose", percentage: 100, affinity: 3 }]
      },
    ]
  },

  // Resp. Service (Venturini)
  [MEMBERS.venturini.memberId]: {
    environmentalImpact: 3,
    operationalFluidity: 3,
    links: [
      {
        targetType: "team", targetId: NODES.serviceTrad, targetLabel: "Service Tradizionale",
        collaborationPercentage: 35, personalAffinity: 4,
        memberBreakdown: [
          { memberId: MEMBERS.romano.memberId, memberLabel: "Paolo Romano", percentage: 25, affinity: 4 },
          { memberId: MEMBERS.griffini.memberId, memberLabel: "Matteo Griffini", percentage: 25, affinity: 4 },
          { memberId: MEMBERS.piani.memberId, memberLabel: "Gabriele Piani", percentage: 25, affinity: 4 },
          { memberId: MEMBERS.luppichini.memberId, memberLabel: "Alberto Luppichini", percentage: 25, affinity: 4 },
        ]
      },
      {
        targetType: "team", targetId: NODES.installazioni, targetLabel: "Installazioni",
        collaborationPercentage: 15, personalAffinity: 4,
        memberBreakdown: [{ memberId: MEMBERS.scudier.memberId, memberLabel: "Alberto Scudier", percentage: 100, affinity: 4 }]
      },
      {
        targetType: "team", targetId: NODES.serviceDigital, targetLabel: "Service Digital & R&D",
        collaborationPercentage: 15, personalAffinity: 4,
        memberBreakdown: [{ memberId: MEMBERS.pagnini.memberId, memberLabel: "Ivan Carlo Pagnini", percentage: 100, affinity: 4 }]
      },
      {
        targetType: "team", targetId: NODES.dirLogistica, targetLabel: "Direzione Logistica",
        collaborationPercentage: 10, personalAffinity: 3,
        memberBreakdown: [{ memberId: MEMBERS.dose.memberId, memberLabel: "Fabrizio Dose", percentage: 100, affinity: 3 }]
      },
    ]
  },

  // Resp. Logistica (Dose)
  [MEMBERS.dose.memberId]: {
    environmentalImpact: 2,
    operationalFluidity: 3,
    links: [
      {
        targetType: "team", targetId: NODES.magazzino, targetLabel: "Magazzino",
        collaborationPercentage: 40, personalAffinity: 4,
        memberBreakdown: [{ memberId: MEMBERS.tompetrini.memberId, memberLabel: "Andrea Tompetrini", percentage: 100, affinity: 4 }]
      },
      {
        targetType: "team", targetId: NODES.gestioneOrdini, targetLabel: "Gestione Ordini",
        collaborationPercentage: 20, personalAffinity: 4,
        memberBreakdown: [{ memberId: MEMBERS.pasqualini.memberId, memberLabel: "Barbara Pasqualini", percentage: 100, affinity: 4 }]
      },
      {
        targetType: "team", targetId: NODES.serviceTrad, targetLabel: "Service Tradizionale",
        collaborationPercentage: 15, personalAffinity: 3,
        memberBreakdown: [
          { memberId: MEMBERS.romano.memberId, memberLabel: "Paolo Romano", percentage: 25, affinity: 3 },
          { memberId: MEMBERS.griffini.memberId, memberLabel: "Matteo Griffini", percentage: 25, affinity: 3 },
          { memberId: MEMBERS.piani.memberId, memberLabel: "Gabriele Piani", percentage: 25, affinity: 3 },
          { memberId: MEMBERS.luppichini.memberId, memberLabel: "Alberto Luppichini", percentage: 25, affinity: 3 },
        ]
      },
    ]
  },

  // Resp. Amministrativo (Sangalli)
  [MEMBERS.sangalli.memberId]: {
    environmentalImpact: 1,
    operationalFluidity: 1,
    links: [
      {
        targetType: "team", targetId: NODES.suppAmm, targetLabel: "Supporto Amministrativo",
        collaborationPercentage: 35, personalAffinity: 5,
        memberBreakdown: [{ memberId: MEMBERS.ciceri.memberId, memberLabel: "Alessandra Ciceri", percentage: 100, affinity: 5 }]
      },
      {
        targetType: "team", targetId: NODES.generalMgmt, targetLabel: "General Management",
        collaborationPercentage: 20, personalAffinity: 4,
        memberBreakdown: [{ memberId: MEMBERS.bertolotto.memberId, memberLabel: "Nicola Bertolotto", percentage: 100, affinity: 4 }]
      },
      {
        targetType: "team", targetId: NODES.dirLogistica, targetLabel: "Direzione Logistica",
        collaborationPercentage: 10, personalAffinity: 3,
        memberBreakdown: [{ memberId: MEMBERS.dose.memberId, memberLabel: "Fabrizio Dose", percentage: 100, affinity: 3 }]
      },
    ]
  },

  // Area Manager (Cassano)
  [MEMBERS.cassano.memberId]: {
    environmentalImpact: 4,
    operationalFluidity: 5,
    links: [
      {
        targetType: "team", targetId: NODES.dirSales, targetLabel: "Direzione Sales & Marketing",
        collaborationPercentage: 25, personalAffinity: 4,
        memberBreakdown: [{ memberId: MEMBERS.dorigo.memberId, memberLabel: "Mauro Dorigo", percentage: 100, affinity: 4 }]
      },
      {
        targetType: "team", targetId: NODES.gestioneOrdini, targetLabel: "Gestione Ordini",
        collaborationPercentage: 20, personalAffinity: 4,
        memberBreakdown: [{ memberId: MEMBERS.pasqualini.memberId, memberLabel: "Barbara Pasqualini", percentage: 100, affinity: 4 }]
      },
      {
        targetType: "team", targetId: NODES.teamMarketing, targetLabel: "Team Marketing",
        collaborationPercentage: 10, personalAffinity: 3,
        memberBreakdown: [
          { memberId: MEMBERS.bartoli.memberId, memberLabel: "Giulia Bartoli", percentage: 50, affinity: 3 },
          { memberId: MEMBERS.cerati.memberId, memberLabel: "Massimiliano Cerati", percentage: 50, affinity: 3 },
        ]
      },
      {
        targetType: "team", targetId: NODES.serviceTrad, targetLabel: "Service Tradizionale",
        collaborationPercentage: 10, personalAffinity: 3,
        memberBreakdown: [
          { memberId: MEMBERS.romano.memberId, memberLabel: "Paolo Romano", percentage: 25, affinity: 3 },
          { memberId: MEMBERS.griffini.memberId, memberLabel: "Matteo Griffini", percentage: 25, affinity: 3 },
          { memberId: MEMBERS.piani.memberId, memberLabel: "Gabriele Piani", percentage: 25, affinity: 3 },
          { memberId: MEMBERS.luppichini.memberId, memberLabel: "Alberto Luppichini", percentage: 25, affinity: 3 },
        ]
      },
    ]
  },

  // Sales Specialist (Fabio)
  [MEMBERS.fabio.memberId]: {
    environmentalImpact: 4,
    operationalFluidity: 5,
    links: [
      {
        targetType: "team", targetId: NODES.dirSales, targetLabel: "Direzione Sales & Marketing",
        collaborationPercentage: 25, personalAffinity: 4,
        memberBreakdown: [{ memberId: MEMBERS.dorigo.memberId, memberLabel: "Mauro Dorigo", percentage: 100, affinity: 4 }]
      },
      {
        targetType: "team", targetId: NODES.gestioneOrdini, targetLabel: "Gestione Ordini",
        collaborationPercentage: 25, personalAffinity: 4,
        memberBreakdown: [{ memberId: MEMBERS.pasqualini.memberId, memberLabel: "Barbara Pasqualini", percentage: 100, affinity: 4 }]
      },
      {
        targetType: "team", targetId: NODES.teamMarketing, targetLabel: "Team Marketing",
        collaborationPercentage: 10, personalAffinity: 3,
        memberBreakdown: [
          { memberId: MEMBERS.bartoli.memberId, memberLabel: "Giulia Bartoli", percentage: 50, affinity: 3 },
          { memberId: MEMBERS.cerati.memberId, memberLabel: "Massimiliano Cerati", percentage: 50, affinity: 3 },
        ]
      },
    ]
  },

  // Marketing Specialist (Bartoli)
  [MEMBERS.bartoli.memberId]: {
    environmentalImpact: 2,
    operationalFluidity: 2,
    links: [
      {
        targetType: "team", targetId: NODES.dirSales, targetLabel: "Direzione Sales & Marketing",
        collaborationPercentage: 25, personalAffinity: 4,
        memberBreakdown: [{ memberId: MEMBERS.dorigo.memberId, memberLabel: "Mauro Dorigo", percentage: 100, affinity: 4 }]
      },
      {
        targetType: "team", targetId: NODES.teamSales, targetLabel: "Team Sales",
        collaborationPercentage: 20, personalAffinity: 3,
        memberBreakdown: [
          { memberId: MEMBERS.cassano.memberId, memberLabel: "Michele Cassano", percentage: 50, affinity: 3 },
          { memberId: MEMBERS.fabio.memberId, memberLabel: "Marco Fabio", percentage: 50, affinity: 3 },
        ]
      },
      {
        targetType: "team", targetId: NODES.gestioneOrdini, targetLabel: "Gestione Ordini",
        collaborationPercentage: 10, personalAffinity: 3,
        memberBreakdown: [{ memberId: MEMBERS.pasqualini.memberId, memberLabel: "Barbara Pasqualini", percentage: 100, affinity: 3 }]
      },
    ]
  },

  // Marketing Specialist (Cerati)
  [MEMBERS.cerati.memberId]: {
    environmentalImpact: 2,
    operationalFluidity: 2,
    links: [
      {
        targetType: "team", targetId: NODES.dirSales, targetLabel: "Direzione Sales & Marketing",
        collaborationPercentage: 25, personalAffinity: 4,
        memberBreakdown: [{ memberId: MEMBERS.dorigo.memberId, memberLabel: "Mauro Dorigo", percentage: 100, affinity: 4 }]
      },
      {
        targetType: "team", targetId: NODES.teamSales, targetLabel: "Team Sales",
        collaborationPercentage: 20, personalAffinity: 3,
        memberBreakdown: [
          { memberId: MEMBERS.cassano.memberId, memberLabel: "Michele Cassano", percentage: 50, affinity: 3 },
          { memberId: MEMBERS.fabio.memberId, memberLabel: "Marco Fabio", percentage: 50, affinity: 3 },
        ]
      },
      {
        targetType: "team", targetId: NODES.gestioneOrdini, targetLabel: "Gestione Ordini",
        collaborationPercentage: 10, personalAffinity: 3,
        memberBreakdown: [{ memberId: MEMBERS.pasqualini.memberId, memberLabel: "Barbara Pasqualini", percentage: 100, affinity: 3 }]
      },
    ]
  },

  // Commerciale Interno (Pasqualini)
  [MEMBERS.pasqualini.memberId]: {
    environmentalImpact: 3,
    operationalFluidity: 1,
    links: [
      {
        targetType: "team", targetId: NODES.teamSales, targetLabel: "Team Sales",
        collaborationPercentage: 25, personalAffinity: 4,
        memberBreakdown: [
          { memberId: MEMBERS.cassano.memberId, memberLabel: "Michele Cassano", percentage: 50, affinity: 4 },
          { memberId: MEMBERS.fabio.memberId, memberLabel: "Marco Fabio", percentage: 50, affinity: 4 },
        ]
      },
      {
        targetType: "team", targetId: NODES.dirSales, targetLabel: "Direzione Sales & Marketing",
        collaborationPercentage: 20, personalAffinity: 4,
        memberBreakdown: [{ memberId: MEMBERS.dorigo.memberId, memberLabel: "Mauro Dorigo", percentage: 100, affinity: 4 }]
      },
      {
        targetType: "team", targetId: NODES.dirLogistica, targetLabel: "Direzione Logistica",
        collaborationPercentage: 15, personalAffinity: 3,
        memberBreakdown: [{ memberId: MEMBERS.dose.memberId, memberLabel: "Fabrizio Dose", percentage: 100, affinity: 3 }]
      },
      {
        targetType: "team", targetId: NODES.suppAmm, targetLabel: "Supporto Amministrativo",
        collaborationPercentage: 10, personalAffinity: 3,
        memberBreakdown: [{ memberId: MEMBERS.ciceri.memberId, memberLabel: "Alessandra Ciceri", percentage: 100, affinity: 3 }]
      },
    ]
  },

  // 4x Tecnico Service (Romano, Griffini, Piani, Luppichini) - same profile
  [MEMBERS.romano.memberId]: SERVICE_TECH_COLLAB_PROFILE,
  [MEMBERS.griffini.memberId]: SERVICE_TECH_COLLAB_PROFILE,
  [MEMBERS.piani.memberId]: SERVICE_TECH_COLLAB_PROFILE,
  [MEMBERS.luppichini.memberId]: SERVICE_TECH_COLLAB_PROFILE,

  // Product Specialist (Pagnini)
  [MEMBERS.pagnini.memberId]: {
    environmentalImpact: 2,
    operationalFluidity: 3,
    links: [
      {
        targetType: "team", targetId: NODES.serviceTrad, targetLabel: "Service Tradizionale",
        collaborationPercentage: 25, personalAffinity: 4,
        memberBreakdown: [
          { memberId: MEMBERS.romano.memberId, memberLabel: "Paolo Romano", percentage: 25, affinity: 4 },
          { memberId: MEMBERS.griffini.memberId, memberLabel: "Matteo Griffini", percentage: 25, affinity: 4 },
          { memberId: MEMBERS.piani.memberId, memberLabel: "Gabriele Piani", percentage: 25, affinity: 4 },
          { memberId: MEMBERS.luppichini.memberId, memberLabel: "Alberto Luppichini", percentage: 25, affinity: 4 },
        ]
      },
      {
        targetType: "team", targetId: NODES.dirService, targetLabel: "Direzione Service",
        collaborationPercentage: 20, personalAffinity: 4,
        memberBreakdown: [{ memberId: MEMBERS.venturini.memberId, memberLabel: "Claudio Venturini", percentage: 100, affinity: 4 }]
      },
      {
        targetType: "team", targetId: NODES.teamMarketing, targetLabel: "Team Marketing",
        collaborationPercentage: 15, personalAffinity: 3,
        memberBreakdown: [
          { memberId: MEMBERS.bartoli.memberId, memberLabel: "Giulia Bartoli", percentage: 50, affinity: 3 },
          { memberId: MEMBERS.cerati.memberId, memberLabel: "Massimiliano Cerati", percentage: 50, affinity: 3 },
        ]
      },
    ]
  },

  // Tecnico Repair (Scudier)
  [MEMBERS.scudier.memberId]: {
    environmentalImpact: 4,
    operationalFluidity: 5,
    links: [
      {
        targetType: "team", targetId: NODES.serviceTrad, targetLabel: "Service Tradizionale",
        collaborationPercentage: 25, personalAffinity: 4,
        memberBreakdown: [
          { memberId: MEMBERS.romano.memberId, memberLabel: "Paolo Romano", percentage: 25, affinity: 4 },
          { memberId: MEMBERS.griffini.memberId, memberLabel: "Matteo Griffini", percentage: 25, affinity: 4 },
          { memberId: MEMBERS.piani.memberId, memberLabel: "Gabriele Piani", percentage: 25, affinity: 4 },
          { memberId: MEMBERS.luppichini.memberId, memberLabel: "Alberto Luppichini", percentage: 25, affinity: 4 },
        ]
      },
      {
        targetType: "team", targetId: NODES.dirService, targetLabel: "Direzione Service",
        collaborationPercentage: 20, personalAffinity: 4,
        memberBreakdown: [{ memberId: MEMBERS.venturini.memberId, memberLabel: "Claudio Venturini", percentage: 100, affinity: 4 }]
      },
      {
        targetType: "team", targetId: NODES.magazzino, targetLabel: "Magazzino",
        collaborationPercentage: 15, personalAffinity: 3,
        memberBreakdown: [{ memberId: MEMBERS.tompetrini.memberId, memberLabel: "Andrea Tompetrini", percentage: 100, affinity: 3 }]
      },
    ]
  },

  // Magazziniere (Tompetrini)
  [MEMBERS.tompetrini.memberId]: {
    environmentalImpact: 3,
    operationalFluidity: 3,
    links: [
      {
        targetType: "team", targetId: NODES.dirLogistica, targetLabel: "Direzione Logistica",
        collaborationPercentage: 30, personalAffinity: 4,
        memberBreakdown: [{ memberId: MEMBERS.dose.memberId, memberLabel: "Fabrizio Dose", percentage: 100, affinity: 4 }]
      },
      {
        targetType: "team", targetId: NODES.serviceTrad, targetLabel: "Service Tradizionale",
        collaborationPercentage: 20, personalAffinity: 3,
        memberBreakdown: [
          { memberId: MEMBERS.romano.memberId, memberLabel: "Paolo Romano", percentage: 25, affinity: 3 },
          { memberId: MEMBERS.griffini.memberId, memberLabel: "Matteo Griffini", percentage: 25, affinity: 3 },
          { memberId: MEMBERS.piani.memberId, memberLabel: "Gabriele Piani", percentage: 25, affinity: 3 },
          { memberId: MEMBERS.luppichini.memberId, memberLabel: "Alberto Luppichini", percentage: 25, affinity: 3 },
        ]
      },
      {
        targetType: "team", targetId: NODES.gestioneOrdini, targetLabel: "Gestione Ordini",
        collaborationPercentage: 15, personalAffinity: 4,
        memberBreakdown: [{ memberId: MEMBERS.pasqualini.memberId, memberLabel: "Barbara Pasqualini", percentage: 100, affinity: 4 }]
      },
      {
        targetType: "team", targetId: NODES.installazioni, targetLabel: "Installazioni",
        collaborationPercentage: 10, personalAffinity: 3,
        memberBreakdown: [{ memberId: MEMBERS.scudier.memberId, memberLabel: "Alberto Scudier", percentage: 100, affinity: 3 }]
      },
    ]
  },

  // Segreteria (Ciceri)
  [MEMBERS.ciceri.memberId]: {
    environmentalImpact: 2,
    operationalFluidity: 1,
    links: [
      {
        targetType: "team", targetId: NODES.dirAmm, targetLabel: "Direzione Amministrativa",
        collaborationPercentage: 40, personalAffinity: 5,
        memberBreakdown: [{ memberId: MEMBERS.sangalli.memberId, memberLabel: "Tessa Sangalli", percentage: 100, affinity: 5 }]
      },
      {
        targetType: "team", targetId: NODES.generalMgmt, targetLabel: "General Management",
        collaborationPercentage: 15, personalAffinity: 3,
        memberBreakdown: [{ memberId: MEMBERS.bertolotto.memberId, memberLabel: "Nicola Bertolotto", percentage: 100, affinity: 3 }]
      },
      {
        targetType: "team", targetId: NODES.dirSales, targetLabel: "Direzione Sales & Marketing",
        collaborationPercentage: 10, personalAffinity: 3,
        memberBreakdown: [{ memberId: MEMBERS.dorigo.memberId, memberLabel: "Mauro Dorigo", percentage: 100, affinity: 3 }]
      },
    ]
  },
};

// Update data for the existing Head of Sales role (Mauro Dorigo)
const HEAD_OF_SALES_UPDATE = {
  title: "Head of Sales & Marketing",
  description: "Direzione commerciale e marketing della filiale italiana, coordinamento della forza vendita e delle strategie di crescita del mercato.",
  responsibilities: [
    "Raggiungimento degli obiettivi di fatturato complessivi dell'area sales",
    "Definizione e implementazione delle strategie commerciali",
    "Coordinamento e sviluppo del team commerciale e marketing",
    "Gestione dei rapporti con i key account",
    "Definizione delle politiche di pricing e condizioni commerciali",
    "Collaborazione con la casa madre per l'allineamento strategico",
    "Analisi del mercato e sviluppo di nuove opportunità di business"
  ],
  daily_tasks: [
    "Coordinamento quotidiano del team sales e marketing",
    "Monitoraggio KPI commerciali e pipeline di vendita",
    "Riunioni strategiche con CEO e direzione",
    "Incontri con clienti chiave e prospect strategici",
    "Definizione campagne promozionali e iniziative commerciali",
    "Revisione offerte commerciali di alto valore",
    "Analisi dei dati di vendita e reporting",
    "Supervisione delle attività di marketing e comunicazione",
    "Gestione del budget commerciale e marketing",
    "Rapporti con la casa madre per strategie e obiettivi"
  ],
  kpis: [
    { name: "Fatturato complessivo Italia", target: "Budget annuale" },
    { name: "Crescita fatturato YoY", target: ">10%" },
    { name: "Market share", target: "Incremento annuale" },
    { name: "Customer satisfaction complessiva", target: ">90%" },
    { name: "Pipeline di vendita", target: ">3x budget trimestrale" },
    { name: "Tasso retention clienti", target: ">90%" },
    { name: "Efficacia campagne marketing", target: "ROI >1:3" }
  ],
  required_hard_skills: [
    { name: "Strategic sales management", level: 5 },
    { name: "Marketing management B2B", level: 4 },
    { name: "Conoscenza approfondita mercato dentale/medicale", level: 5 },
    { name: "CRM e sales analytics", level: 4 },
    { name: "Budgeting e forecast commerciale", level: 5 },
    { name: "Key account management", level: 5 }
  ],
  required_soft_skills: [
    { name: "Leadership e gestione team commerciale", level: 5 },
    { name: "Negoziazione strategica", level: 5 },
    { name: "Visione commerciale e pensiero strategico", level: 5 },
    { name: "Comunicazione efficace a tutti i livelli", level: 5 },
    { name: "Orientamento ai risultati", level: 5 },
    { name: "Coaching e sviluppo del team", level: 4 },
    { name: "Capacità analitiche", level: 4 }
  ],
  required_languages: [
    { language: "Italiano", level: "native" },
    { language: "Inglese", level: "advanced" },
    { language: "Tedesco", level: "intermediate" }
  ],
  required_education: [{ degree: "Laurea in Economia, Marketing o Ingegneria", mandatory: false }],
  required_certifications: [],
  required_seniority: "Senior",
  years_experience_min: 8,
  contract_type: "permanent",
  work_hours_type: "full_time",
  remote_policy: "on_site",
  status: "active",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const results = [];

    // 1. UPDATE existing Head of Sales role
    const { error: updateError } = await supabase
      .from("company_roles")
      .update(HEAD_OF_SALES_UPDATE)
      .eq("id", EXISTING_ROLE_ID);

    results.push({
      person: "Mauro Dorigo",
      role: "Head of Sales & Marketing",
      action: "updated",
      success: !updateError,
      error: updateError?.message,
    });

    // 2. DELETE any existing roles for this company (except the Head of Sales) to avoid duplicates on re-run
    const { data: existingRoles } = await supabase
      .from("company_roles")
      .select("id")
      .eq("company_id", COMPANY_ID)
      .neq("id", EXISTING_ROLE_ID);

    if (existingRoles && existingRoles.length > 0) {
      const existingIds = existingRoles.map((r) => r.id);
      // Delete assignments first
      await supabase
        .from("company_role_assignments")
        .delete()
        .in("role_id", existingIds);
      // Then delete roles
      await supabase
        .from("company_roles")
        .delete()
        .in("id", existingIds);
      results.push({ action: "cleanup", deleted: existingIds.length });
    }

    // 3. CREATE new roles + assignments
    for (const item of ROLES_TO_CREATE) {
      const roleData = { ...item.role };
      // Remove non-DB fields
      delete roleData.years_experience_min;

      // Merge collaboration profile if available
      const collabProfile = COLLABORATION_PROFILES[item.member.memberId];

      const { data: newRole, error: roleError } = await supabase
        .from("company_roles")
        .insert({
          ...roleData,
          years_experience_min: item.role.years_experience_min,
          ...(collabProfile ? { collaboration_profile: collabProfile } : {}),
        })
        .select("id")
        .single();

      if (roleError || !newRole) {
        results.push({
          person: `member ${item.member.memberId}`,
          role: item.role.title,
          action: "create_role",
          success: false,
          error: roleError?.message,
        });
        continue;
      }

      // Create assignment
      const { error: assignError } = await supabase
        .from("company_role_assignments")
        .insert({
          role_id: newRole.id,
          company_member_id: item.member.memberId,
          user_id: item.member.userId,
          assignment_type: "primary",
          start_date: new Date().toISOString().split("T")[0],
          fte_percentage: 100,
        });

      results.push({
        person: `member ${item.member.memberId}`,
        role: item.role.title,
        action: "created",
        roleId: newRole.id,
        success: !assignError,
        error: assignError?.message,
      });
    }

    const successCount = results.filter((r) => r.success !== false).length;

    return new Response(
      JSON.stringify({
        message: `Processed ${results.length} roles. ${successCount} successful.`,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
