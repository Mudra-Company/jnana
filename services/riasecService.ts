import { RiasecScore, RiasecDimension, User, JobDatabase, JobSuggestion, ChatMessage, KarmaData, CompanyProfile, OrgNode, CultureAnalysis, ClimateData } from '../types';
import { RIASEC_QUESTIONNAIRE, RIASEC_DESCRIPTIONS, RIASEC_PAIRS } from '../data/riasecContent';
import { DIMENSION_LABELS } from '../constants';

export const getEmptyScore = (): RiasecScore => ({
  R: 0, I: 0, A: 0, S: 0, E: 0, C: 0
});

/**
 * THE CORE SCORING ENGINE
 * Updated to use RIASEC_QUESTIONNAIRE from data/riasecContent.ts
 */
export const calculateScore = (selectedItemIds: Set<string>): RiasecScore => {
  const finalScores = getEmptyScore();
  
  // Flatten all items/options for easy lookup
  const allItems: Record<string, { impactDimensions: RiasecDimension[] }> = {};
  
  RIASEC_QUESTIONNAIRE.forEach(section => {
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
      // E.g. 'La fronteggio' adds to R and E.
      item.impactDimensions.forEach(dim => {
        finalScores[dim] += 1;
      });
    }
  });

  return finalScores;
};

export const calculateProfileCode = (scores: RiasecScore): string => {
  const entries = Object.entries(scores) as [RiasecDimension, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const top3 = entries.slice(0, 3).map(entry => entry[0]);
  return top3.join('-');
};

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
  B?: number; 
  fullMark: number;
  originalDimension: string;
}

export const generateMainRadarData = (scores: RiasecScore, benchmark?: RiasecScore): AdjectiveDataPoint[] => {
  const order: RiasecDimension[] = ['R', 'I', 'A', 'S', 'E', 'C'];
  return order.map(dim => ({
    subject: DIMENSION_LABELS[dim],
    A: scores[dim],
    B: benchmark ? benchmark[dim] : 0,
    fullMark: 30,
    originalDimension: dim
  }));
};

export const generateAdjectivesData = (scores: RiasecScore): AdjectiveDataPoint[] => {
  const entries = Object.entries(scores) as [RiasecDimension, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const top3 = entries.slice(0, 3);

  const chartData: AdjectiveDataPoint[] = [];

  top3.forEach(([dimension, score]) => {
    const intensity = getAdjectiveScore(score);
    const pole = RIASEC_DESCRIPTIONS[dimension];
    
    if (pole && pole.traits) {
      const adjectives = pole.traits
        .split(',')
        .map(s => {
           const cleaned = s.trim().replace('.', '');
           return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        })
        .filter(s => s.length > 0);

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

export const getBenchmarkScore = (job: JobSuggestion, code: string): RiasecScore => {
  if (job.idealScore) return job.idealScore;
  const score: RiasecScore = { R: 10, I: 10, A: 10, S: 10, E: 10, C: 10 };
  const validLetters = code.toUpperCase().split('').filter(c => "RIASEC".includes(c));
  if (validLetters[0]) score[validLetters[0] as RiasecDimension] = 26;
  if (validLetters[1]) score[validLetters[1] as RiasecDimension] = 22;
  if (validLetters[2]) score[validLetters[2] as RiasecDimension] = 18;
  return score;
}

export interface ReportSection {
  title: string;
  content: string; 
  type: 'poles' | 'dynamics' | 'jobs' | 'karma';
}

export const generateDetailedReport = (scores: RiasecScore, jobDatabase: JobDatabase, user?: User): ReportSection[] => {
  const sections: ReportSection[] = [];
  const entries = Object.entries(scores) as [RiasecDimension, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const top3 = entries.slice(0, 3);
  const code = top3.map(e => e[0]).join('-');

  let strengthsContent = "";
  top3.forEach(([dim, score], idx) => {
    const pole = RIASEC_DESCRIPTIONS[dim];
    if (idx > 0) strengthsContent += "\n\n";
    // REMOVED ** around score to fix visual bug
    strengthsContent += `### ${idx + 1}. ${pole.title} (Punteggio: ${score})\n`;
    strengthsContent += `${pole.description}\n\n`;
    strengthsContent += `[BLOCK:TRAITS]\n${pole.traits}\n\n`;
    strengthsContent += `[BLOCK:QUOTES]\n`;
    pole.quotes.forEach(q => strengthsContent += `"${q}"\n`);
  });

  sections.push({
    title: "1. ANALISI DEI TRATTI RIASEC DOMINANTI",
    content: strengthsContent,
    type: 'poles'
  });

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
    const description = RIASEC_PAIRS[comboKey] || "Combinazione non trovata.";
    const label1 = DIMENSION_LABELS[l1];
    const label2 = DIMENSION_LABELS[l2];
    if (idx > 0) dynamicsContent += "\n\n";
    dynamicsContent += `### Dinamica: ${l1} e ${l2} (${label1} - ${label2})\n`;
    dynamicsContent += `${description}`;
  });

  sections.push({
    title: "2. ANALISI DELLE DINAMICHE RELAZIONALI",
    content: dynamicsContent,
    type: 'dynamics'
  });

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
     jobs = Array.from(uniqueJobs.values()).slice(0, 8);
  }

  if (!jobs || jobs.length === 0) {
    jobs = [{ title: "Consulente Specializzato", sector: "Vari" }];
  }

  let jobsContent = `### Percorsi Professionali Consigliati\n\n`;
  jobsContent += `In base al tuo codice RIASEC (**${code}**), ecco alcuni ruoli adatti al tuo profilo:\n\n`;
  jobs.forEach(job => {
    jobsContent += `* **${job.title}** — ${job.sector}\n`;
  });

  sections.push({
    title: "3. SBOCCHI PROFESSIONALI CONSIGLIATI",
    content: jobsContent,
    type: 'jobs'
  });

  if (user?.karmaData) {
      let karmaContent = "";
      const k = user.karmaData;
      if (k.summary) karmaContent += `### Sintesi del Profilo\n${k.summary}\n\n`;
      if (k.seniorityAssessment) karmaContent += `**Livello Seniority Rilevato:** ${k.seniorityAssessment}\n\n`;
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
          title: "4. ANALISI COMPORTAMENTALE (KARMA AI)",
          content: karmaContent,
          type: 'karma'
      });
  }

  return sections;
};

export const generateKarmaSystemInstruction = (scores: RiasecScore, climateData?: ClimateData): string => {
  const profileCode = calculateProfileCode(scores);
  const entries = Object.entries(scores) as [RiasecDimension, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const dominant = entries[0][0];
  const dominantPole = RIASEC_DESCRIPTIONS[dominant];

  let climateContext = '';
  if (climateData) {
    const criticalAreas = Object.entries(climateData.sectionAverages)
      .filter(([_, v]) => v < 3)
      .map(([k]) => k);
    
    const strongAreas = Object.entries(climateData.sectionAverages)
      .filter(([_, v]) => v >= 4)
      .map(([k]) => k);

    climateContext = `
    
    PERCEZIONE CLIMA AZIENDALE (dal sondaggio):
    - Indice Clima Globale: ${climateData.overallAverage.toFixed(1)}/5
    ${criticalAreas.length > 0 ? `- Aree critiche (bassa soddisfazione): ${criticalAreas.join(', ')}` : '- Nessuna area critica rilevata'}
    ${strongAreas.length > 0 ? `- Punti di forza percepiti: ${strongAreas.join(', ')}` : ''}
    
    Usa queste informazioni per approfondire: se ci sono aree critiche, esplora cosa non funziona secondo il candidato.
    Se il clima è positivo, indaga cosa lo rende tale e quali valori il candidato cerca nel lavoro.`;
  }

  return `
    Sei "Karma", un'Intelligenza Artificiale esperta in Psicologia del Lavoro e HR Management.
    Stai conducendo un colloquio di approfondimento con un candidato.
    
    PROFILO RIASEC EMERSO:
    - Codice Profilo: ${profileCode}
    - Dominante Primaria: ${dominant} (${dominantPole.title})${climateContext}
    
    OBIETTIVI DEL COLLOQUIO:
    1. Validazione Soft Skills: Cerca conferme comportamentali.
    2. Fit Culturale: Indaga i valori profondi.
    3. Seniority Check.
    ${climateData ? '4. Approfondimento Clima: Esplora le percezioni emerse dal sondaggio clima.' : ''}
    
    Lingua: Italiano.
  `;
};

// analyzeKarmaTranscript has been moved to edge function: supabase/functions/karma-analyze

export const calculateCultureAnalysis = (company: CompanyProfile, users: User[]): CultureAnalysis => {
    const driverNodeIds = new Set<string>();
    const traverse = (node: OrgNode) => {
        if (node.isCulturalDriver) driverNodeIds.add(node.id);
        node.children.forEach(traverse);
    };
    traverse(company.structure);

    const leaderUsers = users.filter(u => u.departmentId && driverNodeIds.has(u.departmentId) && u.karmaData);
    const effectiveValueCounts: Record<string, number> = {};
    const riskCounts: Record<string, number> = {};

    leaderUsers.forEach(u => {
        u.karmaData?.primaryValues?.forEach(val => {
            const v = val.trim().charAt(0).toUpperCase() + val.trim().slice(1).toLowerCase();
            effectiveValueCounts[v] = (effectiveValueCounts[v] || 0) + 1;
        });
        u.karmaData?.riskFactors?.forEach(r => {
            const risk = r.trim().charAt(0).toUpperCase() + r.trim().slice(1).toLowerCase();
            riskCounts[risk] = (riskCounts[risk] || 0) + 1;
        });
    });

    const sortedEffectiveValues = Object.entries(effectiveValueCounts).sort((a, b) => b[1] - a[1]).map(entry => entry[0]).slice(0, 8);
    const sortedRisks = Object.entries(riskCounts).sort((a, b) => b[1] - a[1]).map(entry => entry[0]).slice(0, 5);
    const declared = company.cultureValues || [];
    const alignedValues = sortedEffectiveValues.filter(effVal => declared.some(decVal => decVal.toLowerCase() === effVal.toLowerCase()));
    const gapValues = declared.filter(decVal => !sortedEffectiveValues.some(effVal => effVal.toLowerCase() === decVal.toLowerCase()));
    const matchPercentage = declared.length > 0 ? Math.round((alignedValues.length / declared.length) * 100) : 0;

    return {
        matchScore: matchPercentage,
        alignedValues,
        gapValues,
        effectiveValues: sortedEffectiveValues,
        hiddenRisks: sortedRisks,
        driverCount: leaderUsers.length
    };
};

export const analyzeUserCompatibility = (employee: User, manager: User): { score: number, reasons: string[] } => {
    const reasons: string[] = [];
    if (!employee.profileCode || !manager.profileCode) return { score: 0, reasons: ["Dati insufficienti"] };
    let score = 0;
    const empTraits = employee.profileCode.split('-');
    const mgrTraits = manager.profileCode.split('-');
    const sharedTraits = empTraits.filter(t => mgrTraits.includes(t));
    
    if (sharedTraits.length === 3) {
        score += 60;
        reasons.push(`Eccellenza nella Sintonia Caratteriale: Condividete tutte e tre le leve motivazionali (${sharedTraits.join(', ')}).`);
    } else if (sharedTraits.length === 2) {
        score += 45;
        reasons.push(`Forte Allineamento Operativo: Condividete due tratti dominanti (${sharedTraits.join(' e ')}).`);
    } else if (sharedTraits.length === 1) {
        score += 20;
        reasons.push(`Punto di Contatto Specifico: L'unico tratto condiviso è "${sharedTraits[0]}".`);
    } else {
        score += 5;
        reasons.push(`Diversità Cognitiva: Avete profili opposti.`);
    }

    if (employee.karmaData?.primaryValues && manager.karmaData?.primaryValues) {
        const empValues = employee.karmaData.primaryValues.map(v => v.toLowerCase());
        const mgrValues = manager.karmaData.primaryValues.map(v => v.toLowerCase());
        const sharedValues = empValues.filter(v => mgrValues.some(mv => mv.includes(v) || v.includes(mv)));
        const valScore = Math.min((sharedValues.length / Math.max(empValues.length, 1)) * 40 * 1.5, 40);
        score += valScore;

        if (sharedValues.length > 0) {
            const displayValues = sharedValues.map(v => v.charAt(0).toUpperCase() + v.slice(1)).join(', ');
            reasons.push(`Allineamento Valoriale Profondo: Condividete valori come ${displayValues}.`);
        } else {
             reasons.push(`Discrepanza Valoriale: I valori guida emersi sembrano differenti.`);
        }
    } else {
        score = Math.round((score / 60) * 100); 
        reasons.push("Analisi parziale: Mancano i dati del colloquio Karma AI.");
    }

    return { score: Math.round(Math.min(score, 100)), reasons };
};

export const calculateUserCompatibility = (employee: User, manager: User): number => {
    return analyzeUserCompatibility(employee, manager).score;
};

export const findManagerForUser = (targetUser: User, structure: OrgNode, allUsers: User[]): User | null => {
    if (!targetUser.departmentId || structure.id === targetUser.departmentId) return null;
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
    const parentNodeUsers = allUsers.filter(u => u.departmentId === parentId);
    return parentNodeUsers.find(u => u.jobTitle?.toLowerCase().includes('manager') || u.jobTitle?.toLowerCase().includes('head') || u.jobTitle?.toLowerCase().includes('director') || u.jobTitle?.toLowerCase().includes('ceo')) || parentNodeUsers[0] || null;
};

export const calculateClimateAnalytics = (users: User[]) => {
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
    return {
        globalAverages: Object.keys(sectionsSum).map(key => ({ name: key, value: sectionsSum[key] / sectionCounts[key] })),
        overallAverage: overallSum / respondents.length,
        respondentCount: respondents.length
    };
};

export const calculateTeamClimateStats = (root: OrgNode, users: User[]) => {
    const stats: any[] = [];
    const traverse = (node: OrgNode) => {
        const nodeUsers = users.filter(u => u.departmentId === node.id && u.climateData);
        let avg = null;
        if (nodeUsers.length > 0) avg = nodeUsers.reduce((acc, u) => acc + (u.climateData?.overallAverage || 0), 0) / nodeUsers.length;
        stats.push({ nodeId: node.id, nodeName: node.name, type: node.type, score: avg, respondentCount: nodeUsers.length });
        node.children.forEach(traverse);
    };
    traverse(root);
    return stats;
};

export const calculateLeadershipAnalytics = (company: CompanyProfile, users: User[]) => {
    let totalScore = 0;
    let pairsCount = 0;
    let lowCount = 0;
    let medCount = 0;
    let highCount = 0;
    const teamStats: any[] = [];

    const traverse = (node: OrgNode, parentManager?: User) => {
        const nodeUsers = users.filter(u => u.departmentId === node.id);
        const currentNodeManager = nodeUsers.find(u => u.jobTitle?.toLowerCase().includes('manager')) || nodeUsers[0];
        if (parentManager) {
            let teamTotal = 0;
            let teamCount = 0;
            nodeUsers.forEach(user => {
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
            if (teamCount > 0) teamStats.push({ teamName: node.name, managerName: parentManager.firstName, averageFit: teamTotal / teamCount, status: (teamTotal/teamCount) >= 70 ? 'High' : 'Low' });
        }
        node.children.forEach(child => traverse(child, currentNodeManager));
    };
    traverse(company.structure, undefined);

    return {
        globalAlignmentIndex: pairsCount > 0 ? Math.round(totalScore / pairsCount) : 0,
        frictionRate: pairsCount > 0 ? Math.round((lowCount / pairsCount) * 100) : 0,
        totalPairsAnalyzed: pairsCount,
        teamAlignment: teamStats,
        distribution: { high: highCount, medium: medCount, low: lowCount }
    };
};