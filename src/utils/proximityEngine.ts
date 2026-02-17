// =============================================
// PROXIMITY ENGINE - SpaceSync Spatial Compatibility
// =============================================
// Patent-pending algorithm for calculating spatial
// compatibility between team members based on multi-
// dimensional psychometric and organizational data.

import type { RiasecScore } from '../../types';
import type { CollaborationProfile } from '../types/roles';
import { analyzeSynergy, type UserWithGeneration, type SynergyResult } from '../../services/generationService';

// --- TYPES ---

export interface ProximityUserData {
  id: string;
  memberId: string; // company_member_id
  firstName: string;
  lastName: string;
  jobTitle?: string;
  roleId?: string;
  roleTitle?: string;
  // Psychometric data
  riasecScores?: RiasecScore;
  softSkills?: string[];
  primaryValues?: string[];
  riskFactors?: string[];
  // Generation data
  birthDate?: string;
  age?: number;
  hardSkills?: Array<{ name: string; proficiencyLevel?: number; category?: string }>;
  // Karma data for synergy
  karmaData?: {
    softSkills?: string[];
    seniorityAssessment?: any;
  };
  // Collaboration profile from role
  collaborationProfile?: CollaborationProfile;
}

export interface ProximityResult {
  score: number; // 0-100
  breakdown: {
    riasecComplementarity: number;
    softSkillsOverlap: number;
    valuesAlignment: number;
    collaborationFlow: number;
    generationSynergy: number;
    conflictRisk: number;
    environmentalFriction: number;
  };
  synergyResult?: SynergyResult;
  insights: string[];
  level: 'excellent' | 'good' | 'neutral' | 'poor';
}

export interface DeskProximityPair {
  deskA: { id: string; label: string; x: number; y: number; roomId: string };
  deskB: { id: string; label: string; x: number; y: number; roomId: string };
  userA: ProximityUserData;
  userB: ProximityUserData;
  distance: number; // pixel distance on canvas
  proximityResult: ProximityResult;
}

export interface OptimizationSuggestion {
  type: 'swap' | 'move';
  description: string;
  currentScore: number;
  projectedScore: number;
  improvement: number;
  involvedUsers: string[];
}

// --- WEIGHTS ---
const WEIGHTS = {
  RIASEC_COMPLEMENTARITY: 0.15,
  SOFT_SKILLS_OVERLAP: 0.10,
  VALUES_ALIGNMENT: 0.10,
  COLLABORATION_FLOW: 0.30,
  GENERATION_SYNERGY: 0.10,
  CONFLICT_RISK: 0.10,
  ENVIRONMENTAL_FRICTION: 0.15,
};

// --- RIASEC COMPLEMENTARITY ---

// Complementary pairs (work well together)
const RIASEC_COMPLEMENTARY_PAIRS: [string, string][] = [
  ['R', 'I'], ['I', 'A'], ['S', 'E'], ['E', 'C'], ['R', 'C'], ['A', 'S'],
];

function calculateRiasecComplementarity(scoresA?: RiasecScore, scoresB?: RiasecScore): number {
  if (!scoresA || !scoresB) return 50;

  const dims: (keyof RiasecScore)[] = ['R', 'I', 'A', 'S', 'E', 'C'];
  const sortedA = dims.slice().sort((a, b) => (scoresB![b] ?? 0) - (scoresA![a] ?? 0));
  const sortedB = dims.slice().sort((a, b) => (scoresB![b] ?? 0) - (scoresA![a] ?? 0));
  const topA = sortedA.slice(0, 3);
  const topB = sortedB.slice(0, 3);

  let complementaryBonus = 0;
  for (const [d1, d2] of RIASEC_COMPLEMENTARY_PAIRS) {
    if (
      (topA.includes(d1 as keyof RiasecScore) && topB.includes(d2 as keyof RiasecScore)) ||
      (topA.includes(d2 as keyof RiasecScore) && topB.includes(d1 as keyof RiasecScore))
    ) {
      complementaryBonus += 20;
    }
  }

  const overlap = topA.filter(d => topB.includes(d)).length;
  const similarityPenalty = overlap === 3 ? -10 : overlap === 2 ? -5 : 0;

  const dotProduct = dims.reduce((sum, d) => sum + (scoresA[d] ?? 0) * (scoresB[d] ?? 0), 0);
  const magA = Math.sqrt(dims.reduce((sum, d) => sum + (scoresA[d] ?? 0) ** 2, 0));
  const magB = Math.sqrt(dims.reduce((sum, d) => sum + (scoresB[d] ?? 0) ** 2, 0));
  const cosineSim = magA && magB ? dotProduct / (magA * magB) : 0;

  const optimalDiff = Math.abs(cosineSim - 0.6);
  const cosineScore = Math.max(0, 100 - optimalDiff * 150);

  return Math.min(100, Math.max(0, cosineScore + complementaryBonus + similarityPenalty));
}

// --- SOFT SKILLS OVERLAP ---

function calculateSoftSkillsOverlap(skillsA?: string[], skillsB?: string[]): number {
  if (!skillsA?.length || !skillsB?.length) return 50;

  const normalizedA = skillsA.map(s => s.toLowerCase().trim());
  const normalizedB = skillsB.map(s => s.toLowerCase().trim());

  const intersection = normalizedA.filter(s => normalizedB.includes(s));
  const union = new Set([...normalizedA, ...normalizedB]);

  const jaccard = union.size > 0 ? intersection.length / union.size : 0;

  if (jaccard >= 0.3 && jaccard <= 0.6) return 90;
  if (jaccard > 0.6) return 70;
  if (jaccard > 0.1) return 60;
  return 30;
}

// --- VALUES ALIGNMENT ---

function calculateValuesAlignment(valuesA?: string[], valuesB?: string[]): number {
  if (!valuesA?.length || !valuesB?.length) return 50;

  const normalizedA = valuesA.map(v => v.toLowerCase().trim());
  const normalizedB = valuesB.map(v => v.toLowerCase().trim());

  const shared = normalizedA.filter(v => normalizedB.includes(v));
  const shareRatio = shared.length / Math.max(normalizedA.length, normalizedB.length);

  return Math.round(30 + shareRatio * 70);
}

// --- COLLABORATION FLOW (replaces binary communication flow) ---

function calculateCollaborationFlow(
  userA: ProximityUserData,
  userB: ProximityUserData,
): number {
  const profileA = userA.collaborationProfile;
  const profileB = userB.collaborationProfile;

  // If no collaboration profiles, fallback to 40
  if (!profileA && !profileB) return 40;

  let maxCollabScore = 0;

  // Check if A has a link to B (by member or team)
  if (profileA?.links) {
    for (const link of profileA.links) {
      if (link.targetType === 'member' && link.targetId === userB.memberId) {
        maxCollabScore = Math.max(maxCollabScore, link.collaborationPercentage);
        // Bonus for high affinity
        if (link.personalAffinity >= 4) maxCollabScore = Math.min(100, maxCollabScore + 10);
      }
      if (link.targetType === 'team') {
        // Check if B has a role in this team (via memberBreakdown)
        const memberEntry = link.memberBreakdown?.find(mb => mb.memberId === userB.memberId);
        if (memberEntry) {
          const effectivePct = (link.collaborationPercentage * memberEntry.percentage) / 100;
          maxCollabScore = Math.max(maxCollabScore, effectivePct);
          if (link.personalAffinity >= 4) maxCollabScore = Math.min(100, maxCollabScore + 5);
        }
      }
    }
  }

  // Check if B has a link to A
  if (profileB?.links) {
    for (const link of profileB.links) {
      if (link.targetType === 'member' && link.targetId === userA.memberId) {
        maxCollabScore = Math.max(maxCollabScore, link.collaborationPercentage);
        if (link.personalAffinity >= 4) maxCollabScore = Math.min(100, maxCollabScore + 10);
      }
      if (link.targetType === 'team') {
        const memberEntry = link.memberBreakdown?.find(mb => mb.memberId === userA.memberId);
        if (memberEntry) {
          const effectivePct = (link.collaborationPercentage * memberEntry.percentage) / 100;
          maxCollabScore = Math.max(maxCollabScore, effectivePct);
          if (link.personalAffinity >= 4) maxCollabScore = Math.min(100, maxCollabScore + 5);
        }
      }
    }
  }

  return Math.min(100, Math.max(0, maxCollabScore || 40));
}

// --- ENVIRONMENTAL FRICTION ---

const FOCUS_KEYWORDS = [
  'concentrazione', 'analytical thinking', 'focus', 'detail oriented',
  'precisione', 'ricerca', 'analisi', 'introversione', 'silenzio',
];

function calculateEnvironmentalFriction(userA: ProximityUserData, userB: ProximityUserData): number {
  const impactA = userA.collaborationProfile?.environmentalImpact ?? 3;
  const impactB = userB.collaborationProfile?.environmentalImpact ?? 3;
  const fluidityA = userA.collaborationProfile?.operationalFluidity ?? 3;
  const fluidityB = userB.collaborationProfile?.operationalFluidity ?? 3;

  let friction = 0;

  // 1. High noise + focus profile neighbor
  const allSkillsA = [...(userA.softSkills || []), ...(userA.riskFactors || [])].map(s => s.toLowerCase());
  const allSkillsB = [...(userB.softSkills || []), ...(userB.riskFactors || [])].map(s => s.toLowerCase());

  const needsFocusA = allSkillsA.some(s => FOCUS_KEYWORDS.some(kw => s.includes(kw)));
  const needsFocusB = allSkillsB.some(s => FOCUS_KEYWORDS.some(kw => s.includes(kw)));

  if (impactA >= 4 && needsFocusB) friction += 35;
  if (impactB >= 4 && needsFocusA) friction += 35;

  // 2. Very different operational fluidity (delta >= 3)
  const fluidityDelta = Math.abs(fluidityA - fluidityB);
  if (fluidityDelta >= 3) friction += 25;
  else if (fluidityDelta >= 2) friction += 10;

  // 3. Both high noise amplification
  if (impactA >= 5 && impactB >= 5) friction += 20;
  else if (impactA >= 4 && impactB >= 4) friction += 10;

  return Math.min(100, friction);
}

// --- CONFLICT RISK ---

function calculateConflictRisk(riskA?: string[], riskB?: string[]): number {
  if (!riskA?.length && !riskB?.length) return 0;

  const allRisks = [...(riskA || []), ...(riskB || [])];

  const conflictPatterns = [
    ['Micromanagement', 'Autonomia'],
    ['Control', 'Creativity'],
    ['Rigidity', 'Flexibility'],
    ['Burnout Risk', 'Burnout Risk'],
  ];

  let conflictScore = 0;
  for (const [pat1, pat2] of conflictPatterns) {
    const normalizedRisks = allRisks.map(r => r.toLowerCase());
    if (
      normalizedRisks.some(r => r.includes(pat1.toLowerCase())) &&
      normalizedRisks.some(r => r.includes(pat2.toLowerCase()))
    ) {
      conflictScore += 25;
    }
  }

  return Math.min(100, conflictScore);
}

// --- GENERATION SYNERGY ---

function calculateGenerationSynergy(userA: ProximityUserData, userB: ProximityUserData): { score: number; synergy: SynergyResult } {
  const genUserA: UserWithGeneration = {
    birthDate: userA.birthDate,
    age: userA.age,
    hardSkills: userA.hardSkills,
    karmaData: userA.karmaData,
  };
  const genUserB: UserWithGeneration = {
    birthDate: userB.birthDate,
    age: userB.age,
    hardSkills: userB.hardSkills,
    karmaData: userB.karmaData,
  };

  const synergy = analyzeSynergy(genUserA, genUserB);
  return { score: synergy.score, synergy };
}

// --- MAIN PROXIMITY CALCULATOR ---

export function calculateProximityScore(
  userA: ProximityUserData,
  userB: ProximityUserData,
  communicatingRolePairs?: Set<string>
): ProximityResult {
  const riasec = calculateRiasecComplementarity(userA.riasecScores, userB.riasecScores);
  const softSkills = calculateSoftSkillsOverlap(userA.softSkills, userB.softSkills);
  const values = calculateValuesAlignment(userA.primaryValues, userB.primaryValues);
  const collabFlow = calculateCollaborationFlow(userA, userB);
  const { score: genScore, synergy: synergyResult } = calculateGenerationSynergy(userA, userB);
  const conflict = calculateConflictRisk(userA.riskFactors, userB.riskFactors);
  const envFriction = calculateEnvironmentalFriction(userA, userB);

  const weightedScore =
    riasec * WEIGHTS.RIASEC_COMPLEMENTARITY +
    softSkills * WEIGHTS.SOFT_SKILLS_OVERLAP +
    values * WEIGHTS.VALUES_ALIGNMENT +
    collabFlow * WEIGHTS.COLLABORATION_FLOW +
    genScore * WEIGHTS.GENERATION_SYNERGY -
    conflict * WEIGHTS.CONFLICT_RISK -
    envFriction * WEIGHTS.ENVIRONMENTAL_FRICTION;

  const finalScore = Math.round(Math.max(0, Math.min(100, weightedScore)));

  // Generate insights
  const insights: string[] = [];
  if (collabFlow >= 70) {
    insights.push(`Alto flusso collaborativo (${Math.round(collabFlow)}%) — ottimo averli vicini.`);
  } else if (collabFlow === 40) {
    insights.push('Nessun flusso di collaborazione diretto mappato.');
  }
  if (envFriction >= 50) {
    insights.push('⚠️ Rischio Frizione Ambientale: stili operativi incompatibili.');
  } else if (envFriction >= 30) {
    insights.push('⚠️ Attenzione: potenziale disturbo sonoro per il vicino.');
  }
  if (riasec >= 75) {
    insights.push('Profili RIASEC altamente complementari.');
  }
  if (conflict >= 50) {
    insights.push('⚠️ Rischio di frizione: fattori di rischio incompatibili.');
  }
  if (synergyResult.type === 'Reverse Mentoring') {
    insights.push(`Opportunità di Reverse Mentoring: ${synergyResult.reason}`);
  } else if (synergyResult.type === 'Mentoring') {
    insights.push(`Opportunità di Mentoring: ${synergyResult.reason}`);
  }
  if (values >= 80) {
    insights.push('Forte allineamento valoriale.');
  }

  const level: ProximityResult['level'] =
    finalScore >= 75 ? 'excellent' :
    finalScore >= 55 ? 'good' :
    finalScore >= 35 ? 'neutral' : 'poor';

  return {
    score: finalScore,
    breakdown: {
      riasecComplementarity: Math.round(riasec),
      softSkillsOverlap: Math.round(softSkills),
      valuesAlignment: Math.round(values),
      collaborationFlow: Math.round(collabFlow),
      generationSynergy: Math.round(genScore),
      conflictRisk: Math.round(conflict),
      environmentalFriction: Math.round(envFriction),
    },
    synergyResult,
    insights,
    level,
  };
}

// --- HEATMAP COLOR HELPERS ---

export function getProximityColor(score: number): string {
  if (score >= 75) return '#22c55e';
  if (score >= 55) return '#84cc16';
  if (score >= 35) return '#f59e0b';
  return '#ef4444';
}

export function getProximityColorAlpha(score: number, alpha: number = 0.3): string {
  if (score >= 75) return `rgba(34, 197, 94, ${alpha})`;
  if (score >= 55) return `rgba(132, 204, 22, ${alpha})`;
  if (score >= 35) return `rgba(245, 158, 11, ${alpha})`;
  return `rgba(239, 68, 68, ${alpha})`;
}

// --- DESK DISTANCE CALCULATOR ---

export function calculateDeskDistance(
  deskA: { x: number; y: number; roomId: string },
  deskB: { x: number; y: number; roomId: string },
  roomA?: { x: number; y: number },
  roomB?: { x: number; y: number }
): number {
  const absAx = (roomA?.x ?? 0) + deskA.x;
  const absAy = (roomA?.y ?? 0) + deskA.y;
  const absBx = (roomB?.x ?? 0) + deskB.x;
  const absBy = (roomB?.y ?? 0) + deskB.y;

  return Math.sqrt((absAx - absBx) ** 2 + (absAy - absBy) ** 2);
}

// --- ADJACENCY THRESHOLD ---
export const ADJACENCY_THRESHOLD = 200;

export function areDesksAdjacent(distance: number): boolean {
  return distance <= ADJACENCY_THRESHOLD;
}
