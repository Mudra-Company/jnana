// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COMPANY_ID = '02b47082-c1d5-4e63-bc78-b6e9dfe602a7';
const PASSWORD = 'Amaeru2026!';
const HQ_LOCATION_ID = '4d876450-ac0a-55ce-8951-fdf31b91fa17';

// Hard skills catalog cache (id by name)
const HS: Record<string, string> = {
  Python: 'df257110-4128-450e-bca2-56dd6f19d22b',
  JavaScript: '39ffe5a0-6902-43e8-ade6-c0886fcbde36',
  React: '3431f39c-15f9-4c53-b4b6-ba4d31b4a3a1',
  'Node.js': '062894f5-6fb7-48c5-860e-0930bc1ec5af',
  GraphQL: '11b261d5-340e-4712-a9aa-ce560c5bf956',
  Kotlin: '580bb24a-625f-43b3-b49f-2b640b7e4a86',
  Go: '8271944b-5e23-4c18-9208-cc227ad8e07d',
  Java: 'df84787e-e453-4129-b659-05d2e621510e',
  AWS: '56fcfd34-c830-4454-b1fe-abf86e003094',
  Docker: '9f202462-6f14-4d2e-9a76-6d1f0e2eab4e',
  Kubernetes: '70684920-8bf1-4ce4-8289-65d60e89de0b',
  'CI/CD': '956d8a62-95af-47e3-98d6-d08e2b296004',
  Terraform: '4a42a709-7d72-499b-a42f-af79e0aa95a0',
  Linux: 'a33a650c-aa15-4c3b-b53d-02add466b476',
  'Machine Learning': '1c22c6c5-be8c-4973-94e8-b607cc4ef6ab',
  'Deep Learning': '2e7f471e-97d7-470d-9ce7-af8c36babc9e',
  PyTorch: 'ff0423b1-53a2-45ed-846d-4bd3f4681090',
  TensorFlow: '0c72b9d9-1b1d-4a91-8c9b-3025b07d715c',
  Pandas: '8aa67f46-0feb-4b57-9c58-2217b9e55bc9',
  'Data Analysis': 'eaaba346-c499-47c9-be44-1b7a3c0bea67',
  Tableau: '94c0bd97-cc03-48a0-8907-a38e4fe7f367',
  'Power BI': '60766b72-d6ff-4ef3-9be4-f9763e5ce995',
  Figma: 'b3d5dcf0-eac8-4523-8740-136324d0d980',
  'UX Design': '6977c33f-0a27-4564-a8bf-604015b9668e',
  'UI Design': '6d323bea-c722-4fe7-8595-716c209b9e4c',
  Photoshop: '2cf000db-b387-44bf-8160-b8c28f9074c7',
  Illustrator: 'd54376b7-39ae-4f9a-8232-f82abcc4ce73',
  Branding: 'f8c8222f-6ff6-4dea-a543-aedf833d0cb6',
  SEO: '23aac85c-03a1-4496-8eec-bb95638303c4',
  SEM: 'a9d3afc2-207e-4376-8387-664f5dd969db',
  'Google Analytics': '6ab96ff3-c098-4397-a775-7a7775a903c1',
  'Content Marketing': '1a7446c7-0cc2-4d48-ab24-7d55c14547fe',
  Copywriting: '0958c856-6e6c-4ef6-a910-abe36158df46',
  'Brand Strategy': 'd2b829a6-42ef-4a7d-b29a-49e2d5b28645',
  'Email Marketing': '6adf3522-5d1c-4b2c-9d8d-ee8ed6d37e06',
  'Social Media Marketing': '3058ebc2-0298-4083-a243-ef61cd4d564e',
  Accounting: '9ab5df1f-60f6-490c-bb53-b49d121f3562',
  Budgeting: '861c8d0f-b686-4ec2-81b9-e350a5214a3b',
  'Financial Analysis': 'e51aae17-e903-4570-8df5-0d282699cc0c',
  'Financial Modeling': '1717201a-193e-4d46-92a4-52b1da762250',
  SAP: '4310bab9-c042-4b0b-b443-764b7dc8851b',
  'Excel Advanced': 'c1a62dcc-c25c-4d0f-a719-e9c81562b9a5',
};

// 22 personas
type Persona = {
  memberId: string; roleId: string; firstName: string; lastName: string; email: string;
  jobTitle: string; gender: 'M'|'F'; age: number; location: string; region: string; yearsExp: number;
  bio: string; headline: string; seniority: 'Junior'|'Mid'|'Senior'|'Lead'|'C-Level';
  hardSkills: { name: string; level: 1|2|3|4|5; custom?: boolean }[];
  softSkills: string[]; values: string[]; risks: string[];
  experiences: { company: string; role: string; start: string; end: string|null; desc: string }[];
  education: { inst: string; degree: string; field: string; start: number; end: number }[];
  languages: { lang: string; level: 'native'|'fluent'|'professional'|'intermediate'|'basic' }[];
  certs: { name: string; org: string; year: number }[];
  riasec: { R: number; I: number; A: number; S: number; E: number; C: number };
  climateBase: number; // base score 60-95
};

const PEOPLE: Persona[] = [
  // CDA + CEO
  { memberId:'129fd34e-d30e-5c78-b9cc-85adcc2877db', roleId:'2f28afaf-9ad8-5b22-8fcb-5192a62b5242', firstName:'Giuseppe', lastName:'Ciniero', email:'giuseppe.ciniero@amaeru.eu', jobTitle:'CEO & Presidente CDA', gender:'M', age:42, location:'Milano', region:'Lombardia', yearsExp:18, bio:'Imprenditore seriale e founder di Amaeru. Visione: usare l\'AI per migliorare la salute degli animali domestici. Background tecnico, esperienza in product management e go-to-market.', headline:'CEO @ Amaeru — Pet-tech & AI for Animal Wellbeing', seniority:'C-Level', hardSkills:[{name:'Brand Strategy',level:5},{name:'Financial Modeling',level:4},{name:'Python',level:3},{name:'Data Analysis',level:4}], softSkills:['Leadership','Visione strategica','Public Speaking','Resilienza','Decision Making'], values:['Innovazione','Trasparenza','Amore per gli animali'], risks:['Workaholism','Iper-coinvolgimento operativo'], experiences:[{company:'Mudra Holdings',role:'Founder & CEO',start:'2019-01-01',end:null,desc:'Holding di startup pet-tech e wellness.'},{company:'Tech Startup XYZ',role:'Head of Product',start:'2014-06-01',end:'2018-12-31',desc:'Product leadership su SaaS B2B.'}], education:[{inst:'Politecnico di Milano',degree:'MSc',field:'Computer Engineering',start:2003,end:2008}], languages:[{lang:'Italiano',level:'native'},{lang:'Inglese',level:'fluent'},{lang:'Spagnolo',level:'intermediate'}], certs:[{name:'Stanford LEAD Certificate',org:'Stanford GSB',year:2020}], riasec:{R:55,I:75,A:70,S:80,E:95,C:65}, climateBase:90 },
  { memberId:'fc70eebc-3f44-5aca-b20c-caca71ea4cdf', roleId:'24ef46f5-75ee-5112-9a8c-835f497c3817', firstName:'Chiara', lastName:'Tacco', email:'chiara.tacco@amaeru.eu', jobTitle:'Membro CDA', gender:'F', age:48, location:'Milano', region:'Lombardia', yearsExp:22, bio:'Consigliera di amministrazione con background in venture capital e governance. Mentor per startup early-stage.', headline:'Board Member & VC Advisor', seniority:'C-Level', hardSkills:[{name:'Financial Analysis',level:5},{name:'Brand Strategy',level:4}], softSkills:['Governance','Strategic Thinking','Negotiation','Network Building'], values:['Trasparenza','Goal Oriented','Innovazione'], risks:['Bassa frequenza in azienda'], experiences:[{company:'Italia VC Partners',role:'Partner',start:'2015-01-01',end:null,desc:'Investimenti seed in startup tech italiane.'}], education:[{inst:'Università Bocconi',degree:'MSc',field:'Finance',start:1995,end:2000}], languages:[{lang:'Italiano',level:'native'},{lang:'Inglese',level:'fluent'}], certs:[], riasec:{R:30,I:75,A:50,S:70,E:90,C:80}, climateBase:85 },
  { memberId:'595e7898-5a15-50e5-8859-716f4ad00ef3', roleId:'e2a5ac5c-0b54-58fb-8345-80e1d51f066c', firstName:'Carlotta', lastName:'Silvestrini', email:'carlotta.silvestrini@amaeru.eu', jobTitle:'Membro CDA', gender:'F', age:45, location:'Roma', region:'Lazio', yearsExp:20, bio:'Esperta di scaling internazionale, con esperienza in pet industry e D2C brands.', headline:'Board Member — Scale-up Strategy', seniority:'C-Level', hardSkills:[{name:'Brand Strategy',level:5},{name:'Content Marketing',level:4}], softSkills:['Strategia internazionale','Coaching','Analisi competitor'], values:['Innovazione','Amore per gli animali','Goal Oriented'], risks:['Disponibilità limitata'], experiences:[{company:'PetCorp Europe',role:'VP International',start:'2016-03-01',end:'2023-12-31',desc:'Espansione brand pet in 8 mercati EMEA.'}], education:[{inst:'LUISS Guido Carli',degree:'MSc',field:'International Management',start:1998,end:2003}], languages:[{lang:'Italiano',level:'native'},{lang:'Inglese',level:'fluent'},{lang:'Francese',level:'professional'}], certs:[], riasec:{R:35,I:65,A:65,S:75,E:90,C:60}, climateBase:88 },
  { memberId:'1bedcd9d-b9a0-5db0-aae4-9176cc067f4a', roleId:'49062e5a-e74a-5e67-a052-ae9e611e3103', firstName:'Diego', lastName:'Barbisan', email:'diego.barbisan@amaeru.eu', jobTitle:'Membro CDA', gender:'M', age:55, location:'Milano', region:'Lombardia', yearsExp:30, bio:'CFO advisor con 30 anni di esperienza in finance e M&A. Membro indipendente del CDA.', headline:'Independent Board Member — CFO Advisory', seniority:'C-Level', hardSkills:[{name:'Financial Analysis',level:5},{name:'Financial Modeling',level:5},{name:'SAP',level:4}], softSkills:['Audit','Risk Management','Mentoring'], values:['Trasparenza','Goal Oriented'], risks:['Approccio molto tradizionale'], experiences:[{company:'Big4 Consulting',role:'Senior Partner',start:'2005-01-01',end:'2022-12-31',desc:'Audit e advisory per mid-cap italiane.'}], education:[{inst:'Università Bocconi',degree:'BSc',field:'Economia Aziendale',start:1988,end:1993}], languages:[{lang:'Italiano',level:'native'},{lang:'Inglese',level:'professional'}], certs:[{name:'Revisore Legale',org:'MEF',year:1998}], riasec:{R:40,I:75,A:30,S:55,E:75,C:95}, climateBase:78 },

  // Sviluppo Prodotto
  { memberId:'d2e0b552-8efc-54c4-b1a2-22489b6756ba', roleId:'9f70c689-7da4-5eac-bfa1-baf7d5931491', firstName:'Lorenzo', lastName:'Marchetti', email:'lorenzo.marchetti@amaeru.eu', jobTitle:'CTO / Head of Engineering', gender:'M', age:38, location:'Milano', region:'Lombardia', yearsExp:14, bio:'CTO con background in distributed systems e ML platforms. Costruisce team di engineering ad alta crescita.', headline:'CTO @ Amaeru — Building scalable AI platforms', seniority:'C-Level', hardSkills:[{name:'Python',level:5},{name:'AWS',level:5},{name:'Kubernetes',level:4},{name:'Go',level:4},{name:'Machine Learning',level:4},{name:'CI/CD',level:5}], softSkills:['Tech Leadership','System Design','Coaching','Decision Making'], values:['Innovazione','Goal Oriented','Trasparenza'], risks:['Bias verso over-engineering'], experiences:[{company:'Spotify',role:'Senior Engineering Manager',start:'2018-04-01',end:'2023-08-31',desc:'Lead di team di 12 ingegneri su data platform.'},{company:'Yoox Net-A-Porter',role:'Tech Lead',start:'2014-01-01',end:'2018-03-31',desc:'Architettura microservizi e-commerce.'}], education:[{inst:'Politecnico di Milano',degree:'MSc',field:'Computer Engineering',start:2007,end:2012}], languages:[{lang:'Italiano',level:'native'},{lang:'Inglese',level:'fluent'}], certs:[{name:'AWS Solutions Architect Professional',org:'Amazon Web Services',year:2022},{name:'Certified Kubernetes Administrator',org:'CNCF',year:2021}], riasec:{R:65,I:90,A:50,S:70,E:75,C:80}, climateBase:88 },
  { memberId:'bc8d5af3-a736-5326-839f-fc7ef88bfaae', roleId:'9bd87bbc-054e-5a8c-bd7f-cd749db3d8a4', firstName:'Sara', lastName:'Bianchi', email:'sara.bianchi@amaeru.eu', jobTitle:'Lead AI Engineer', gender:'F', age:33, location:'Milano', region:'Lombardia', yearsExp:9, bio:'AI Engineer con focus su NLP e computer vision applicate al benessere animale. PhD in ML.', headline:'Lead AI Engineer — Pet Health ML', seniority:'Lead', hardSkills:[{name:'Python',level:5},{name:'PyTorch',level:5},{name:'TensorFlow',level:4},{name:'Machine Learning',level:5},{name:'Deep Learning',level:5},{name:'AWS',level:4}], softSkills:['Research Mindset','Mentoring','Cross-functional collaboration'], values:['Innovazione','Amore per gli animali'], risks:['Tendenza al perfezionismo'], experiences:[{company:'NVIDIA',role:'AI Research Engineer',start:'2020-09-01',end:'2024-01-31',desc:'Modelli vision per healthcare.'}], education:[{inst:'Politecnico di Torino',degree:'PhD',field:'Machine Learning',start:2014,end:2018}], languages:[{lang:'Italiano',level:'native'},{lang:'Inglese',level:'fluent'}], certs:[{name:'TensorFlow Developer Certificate',org:'Google',year:2021}], riasec:{R:70,I:95,A:60,S:55,E:50,C:75}, climateBase:85 },
  { memberId:'37f4669f-a106-5640-a9b4-e67344855d5e', roleId:'979fc0d3-dfe6-5dd8-bfdc-5c097e74bd12', firstName:'Matteo', lastName:'Greco', email:'matteo.greco@amaeru.eu', jobTitle:'Senior Backend Engineer', gender:'M', age:31, location:'Milano', region:'Lombardia', yearsExp:8, bio:'Backend engineer specializzato in API ad alte prestazioni e architetture event-driven.', headline:'Senior Backend Engineer', seniority:'Senior', hardSkills:[{name:'Go',level:5},{name:'Python',level:4},{name:'AWS',level:4},{name:'Docker',level:5},{name:'GraphQL',level:4},{name:'Linux',level:5}], softSkills:['Problem Solving','Code Review','Documentation'], values:['Innovazione','Trasparenza'], risks:['Resistente ai cambi di priorità'], experiences:[{company:'Satispay',role:'Backend Engineer',start:'2019-02-01',end:'2024-01-31',desc:'Sistemi di pagamento ad alta affidabilità.'}], education:[{inst:'Università di Bologna',degree:'MSc',field:'Informatica',start:2012,end:2017}], languages:[{lang:'Italiano',level:'native'},{lang:'Inglese',level:'professional'}], certs:[{name:'AWS Developer Associate',org:'Amazon Web Services',year:2022}], riasec:{R:75,I:85,A:35,S:50,E:45,C:80}, climateBase:80 },
  { memberId:'f3d0b88b-5eb2-5b6d-993a-8349d6cf84fd', roleId:'a2e7450d-c74f-5a42-b0ec-13f6e5634788', firstName:'Federico', lastName:'Romano', email:'federico.romano@amaeru.eu', jobTitle:'iOS / Mobile Engineer', gender:'M', age:29, location:'Milano', region:'Lombardia', yearsExp:6, bio:'iOS engineer con passione per l\'UX. App nativa Swift + SwiftUI.', headline:'iOS Engineer — SwiftUI & Mobile UX', seniority:'Senior', hardSkills:[{name:'Kotlin',level:3},{name:'Java',level:3,custom:false},{name:'JavaScript',level:3}], softSkills:['Attenzione al dettaglio','UX sensitivity'], values:['Innovazione','Amore per gli animali'], risks:['Limitata esperienza Android'], experiences:[{company:'Bending Spoons',role:'iOS Developer',start:'2020-06-01',end:'2024-02-28',desc:'App consumer top-grossing.'}], education:[{inst:'Università di Milano-Bicocca',degree:'BSc',field:'Informatica',start:2014,end:2018}], languages:[{lang:'Italiano',level:'native'},{lang:'Inglese',level:'professional'}], certs:[], riasec:{R:60,I:80,A:75,S:55,E:45,C:75}, climateBase:82 },
  { memberId:'0095746f-d524-532c-9932-c2ec1cbcc982', roleId:'f3a1be1d-e8d3-511b-b81a-663d8975c458', firstName:'Alessia', lastName:'Conti', email:'alessia.conti@amaeru.eu', jobTitle:'Frontend / Web Engineer', gender:'F', age:27, location:'Milano', region:'Lombardia', yearsExp:5, bio:'Frontend dev che cura ogni pixel. React, TypeScript, Tailwind.', headline:'Frontend Engineer — React & Design Systems', seniority:'Mid', hardSkills:[{name:'React',level:5},{name:'JavaScript',level:5},{name:'Node.js',level:3},{name:'Figma',level:4},{name:'UI Design',level:3}], softSkills:['Collaborazione con design','Testing','Accessibility'], values:['Innovazione','Trasparenza'], risks:['Junior in architettura backend'], experiences:[{company:'Subito.it',role:'Frontend Developer',start:'2021-01-01',end:'2024-02-28',desc:'Web app marketplace.'}], education:[{inst:'Università degli Studi di Milano',degree:'BSc',field:'Comunicazione Digitale',start:2015,end:2019}], languages:[{lang:'Italiano',level:'native'},{lang:'Inglese',level:'professional'}], certs:[], riasec:{R:50,I:75,A:80,S:60,E:50,C:70}, climateBase:84 },
  { memberId:'4b971b24-80ff-5279-acbb-53b91ccc5bb8', roleId:'0c6986de-a06b-506b-bd55-130791f202bd', firstName:'Davide', lastName:'Russo', email:'davide.russo@amaeru.eu', jobTitle:'ML / Computer Vision Engineer', gender:'M', age:30, location:'Torino', region:'Piemonte', yearsExp:7, bio:'Ricercatore applicato in computer vision. Costruisce il sistema di riconoscimento etichette e Bristol scale.', headline:'Computer Vision Engineer — Pet Food Label Recognition', seniority:'Senior', hardSkills:[{name:'Python',level:5},{name:'PyTorch',level:5},{name:'Deep Learning',level:5},{name:'TensorFlow',level:4},{name:'AWS',level:3}], softSkills:['Research','Sperimentazione','Pubblicazioni scientifiche'], values:['Innovazione','Amore per gli animali'], risks:['Lavora meglio in autonomia'], experiences:[{company:'Politecnico di Torino — VANDAL Lab',role:'Research Fellow',start:'2018-09-01',end:'2024-02-29',desc:'Vision per industria.'}], education:[{inst:'Politecnico di Torino',degree:'PhD',field:'Computer Vision',start:2017,end:2021}], languages:[{lang:'Italiano',level:'native'},{lang:'Inglese',level:'fluent'}], certs:[{name:'PyTorch Certified Developer',org:'Linux Foundation',year:2023}], riasec:{R:75,I:95,A:55,S:45,E:40,C:75}, climateBase:80 },
  { memberId:'465897de-d8e0-5bb7-bf13-834af3e3cf69', roleId:'5c8db9b2-a239-55b4-a1d3-bde2e427dda8', firstName:'Elena', lastName:'Marini', email:'elena.marini@amaeru.eu', jobTitle:'Product Designer (UX/UI)', gender:'F', age:32, location:'Milano', region:'Lombardia', yearsExp:9, bio:'Product designer con approccio research-driven. Crea esperienze empatiche per pet owner.', headline:'Product Designer — UX research & inclusive design', seniority:'Senior', hardSkills:[{name:'Figma',level:5},{name:'UX Design',level:5},{name:'UI Design',level:5},{name:'Photoshop',level:4},{name:'Illustrator',level:4},{name:'Branding',level:4}], softSkills:['User Research','Empathy','Workshop facilitation','Storytelling'], values:['Innovazione','Trasparenza','Amore per gli animali'], risks:['Eccessiva attenzione al dettaglio'], experiences:[{company:'Nana Bianca',role:'Senior Product Designer',start:'2019-04-01',end:'2024-01-31',desc:'Design di prodotti SaaS B2B/B2C.'}], education:[{inst:'NABA Milano',degree:'BA',field:'Design',start:2010,end:2013}], languages:[{lang:'Italiano',level:'native'},{lang:'Inglese',level:'fluent'},{lang:'Spagnolo',level:'intermediate'}], certs:[{name:'Nielsen Norman UX Certification',org:'NN/g',year:2021}], riasec:{R:40,I:75,A:95,S:75,E:55,C:60}, climateBase:87 },

  // Marketing
  { memberId:'b83e9fc1-f217-56a3-bfb9-7bf7df5a5160', roleId:'21d5cb69-f480-589b-813c-f89d49e9d9ba', firstName:'Giulia', lastName:'Ruggi', email:'giulia.ruggi@amaeru.eu', jobTitle:'Head of Marketing', gender:'F', age:36, location:'Milano', region:'Lombardia', yearsExp:13, bio:'Head of Marketing con background in growth e brand. Costruisce team di marketing data-driven con anima creativa.', headline:'Head of Marketing — Growth & Brand', seniority:'Lead', hardSkills:[{name:'Brand Strategy',level:5},{name:'Content Marketing',level:5},{name:'Google Analytics',level:4},{name:'SEO',level:4},{name:'Social Media Marketing',level:4}], softSkills:['Leadership','Storytelling','Data-driven decision','Creative direction','Mentoring'], values:['Trasparenza','Amore per gli animali','Goal Oriented'], risks:['Carico di lavoro elevato'], experiences:[{company:'Velasca',role:'Marketing Director',start:'2020-02-01',end:'2024-01-31',desc:'Brand & performance per D2C fashion.'},{company:'Glovo',role:'Country Marketing Manager',start:'2017-05-01',end:'2020-01-31',desc:'Lancio mercato italiano.'}], education:[{inst:'Università Cattolica Milano',degree:'MSc',field:'Marketing Management',start:2008,end:2013}], languages:[{lang:'Italiano',level:'native'},{lang:'Inglese',level:'fluent'},{lang:'Francese',level:'intermediate'}], certs:[{name:'Google Analytics 4 Certification',org:'Google',year:2023}], riasec:{R:35,I:70,A:85,S:80,E:90,C:60}, climateBase:90 },
  { memberId:'f53d360e-eac6-549e-aed1-9439c4ca1dab', roleId:'a6f9bc80-aeda-5206-8472-54c1c3b28295', firstName:'Marco', lastName:'Galli', email:'marco.galli@amaeru.eu', jobTitle:'Content & Brand Manager', gender:'M', age:30, location:'Milano', region:'Lombardia', yearsExp:7, bio:'Content strategist e copywriter. Costruisce la voce del brand Amaeru e gestisce blog, newsletter, video.', headline:'Content & Brand Manager — Editorial pet-tech', seniority:'Senior', hardSkills:[{name:'Content Marketing',level:5},{name:'Copywriting',level:5},{name:'Brand Strategy',level:4},{name:'SEO',level:3},{name:'Photoshop',level:3}], softSkills:['Storytelling','Editorial planning','Cross-team collab'], values:['Trasparenza','Amore per gli animali'], risks:['Fatica a gestire molti deadline contemporanei'], experiences:[{company:'Will Media',role:'Senior Editor',start:'2019-09-01',end:'2024-01-31',desc:'Content editoriale per audience giovane.'}], education:[{inst:'IULM Milano',degree:'BA',field:'Comunicazione',start:2013,end:2017}], languages:[{lang:'Italiano',level:'native'},{lang:'Inglese',level:'fluent'}], certs:[], riasec:{R:30,I:65,A:90,S:75,E:75,C:55}, climateBase:86 },
  { memberId:'55978dab-41b4-54ee-8114-041b63936767', roleId:'ae642bfc-a3c2-52f3-9492-33469109edbe', firstName:'Sofia', lastName:'De Luca', email:'sofia.deluca@amaeru.eu', jobTitle:'Performance & SEO Specialist', gender:'F', age:28, location:'Milano', region:'Lombardia', yearsExp:6, bio:'SEO/SEM specialist data-driven. Ottimizza acquisition cost e converte organico.', headline:'Performance & SEO Specialist', seniority:'Mid', hardSkills:[{name:'SEO',level:5},{name:'SEM',level:5},{name:'Google Analytics',level:5},{name:'Data Analysis',level:4},{name:'Excel Advanced',level:4}], softSkills:['Analisi dati','Sperimentazione A/B','Attenzione al dettaglio'], values:['Goal Oriented','Trasparenza'], risks:['Rischio tunnel vision sui numeri'], experiences:[{company:'Webranking',role:'SEO Specialist',start:'2020-03-01',end:'2024-01-31',desc:'SEO tecnico per clienti enterprise.'}], education:[{inst:'Università di Pavia',degree:'BSc',field:'Marketing',start:2014,end:2018}], languages:[{lang:'Italiano',level:'native'},{lang:'Inglese',level:'professional'}], certs:[{name:'Google Ads Search Certification',org:'Google',year:2023},{name:'SEMrush SEO Toolkit',org:'SEMrush',year:2022}], riasec:{R:45,I:85,A:50,S:55,E:70,C:90}, climateBase:82 },
  { memberId:'d7694d90-3adf-5e90-b1d4-7045f90ddf6a', roleId:'28a73e9e-e4ee-59ec-8682-56b7242971c0', firstName:'Luca', lastName:'Ferrari', email:'luca.ferrari@amaeru.eu', jobTitle:'Social Media & Community Manager', gender:'M', age:26, location:'Milano', region:'Lombardia', yearsExp:4, bio:'Social media manager con feeling per video brevi e community building.', headline:'Social & Community Manager — Pet content creator', seniority:'Mid', hardSkills:[{name:'Social Media Marketing',level:5},{name:'Content Marketing',level:4},{name:'Copywriting',level:4},{name:'Photoshop',level:3}], softSkills:['Community engagement','Trend spotting','Video editing'], values:['Amore per gli animali','Innovazione'], risks:['Esperienza limitata su paid social'], experiences:[{company:'Freelance',role:'Social Media Manager',start:'2021-01-01',end:'2024-02-29',desc:'Gestione canali per brand pet/wellness.'}], education:[{inst:'IED Milano',degree:'BA',field:'Digital Communication',start:2016,end:2019}], languages:[{lang:'Italiano',level:'native'},{lang:'Inglese',level:'professional'}], certs:[{name:'Meta Blueprint Certified',org:'Meta',year:2023}], riasec:{R:35,I:55,A:90,S:85,E:85,C:50}, climateBase:88 },

  // Vet
  { memberId:'2803bcfd-2b08-5bc5-b3da-325cf3bdebcd', roleId:'bb1b14da-ca77-520c-9df4-8b91cba00628', firstName:'Valentina', lastName:'Rossi', email:'valentina.rossi@amaeru.eu', jobTitle:'Veterinary Lead (DVM, WSAVA)', gender:'F', age:41, location:'Milano', region:'Lombardia', yearsExp:16, bio:'Medico veterinario con specializzazione in nutrizione e medicina interna. Membro WSAVA. Garantisce rigore scientifico.', headline:'Veterinary Lead — DVM, WSAVA member', seniority:'Lead', hardSkills:[{name:'Data Analysis',level:3,custom:false}], softSkills:['Rigore scientifico','Comunicazione divulgativa','Empathy','Critical Thinking'], values:['Trasparenza','Amore per gli animali'], risks:['Tempi di review lunghi'], experiences:[{company:'Clinica Veterinaria San Siro',role:'Medico Veterinario',start:'2010-09-01',end:'2024-01-31',desc:'Medicina interna piccoli animali.'}], education:[{inst:'Università degli Studi di Milano',degree:'DVM',field:'Medicina Veterinaria',start:2003,end:2009}], languages:[{lang:'Italiano',level:'native'},{lang:'Inglese',level:'fluent'}], certs:[{name:'WSAVA Member',org:'WSAVA',year:2015},{name:'ENVA Diplomate Nutrition',org:'European College of Veterinary Nutrition',year:2018}], riasec:{R:65,I:95,A:50,S:90,E:55,C:70}, climateBase:85 },
  { memberId:'c27f66d9-121e-565a-92e6-e86a5375c02f', roleId:'f7746232-8650-5642-bc6d-84f4685c63f3', firstName:'Andrea', lastName:'Pozzi', email:'andrea.pozzi@amaeru.eu', jobTitle:'Pet Nutrition Specialist', gender:'M', age:35, location:'Bologna', region:'Emilia-Romagna', yearsExp:10, bio:'Specialista in nutrizione animale, contribuisce all\'analisi etichette e ai contenuti scientifici.', headline:'Pet Nutrition Specialist', seniority:'Senior', hardSkills:[{name:'Data Analysis',level:3}], softSkills:['Critical Thinking','Pubblicazioni','Divulgazione'], values:['Trasparenza','Amore per gli animali'], risks:['Comunicazione molto tecnica'], experiences:[{company:'Università di Bologna',role:'Ricercatore',start:'2016-01-01',end:'2024-02-29',desc:'Studi su nutrizione cane/gatto.'}], education:[{inst:'Università di Bologna',degree:'DVM + PhD',field:'Nutrizione Animale',start:2008,end:2016}], languages:[{lang:'Italiano',level:'native'},{lang:'Inglese',level:'fluent'}], certs:[], riasec:{R:60,I:95,A:45,S:80,E:50,C:75}, climateBase:80 },

  // Customer Success
  { memberId:'0410acb1-b210-5d8b-8f4a-e195d53b3590', roleId:'a0c1e40b-cbc8-54bc-a7e3-f2aa1eb8c937', firstName:'Martina', lastName:'Gallo', email:'martina.gallo@amaeru.eu', jobTitle:'Customer Success Lead', gender:'F', age:33, location:'Milano', region:'Lombardia', yearsExp:10, bio:'Customer Success leader con focus su retention e community. Costruisce relazione di lungo periodo con i pet owner.', headline:'CS Lead — Retention & Community', seniority:'Lead', hardSkills:[{name:'Excel Advanced',level:4},{name:'Data Analysis',level:3},{name:'Email Marketing',level:4}], softSkills:['Empathy','Conflict Resolution','Process design','Leadership'], values:['Amore per gli animali','Trasparenza','Goal Oriented'], risks:['Difficoltà a delegare'], experiences:[{company:'TheFork',role:'CS Manager',start:'2018-01-01',end:'2024-01-31',desc:'Team CS B2B per ristoranti.'}], education:[{inst:'Università di Torino',degree:'MSc',field:'Psicologia',start:2009,end:2014}], languages:[{lang:'Italiano',level:'native'},{lang:'Inglese',level:'fluent'},{lang:'Spagnolo',level:'professional'}], certs:[{name:'Customer Success Manager Certification',org:'SuccessCOACHING',year:2022}], riasec:{R:30,I:60,A:65,S:95,E:80,C:65}, climateBase:88 },
  { memberId:'23938116-ee8d-57d1-a5df-05b301f17c53', roleId:'63849bbd-5170-59b5-b28a-98ad82ee6729', firstName:'Riccardo', lastName:'Esposito', email:'riccardo.esposito@amaeru.eu', jobTitle:'Community & Support Specialist', gender:'M', age:25, location:'Napoli', region:'Campania', yearsExp:3, bio:'Support specialist multilingua. Gestisce ticket, chat e community Discord.', headline:'Community & Support Specialist', seniority:'Junior', hardSkills:[{name:'Excel Advanced',level:3},{name:'Social Media Marketing',level:3}], softSkills:['Pazienza','Multitasking','Empathy'], values:['Amore per gli animali','Trasparenza'], risks:['Junior, in crescita'], experiences:[{company:'Treatwell',role:'Customer Support Agent',start:'2022-04-01',end:'2024-02-29',desc:'Support multi-canale.'}], education:[{inst:'Università Federico II Napoli',degree:'BA',field:'Lingue',start:2016,end:2020}], languages:[{lang:'Italiano',level:'native'},{lang:'Inglese',level:'fluent'},{lang:'Spagnolo',level:'fluent'}], certs:[], riasec:{R:35,I:55,A:65,S:90,E:65,C:60}, climateBase:78 },

  // Operations & Finance
  { memberId:'ca13f3ba-7149-50c5-8393-db344a3cd6fb', roleId:'beb653e8-345e-5fec-b33a-735241c16ceb', firstName:'Paola', lastName:'Neri', email:'paola.neri@amaeru.eu', jobTitle:'CFO / Head of Operations', gender:'F', age:43, location:'Milano', region:'Lombardia', yearsExp:18, bio:'CFO con esperienza in scale-up tech. Gestisce finance, operations e controllo di gestione.', headline:'CFO & Head of Ops — Scaling fintech & pet-tech', seniority:'C-Level', hardSkills:[{name:'Financial Analysis',level:5},{name:'Financial Modeling',level:5},{name:'SAP',level:4},{name:'Accounting',level:5},{name:'Budgeting',level:5},{name:'Excel Advanced',level:5}], softSkills:['Strategic Planning','Negoziazione','Leadership','Risk Management'], values:['Trasparenza','Goal Oriented'], risks:['Stile decisionale rigoroso'], experiences:[{company:'Casavo',role:'Finance Director',start:'2019-06-01',end:'2024-01-31',desc:'Finance per scale-up proptech.'}], education:[{inst:'Università Bocconi',degree:'MSc',field:'Finance',start:2001,end:2006}], languages:[{lang:'Italiano',level:'native'},{lang:'Inglese',level:'fluent'}], certs:[{name:'CFA Level III',org:'CFA Institute',year:2012}], riasec:{R:35,I:80,A:30,S:60,E:85,C:95}, climateBase:84 },
  { memberId:'e2278b2e-0ccb-504e-a8e3-b3a6540dd4b6', roleId:'4e0bd4fd-d9ff-5289-9bf8-7f9bff588a1c', firstName:'Stefano', lastName:'Lombardi', email:'stefano.lombardi@amaeru.eu', jobTitle:'Finance & Admin', gender:'M', age:34, location:'Milano', region:'Lombardia', yearsExp:9, bio:'Finance & Admin specialist. Gestisce ciclo attivo/passivo, riconciliazioni e reportistica mensile.', headline:'Finance & Admin Specialist', seniority:'Senior', hardSkills:[{name:'Accounting',level:5},{name:'Excel Advanced',level:5},{name:'SAP',level:4},{name:'Budgeting',level:4}], softSkills:['Precisione','Organizzazione','Riservatezza'], values:['Trasparenza','Goal Oriented'], risks:['Poco propenso al cambiamento'], experiences:[{company:'PwC',role:'Senior Auditor',start:'2017-09-01',end:'2024-01-31',desc:'Audit clienti mid-cap.'}], education:[{inst:'Università Cattolica Milano',degree:'MSc',field:'Economia',start:2010,end:2015}], languages:[{lang:'Italiano',level:'native'},{lang:'Inglese',level:'professional'}], certs:[{name:'Dottore Commercialista',org:'ODCEC Milano',year:2018}], riasec:{R:35,I:70,A:25,S:55,E:55,C:95}, climateBase:80 },
  { memberId:'84c5448a-1ad6-5de6-b2bc-668a1ba2e47a', roleId:'f52ef6bd-b027-5361-85ce-2f8856ace1a1', firstName:'Francesca', lastName:'Moretti', email:'francesca.moretti@amaeru.eu', jobTitle:'People & Legal', gender:'F', age:38, location:'Milano', region:'Lombardia', yearsExp:14, bio:'HR Business Partner con background legale. Gestisce contratti, talent acquisition, compliance e cultura.', headline:'People & Legal — HRBP & In-house counsel', seniority:'Senior', hardSkills:[{name:'Excel Advanced',level:4}], softSkills:['Empathy','Conflict resolution','Negoziazione','Diritto del lavoro'], values:['Trasparenza','Goal Oriented','Amore per gli animali'], risks:['Carico legato a compliance'], experiences:[{company:'Studio Legale Toffoletto',role:'Avvocato giuslavorista',start:'2014-01-01',end:'2020-06-30',desc:'Diritto del lavoro per aziende.'},{company:'N26',role:'HR Business Partner',start:'2020-07-01',end:'2024-01-31',desc:'HRBP team product/tech.'}], education:[{inst:'Università di Bologna',degree:'JD',field:'Giurisprudenza',start:2005,end:2010}], languages:[{lang:'Italiano',level:'native'},{lang:'Inglese',level:'fluent'},{lang:'Tedesco',level:'intermediate'}], certs:[{name:'SHRM-CP',org:'SHRM',year:2022}], riasec:{R:25,I:75,A:50,S:90,E:75,C:80}, climateBase:86 },
];

// climate sections (9)
const CLIMATE_SECTIONS = ['Soddisfazione','Leadership','Comunicazione','Crescita','Worklife','Compensation','Cultura','Riconoscimento','Innovazione'];

function profileCode(r:any){
  const arr = Object.entries(r).sort((a:any,b:any)=>b[1]-a[1]).slice(0,3).map(e=>e[0]);
  return arr.join('-');
}

async function deleteExisting(supa:any){
  // delete extra location piano 2 if present
  const { data: extra } = await supa.from('office_locations').select('id').eq('company_id', COMPANY_ID).neq('id', HQ_LOCATION_ID);
  if (extra && extra.length){
    for (const l of extra){
      const { data: rooms } = await supa.from('office_rooms').select('id').eq('location_id', l.id);
      if (rooms?.length) await supa.from('office_desks').delete().in('room_id', rooms.map((r:any)=>r.id));
      await supa.from('office_rooms').delete().eq('location_id', l.id);
      await supa.from('office_locations').delete().eq('id', l.id);
    }
  }
  // delete existing auth users for amaeru emails
  const { data: list } = await supa.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const toDelete = (list?.users || []).filter((u:any)=>u.email?.endsWith('@amaeru.eu'));
  for (const u of toDelete){
    // unlink from member
    await supa.from('company_members').update({ user_id: null }).eq('user_id', u.id);
    // delete user-level data
    await supa.from('user_hard_skills').delete().eq('user_id', u.id);
    await supa.from('user_experiences').delete().eq('user_id', u.id);
    await supa.from('user_education').delete().eq('user_id', u.id);
    await supa.from('user_languages').delete().eq('user_id', u.id);
    await supa.from('user_certifications').delete().eq('user_id', u.id);
    await supa.from('riasec_results').delete().eq('user_id', u.id);
    await supa.from('karma_sessions').delete().eq('user_id', u.id);
    await supa.from('climate_responses').delete().eq('user_id', u.id);
    await supa.auth.admin.deleteUser(u.id);
  }
  // compliance
  await supa.from('company_compliance_status').delete().eq('company_id', COMPANY_ID);
  await supa.from('company_ccnl_selections').delete().eq('company_id', COMPANY_ID);
}

async function createUsersAndProfiles(supa:any, log:string[]){
  let created = 0;
  for (const p of PEOPLE){
    const { data: u, error } = await supa.auth.admin.createUser({
      email: p.email, password: PASSWORD, email_confirm: true,
      user_metadata: { first_name: p.firstName, last_name: p.lastName },
    });
    if (error || !u?.user){ log.push(`AUTH FAIL ${p.email}: ${error?.message}`); continue; }
    const uid = u.user.id;
    // Update member
    await supa.from('company_members').update({
      user_id: uid, status: 'completed', joined_at: new Date().toISOString(),
      placeholder_first_name: null, placeholder_last_name: null, placeholder_email: null,
    }).eq('id', p.memberId);
    // Update profile
    const birthYear = new Date().getFullYear() - p.age;
    await supa.from('profiles').update({
      first_name: p.firstName, last_name: p.lastName, gender: p.gender, age: p.age,
      birth_date: `${birthYear}-06-15`, job_title: p.jobTitle, bio: p.bio, headline: p.headline,
      location: p.location, region: p.region, years_experience: p.yearsExp,
      is_karma_profile: false, looking_for_work: false, profile_visibility: 'private',
    }).eq('id', uid);
    // Hard skills
    const hsRows = p.hardSkills.map(s=>({
      user_id: uid, skill_id: s.custom ? null : (HS[s.name] || null),
      custom_skill_name: HS[s.name] ? null : s.name,
      proficiency_level: s.level,
    }));
    if (hsRows.length) await supa.from('user_hard_skills').insert(hsRows);
    // Experiences
    const exRows = p.experiences.map((e,i)=>({
      user_id: uid, company: e.company, role: e.role,
      start_date: e.start, end_date: e.end, is_current: !e.end, description: e.desc, sort_order: i,
    }));
    if (exRows.length) await supa.from('user_experiences').insert(exRows);
    // Education
    const edRows = p.education.map((e,i)=>({
      user_id: uid, institution: e.inst, degree: e.degree, field_of_study: e.field,
      start_year: e.start, end_year: e.end, sort_order: i,
    }));
    if (edRows.length) await supa.from('user_education').insert(edRows);
    // Languages
    const langRows = p.languages.map(l=>({ user_id: uid, language: l.lang, proficiency: l.level }));
    if (langRows.length) await supa.from('user_languages').insert(langRows);
    // Certs
    const certRows = p.certs.map(c=>({
      user_id: uid, name: c.name, issuing_organization: c.org, issue_date: `${c.year}-06-01`,
    }));
    if (certRows.length) await supa.from('user_certifications').insert(certRows);
    // RIASEC
    await supa.from('riasec_results').insert({
      user_id: uid, company_id: COMPANY_ID,
      score_r: p.riasec.R, score_i: p.riasec.I, score_a: p.riasec.A,
      score_s: p.riasec.S, score_e: p.riasec.E, score_c: p.riasec.C,
      profile_code: profileCode(p.riasec), raw_answers: { seeded: true },
    });
    // Karma session
    await supa.from('karma_sessions').insert({
      user_id: uid, company_id: COMPANY_ID,
      transcript: [
        { role: 'assistant', content: `Ciao ${p.firstName}, raccontami un progetto di cui sei orgoglioso.` },
        { role: 'user', content: `Ho lavorato su ${p.experiences[0]?.company || 'progetti complessi'} con un team affiatato.` },
        { role: 'assistant', content: 'Quali valori ti hanno guidato?' },
        { role: 'user', content: `Soprattutto ${p.values.join(', ')}.` },
      ],
      summary: `${p.firstName} mostra ${p.softSkills.slice(0,2).join(' e ')}, con forti valori di ${p.values[0]}. Profilo ${p.seniority}.`,
      soft_skills: p.softSkills, primary_values: p.values, risk_factors: p.risks,
      seniority_assessment: p.seniority, completed_at: new Date().toISOString(),
    });
    // Climate
    const sectionAvgs:Record<string,number> = {};
    let total=0;
    for (const s of CLIMATE_SECTIONS){
      const v = Math.max(50, Math.min(98, p.climateBase + (Math.random()*10 - 5)));
      sectionAvgs[s] = Math.round(v*10)/10; total += v;
    }
    await supa.from('climate_responses').insert({
      user_id: uid, company_id: COMPANY_ID,
      raw_scores: { seeded: true }, section_averages: sectionAvgs,
      overall_average: Math.round((total / CLIMATE_SECTIONS.length)*10)/10,
    });
    created++;
  }
  log.push(`Created ${created}/${PEOPLE.length} users`);
  return created;
}

async function setupSpaceSyncFloor2(supa:any, log:string[]){
  // Create new location piano 2
  const { data: loc, error } = await supa.from('office_locations').insert({
    company_id: COMPANY_ID, name: 'Milano HQ — Piano 2',
    address: 'Via Cavour 1, Milano', building_name: 'Milano HQ', floor_number: 2,
    canvas_width: 1200, canvas_height: 800, sort_order: 2,
  }).select().single();
  if (error || !loc){ log.push(`LOC2 fail: ${error?.message}`); return; }
  const locId = loc.id;
  // Rooms
  const rooms = [
    { name: 'Ufficio CEO', x: 60, y: 60, width: 220, height: 160, color: '#fef3c7', room_type: 'office' },
    { name: 'Sala CDA', x: 320, y: 60, width: 280, height: 180, color: '#fce7f3', room_type: 'meeting' },
    { name: 'Lounge', x: 640, y: 60, width: 220, height: 180, color: '#dcfce7', room_type: 'common' },
    { name: 'Sala Duomo', x: 900, y: 60, width: 220, height: 180, color: '#dbeafe', room_type: 'meeting' },
    { name: 'Open Space Marketing', x: 60, y: 290, width: 380, height: 220, color: '#e0f2fe', room_type: 'office' },
    { name: 'Vet Lab', x: 480, y: 290, width: 280, height: 220, color: '#f3e8ff', room_type: 'office' },
    { name: 'Customer Success Hub', x: 60, y: 550, width: 320, height: 200, color: '#fee2e2', room_type: 'office' },
    { name: 'Operations & Finance', x: 420, y: 550, width: 380, height: 200, color: '#ecfccb', room_type: 'office' },
  ];
  const roomMap: Record<string,string> = {};
  for (const r of rooms){
    const { data: rr } = await supa.from('office_rooms').insert({ ...r, location_id: locId }).select().single();
    if (rr) roomMap[r.name] = rr.id;
  }
  // Desks: assign by member
  const placements = [
    { room: 'Ufficio CEO', mid: '129fd34e-d30e-5c78-b9cc-85adcc2877db', label: 'Giuseppe Ciniero', x: 110, y: 90 },
    { room: 'Open Space Marketing', mid: 'b83e9fc1-f217-56a3-bfb9-7bf7df5a5160', label: 'Giulia Ruggi', x: 80, y: 60 },
    { room: 'Open Space Marketing', mid: 'f53d360e-eac6-549e-aed1-9439c4ca1dab', label: 'Marco Galli', x: 200, y: 60 },
    { room: 'Open Space Marketing', mid: '55978dab-41b4-54ee-8114-041b63936767', label: 'Sofia De Luca', x: 80, y: 150 },
    { room: 'Open Space Marketing', mid: 'd7694d90-3adf-5e90-b1d4-7045f90ddf6a', label: 'Luca Ferrari', x: 200, y: 150 },
    { room: 'Vet Lab', mid: '2803bcfd-2b08-5bc5-b3da-325cf3bdebcd', label: 'Valentina Rossi', x: 70, y: 80 },
    { room: 'Vet Lab', mid: 'c27f66d9-121e-565a-92e6-e86a5375c02f', label: 'Andrea Pozzi', x: 170, y: 80 },
    { room: 'Customer Success Hub', mid: '0410acb1-b210-5d8b-8f4a-e195d53b3590', label: 'Martina Gallo', x: 80, y: 80 },
    { room: 'Customer Success Hub', mid: '23938116-ee8d-57d1-a5df-05b301f17c53', label: 'Riccardo Esposito', x: 200, y: 80 },
    { room: 'Operations & Finance', mid: 'ca13f3ba-7149-50c5-8393-db344a3cd6fb', label: 'Paola Neri', x: 70, y: 80 },
    { room: 'Operations & Finance', mid: 'e2278b2e-0ccb-504e-a8e3-b3a6540dd4b6', label: 'Stefano Lombardi', x: 190, y: 80 },
    { room: 'Operations & Finance', mid: '84c5448a-1ad6-5de6-b2bc-668a1ba2e47a', label: 'Francesca Moretti', x: 310, y: 80 },
  ];
  // Get role_id for each member from existing assignments
  const memberIds = placements.map(p=>p.mid);
  const { data: assigns } = await supa.from('company_role_assignments').select('company_member_id, role_id').in('company_member_id', memberIds);
  const roleByMember: Record<string,string> = {};
  (assigns||[]).forEach((a:any)=>{ roleByMember[a.company_member_id] = a.role_id; });
  const deskRows = placements.filter(p=>roomMap[p.room]).map(p=>({
    room_id: roomMap[p.room], label: p.label, x: p.x, y: p.y,
    company_member_id: p.mid, company_role_id: roleByMember[p.mid] || null,
  }));
  if (deskRows.length) await supa.from('office_desks').insert(deskRows);
  log.push(`Piano 2 created with ${rooms.length} rooms, ${deskRows.length} desks`);

  // Move CEO/CFO/CS/Marketing/Vet from Piano 1 to Piano 2 by deleting their old desks
  const piano2Members = placements.map(p=>p.mid);
  const { data: piano1Rooms } = await supa.from('office_rooms').select('id').eq('location_id', HQ_LOCATION_ID);
  if (piano1Rooms?.length){
    await supa.from('office_desks').delete().in('room_id', piano1Rooms.map((r:any)=>r.id)).in('company_member_id', piano2Members);
  }
  // Rename Piano 1 location for clarity
  await supa.from('office_locations').update({
    name: 'Milano HQ — Piano 1', floor_number: 1, building_name: 'Milano HQ', sort_order: 1,
  }).eq('id', HQ_LOCATION_ID);
}

async function setupCompliance(supa:any, log:string[]){
  // CCNL
  await supa.from('company_ccnl_selections').insert({
    company_id: COMPANY_ID, ccnl_code: 'commercio', ccnl_label: 'CCNL Commercio Confcommercio', is_primary: true,
  });
  // Get applicable requirements (Universale + Commercio)
  const { data: reqs } = await supa.from('compliance_requirements')
    .select('id, ccnl_scope, frequency_months, deadline_type')
    .eq('is_active', true).in('ccnl_scope', ['Universale','Commercio']);
  if (!reqs?.length){ log.push('No requirements found'); return; }
  const today = new Date();
  const rows = reqs.map((r:any, i:number)=>{
    const bucket = i % 20;
    let status: string, validFrom: string|null = null, validUntil: string|null = null, docName: string|null = null;
    if (bucket < 12){ // 60% compliant
      status = 'compliant';
      const months = r.frequency_months || 12;
      const start = new Date(today); start.setMonth(start.getMonth() - Math.floor(months/2));
      const end = new Date(start); end.setMonth(end.getMonth() + months);
      validFrom = start.toISOString().slice(0,10);
      validUntil = end.toISOString().slice(0,10);
      docName = 'documento_compliance.pdf';
    } else if (bucket < 17){ // 25% expiring
      status = 'expiring_soon';
      const start = new Date(today); start.setMonth(start.getMonth() - 11);
      const end = new Date(today); end.setDate(end.getDate() + 15);
      validFrom = start.toISOString().slice(0,10);
      validUntil = end.toISOString().slice(0,10);
      docName = 'documento_in_scadenza.pdf';
    } else if (bucket < 19){ // 10% expired
      status = 'expired';
      const start = new Date(today); start.setMonth(start.getMonth() - 18);
      const end = new Date(today); end.setMonth(end.getMonth() - 2);
      validFrom = start.toISOString().slice(0,10);
      validUntil = end.toISOString().slice(0,10);
      docName = 'documento_scaduto.pdf';
    } else { // 5% missing
      status = 'missing';
    }
    return {
      company_id: COMPANY_ID, requirement_id: r.id, status,
      valid_from: validFrom, valid_until: validUntil, document_name: docName,
    };
  });
  // Insert in batches
  for (let i=0; i<rows.length; i+=20){
    await supa.from('company_compliance_status').insert(rows.slice(i, i+20));
  }
  log.push(`Compliance: CCNL Commercio + ${rows.length} requirements`);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const log: string[] = [];
  try {
    const supa = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );
    log.push('Cleaning up existing Amaeru data...');
    await deleteExisting(supa);
    log.push('Creating users + profiles + skills + tests...');
    const usersCreated = await createUsersAndProfiles(supa, log);
    log.push('Setting up SpaceSync Piano 2...');
    await setupSpaceSyncFloor2(supa, log);
    log.push('Setting up Compliance...');
    await setupCompliance(supa, log);
    return new Response(JSON.stringify({
      ok: true, password: PASSWORD, usersCreated, log,
      message: `✅ ${usersCreated}/22 utenti reali creati. Password: ${PASSWORD}. SpaceSync su 2 piani. Compliance + CCNL Commercio popolati.`,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    log.push(`FATAL: ${e?.message || e}`);
    return new Response(JSON.stringify({ ok: false, error: e?.message, log }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
