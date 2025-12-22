import { TestSection, User, Company, OrgNode, CompanyProfile } from './types';
import { DUERR_COMPANY_DATA } from './data/mockDuerr';
import { RIASEC_QUESTIONNAIRE } from './data/riasecContent';

export const SOFT_SKILLS_OPTIONS = [
  "Comunicazione Efficace",
  "Problem Solving",
  "Leadership",
  "Teamwork",
  "Intelligenza Emotiva",
  "Gestione del Tempo",
  "Adattabilità",
  "Pensiero Critico",
  "Creatività",
  "Negoziazione"
];

// Re-export the definitive questionnaire
export const RIASEC_SECTIONS: TestSection[] = RIASEC_QUESTIONNAIRE;

export const INDUSTRIES = [
  "Banca/Finanza",
  "Sanità",
  "Industria",
  "Servizi Creativi",
  "Tech/IT",
  "Retail",
  "Consulenza",
  "Pubblica Amministrazione",
  "Istruzione"
];

export const SIZE_RANGES = [
  "1-10",
  "10-50",
  "50-100",
  "100-500",
  "500+"
];

export const DIMENSION_LABELS: Record<string, string> = {
  R: "Realistico",
  I: "Investigativo",
  A: "Artistico",
  S: "Sociale",
  E: "Intraprendente",
  C: "Convenzionale"
};

export const DIMENSION_COLORS: Record<string, string> = {
  R: "#3B82F6",
  I: "#8B5CF6",
  A: "#EC4899",
  S: "#10B981",
  E: "#F97316",
  C: "#EAB308"
};

export const INITIAL_COMPANIES: CompanyProfile[] = [
  {
    id: 'c1',
    name: "Acme Corp",
    email: 'admin@acme.com',
    industry: "Tech/IT",
    sizeRange: "50-100",
    cultureValues: ["Innovazione", "Trasparenza", "Meritocrazia", "Agilità"],
    structure: { 
        id: 'root', 
        name: 'CEO Office', 
        type: 'root', 
        isCulturalDriver: true, 
        children: [
            { id: 'acme_mktg', name: 'Marketing', type: 'department', children: [] },
            { id: 'acme_eng', name: 'Engineering', type: 'department', isCulturalDriver: true, children: [] }
        ] 
    }
  },
  DUERR_COMPANY_DATA.company
];

export const INITIAL_USERS: User[] = [
  // --- ACME CORP: CEO OFFICE (4 utenti) ---
  {
    id: 'u6',
    firstName: 'Alessandro',
    lastName: 'Visconti',
    email: 'alessandro.visconti@acme.com',
    companyId: 'c1',
    status: 'completed',
    results: { R: 5, I: 20, A: 15, S: 10, E: 28, C: 24 },
    profileCode: 'E-C-I',
    jobTitle: 'CEO',
    departmentId: 'root'
  },
  {
    id: 'u_sofia',
    firstName: 'Sofia',
    lastName: 'Moretti',
    email: 'sofia.m@acme.com',
    companyId: 'c1',
    status: 'completed',
    results: { R: 5, I: 12, A: 10, S: 29, E: 15, C: 24 },
    profileCode: 'S-C-E',
    jobTitle: 'HR Director',
    departmentId: 'root'
  },
  { id: 'u_francesca', firstName: 'Francesca', lastName: 'Costa', email: 'francesca.c@acme.com', companyId: 'c1', status: 'pending', jobTitle: 'Admin Assistant', departmentId: 'root' },
  { id: 'u_chiara', firstName: 'Chiara', lastName: 'Longo', email: 'chiara.l@acme.com', companyId: 'c1', status: 'pending', jobTitle: 'Finance Assistant', departmentId: 'root' },

  // --- ACME CORP: MARKETING (7 utenti) ---
  {
    id: 'u_giulia',
    firstName: 'Giulia',
    lastName: 'Bianchi',
    email: 'giulia.bianchi@acme.com',
    companyId: 'c1',
    status: 'completed',
    results: { R: 5, I: 18, A: 28, S: 22, E: 10, C: 12 },
    profileCode: 'A-S-I',
    jobTitle: 'Senior Art Director',
    departmentId: 'acme_mktg',
    karmaData: { transcript: [], summary: "Creativa empatica, ottima per guidare team di design." }
  },
  {
    id: 'u_marco',
    firstName: 'Marco',
    lastName: 'Rossi',
    email: 'marco.rossi@acme.com',
    companyId: 'c1',
    status: 'completed',
    results: { R: 10, I: 15, A: 10, S: 22, E: 25, C: 18 },
    profileCode: 'E-S-C',
    jobTitle: 'Marketing Manager',
    departmentId: 'acme_mktg'
  },
  { id: 'u_elena_g', firstName: 'Elena', lastName: 'Gatti', email: 'elena.g@acme.com', companyId: 'c1', status: 'invited', jobTitle: 'Sales Lead', departmentId: 'acme_mktg' },
  { id: 'u_clara', firstName: 'Clara', lastName: 'Sala', email: 'clara.s@acme.com', companyId: 'c1', status: 'pending', jobTitle: 'Junior Designer', departmentId: 'acme_mktg' },
  { id: 'u_alice', firstName: 'Alice', lastName: 'Martini', email: 'alice.m@acme.com', companyId: 'c1', status: 'invited', jobTitle: 'Copywriter', departmentId: 'acme_mktg' },
  { id: 'u_silvia', firstName: 'Silvia', lastName: 'Ferri', email: 'silvia.f@acme.com', companyId: 'c1', status: 'pending', jobTitle: 'Social Media', departmentId: 'acme_mktg' },
  { id: 'u_antonio', firstName: 'Antonio', lastName: 'Conte', email: 'antonio.c@acme.com', companyId: 'c1', status: 'completed', jobTitle: 'Sales Exec', departmentId: 'acme_mktg', results: {R: 5, I: 5, A: 15, S: 20, E: 30, C: 10}, profileCode: 'E-S-A' },

  // --- ACME CORP: ENGINEERING (6 utenti) ---
  {
    id: 'u_luca',
    firstName: 'Luca',
    lastName: 'Ferrari',
    email: 'luca.f@acme.com',
    companyId: 'c1',
    status: 'completed',
    results: { R: 28, I: 25, A: 5, S: 10, E: 12, C: 20 },
    profileCode: 'R-I-C',
    jobTitle: 'Senior Developer',
    departmentId: 'acme_eng'
  },
  { id: 'u_matteo', firstName: 'Matteo', lastName: 'Riva', email: 'matteo.r@acme.com', companyId: 'c1', status: 'invited', jobTitle: 'Product Manager', departmentId: 'acme_eng' },
  { id: 'u_stefano_b', firstName: 'Stefano', lastName: 'Bruno', email: 'stefano.b@acme.com', companyId: 'c1', status: 'pending', jobTitle: 'IT Technician', departmentId: 'acme_eng' },
  { id: 'u_paolo', firstName: 'Paolo', lastName: 'Galli', email: 'paolo.g@acme.com', companyId: 'c1', status: 'completed', jobTitle: 'Fullstack Dev', departmentId: 'acme_eng', results: {R: 25, I: 25, A: 10, S: 8, E: 5, C: 15}, profileCode: 'R-I-C' },
  { id: 'u_giorgio_b', firstName: 'Giorgio', lastName: 'Bianchi', email: 'giorgio.b@acme.com', companyId: 'c1', status: 'completed', jobTitle: 'Project Lead', departmentId: 'acme_eng', results: {R: 15, I: 20, A: 5, S: 12, E: 26, C: 22}, profileCode: 'E-C-I' },
  { id: 'u_davide', firstName: 'Davide', lastName: 'Russo', email: 'davide.r@acme.com', companyId: 'c1', status: 'invited', jobTitle: 'Data Analyst', departmentId: 'acme_eng' },

  ...DUERR_COMPANY_DATA.users
];