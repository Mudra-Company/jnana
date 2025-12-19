// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Demo users data for Dürr Dental Italia
const DEMO_USERS = [
  {
    email: "nicola.bertolotto@duerr.demo",
    firstName: "Nicola",
    lastName: "Bertolotto",
    jobTitle: "CEO",
    department: "General Management",
    riasec: { R: 45, I: 68, A: 42, S: 55, E: 85, C: 72 },
    profileCode: "ECI",
    karma: {
      summary: "Leader strategico con forte orientamento ai risultati e capacità di visione a lungo termine.",
      softSkills: ["Leadership strategica", "Pensiero sistemico", "Gestione stakeholder"],
      primaryValues: ["Innovazione", "Eccellenza", "Integrità"],
      riskFactors: ["Tendenza al micromanagement in situazioni critiche"],
      seniority: "C-Level"
    },
    climate: { rawScores: { leadership: 4.2, culture: 4.5, growth: 4.0 }, sectionAverages: { leadership: 4.2, culture: 4.5, growth: 4.0 }, overallAverage: 4.23 }
  },
  {
    email: "mauro.dorigo@duerr.demo",
    firstName: "Mauro",
    lastName: "Dorigo",
    jobTitle: "Head of Sales",
    department: "Direzione Sales",
    riasec: { R: 38, I: 52, A: 45, S: 78, E: 72, C: 65 },
    profileCode: "SEC",
    karma: {
      summary: "Manager commerciale esperto con eccellenti capacità relazionali e orientamento al cliente.",
      softSkills: ["Negoziazione", "Gestione team", "Customer focus"],
      primaryValues: ["Collaborazione", "Risultati", "Relazioni"],
      riskFactors: ["Difficoltà nel delegare decisioni importanti"],
      seniority: "Lead"
    },
    climate: { rawScores: { leadership: 3.8, culture: 4.2, growth: 3.9 }, sectionAverages: { leadership: 3.8, culture: 4.2, growth: 3.9 }, overallAverage: 3.97 }
  },
  {
    email: "claudio.venturini@duerr.demo",
    firstName: "Claudio",
    lastName: "Venturini",
    jobTitle: "Head of Service",
    department: "Direzione Service",
    riasec: { R: 65, I: 70, A: 35, S: 75, E: 48, C: 55 },
    profileCode: "SRI",
    karma: {
      summary: "Responsabile tecnico con forte competenza operativa e capacità di gestione team distribuiti.",
      softSkills: ["Problem solving tecnico", "Gestione risorse", "Pianificazione"],
      primaryValues: ["Qualità", "Efficienza", "Affidabilità"],
      riskFactors: ["Resistenza ai cambiamenti organizzativi rapidi"],
      seniority: "Lead"
    },
    climate: { rawScores: { leadership: 3.5, culture: 3.8, growth: 3.6 }, sectionAverages: { leadership: 3.5, culture: 3.8, growth: 3.6 }, overallAverage: 3.63 }
  },
  {
    email: "fabrizio.dose@duerr.demo",
    firstName: "Fabrizio",
    lastName: "Dose",
    jobTitle: "Responsabile Logistica",
    department: "Logistica",
    riasec: { R: 72, I: 65, A: 28, S: 45, E: 42, C: 78 },
    profileCode: "RIC",
    karma: {
      summary: "Professionista della supply chain con forte orientamento all'ottimizzazione dei processi.",
      softSkills: ["Ottimizzazione processi", "Gestione fornitori", "Analisi dati"],
      primaryValues: ["Precisione", "Efficienza", "Continuità"],
      riskFactors: ["Tendenza all'isolamento decisionale"],
      seniority: "Senior"
    },
    climate: { rawScores: { leadership: 3.2, culture: 3.5, growth: 3.3 }, sectionAverages: { leadership: 3.2, culture: 3.5, growth: 3.3 }, overallAverage: 3.33 }
  },
  {
    email: "tessa.sangalli@duerr.demo",
    firstName: "Tessa",
    lastName: "Sangalli",
    jobTitle: "Head of Admin",
    department: "Admin & Finance",
    riasec: { R: 35, I: 48, A: 32, S: 58, E: 68, C: 82 },
    profileCode: "CER",
    karma: {
      summary: "Manager amministrativa con eccellente capacità organizzativa e attenzione ai dettagli.",
      softSkills: ["Gestione budget", "Compliance", "Coordinamento"],
      primaryValues: ["Ordine", "Trasparenza", "Responsabilità"],
      riskFactors: ["Rigidità nelle procedure"],
      seniority: "Lead"
    },
    climate: { rawScores: { leadership: 4.0, culture: 4.1, growth: 3.8 }, sectionAverages: { leadership: 4.0, culture: 4.1, growth: 3.8 }, overallAverage: 3.97 }
  },
  {
    email: "michele.cassano@duerr.demo",
    firstName: "Michele",
    lastName: "Cassano",
    jobTitle: "Area Manager",
    department: "Team Sales",
    riasec: { R: 42, I: 62, A: 48, S: 75, E: 68, C: 52 },
    profileCode: "SIE",
    karma: {
      summary: "Sales manager con forte orientamento alle relazioni e capacità di sviluppo territorio.",
      softSkills: ["Sviluppo clienti", "Coaching", "Networking"],
      primaryValues: ["Crescita", "Relazioni", "Risultati"],
      riskFactors: ["Tendenza a sovraesporsi su troppi fronti"],
      seniority: "Senior"
    },
    climate: { rawScores: { leadership: 3.6, culture: 4.0, growth: 4.2 }, sectionAverages: { leadership: 3.6, culture: 4.0, growth: 4.2 }, overallAverage: 3.93 }
  },
  {
    email: "marco.fabio@duerr.demo",
    firstName: "Marco",
    lastName: "Fabio",
    jobTitle: "Sales Specialist",
    department: "Team Sales",
    riasec: { R: 35, I: 72, A: 58, S: 68, E: 52, C: 45 },
    profileCode: "ISA",
    karma: {
      summary: "Specialista vendite con approccio consulenziale e forte competenza tecnica di prodotto.",
      softSkills: ["Consulenza tecnica", "Presentazioni", "Analisi bisogni"],
      primaryValues: ["Competenza", "Servizio", "Innovazione"],
      riskFactors: ["Difficoltà nella chiusura commerciale"],
      seniority: "Mid"
    },
    climate: { rawScores: { leadership: 3.4, culture: 3.9, growth: 4.0 }, sectionAverages: { leadership: 3.4, culture: 3.9, growth: 4.0 }, overallAverage: 3.77 }
  },
  {
    email: "giulia.bartoli@duerr.demo",
    firstName: "Giulia",
    lastName: "Bartoli",
    jobTitle: "Marketing Specialist",
    department: "Marketing",
    riasec: { R: 28, I: 48, A: 72, S: 75, E: 65, C: 42 },
    profileCode: "SAE",
    karma: {
      summary: "Professionista del marketing con creatività e forte orientamento alla comunicazione.",
      softSkills: ["Content creation", "Social media", "Event management"],
      primaryValues: ["Creatività", "Comunicazione", "Impatto"],
      riskFactors: ["Tendenza a sottovalutare aspetti analitici"],
      seniority: "Mid"
    },
    climate: { rawScores: { leadership: 3.3, culture: 4.3, growth: 4.1 }, sectionAverages: { leadership: 3.3, culture: 4.3, growth: 4.1 }, overallAverage: 3.90 }
  },
  {
    email: "massimiliano.cerati@duerr.demo",
    firstName: "Massimiliano",
    lastName: "Cerati",
    jobTitle: "Marketing Specialist",
    department: "Marketing",
    riasec: { R: 32, I: 58, A: 48, S: 72, E: 68, C: 52 },
    profileCode: "SEI",
    karma: {
      summary: "Marketer con forte orientamento strategico e capacità di analisi di mercato.",
      softSkills: ["Analisi mercato", "Strategia", "Digital marketing"],
      primaryValues: ["Strategia", "Innovazione", "Dati"],
      riskFactors: ["Tendenza al perfezionismo"],
      seniority: "Mid"
    },
    climate: { rawScores: { leadership: 3.5, culture: 4.0, growth: 3.8 }, sectionAverages: { leadership: 3.5, culture: 4.0, growth: 3.8 }, overallAverage: 3.77 }
  },
  {
    email: "barbara.pasqualini@duerr.demo",
    firstName: "Barbara",
    lastName: "Pasqualini",
    jobTitle: "Gestione Ordini",
    department: "Admin & Finance",
    riasec: { R: 38, I: 45, A: 35, S: 72, E: 55, C: 78 },
    profileCode: "SCE",
    karma: {
      summary: "Specialista ordini con eccellente precisione e capacità di gestione clienti.",
      softSkills: ["Gestione ordini", "Customer service", "Precisione"],
      primaryValues: ["Accuratezza", "Servizio", "Efficienza"],
      riskFactors: ["Difficoltà nella gestione di picchi di lavoro"],
      seniority: "Mid"
    },
    climate: { rawScores: { leadership: 3.1, culture: 3.8, growth: 3.4 }, sectionAverages: { leadership: 3.1, culture: 3.8, growth: 3.4 }, overallAverage: 3.43 }
  },
  {
    email: "paolo.romano@duerr.demo",
    firstName: "Paolo",
    lastName: "Romano",
    jobTitle: "Tecnico Service Tradizionale",
    department: "Team Tecnico",
    riasec: { R: 68, I: 52, A: 35, S: 62, E: 72, C: 48 },
    profileCode: "ESR",
    karma: {
      summary: "Tecnico esperto con forte orientamento al cliente e capacità di problem solving.",
      softSkills: ["Diagnosi tecnica", "Relazione cliente", "Autonomia"],
      primaryValues: ["Competenza", "Servizio", "Affidabilità"],
      riskFactors: ["Resistenza all'adozione di nuove tecnologie"],
      seniority: "Senior"
    },
    climate: { rawScores: { leadership: 3.0, culture: 3.6, growth: 3.2 }, sectionAverages: { leadership: 3.0, culture: 3.6, growth: 3.2 }, overallAverage: 3.27 }
  },
  {
    email: "ivan.pagnini@duerr.demo",
    firstName: "Ivan Carlo",
    lastName: "Pagnini",
    jobTitle: "Specialist R&D",
    department: "Team Tecnico",
    riasec: { R: 75, I: 68, A: 42, S: 45, E: 72, C: 52 },
    profileCode: "ERI",
    karma: {
      summary: "Specialista R&D con forte competenza tecnica e orientamento all'innovazione.",
      softSkills: ["Ricerca", "Innovazione", "Analisi tecnica"],
      primaryValues: ["Innovazione", "Qualità", "Scoperta"],
      riskFactors: ["Tendenza all'isolamento progettuale"],
      seniority: "Senior"
    },
    climate: { rawScores: { leadership: 3.2, culture: 3.7, growth: 4.0 }, sectionAverages: { leadership: 3.2, culture: 3.7, growth: 4.0 }, overallAverage: 3.63 }
  },
  {
    email: "matteo.griffini@duerr.demo",
    firstName: "Matteo",
    lastName: "Griffini",
    jobTitle: "Tecnico Service",
    department: "Team Tecnico",
    riasec: { R: 48, I: 72, A: 65, S: 55, E: 42, C: 58 },
    profileCode: "IAC",
    karma: {
      summary: "Tecnico con approccio analitico e capacità di documentazione tecnica.",
      softSkills: ["Analisi", "Documentazione", "Metodicità"],
      primaryValues: ["Precisione", "Apprendimento", "Metodo"],
      riskFactors: ["Lentezza nelle decisioni operative"],
      seniority: "Mid"
    },
    climate: { rawScores: { leadership: 3.1, culture: 3.5, growth: 3.6 }, sectionAverages: { leadership: 3.1, culture: 3.5, growth: 3.6 }, overallAverage: 3.40 }
  },
  {
    email: "gabriele.piani@duerr.demo",
    firstName: "Gabriele",
    lastName: "Piani",
    jobTitle: "Tecnico Service",
    department: "Team Tecnico",
    riasec: { R: 68, I: 62, A: 38, S: 72, E: 45, C: 52 },
    profileCode: "SRI",
    karma: {
      summary: "Tecnico affidabile con buone capacità relazionali e orientamento al servizio.",
      softSkills: ["Assistenza clienti", "Lavoro di squadra", "Flessibilità"],
      primaryValues: ["Servizio", "Collaborazione", "Affidabilità"],
      riskFactors: ["Difficoltà nella gestione delle priorità"],
      seniority: "Mid"
    },
    climate: { rawScores: { leadership: 3.0, culture: 3.8, growth: 3.5 }, sectionAverages: { leadership: 3.0, culture: 3.8, growth: 3.5 }, overallAverage: 3.43 }
  },
  {
    email: "alberto.luppichini@duerr.demo",
    firstName: "Alberto",
    lastName: "Luppichini",
    jobTitle: "Tecnico Service",
    department: "Team Tecnico",
    riasec: { R: 55, I: 58, A: 68, S: 72, E: 42, C: 45 },
    profileCode: "SAI",
    karma: {
      summary: "Tecnico creativo con buone capacità di problem solving non convenzionale.",
      softSkills: ["Creatività tecnica", "Adattabilità", "Comunicazione"],
      primaryValues: ["Innovazione", "Servizio", "Crescita"],
      riskFactors: ["Tendenza a soluzioni non standard"],
      seniority: "Mid"
    },
    climate: { rawScores: { leadership: 2.9, culture: 3.7, growth: 3.8 }, sectionAverages: { leadership: 2.9, culture: 3.7, growth: 3.8 }, overallAverage: 3.47 }
  },
  {
    email: "alberto.scudier@duerr.demo",
    firstName: "Alberto",
    lastName: "Scudier",
    jobTitle: "Installatore",
    department: "Team Tecnico",
    riasec: { R: 62, I: 68, A: 55, S: 72, E: 45, C: 42 },
    profileCode: "SIA",
    karma: {
      summary: "Installatore preciso con buone capacità manuali e attenzione ai dettagli.",
      softSkills: ["Installazione", "Precisione", "Autonomia"],
      primaryValues: ["Qualità", "Efficienza", "Sicurezza"],
      riskFactors: ["Difficoltà nel lavoro di squadra prolungato"],
      seniority: "Mid"
    },
    climate: { rawScores: { leadership: 2.8, culture: 3.5, growth: 3.3 }, sectionAverages: { leadership: 2.8, culture: 3.5, growth: 3.3 }, overallAverage: 3.20 }
  },
  {
    email: "andrea.tompetrini@duerr.demo",
    firstName: "Andrea",
    lastName: "Tompetrini",
    jobTitle: "Addetto Magazzino",
    department: "Logistica",
    riasec: { R: 72, I: 45, A: 55, S: 68, E: 38, C: 52 },
    profileCode: "SRA",
    karma: {
      summary: "Addetto magazzino affidabile con buone capacità organizzative.",
      softSkills: ["Organizzazione", "Gestione scorte", "Precisione"],
      primaryValues: ["Ordine", "Affidabilità", "Efficienza"],
      riskFactors: ["Limitata propensione all'iniziativa"],
      seniority: "Junior"
    },
    climate: { rawScores: { leadership: 2.7, culture: 3.4, growth: 3.1 }, sectionAverages: { leadership: 2.7, culture: 3.4, growth: 3.1 }, overallAverage: 3.07 }
  },
  {
    email: "alessandra.ciceri@duerr.demo",
    firstName: "Alessandra",
    lastName: "Ciceri",
    jobTitle: "Supporto Amministrativo",
    department: "Admin & Finance",
    riasec: { R: 32, I: 42, A: 55, S: 75, E: 48, C: 72 },
    profileCode: "SCA",
    karma: {
      summary: "Supporto amministrativo preciso con eccellenti capacità organizzative.",
      softSkills: ["Organizzazione", "Precisione", "Supporto"],
      primaryValues: ["Accuratezza", "Servizio", "Collaborazione"],
      riskFactors: ["Tendenza alla dipendenza dalle direttive"],
      seniority: "Junior"
    },
    climate: { rawScores: { leadership: 2.9, culture: 3.6, growth: 3.2 }, sectionAverages: { leadership: 2.9, culture: 3.6, growth: 3.2 }, overallAverage: 3.23 }
  }
];

// Department mapping for Dürr Dental Italia
const DEPARTMENT_MAP: Record<string, string> = {
  "General Management": "dept-gm",
  "Direzione Sales": "dept-sales",
  "Direzione Service": "dept-service",
  "Logistica": "dept-logistics",
  "Admin & Finance": "dept-admin",
  "Team Sales": "team-sales",
  "Marketing": "team-marketing",
  "Team Tecnico": "team-tecnico"
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const companyId = "11111111-1111-1111-1111-111111111111"; // Dürr Dental Italia
    const results: { email: string; success: boolean; error?: string; userId?: string }[] = [];

    // First, ensure org_nodes exist for our departments
    const orgNodesData = [
      { id: "dept-gm", company_id: companyId, name: "General Management", type: "department", parent_node_id: null, sort_order: 0 },
      { id: "dept-sales", company_id: companyId, name: "Direzione Sales", type: "department", parent_node_id: null, sort_order: 1 },
      { id: "dept-service", company_id: companyId, name: "Direzione Service", type: "department", parent_node_id: null, sort_order: 2 },
      { id: "dept-logistics", company_id: companyId, name: "Logistica", type: "department", parent_node_id: null, sort_order: 3 },
      { id: "dept-admin", company_id: companyId, name: "Admin & Finance", type: "department", parent_node_id: null, sort_order: 4 },
      { id: "team-sales", company_id: companyId, name: "Team Sales", type: "team", parent_node_id: "dept-sales", sort_order: 0 },
      { id: "team-marketing", company_id: companyId, name: "Marketing", type: "team", parent_node_id: "dept-sales", sort_order: 1 },
      { id: "team-tecnico", company_id: companyId, name: "Team Tecnico", type: "team", parent_node_id: "dept-service", sort_order: 0 }
    ];

    // Upsert org nodes
    for (const node of orgNodesData) {
      await supabase.from('org_nodes').upsert(node, { onConflict: 'id' });
    }

    console.log("Org nodes created/updated");

    for (const user of DEMO_USERS) {
      try {
        console.log(`Processing user: ${user.email}`);
        
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: "DemoUser2024!",
          email_confirm: true,
          user_metadata: {
            first_name: user.firstName,
            last_name: user.lastName
          }
        });

        if (authError) {
          // If user already exists, try to get their ID
          if (authError.message.includes('already been registered')) {
            const { data: existingUsers } = await supabase.auth.admin.listUsers();
            const existingUser = existingUsers?.users?.find(u => u.email === user.email);
            if (existingUser) {
              console.log(`User ${user.email} already exists, updating data...`);
              await updateUserData(supabase, existingUser.id, user, companyId);
              results.push({ email: user.email, success: true, userId: existingUser.id });
              continue;
            }
          }
          throw authError;
        }

        const userId = authData.user!.id;
        console.log(`Created auth user: ${userId}`);

        // The trigger should have created the profile, but let's update it
        await updateUserData(supabase, userId, user, companyId);
        
        results.push({ email: user.email, success: true, userId });
        
      } catch (error) {
        console.error(`Error processing ${user.email}:`, error);
        results.push({ 
          email: user.email, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(JSON.stringify({
      message: `Seeding completed: ${successCount} success, ${failCount} failed`,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Seed error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function updateUserData(
  supabase: any,
  userId: string,
  user: typeof DEMO_USERS[0],
  companyId: string
) {
  const departmentId = DEPARTMENT_MAP[user.department];

  // Update profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      first_name: user.firstName,
      last_name: user.lastName,
      job_title: user.jobTitle
    })
    .eq('id', userId);

  if (profileError) {
    console.error(`Profile update error for ${user.email}:`, profileError);
  }

  // Insert company membership
  const { error: memberError } = await supabase
    .from('company_members')
    .upsert({
      user_id: userId,
      company_id: companyId,
      department_id: departmentId,
      role: 'user',
      status: 'completed',
      joined_at: new Date().toISOString()
    }, { onConflict: 'user_id,company_id' });

  if (memberError) {
    console.error(`Member insert error for ${user.email}:`, memberError);
  }

  // Insert RIASEC result
  const { error: riasecError } = await supabase
    .from('riasec_results')
    .insert({
      user_id: userId,
      company_id: companyId,
      score_r: user.riasec.R,
      score_i: user.riasec.I,
      score_a: user.riasec.A,
      score_s: user.riasec.S,
      score_e: user.riasec.E,
      score_c: user.riasec.C,
      profile_code: user.profileCode,
      raw_answers: {}
    });

  if (riasecError) {
    console.error(`RIASEC insert error for ${user.email}:`, riasecError);
  }

  // Insert Karma session
  const { error: karmaError } = await supabase
    .from('karma_sessions')
    .insert({
      user_id: userId,
      company_id: companyId,
      summary: user.karma.summary,
      soft_skills: user.karma.softSkills,
      primary_values: user.karma.primaryValues,
      risk_factors: user.karma.riskFactors,
      seniority_assessment: user.karma.seniority,
      transcript: [],
      completed_at: new Date().toISOString()
    });

  if (karmaError) {
    console.error(`Karma insert error for ${user.email}:`, karmaError);
  }

  // Insert Climate response
  const { error: climateError } = await supabase
    .from('climate_responses')
    .insert({
      user_id: userId,
      company_id: companyId,
      raw_scores: user.climate.rawScores,
      section_averages: user.climate.sectionAverages,
      overall_average: user.climate.overallAverage
    });

  if (climateError) {
    console.error(`Climate insert error for ${user.email}:`, climateError);
  }

  console.log(`Updated all data for ${user.email}`);
}
