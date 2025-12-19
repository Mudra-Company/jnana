import { CompanyProfile, User, OrgNode, ClimateData } from '../types';

const DUERR_ID = 'c_duerr';

// --- CLIMATE DATA CONFIGURATION (Based on "Media alta su Appartenenza, bassa su Organizzazione") ---
const REALISTIC_CLIMATE: ClimateData = {
    rawScores: {}, 
    submissionDate: '2023-11-15',
    sectionAverages: {
        "Senso di Appartenenza": 4.5,
        "Identità": 4.5,
        "Il Mio Lavoro": 3.8,
        "Organizzazione e Cambiamento": 2.5, // Critical
        "Rapporto con il Capo": 3.5,
        "La Mia Unità (Team)": 3.8,
        "Aspetto Umano": 2.5, // Critical
        "Responsabilità": 3.2,
        "La Mia Remunerazione": 3.0
    },
    overallAverage: 3.5
};

const POSITIVE_CLIMATE: ClimateData = {
    ...REALISTIC_CLIMATE,
    overallAverage: 4.2,
    sectionAverages: { ...REALISTIC_CLIMATE.sectionAverages, "Organizzazione e Cambiamento": 3.8, "Rapporto con il Capo": 4.5 }
};

const CRITICAL_CLIMATE: ClimateData = {
    ...REALISTIC_CLIMATE,
    overallAverage: 2.8,
    sectionAverages: { ...REALISTIC_CLIMATE.sectionAverages, "Rapporto con il Capo": 2.0, "Aspetto Umano": 2.2 }
};

// --- HIERARCHY STRUCTURE ---
const DUERR_STRUCTURE: OrgNode = {
    id: 'n_d_root',
    name: 'General Management',
    type: 'root',
    isCulturalDriver: true,
    children: [
        { 
            id: 'n_d_sales_dir', 
            name: 'Direzione Sales & Marketing', 
            type: 'department', 
            isCulturalDriver: true, 
            children: [
                {
                    id: 'n_d_sales_team',
                    name: 'Team Sales',
                    type: 'team',
                    children: []
                },
                {
                    id: 'n_d_mktg',
                    name: 'Team Marketing',
                    type: 'team',
                    children: []
                },
                {
                    id: 'n_d_orders',
                    name: 'Gestione Ordini',
                    type: 'team',
                    children: []
                }
            ] 
        },
        { 
            id: 'n_d_serv_dir', 
            name: 'Direzione Service', 
            type: 'department', 
            isCulturalDriver: true, 
            children: [
                {
                    id: 'n_d_serv_trad',
                    name: 'Service Tradizionale',
                    type: 'team',
                    children: []
                },
                {
                    id: 'n_d_serv_digi',
                    name: 'Service Digital & R&D',
                    type: 'team',
                    children: []
                },
                {
                    id: 'n_d_install',
                    name: 'Installazioni',
                    type: 'team',
                    children: []
                }
            ] 
        },
        {
            id: 'n_d_log_dir',
            name: 'Direzione Logistica', // Renamed from Operations per request
            type: 'department',
            isCulturalDriver: false,
            children: [
                {
                    id: 'n_d_log_team',
                    name: 'Magazzino',
                    type: 'team',
                    children: []
                }
            ]
        },
        {
            id: 'n_d_admin_dir',
            name: 'Direzione Amministrativa',
            type: 'department',
            isCulturalDriver: false,
            children: [
                {
                    id: 'n_d_admin_team',
                    name: 'Supporto Amministrativo',
                    type: 'team',
                    children: []
                }
            ]
        }
    ]
};

const DUERR_USERS: User[] = [
    // --- 1. GENERAL MANAGEMENT (CEO) ---
    {
        id: 'u_d_nicola',
        firstName: 'Nicola',
        lastName: 'Bertolotto',
        email: 'nicola.bertolotto@duerr.it',
        companyId: DUERR_ID,
        status: 'completed',
        jobTitle: 'CEO / AD',
        departmentId: 'n_d_root',
        results: { E: 25, C: 20, I: 15, S: 10, R: 10, A: 10 },
        profileCode: 'E-C-I',
        karmaData: { 
            transcript: [], 
            summary: "Leader energico con focus sul controllo e sul profitto.",
            softSkills: ["Leadership Direttiva", "Controllo", "Visione"],
            primaryValues: ["Eccellenza", "Profitto", "Reputazione"],
            riskFactors: ["Micromanagement", "Mancanza di Fiducia", "Difficoltà a Decidere"], // From prompt
            seniorityAssessment: "C-Level"
        },
        climateData: POSITIVE_CLIMATE
    },

    // --- 2. FIRST LINE MANAGEMENT (HEADS) ---
    {
        id: 'u_d_mauro',
        firstName: 'Mauro',
        lastName: 'Dorigo',
        email: 'mauro.dorigo@duerr.it',
        companyId: DUERR_ID,
        status: 'completed',
        jobTitle: 'Head of Sales & Marketing',
        departmentId: 'n_d_sales_dir', 
        results: { R: 12, I: 13, A: 11, S: 26, E: 15, C: 15 },
        profileCode: 'S-E-C',
        karmaData: { transcript: [], summary: "Manager relazionale.", riskFactors: ["Over-promising"], seniorityAssessment: "Lead" },
        climateData: REALISTIC_CLIMATE
    },
    {
        id: 'u_d_claudio',
        firstName: 'Claudio',
        lastName: 'Venturini',
        email: 'claudio.venturini@duerr.it',
        companyId: DUERR_ID,
        status: 'completed',
        jobTitle: 'Head of Service',
        departmentId: 'n_d_serv_dir', 
        results: { R: 14, I: 14, A: 11, S: 16, E: 11, C: 12 },
        profileCode: 'S-R-I',
        karmaData: { transcript: [], summary: "Leader tecnico.", riskFactors: ["Delega difficile"], seniorityAssessment: "Senior" },
        climateData: REALISTIC_CLIMATE
    },
    {
        id: 'u_d_fabrizio',
        firstName: 'Fabrizio',
        lastName: 'Dose',
        email: 'fabrizio.dose@duerr.it',
        companyId: DUERR_ID,
        status: 'completed',
        jobTitle: 'Responsabile Logistica', // Changed role title
        departmentId: 'n_d_log_dir', 
        results: { R: 15, I: 15, A: 7, S: 8, E: 11, C: 15 },
        profileCode: 'R-I-C',
        karmaData: { transcript: [], summary: "Responsabile pragmatico.", riskFactors: ["Rigidità"], seniorityAssessment: "Senior" },
        climateData: REALISTIC_CLIMATE
    },
    {
        id: 'u_d_tessa',
        firstName: 'Tessa',
        lastName: 'Sangalli',
        email: 'tessa.sangalli@duerr.it',
        companyId: DUERR_ID,
        status: 'completed',
        jobTitle: 'Head of Admin',
        departmentId: 'n_d_admin_dir', 
        results: { R: 11, I: 10, A: 9, S: 9, E: 13, C: 15 },
        profileCode: 'C-E-R',
        karmaData: { transcript: [], summary: "Figura strutturata.", riskFactors: ["Burocrazia"], seniorityAssessment: "Senior" },
        climateData: REALISTIC_CLIMATE
    },

    // --- 3. SALES & MARKETING TEAMS ---
    {
        id: 'u_d_michele',
        firstName: 'Michele',
        lastName: 'Cassano',
        email: 'michele.cassano@duerr.it',
        companyId: DUERR_ID,
        status: 'completed',
        jobTitle: 'Area Manager',
        departmentId: 'n_d_sales_team',
        results: { R: 11, I: 18, A: 16, S: 25, E: 18, C: 14 },
        profileCode: 'S-I-E',
        climateData: REALISTIC_CLIMATE
    },
    {
        id: 'u_d_marco',
        firstName: 'Marco',
        lastName: 'Fabio',
        email: 'marco.fabio@duerr.it',
        companyId: DUERR_ID,
        status: 'completed',
        jobTitle: 'Sales Specialist',
        departmentId: 'n_d_sales_team',
        results: { R: 13, I: 24, A: 22, S: 24, E: 20, C: 14 },
        profileCode: 'I-S-A',
        climateData: REALISTIC_CLIMATE
    },
    {
        id: 'u_d_giulia_b',
        firstName: 'Giulia',
        lastName: 'Bartoli',
        email: 'giulia.bartoli@duerr.it',
        companyId: DUERR_ID,
        status: 'completed',
        jobTitle: 'Marketing Specialist',
        departmentId: 'n_d_mktg',
        results: { R: 7, I: 11, A: 12, S: 17, E: 12, C: 8 },
        profileCode: 'S-A-E',
        climateData: REALISTIC_CLIMATE
    },
    {
        id: 'u_d_massimiliano',
        firstName: 'Massimiliano',
        lastName: 'Cerati',
        email: 'massimiliano.cerati@duerr.it',
        companyId: DUERR_ID,
        status: 'completed',
        jobTitle: 'Marketing Specialist',
        departmentId: 'n_d_mktg',
        results: { R: 14, I: 18, A: 15, S: 30, E: 25, C: 16 },
        profileCode: 'S-E-I',
        climateData: REALISTIC_CLIMATE
    },
    {
        id: 'u_d_barbara',
        firstName: 'Barbara',
        lastName: 'Pasqualini',
        email: 'barbara.pasqualini@duerr.it',
        companyId: DUERR_ID,
        status: 'completed',
        jobTitle: 'Gestione Ordini',
        departmentId: 'n_d_orders',
        results: { R: 12, I: 12, A: 12, S: 14, E: 12, C: 13 },
        profileCode: 'S-C-E', // Tie breaker logic
        climateData: CRITICAL_CLIMATE
    },

    // --- 4. SERVICE TEAMS ---
    {
        id: 'u_d_paolo',
        firstName: 'Paolo',
        lastName: 'Romano',
        email: 'paolo.romano@duerr.it',
        companyId: DUERR_ID,
        status: 'completed',
        jobTitle: 'Tecnico Service Tradizionale',
        departmentId: 'n_d_serv_trad', // Only Paolo here per instructions
        results: { R: 12, I: 9, A: 10, S: 13, E: 14, C: 10 },
        profileCode: 'E-S-R',
        climateData: REALISTIC_CLIMATE
    },
    {
        id: 'u_d_ivan',
        firstName: 'Ivan Carlo',
        lastName: 'Pagnini',
        email: 'ivan.pagnini@duerr.it',
        companyId: DUERR_ID,
        status: 'completed',
        jobTitle: 'Specialist R&D',
        departmentId: 'n_d_serv_digi', // Moved to Digital
        results: { R: 20, I: 15, A: 9, S: 14, E: 24, C: 10 },
        profileCode: 'E-R-I',
        climateData: POSITIVE_CLIMATE
    },
    {
        id: 'u_d_matteo_g',
        firstName: 'Matteo',
        lastName: 'Griffini',
        email: 'matteo.griffini@duerr.it',
        companyId: DUERR_ID,
        status: 'completed',
        jobTitle: 'Tecnico Service',
        departmentId: 'n_d_serv_digi',
        results: { R: 14, I: 17, A: 16, S: 12, E: 10, C: 15 },
        profileCode: 'I-A-C',
        climateData: REALISTIC_CLIMATE
    },
    {
        id: 'u_d_gabriele',
        firstName: 'Gabriele',
        lastName: 'Piani',
        email: 'gabriele.piani@duerr.it',
        companyId: DUERR_ID,
        status: 'completed',
        jobTitle: 'Tecnico Service',
        departmentId: 'n_d_serv_digi',
        results: { R: 23, I: 20, A: 14, S: 24, E: 12, C: 15 },
        profileCode: 'S-R-I',
        climateData: REALISTIC_CLIMATE
    },
    {
        id: 'u_d_alberto_l',
        firstName: 'Alberto',
        lastName: 'Luppichini',
        email: 'alberto.luppichini@duerr.it',
        companyId: DUERR_ID,
        status: 'completed',
        jobTitle: 'Tecnico Service',
        departmentId: 'n_d_serv_digi',
        results: { R: 6, I: 8, A: 16, S: 16, E: 5, C: 5 },
        profileCode: 'S-A-I',
        climateData: CRITICAL_CLIMATE
    },
    {
        id: 'u_d_alberto_s',
        firstName: 'Alberto',
        lastName: 'Scudier',
        email: 'alberto.scudier@duerr.it',
        companyId: DUERR_ID,
        status: 'completed',
        jobTitle: 'Installatore',
        departmentId: 'n_d_install',
        results: { R: 10, I: 16, A: 16, S: 19, E: 8, C: 10 },
        profileCode: 'S-I-A',
        climateData: REALISTIC_CLIMATE
    },

    // --- 5. LOGISTICS & ADMIN TEAMS ---
    {
        id: 'u_d_andrea',
        firstName: 'Andrea',
        lastName: 'Tompetrini',
        email: 'andrea.tompetrini@duerr.it',
        companyId: DUERR_ID,
        status: 'completed',
        jobTitle: 'Addetto Magazzino',
        departmentId: 'n_d_log_team',
        results: { R: 12, I: 5, A: 11, S: 15, E: 6, C: 7 },
        profileCode: 'S-R-A',
        climateData: CRITICAL_CLIMATE
    },
    {
        id: 'u_d_alessandra',
        firstName: 'Alessandra',
        lastName: 'Ciceri',
        email: 'alessandra.ciceri@duerr.it',
        companyId: DUERR_ID,
        status: 'completed',
        jobTitle: 'Supporto Amministrativo',
        departmentId: 'n_d_admin_team',
        results: { R: 8, I: 12, A: 13, S: 22, E: 8, C: 14 },
        profileCode: 'S-C-A',
        climateData: REALISTIC_CLIMATE
    }
];

export const DUERR_COMPANY_DATA = {
    company: {
        id: DUERR_ID,
        name: 'Dürr Dental Italia',
        industry: 'Sanità',
        sizeRange: '10-50',
        cultureValues: ["Innovazione", "Affidabilità", "Qualità", "Precisione", "Supporto"],
        structure: DUERR_STRUCTURE
    } as CompanyProfile,
    users: DUERR_USERS
};