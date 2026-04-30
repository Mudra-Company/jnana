/**
 * Job Rotation Analyzer
 * 
 * Pure function that, given an internal candidate + a target position + the
 * surrounding company context, produces an HR-grade decision report:
 *  1. Recommendation (Procedi / Valuta / Sconsigliato) with rationale
 *  2. Manager-fit (synergy with the future direct manager)
 *  3. Impact on the role being left (skills coverage, backups available)
 *  4. Growth analysis (stretch level, RIASEC alignment)
 * 
 * No side effects, no I/O, no React. Easy to test and to reason about.
 */

import { analyzeSynergy, getUserGeneration, type UserWithGeneration, type SynergyResult, type GenerationType } from '../../services/generationService';
import type { User as LegacyUser, RequiredProfile, SeniorityLevel } from '../../types';

// ============================================================
// Types
// ============================================================

export type RecommendationVerdict = 'procedi' | 'valuta' | 'sconsigliato';

export interface RoleFitSummary {
  score: number; // 0-100
  hardMatches: string[];
  hardGaps: string[];
  softMatches: string[];
  softGaps: string[];
  seniorityMatch: 'match' | 'above' | 'below';
}

export interface ManagerFit {
  managerName: string | null;
  managerId: string | null;
  managerGeneration: GenerationType | null;
  synergy: SynergyResult | null;
  /** Score 0-100 derived from synergy + RIASEC complementarity */
  fitScore: number;
  /** Human-readable reason ("Complementarietà generazionale: Mentoring") */
  notes: string[];
  /** True when no manager could be identified for the target node */
  managerMissing: boolean;
}

export interface RoleImpact {
  /** Department/node the candidate is leaving */
  fromDepartmentName: string;
  /** Skills the candidate uniquely covered in their team */
  criticalSkillsAtRisk: string[];
  /** Internal candidates ready to backfill the candidate's current role */
  internalBackupsCount: number;
  /** Names of the top 3 backups (for display) */
  internalBackupsPreview: Array<{ id: string; name: string; matchScore: number }>;
  /** Risk level for the team being left */
  risk: 'low' | 'medium' | 'high';
  notes: string[];
}

export interface GrowthAnalysis {
  /** New hard skills the candidate would have to learn */
  newHardSkillsToLearn: string[];
  /** New soft skills as well */
  newSoftSkillsToLearn: string[];
  /** Stretch level relative to current role */
  stretchLevel: 'lateral' | 'healthy_stretch' | 'aggressive_stretch';
  /** Friendly label for the stretch */
  stretchLabel: string;
  /** Whether the move climbs, stays at, or descends seniority ladder */
  seniorityChange: 'promotion' | 'lateral' | 'demotion' | 'unknown';
  notes: string[];
}

export interface RotationRecommendation {
  verdict: RecommendationVerdict;
  /** Composite 0-100 weighting role fit, manager fit, role impact, growth */
  score: number;
  /** One-line summary ("Stretch sano con manager forte; team scoperto su 1 skill") */
  headline: string;
  /** Bullet points of the most relevant pros & cons */
  pros: string[];
  cons: string[];
}

export interface RotationAnalysis {
  candidateName: string;
  candidateSeniority: SeniorityLevel | null;
  fromDepartment: string;
  toDepartment: string;
  roleFit: RoleFitSummary;
  managerFit: ManagerFit;
  roleImpact: RoleImpact;
  growth: GrowthAnalysis;
  recommendation: RotationRecommendation;
}

// ============================================================
// Constants
// ============================================================

const SENIORITY_LEVELS: Record<SeniorityLevel, number> = {
  Junior: 1,
  Mid: 2,
  Senior: 3,
  Lead: 4,
  'C-Level': 5,
};

// ============================================================
// Helpers
// ============================================================

const norm = (s: string | undefined | null) => (s || '').trim().toLowerCase();

const skillName = (s: any): string => {
  if (!s) return '';
  if (typeof s === 'string') return s;
  return s.name || s.skill?.name || s.customSkillName || '';
};

const getCandidateHardSkillNames = (candidate: LegacyUser): string[] => {
  return (candidate.hardSkills || [])
    .map(s => skillName(s))
    .filter(Boolean);
};

const getCandidateSoftSkillNames = (candidate: LegacyUser): string[] => {
  return candidate.karmaData?.softSkills || [];
};

const skillEquals = (a: string, b: string): boolean => {
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
};

const toUserWithGeneration = (u: LegacyUser): UserWithGeneration => ({
  birthDate: u.birthDate,
  age: u.age,
  hardSkills: (u.hardSkills || []).map(s => ({
    name: skillName(s),
    proficiencyLevel: typeof s === 'object' ? (s as any).proficiencyLevel : undefined,
  })),
  karmaData: u.karmaData
    ? {
        softSkills: u.karmaData.softSkills,
        seniorityAssessment: u.karmaData.seniorityAssessment as SeniorityLevel | undefined,
      }
    : undefined,
});

// ============================================================
// 1. Manager-Fit
// ============================================================

/**
 * Find the manager of a target node:
 *  - Prefer someone already assigned to that node who is NOT a hiring placeholder
 *  - Among those, prefer the highest seniority
 */
const findNodeManager = (
  targetNodeId: string | null,
  companyUsers: LegacyUser[],
  excludeUserId: string,
): LegacyUser | null => {
  if (!targetNodeId) return null;
  const inNode = companyUsers.filter(
    u =>
      u.departmentId === targetNodeId &&
      u.id !== excludeUserId &&
      !u.isHiring &&
      u.firstName,
  );
  if (inNode.length === 0) return null;
  // Sort by seniority desc
  const sorted = [...inNode].sort((a, b) => {
    const al = SENIORITY_LEVELS[a.karmaData?.seniorityAssessment as SeniorityLevel] || 0;
    const bl = SENIORITY_LEVELS[b.karmaData?.seniorityAssessment as SeniorityLevel] || 0;
    return bl - al;
  });
  return sorted[0];
};

const analyzeManagerFit = (
  candidate: LegacyUser,
  targetNodeId: string | null,
  companyUsers: LegacyUser[],
): ManagerFit => {
  const manager = findNodeManager(targetNodeId, companyUsers, candidate.id);

  if (!manager) {
    return {
      managerName: null,
      managerId: null,
      managerGeneration: null,
      synergy: null,
      fitScore: 50, // neutral when unknown
      notes: ['Manager del nodo target non ancora identificato — fit non calcolabile.'],
      managerMissing: true,
    };
  }

  const candidateUW = toUserWithGeneration(candidate);
  const managerUW = toUserWithGeneration(manager);
  const synergy = analyzeSynergy(candidateUW, managerUW);

  // Convert synergy.score (0-100) into fitScore, with a small bump for non-"None" types
  let fitScore = synergy.score;
  if (synergy.type === 'Mentoring' || synergy.type === 'Reverse Mentoring') {
    fitScore = Math.min(100, fitScore + 5);
  } else if (synergy.type === 'None') {
    fitScore = Math.max(40, fitScore); // floor for "neutral" relationships
  }

  const notes: string[] = [];
  if (synergy.type !== 'None') {
    notes.push(`Sinergia generazionale: ${synergy.type} — ${synergy.reason}`);
  } else {
    notes.push(`Stessa generazione (${synergy.generationA || 'n/d'}) — relazione paritaria.`);
  }
  if (synergy.techSkillsBonus && synergy.techSkillsBonus.length > 0) {
    notes.push(`Possibile reverse mentoring tech: ${synergy.techSkillsBonus.join(', ')}.`);
  }

  return {
    managerName: `${manager.firstName} ${manager.lastName}`,
    managerId: manager.id,
    managerGeneration: getUserGeneration(managerUW),
    synergy,
    fitScore: Math.round(fitScore),
    notes,
    managerMissing: false,
  };
};

// ============================================================
// 2. Role Impact (what the team being left would lose)
// ============================================================

const analyzeRoleImpact = (
  candidate: LegacyUser,
  companyUsers: LegacyUser[],
  nodeNames: Record<string, string>,
): RoleImpact => {
  const fromNodeId = candidate.departmentId;
  const fromDepartmentName = fromNodeId ? nodeNames[fromNodeId] || 'Nodo sconosciuto' : 'Non assegnato';

  if (!fromNodeId) {
    return {
      fromDepartmentName,
      criticalSkillsAtRisk: [],
      internalBackupsCount: 0,
      internalBackupsPreview: [],
      risk: 'low',
      notes: ['Il candidato non è attualmente assegnato a un nodo: nessun impatto sul team di partenza.'],
    };
  }

  // Teammates: people in the same node, excluding the candidate and hiring placeholders
  const teammates = companyUsers.filter(
    u => u.departmentId === fromNodeId && u.id !== candidate.id && !u.isHiring && u.firstName,
  );

  // Skills the candidate brings to the team
  const candHard = getCandidateHardSkillNames(candidate);
  const candSoft = getCandidateSoftSkillNames(candidate);

  // For each candidate skill, check if any teammate also has it
  const teammateHard = teammates.flatMap(u => getCandidateHardSkillNames(u));
  const teammateSoft = teammates.flatMap(u => getCandidateSoftSkillNames(u));

  const criticalSkillsAtRisk: string[] = [];
  for (const s of [...candHard, ...candSoft]) {
    const covered = [...teammateHard, ...teammateSoft].some(t => skillEquals(s, t));
    if (!covered && !criticalSkillsAtRisk.some(k => skillEquals(k, s))) {
      criticalSkillsAtRisk.push(s);
    }
  }

  // Find internal backups: people NOT in this node, not hiring, with seniority that
  // could plausibly cover the candidate's current role (same level ±1).
  const candLevel = SENIORITY_LEVELS[candidate.karmaData?.seniorityAssessment as SeniorityLevel] || 0;

  const backupCandidates = companyUsers
    .filter(u => {
      if (u.id === candidate.id) return false;
      if (u.isHiring) return false;
      if (!u.firstName) return false;
      if (u.departmentId === fromNodeId) return false; // already in the team
      const uLevel = SENIORITY_LEVELS[u.karmaData?.seniorityAssessment as SeniorityLevel] || 0;
      if (candLevel === 0 || uLevel === 0) return true; // unknown seniority -> still possible
      return Math.abs(uLevel - candLevel) <= 1;
    })
    .map(u => {
      // Score: % of candidate skills the backup also has
      const uHard = getCandidateHardSkillNames(u);
      const uSoft = getCandidateSoftSkillNames(u);
      const allCand = [...candHard, ...candSoft];
      if (allCand.length === 0) return { id: u.id, name: `${u.firstName} ${u.lastName}`, matchScore: 50 };
      const overlapping = allCand.filter(s => [...uHard, ...uSoft].some(t => skillEquals(s, t))).length;
      const matchScore = Math.round((overlapping / allCand.length) * 100);
      return { id: u.id, name: `${u.firstName} ${u.lastName}`, matchScore };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  // A "ready" backup is one with ≥40% skill overlap
  const readyBackups = backupCandidates.filter(b => b.matchScore >= 40);

  // Risk:
  //   high = >0 critical skills AND <1 ready backup
  //   medium = (1-2 critical skills) OR (1 ready backup)
  //   low = no critical skills AND ≥2 ready backups
  let risk: 'low' | 'medium' | 'high' = 'low';
  if (criticalSkillsAtRisk.length > 0 && readyBackups.length === 0) risk = 'high';
  else if (criticalSkillsAtRisk.length > 0 || readyBackups.length <= 1) risk = 'medium';

  const notes: string[] = [];
  if (teammates.length === 0) {
    notes.push(`Il candidato è l'unico membro di "${fromDepartmentName}".`);
    risk = 'high';
  }
  if (criticalSkillsAtRisk.length > 0) {
    notes.push(`Skill non più coperte nel team: ${criticalSkillsAtRisk.slice(0, 3).join(', ')}${criticalSkillsAtRisk.length > 3 ? '…' : ''}.`);
  }
  if (readyBackups.length === 0) {
    notes.push('Nessun backup interno con seniority compatibile.');
  } else {
    notes.push(`${readyBackups.length} backup interno/i con almeno il 40% delle skill compatibili.`);
  }

  return {
    fromDepartmentName,
    criticalSkillsAtRisk,
    internalBackupsCount: readyBackups.length,
    internalBackupsPreview: readyBackups.slice(0, 3),
    risk,
    notes,
  };
};

// ============================================================
// 3. Growth analysis
// ============================================================

const analyzeGrowth = (
  candidate: LegacyUser,
  required: RequiredProfile | undefined,
): GrowthAnalysis => {
  const requiredHard = required?.hardSkills || [];
  const requiredSoft = required?.softSkills || [];
  const candHard = getCandidateHardSkillNames(candidate);
  const candSoft = getCandidateSoftSkillNames(candidate);

  const newHardSkillsToLearn = requiredHard.filter(rs => !candHard.some(cs => skillEquals(cs, rs)));
  const newSoftSkillsToLearn = requiredSoft.filter(rs => !candSoft.some(cs => skillEquals(cs, rs)));
  const totalNew = newHardSkillsToLearn.length + newSoftSkillsToLearn.length;

  let stretchLevel: GrowthAnalysis['stretchLevel'] = 'lateral';
  let stretchLabel = 'Movimento laterale';
  if (totalNew === 0) {
    stretchLevel = 'lateral';
    stretchLabel = 'Movimento laterale puro';
  } else if (totalNew <= 3) {
    stretchLevel = 'healthy_stretch';
    stretchLabel = 'Stretch sano';
  } else {
    stretchLevel = 'aggressive_stretch';
    stretchLabel = 'Stretch aggressivo';
  }

  // Seniority change
  const reqLevel = SENIORITY_LEVELS[required?.seniority as SeniorityLevel] || 0;
  const candLevel = SENIORITY_LEVELS[candidate.karmaData?.seniorityAssessment as SeniorityLevel] || 0;
  let seniorityChange: GrowthAnalysis['seniorityChange'] = 'unknown';
  if (reqLevel && candLevel) {
    if (reqLevel > candLevel) seniorityChange = 'promotion';
    else if (reqLevel === candLevel) seniorityChange = 'lateral';
    else seniorityChange = 'demotion';
  }

  const notes: string[] = [];
  if (stretchLevel === 'lateral') {
    notes.push('Nessuna nuova competenza richiesta: rischio di scarsa motivazione.');
  } else if (stretchLevel === 'healthy_stretch') {
    notes.push(`${totalNew} nuova/e competenza/e da sviluppare: livello di sfida ottimale.`);
  } else {
    notes.push(`${totalNew} competenze nuove richieste: alto rischio di adattamento difficoltoso.`);
  }
  if (seniorityChange === 'promotion') notes.push('La rotazione comporta un avanzamento di seniority.');
  if (seniorityChange === 'demotion') notes.push('Attenzione: il ruolo è di seniority inferiore al candidato.');

  return {
    newHardSkillsToLearn,
    newSoftSkillsToLearn,
    stretchLevel,
    stretchLabel,
    seniorityChange,
    notes,
  };
};

// ============================================================
// 4. Final recommendation
// ============================================================

const buildRecommendation = (
  roleFit: RoleFitSummary,
  managerFit: ManagerFit,
  roleImpact: RoleImpact,
  growth: GrowthAnalysis,
): RotationRecommendation => {
  // Convert roleImpact risk into a 0-100 score (high risk = low score)
  const impactScore = roleImpact.risk === 'low' ? 90 : roleImpact.risk === 'medium' ? 60 : 25;

  // Convert growth stretch into a 0-100 score
  const growthScore =
    growth.stretchLevel === 'healthy_stretch' ? 90 :
    growth.stretchLevel === 'lateral' ? 55 :
    40;

  // Weighted composite (Head of HR weights)
  const composite =
    roleFit.score * 0.35 +
    managerFit.fitScore * 0.25 +
    impactScore * 0.25 +
    growthScore * 0.15;

  const score = Math.round(composite);

  let verdict: RecommendationVerdict;
  if (score >= 75) verdict = 'procedi';
  else if (score >= 50) verdict = 'valuta';
  else verdict = 'sconsigliato';

  // Build pros & cons
  const pros: string[] = [];
  const cons: string[] = [];

  if (roleFit.score >= 75) pros.push(`Match con il ruolo solido (${roleFit.score}%).`);
  else if (roleFit.score < 50) cons.push(`Match con il ruolo basso (${roleFit.score}%).`);

  if (!managerFit.managerMissing) {
    if (managerFit.fitScore >= 70) pros.push(`Buon fit con il manager${managerFit.managerName ? ` ${managerFit.managerName}` : ''}.`);
    else if (managerFit.fitScore < 50) cons.push('Fit con il manager debole.');
  }

  if (roleImpact.risk === 'low') pros.push('Il team di partenza non subisce contraccolpi rilevanti.');
  else if (roleImpact.risk === 'high') cons.push(`Alto rischio per il team di partenza (${roleImpact.fromDepartmentName}).`);
  else cons.push(`Impatto medio sul team di partenza.`);

  if (growth.stretchLevel === 'healthy_stretch') pros.push('Stretch di crescita ottimale per la persona.');
  else if (growth.stretchLevel === 'lateral') cons.push('Movimento puramente laterale: poca crescita per la persona.');
  else if (growth.stretchLevel === 'aggressive_stretch') cons.push('Stretch aggressivo: rischio di overload.');

  if (growth.seniorityChange === 'promotion') pros.push('La rotazione è anche una promozione.');
  if (growth.seniorityChange === 'demotion') cons.push('Il ruolo è di seniority inferiore.');

  // Headline: choose the 1-2 most defining factors
  let headline: string;
  if (verdict === 'procedi') {
    headline = pros.slice(0, 2).join(' ') || 'Rotazione consigliata.';
  } else if (verdict === 'valuta') {
    headline = `${pros[0] || 'Match parziale.'} ${cons[0] || ''}`.trim();
  } else {
    headline = cons.slice(0, 2).join(' ') || 'Rotazione sconsigliata.';
  }

  return { verdict, score, headline, pros, cons };
};

// ============================================================
// Public API
// ============================================================

export interface AnalyzeRotationInput {
  candidate: LegacyUser;
  candidateMatch: {
    score: number;
    softMatches: string[];
    softGaps: string[];
    hardMatches: string[];
    hardGaps: string[];
    seniorityMatch: 'match' | 'above' | 'below';
  };
  position: {
    jobTitle: string;
    requiredProfile?: RequiredProfile;
    nodeId?: string | null;
  };
  /** All company users, used to compute manager-fit and impact */
  companyUsers: LegacyUser[];
  /** Map of node id → node name */
  nodeNames: Record<string, string>;
}

export const analyzeRotation = (input: AnalyzeRotationInput): RotationAnalysis => {
  const { candidate, candidateMatch, position, companyUsers, nodeNames } = input;

  const roleFit: RoleFitSummary = {
    score: candidateMatch.score,
    hardMatches: candidateMatch.hardMatches,
    hardGaps: candidateMatch.hardGaps,
    softMatches: candidateMatch.softMatches,
    softGaps: candidateMatch.softGaps,
    seniorityMatch: candidateMatch.seniorityMatch,
  };

  const managerFit = analyzeManagerFit(candidate, position.nodeId || null, companyUsers);
  const roleImpact = analyzeRoleImpact(candidate, companyUsers, nodeNames);
  const growth = analyzeGrowth(candidate, position.requiredProfile);
  const recommendation = buildRecommendation(roleFit, managerFit, roleImpact, growth);

  const fromDepartment = candidate.departmentId ? nodeNames[candidate.departmentId] || 'Non assegnato' : 'Non assegnato';
  const toDepartment = position.nodeId ? nodeNames[position.nodeId] || position.jobTitle : position.jobTitle;

  return {
    candidateName: `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim(),
    candidateSeniority: (candidate.karmaData?.seniorityAssessment as SeniorityLevel) || null,
    fromDepartment,
    toDepartment,
    roleFit,
    managerFit,
    roleImpact,
    growth,
    recommendation,
  };
};
