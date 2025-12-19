// Updated imports to use Riasec types and constants as Tricam variants were removed
import { RiasecScore, RiasecDimension, User, JobDatabase, JobSuggestion, ChatMessage, KarmaData, CompanyProfile, OrgNode, CultureAnalysis } from '../types';
import { RIASEC_SECTIONS } from '../constants';
import { POLE_CONTENT, COMBINATION_CONTENT, JOB_SUGGESTIONS } from '../data/riasecContent';
import { DIMENSION_LABELS } from '../constants';
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Returns an initial zeroed-out score object.
 * Used for initializing user results or benchmarks.
 */
export const getEmptyScore = (): RiasecScore => ({
  R: 0, I: 0, A: 0, S: 0, E: 0, C: 0
});

/**
 * THE CORE SCORING ENGINE
 * Calculates the total RIASEC score based on selected item IDs.
 */
export const calculateScore = (selectedItemIds: Set<string>): RiasecScore => {
  const finalScores = getEmptyScore();
  
  // Flatten all items/options for easy lookup
  const allItems: Record<string, { impactDimensions: RiasecDimension[] }> = {};
  
  RIASEC_SECTIONS.forEach(section => {
    if (section.type === 'checklist') {
      section.items.forEach(item => {
        allItems[item.id] = item;
      });
    } else if (section.type === 'forced_choice') {
      section.questions.forEach(q => {
        q.options.forEach(opt => {
          allItems[opt.id] = opt;
        });
      });
    }
  });

  // Calculate
  selectedItemIds.forEach(id => {
    const item = allItems[id];
    if (item) {
      // Logic: Add +1 to EVERY dimension listed in impactDimensions.
      item.impactDimensions.forEach(dim => {
        finalScores[dim] += 1;
      });
    }
  });

  return finalScores;
};

/**
 * Generates the 3-letter profile code (e.g., "A-I-R") based on the highest scores.
 */
export const calculateProfileCode = (scores: RiasecScore): string => {
  // Convert object to array of [key, value]
  const entries = Object.entries(scores) as [RiasecDimension, number][];
  
  // Sort by score descending
  entries.sort((a, b) => b[1] - a[1]);
  
  // Take top 3 for the code
  const top3 = entries.slice(0, 3).map(entry => entry[0]);
  
  return top3.join('-');
};

// --- Advanced Analytics for Adjective Mapping ---

export const getAdjectiveScore = (rawScore: number): number => {
  if (rawScore >= 26) return 5;
  if (rawScore >= 22) return 4;
  if (rawScore >= 18) return 3;
  if (rawScore >= 14) return 2;
  return 1;
};

export interface AdjectiveDataPoint {
  subject: string;
  A: number;
  B?: number; // Benchmark score
  fullMark: number;
  originalDimension: string;
}

/**
 * Prepares data for the Main Radar Chart (Hexagon).
 */
export const generateMainRadarData = (scores: RiasecScore, benchmark?: RiasecScore): AdjectiveDataPoint[] => {
  // Standard Order for hexagon
  const order: RiasecDimension[] = ['R', 'I', 'A', 'S', 'E', 'C'];
  
  return order.map(dim => ({
    subject: dim,
    A: scores[dim],
    B: benchmark ? benchmark[dim] : 0,
    fullMark: 30, // Theoretical max roughly
    originalDimension: dim
  }));
};

/**
 * Generates data for the Competency Grid (Adjectives).
 */
export const generateAdjectivesData = (scores: RiasecScore): AdjectiveDataPoint[] => {
  // 1. Determine Top 3 Profiles
  const entries = Object.entries(scores) as [RiasecDimension, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const top3 = entries.slice(0, 3); // [[Dim, Score], ...]

  const chartData: AdjectiveDataPoint[] = [];

  // 2. Iterate through top 3 and extract adjectives
  top3.forEach(([dimension, score]) => {
    const intensity = getAdjectiveScore(score);
    const pole = POLE_CONTENT[dimension];
    
    // Parse traits string
    if (pole && pole.traits) {
      const adjectives = pole.traits
        .split(',')
        .map(s => {
           const cleaned = s.trim().replace('.', '');
           // Capitalize first letter
           return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        })
        .filter(s => s.length > 0);

      // Select top 4 adjectives from each dominant pole for the chart
      const subset = adjectives.slice(0, 4);

      subset.forEach(adj => {
        chartData.push({
          subject: adj,
          A: intensity,
          fullMark: 5,
          originalDimension: dimension
        });
      });
    }
  });

  return chartData;
};

// --- Helper for Benchmark ---

export const getBenchmarkScore = (job: JobSuggestion, code: string): RiasecScore => {
  if (job.idealScore) return job.idealScore;

  // Heuristic based on code (e.g. ACI)
  const score: RiasecScore = { R: 10, I: 10, A: 10, S: 10, E: 10, C: 10 };
  const validLetters = code.toUpperCase().split('').filter(c => "RIASEC".includes(c));
  
  if (validLetters[0]) score[validLetters[0] as RiasecDimension] = 26;
  if (validLetters[1]) score[validLetters[1] as RiasecDimension] = 22;
  if (validLetters[2]) score[validLetters[2] as RiasecDimension] = 18;
  
  return score;
}

// --- Report Generation ---

export interface ReportSection {
  title: string;
  content: string; // Markdown-like string
  type: 'poles' | 'dynamics' | 'jobs' | 'karma'; // Metadata for icon rendering
}

export const generateDetailedReport = (scores: RiasecScore, jobDatabase: JobDatabase, user?: User): ReportSection[] => {
  const sections: ReportSection[] = [];
  
  // 1. Determine Profile (Top 3)
  const entries = Object.entries(scores) as [RiasecDimension, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const top3 = entries.slice(0, 3); // Array of [Dimension, Score]
  const code = top3.map(e => e[0]).join('-');


  // === SECTION 1: DETTAGLIO ATTITUDINI (I 3 Poli Singoli) ===
  let strengthsContent = "";
  
  top3.forEach(([dim, score], idx) => {
    const pole = POLE_CONTENT[dim];
    // Clean spacing between items, removed the "---" separator
    if (idx > 0) strengthsContent += "\n\n";
    strengthsContent += `### ${idx + 1}. ${pole.title} (Punteggio: **${score}**)\n`;
    strengthsContent += `${pole.description}\n\n`;
    
    strengthsContent += `[BLOCK:TRAITS]\n${pole.traits}\n\n`;
    strengthsContent += `[BLOCK:QUOTES]\n`;
    pole.quotes.forEach(q => strengthsContent += `"${q}"\n`);
  });

  sections.push({
    title: "1. DETTAGLIO ATTITUDINI PREDOMINANTI",
    content: strengthsContent,
    type: 'poles'
  });


  // === SECTION 2: ANALISI SINTETICA E DINAMICHE (Le 3 Coppie) ===
  let dynamicsContent = "";
  
  const pairs = [
    [top3[0][0], top3[1][0]],
    [top3[0][0], top3[2][0]],
    [top3[1][0], top3[2][0]]
  ];

  pairs.forEach((pair, idx) => {
    const l1 = pair[0] as RiasecDimension;
    const l2 = pair[1] as RiasecDimension;
    const comboKey = [l1, l2].sort().join('');
    
    const description = COMBINATION_CONTENT[comboKey] || "Combinazione non trovata.";
    const label1 = DIMENSION_LABELS[l1];
    const label2 = DIMENSION_LABELS[l2];

    // Clean spacing between items, removed the "---" separator
    if (idx > 0) dynamicsContent += "\n\n";
    dynamicsContent += `### Dinamica: ${l1} e ${l2} (${label1} - ${label2})\n`;
    dynamicsContent += `${description}`;
  });

  sections.push({
    title: "2. ANALISI SINTETICA E DINAMICHE",
    content: dynamicsContent,
    type: 'dynamics'
  });


  // === SECTION 3: SBOCCHI PROFESSIONALI ===
  const exactCodeKey = top3.map(e => e[0]).sort().join('');
  let jobs = jobDatabase[exactCodeKey]; 

  if (!jobs || jobs.length === 0) {
     const l1 = top3[0][0];
     const l2 = top3[1][0];
     const partialMatches: Array<{title: string, sector: string}> = [];
     
     Object.keys(jobDatabase).forEach(key => {
        if (key.includes(l1) && key.includes(l2)) {
           partialMatches.push(...jobDatabase[key]);
        }
     });
     
     const uniqueJobs = new Map();
     partialMatches.forEach(j => uniqueJobs.set(j.title, j));
     jobs = Array.from(uniqueJobs.values()).slice(0, 8); // Take top 8
  }

  if (!jobs || jobs.length === 0) {
    jobs = [
      { title: "Consulente Generico", sector: "Vari" },
      { title: "Ruolo da definire in base alle competenze specifiche", sector: "Vari" }
    ];
  }

  let jobsContent = `In base al tuo codice RIASEC (**${code}**), ecco alcuni percorsi professionali in linea con le tue attitudini:\n\n`;
  jobs.forEach(job => {
    jobsContent += `* **${job.title}**: ${job.sector}\n`;
  });

  sections.push({
    title: "3. SBOCCHI PROFESSIONALI CONSIGLIATI",
    content: jobsContent,
    type: 'jobs'
  });

  // === SECTION 4: KARMA AI INSIGHTS ===
  if (user?.karmaData) {
      let karmaContent = "";
      const k = user.karmaData;

      if (k.summary) {
          karmaContent += `### Sintesi del Profilo\n${k.summary}\n\n`;
      }

      if (k.seniorityAssessment) {
          karmaContent += `**Livello Seniority Rilevato:** ${k.seniorityAssessment}\n\n`;
      }

      if (k.softSkills && k.softSkills.length > 0) {
          karmaContent += `### Soft Skills Distintive\n`;
          k.softSkills.forEach(s => karmaContent += `* ${s}\n`);
          karmaContent += `\n`;
      }

      if (k.primaryValues && k.primaryValues.length > 0) {
          karmaContent += `### Valori e Fit Culturale\n`;
          k.primaryValues.forEach(v => karmaContent += `* ${v}\n`);
          karmaContent += `\n`;
      }

      if (k.riskFactors && k.riskFactors.length > 0) {
          karmaContent += `### Aree di Attenzione (Rischi & Entropia)\n`;
          k.riskFactors.forEach(r => karmaContent += `* ${r}\n`);
      }

      sections.push({
          title: "4. ANALISI COMPORTAMENTALE & CULTURALE (KARMA AI)",
          content: karmaContent,
          type: 'karma'
      });
  }

  return sections;
};

// --- KARMA AI PROMPT GENERATION ---

export const generateKarmaSystemInstruction = (scores: RiasecScore): string => {
  const profileCode = calculateProfileCode(scores);
  const entries = Object.entries(scores) as [RiasecDimension, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const dominant = entries[0][0];
  const secondary = entries[1][0];
  const weakest = entries[5][0];

  const dominantPole = POLE_CONTENT[dominant];
  const secondaryPole = POLE_CONTENT[secondary];
  const weakestPole = weakest ? POLE_CONTENT[weakest] : null;

  return `
    Sei "Karma", un'Intelligenza Artificiale esperta in Psicologia del Lavoro e HR Management.
    Stai conducendo un colloquio di approfondimento con un candidato che ha completato il test RIASEC.
    
    PROFILO RIASEC EMERSO:
    - Codice Profilo: ${profileCode}
    - Dominante Primaria: ${dominant} (${dominantPole.title}) -> Tratti: ${dominantPole.traits}
    - Dominante Secondaria: ${secondary} (${secondaryPole.title})
    - Area di Sviluppo (Debolezza): ${weakest} (${weakestPole?.title || 'N/A'})
    
    OBIETTIVI DEL COLLOQUIO:
    1. Validazione Soft Skills: Cerca conferme comportamentali (es. esempi concreti) dei tratti emersi.
    2. Fit Culturale: Indaga i valori profondi (es. collaborazione vs competizione, stabilità vs rischio).
    3. Seniority Check: Valuta indirettamente l'autonomia e la complessità gestita.
    
    LINEE GUIDA DI INTERAZIONE:
    - Adotta uno stile colloquiale ma professionale ("Lei" o "Tu" in base al tono dell'utente, parti col "Tu").
    - Fai domande comportamentali (Metodo STAR: Situazione, Compito, Azione, Risultato). Esempio: "Raccontami di una sfida complessa che hai superato...".
    - Non fare elenchi di domande. Fai UNA sola domanda mirata per turno.
    - Se la risposta è vaga, chiedi un approfondimento ("Mi puoi fare un esempio specifico?").
    - Sii empatico: valorizza le risposte prima di passare alla domanda successiva.
    - Mantieni la conversazione entro 4-5 scambi totali.
    - Lingua: Italiano.
  `;
};

/**
 * NEW: Analyzes the completed transcript to generate structured data.
 * Enhanced to extract Risk Factors and be less "nice".
 */
export const analyzeKarmaTranscript = async (transcript: ChatMessage[]): Promise<Partial<KarmaData>> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const conversationText = transcript.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
        
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview", // Updated model name for Basic Text Tasks
            contents: `Sei un Senior HR Assessor e Psicologo del Lavoro.
            Analizza la seguente trascrizione di colloquio per creare un profilo onesto e "chirurgico" del candidato.
            Non essere buonista: identifica sia i punti di forza che i potenziali rischi (Luce e Ombra).
            
            ISTRUZIONI DI ANALISI:
            Analizza non solo il contenuto esplicito, ma anche lo stile comunicativo, la sintassi, le esitazioni e le contraddizioni.
            
            GENERA UN REPORT JSON CON I SEGUENTI CAMPI:
            1. "summary": Una sintesi professionale (max 300 caratteri) in terza persona.
            2. "soft_skills": Estrai esattamente 5 Soft Skills distintive emerse (es. "Gestione dell'ambiguità", "Comunicazione persuasiva").
            3. "primary_values": Identifica 3-4 valori cardine che guidano le scelte (es. "Meritocrazia", "Status", "Sicurezza").
            4. "risk_factors": IMPORTANTE. Identifica 2-3 potenziali comportamenti tossici, limitanti o rischi di disallineamento (es. "Tendenza al micromanagement", "Bassa tolleranza allo stress", "Conflittualità latente", "Rigidità mentale"). Se il profilo è eccellente, cerca comunque aree di attenzione (es. "Rischio burnout per eccesso di zelo").
            5. "seniority_assessment": Valuta il livello (Junior, Mid, Senior, Lead, C-Level).
            
            TRASCRIZIONE:
            ${conversationText}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        soft_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                        primary_values: { type: Type.ARRAY, items: { type: Type.STRING } },
                        risk_factors: { type: Type.ARRAY, items: { type: Type.STRING } },
                        seniority_assessment: { type: Type.STRING, enum: ["Junior", "Mid", "Senior", "Lead", "C-Level"] }
                    },
                    required: ["summary", "soft_skills", "primary_values", "risk_factors", "seniority_assessment"]
                }
            }
        });

        const jsonText = response.text;
        if (!jsonText) throw new Error("No response from AI");
        
        const parsed = JSON.parse(jsonText);
        return {
            summary: parsed.summary,
            softSkills: parsed.soft_skills,
            primaryValues: parsed.primary_values,
            riskFactors: parsed.risk_factors,
            seniorityAssessment: parsed.seniority_assessment
        };
    } catch (e) {
        console.error("Error analyzing transcript:", e);
        // Fallback
        return {
            summary: "Analisi automatica non disponibile. Il candidato ha completato il colloquio.",
            softSkills: ["Comunicazione", "Impegno"],
            primaryValues: ["Professionalità"],
            riskFactors: ["Dati insufficienti"],
            seniorityAssessment: "Mid"
        };
    }
};

/**
 * CALCULATES DEEP CULTURE ANALYSIS (Declared vs. Acted vs. Risks)
 * Filters strictly by "Cultural Drivers" (Leaders)
 */
export const calculateCultureAnalysis = (company: CompanyProfile, users: User[]): CultureAnalysis => {
    // 1. Identify Driver Node IDs (Only nodes explicitly marked as isCulturalDriver)
    const driverNodeIds = new Set<string>();
    const traverse = (node: OrgNode) => {
        if (node.isCulturalDriver) {
            driverNodeIds.add(node.id);
        }
        node.children.forEach(traverse);
    };
    traverse(company.structure);

    // 2. Filter Users (Leaders/Cultural Drivers)
    const leaderUsers = users.filter(u => u.departmentId && driverNodeIds.has(u.departmentId) && u.karmaData);

    // 3. Aggregate Values & Risks from Leaders
    const effectiveValueCounts: Record<string, number> = {};
    const riskCounts: Record<string, number> = {};

    leaderUsers.forEach(u => {
        // Values (Positive)
        u.karmaData?.primaryValues?.forEach(val => {
            const v = val.trim().charAt(0).toUpperCase() + val.trim().slice(1).toLowerCase();
            effectiveValueCounts[v] = (effectiveValueCounts[v] || 0) + 1;
        });
        // Risks (Entropy)
        u.karmaData?.riskFactors?.forEach(r => {
            const risk = r.trim().charAt(0).toUpperCase() + r.trim().slice(1).toLowerCase();
            riskCounts[risk] = (riskCounts[risk] || 0) + 1;
        });
    });

    // Sort by frequency
    const sortedEffectiveValues = Object.entries(effectiveValueCounts)
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0])
        .slice(0, 8); // Top 8 effective values

    const sortedRisks = Object.entries(riskCounts)
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0])
        .slice(0, 5); // Top 5 risks

    // 4. Compare with Declared (Espoused Values)
    const declared = company.cultureValues || [];
    
    // Aligned: Present in both Declared and Effective
    const alignedValues = sortedEffectiveValues.filter(effVal => 
        declared.some(decVal => decVal.toLowerCase() === effVal.toLowerCase())
    );

    // Gap: Declared but NOT in Effective
    const gapValues = declared.filter(decVal => 
        !sortedEffectiveValues.some(effVal => effVal.toLowerCase() === decVal.toLowerCase())
    );

    // Calculate match percentage (Alignment Score)
    // Formula: (Aligned Count / Total Declared Count) * 100
    const matchPercentage = declared.length > 0 
        ? Math.round((alignedValues.length / declared.length) * 100) 
        : 0;

    return {
        matchScore: matchPercentage,
        alignedValues,
        gapValues,
        effectiveValues: sortedEffectiveValues,
        hiddenRisks: sortedRisks,
        driverCount: leaderUsers.length
    };
};

/**
 * Calculates compatibility between two users (e.g. Employee vs Manager)
 * Logic uses both RIASEC profile (Code) and Karma Values (Deep Match)
 */
export const calculateUserCompatibility = (employee: User, manager: User): number => {
    return analyzeUserCompatibility(employee, manager).score;
};

/**
 * Returns detailed breakdown of compatibility
 */
export const analyzeUserCompatibility = (employee: User, manager: User): { score: number, reasons: string[] } => {
    const reasons: string[] = [];
    if (!employee.profileCode || !manager.profileCode) return { score: 0, reasons: ["Dati insufficienti"] };
    
    let score = 0;
    
    // 1. RIASEC Code Match (Weight: 60%)
    const empTraits = employee.profileCode.split('-');
    const mgrTraits = manager.profileCode.split('-');
    
    const sharedTraits = empTraits.filter(t => mgrTraits.includes(t));
    
    if (sharedTraits.length === 3) {
        score += 60;
        reasons.push(`Forte sintonia caratteriale: Condividete tutte le leve motivazionali (${sharedTraits.join(', ')}).`);
    } else if (sharedTraits.length === 2) {
        score += 45;
        reasons.push(`Buona intesa caratteriale: Condividete i tratti dominanti ${sharedTraits.join(' e ')}.`);
    } else if (sharedTraits.length === 1) {
        score += 20;
        reasons.push(`Punto di contatto caratteriale sul tratto ${sharedTraits[0]}.`);
    } else {
        score += 5;
        reasons.push("Diversità caratteriale: Avete approcci al lavoro complementari ma distanti.");
    }

    // 2. Karma Values Match (Weight: 40%)
    if (employee.karmaData?.primaryValues && manager.karmaData?.primaryValues) {
        const empValues = employee.karmaData.primaryValues.map(v => v.toLowerCase());
        const mgrValues = manager.karmaData.primaryValues.map(v => v.toLowerCase());
        
        // Find intersection
        const sharedValues = empValues.filter(v => mgrValues.some(mv => mv.includes(v) || v.includes(mv)));
        const matchRatio = sharedValues.length / Math.max(empValues.length, 1);
        
        const valueScore = Math.min(matchRatio * 40 * 1.5, 40);
        score += valueScore;

        if (sharedValues.length > 0) {
            const displayValues = sharedValues.map(v => v.charAt(0).toUpperCase() + v.slice(1)).join(', ');
            reasons.push(`Allineamento valoriale su: ${displayValues}.`);
        } else {
            reasons.push("I valori guida emersi dai colloqui sembrano differenti.");
        }
    } else {
        // Fallback if no Karma data
        score = (score / 60) * 100;
        reasons.push("Dati valoriali (Karma) non disponibili per un confronto completo.");
    }

    return { score: Math.round(Math.min(score, 100)), reasons };
};

/**
 * Finds the manager for a given user by traversing up the org tree to the parent node.
 */
export const findManagerForUser = (targetUser: User, structure: OrgNode, allUsers: User[]): User | null => {
    if (!targetUser.departmentId || structure.id === targetUser.departmentId) return null;

    // Helper to find parent of a node ID
    const findParentId = (node: OrgNode, targetId: string): string | null => {
        for (const child of node.children) {
            if (child.id === targetId) return node.id;
            const res = findParentId(child, targetId);
            if (res) return res;
        }
        return null;
    };

    const parentId = findParentId(structure, targetUser.departmentId);
    if (!parentId) return null;

    // Find Users in Parent Node
    const parentNodeUsers = allUsers.filter(u => u.departmentId === parentId);

    // Identify Leader in Parent Node
    // Find node object to check Cultural Driver flag
    const findNode = (node: OrgNode, id: string): OrgNode | null => {
        if (node.id === id) return node;
        for (const child of node.children) {
            const res = findNode(child, id);
            if (res) return res;
        }
        return null;
    };
    const parentNode = findNode(structure, parentId);

    return parentNodeUsers.find(u => 
        u.jobTitle?.toLowerCase().includes('head') || 
        u.jobTitle?.toLowerCase().includes('manager') || 
        u.jobTitle?.toLowerCase().includes('lead') || 
        u.jobTitle?.toLowerCase().includes('director') ||
        u.jobTitle?.toLowerCase().includes('ceo') ||
        u.jobTitle?.toLowerCase().includes('ad')
    ) || parentNodeUsers.find(u => parentNode?.isCulturalDriver) || parentNodeUsers[0] || null;
};

// --- CLIMATE ANALYTICS ---

export interface ClimateAnalytics {
    globalAverages: { name: string, value: number }[];
    overallAverage: number;
    respondentCount: number;
}

export interface TeamClimateStat {
    nodeId: string;
    nodeName: string;
    type: 'department' | 'team' | 'root';
    score: number | null;
    respondentCount: number;
}

/**
 * Aggregates all climate data for the company
 */
export const calculateClimateAnalytics = (users: User[]): ClimateAnalytics | null => {
    const respondents = users.filter(u => u.climateData);
    if (respondents.length === 0) return null;

    const sectionsSum: Record<string, number> = {};
    const sectionCounts: Record<string, number> = {};
    let overallSum = 0;

    respondents.forEach(u => {
        const data = u.climateData!;
        overallSum += data.overallAverage;

        Object.entries(data.sectionAverages).forEach(([key, val]) => {
             sectionsSum[key] = (sectionsSum[key] || 0) + val;
             sectionCounts[key] = (sectionCounts[key] || 0) + 1;
        });
    });

    const globalAverages = Object.keys(sectionsSum).map(key => ({
        name: key,
        value: sectionsSum[key] / sectionCounts[key]
    }));

    return {
        globalAverages,
        overallAverage: overallSum / respondents.length,
        respondentCount: respondents.length
    };
};

/**
 * Calculates average climate score for each node in the tree recursively
 */
export const calculateTeamClimateStats = (root: OrgNode, users: User[]): TeamClimateStat[] => {
    const stats: TeamClimateStat[] = [];

    const traverse = (node: OrgNode) => {
        // Find users strictly in this node
        const nodeUsers = users.filter(u => u.departmentId === node.id && u.climateData);
        
        let avg = null;
        if (nodeUsers.length > 0) {
            const sum = nodeUsers.reduce((acc, u) => acc + (u.climateData?.overallAverage || 0), 0);
            avg = sum / nodeUsers.length;
        }

        stats.push({
            nodeId: node.id,
            nodeName: node.name,
            type: node.type,
            score: avg,
            respondentCount: nodeUsers.length
        });

        node.children.forEach(traverse);
    };

    traverse(root);
    return stats;
};

// --- NEW LEADERSHIP ANALYTICS ---

export interface LeadershipAnalytics {
    globalAlignmentIndex: number; // 0-100 Average
    frictionRate: number; // % of pairs with low compatibility (<40)
    totalPairsAnalyzed: number;
    teamAlignment: {
        teamName: string;
        managerName: string;
        averageFit: number;
        status: 'High' | 'Medium' | 'Low';
    }[];
    distribution: {
        high: number; // >70
        medium: number; // 40-70
        low: number; // <40
    };
}

export const calculateLeadershipAnalytics = (company: CompanyProfile, users: User[]): LeadershipAnalytics => {
    let totalScore = 0;
    let pairsCount = 0;
    let lowCount = 0;
    let medCount = 0;
    let highCount = 0;
    const teamStats: LeadershipAnalytics['teamAlignment'] = [];

    // Helper to identify manager of a node (Same logic as OrgView)
    const findNodeManager = (nodeUsers: User[], node: OrgNode): User | undefined => {
        return nodeUsers.find(u => 
            u.jobTitle?.toLowerCase().includes('head') || 
            u.jobTitle?.toLowerCase().includes('manager') || 
            u.jobTitle?.toLowerCase().includes('lead') || 
            u.jobTitle?.toLowerCase().includes('director') ||
            u.jobTitle?.toLowerCase().includes('ceo') ||
            u.jobTitle?.toLowerCase().includes('ad')
        ) || nodeUsers.find(u => node.isCulturalDriver) || nodeUsers[0];
    };

    const traverse = (node: OrgNode, parentManager?: User) => {
        // 1. Identify users in this node
        const nodeUsers = users.filter(u => u.departmentId === node.id);
        
        // 2. Identify WHO leads this node (to pass to children)
        const currentNodeManager = findNodeManager(nodeUsers, node);

        // 3. Calculate Fit for users in THIS node vs PARENT Manager
        // Note: Root node has no parent manager, so no calc there.
        if (parentManager) {
            let teamTotal = 0;
            let teamCount = 0;

            nodeUsers.forEach(user => {
                // Don't compare manager with themselves if they are in the child node (rare but possible)
                if (user.id !== parentManager.id && user.profileCode && parentManager.profileCode) {
                    const score = calculateUserCompatibility(user, parentManager);
                    totalScore += score;
                    pairsCount++;
                    teamTotal += score;
                    teamCount++;

                    if (score >= 70) highCount++;
                    else if (score >= 40) medCount++;
                    else lowCount++;
                }
            });

            if (teamCount > 0) {
                const avg = teamTotal / teamCount;
                teamStats.push({
                    teamName: node.name,
                    managerName: `${parentManager.firstName} ${parentManager.lastName}`,
                    averageFit: avg,
                    status: avg >= 70 ? 'High' : avg >= 40 ? 'Medium' : 'Low'
                });
            }
        }

        // 4. Recurse
        node.children.forEach(child => traverse(child, currentNodeManager));
    };

    traverse(company.structure, undefined); // Root start

    return {
        globalAlignmentIndex: pairsCount > 0 ? Math.round(totalScore / pairsCount) : 0,
        frictionRate: pairsCount > 0 ? Math.round((lowCount / pairsCount) * 100) : 0,
        totalPairsAnalyzed: pairsCount,
        teamAlignment: teamStats.sort((a, b) => a.averageFit - b.averageFit), // Sort low to high
        distribution: {
            high: highCount,
            medium: medCount,
            low: lowCount
        }
    };
};