// =============================================
// PROXIMITY ENGINE - SpaceSync Spatial Compatibility
// =============================================
// Patent-pending algorithm for calculating spatial
// compatibility between team members based on multi-
// dimensional psychometric and organizational data.

import type { RiasecScore } from '../../types';
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
}

export interface ProximityResult {
  score: number; // 0-100
  breakdown: {
    riasecComplementarity: number;
    softSkillsOverlap: number;
    valuesAlignment: number;
    communicationFlow: number;
    generationSynergy: number;
    conflictRisk: number;
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
  RIASEC_COMPLEMENTARITY: 0.20,
  SOFT_SKILLS_OVERLAP: 0.15,
  VALUES_ALIGNMENT: 0.15,
  COMMUNICATION_FLOW: 0.30,
  GENERATION_SYNERGY: 0.10,
  CONFLICT_RISK: 0.10,
};

// --- RIASEC COMPLEMENTARITY ---

// Complementary pairs (work well together)
const RIASEC_COMPLEMENTARY_PAIRS: [string, string][] = [
  ['R', 'I'], // Realistic + Investigative
  ['I', 'A'], // Investigative + Artistic
  ['S', 'E'], // Social + Enterprising
  ['E', 'C'], // Enterprising + Conventional
  ['R', 'C'], // Realistic + Conventional
  ['A', 'S'], // Artistic + Social
];

function calculateRiasecComplementarity(scoresA?: RiasecScore, scoresB?: RiasecScore): number {
  if (!scoresA || !scoresB) return 50; // neutral when no data

  const dims: (keyof RiasecScore)[] = ['R', 'I', 'A', 'S', 'E', 'C'];
  
  // Get top 3 dimensions for each
  const sortedA = dims.slice().sort((a, b) => (scoresB![b] ?? 0) - (scoresA![a] ?? 0));
  const sortedB = dims.slice().sort((a, b) => (scoresB![b] ?? 0) - (scoresA![a] ?? 0));
  const topA = sortedA.slice(0, 3);
  const topB = sortedB.slice(0, 3);

  // Check complementary pairs
  let complementaryBonus = 0;
  for (const [d1, d2] of RIASEC_COMPLEMENTARY_PAIRS) {
    if (
      (topA.includes(d1 as keyof RiasecScore) && topB.includes(d2 as keyof RiasecScore)) ||
      (topA.includes(d2 as keyof RiasecScore) && topB.includes(d1 as keyof RiasecScore))
    ) {
      complementaryBonus += 20;
    }
  }

  // Penalize too-similar profiles slightly (less diversity of thought)
  const overlap = topA.filter(d => topB.includes(d)).length;
  const similarityPenalty = overlap === 3 ? -10 : overlap === 2 ? -5 : 0;

  // Calculate cosine similarity for nuance
  const dotProduct = dims.reduce((sum, d) => sum + (scoresA[d] ?? 0) * (scoresB[d] ?? 0), 0);
  const magA = Math.sqrt(dims.reduce((sum, d) => sum + (scoresA[d] ?? 0) ** 2, 0));
  const magB = Math.sqrt(dims.reduce((sum, d) => sum + (scoresB[d] ?? 0) ** 2, 0));
  const cosineSim = magA && magB ? dotProduct / (magA * magB) : 0;

  // Balance: not too similar, not too different
  // Optimal is ~0.5-0.7 cosine similarity
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

  // Jaccard similarity
  const jaccard = union.size > 0 ? intersection.length / union.size : 0;

  // Some overlap is good (communication), too much is redundant
  // Optimal: 30-60% overlap
  if (jaccard >= 0.3 && jaccard <= 0.6) return 90;
  if (jaccard > 0.6) return 70; // too similar
  if (jaccard > 0.1) return 60;
  return 30; // very different soft skills
}

// --- VALUES ALIGNMENT ---

function calculateValuesAlignment(valuesA?: string[], valuesB?: string[]): number {
  if (!valuesA?.length || !valuesB?.length) return 50;

  const normalizedA = valuesA.map(v => v.toLowerCase().trim());
  const normalizedB = valuesB.map(v => v.toLowerCase().trim());

  const shared = normalizedA.filter(v => normalizedB.includes(v));
  const shareRatio = shared.length / Math.max(normalizedA.length, normalizedB.length);

  // Higher alignment = less friction
  return Math.round(30 + shareRatio * 70);
}

// --- COMMUNICATION FLOW ---

function calculateCommunicationFlow(
  roleIdA?: string,
  roleIdB?: string,
  communicatingRolePairs?: Set<string>
): number {
  if (!roleIdA || !roleIdB || !communicatingRolePairs) return 50;

  const key1 = `${roleIdA}:${roleIdB}`;
  const key2 = `${roleIdB}:${roleIdA}`;

  if (communicatingRolePairs.has(key1) || communicatingRolePairs.has(key2)) {
    return 100; // These roles need to communicate frequently
  }

  return 40; // No known communication flow
}

// --- CONFLICT RISK ---

function calculateConflictRisk(riskA?: string[], riskB?: string[]): number {
  if (!riskA?.length && !riskB?.length) return 0; // no risk factors = no penalty

  const allRisks = [...(riskA || []), ...(riskB || [])];

  // Known conflicting risk factor patterns
  const conflictPatterns = [
    ['Micromanagement', 'Autonomia'],
    ['Control', 'Creativity'],
    ['Rigidity', 'Flexibility'],
    ['Burnout Risk', 'Burnout Risk'], // Two burned-out people together is bad
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
  const commFlow = calculateCommunicationFlow(userA.roleId, userB.roleId, communicatingRolePairs);
  const { score: genScore, synergy: synergyResult } = calculateGenerationSynergy(userA, userB);
  const conflict = calculateConflictRisk(userA.riskFactors, userB.riskFactors);

  const weightedScore =
    riasec * WEIGHTS.RIASEC_COMPLEMENTARITY +
    softSkills * WEIGHTS.SOFT_SKILLS_OVERLAP +
    values * WEIGHTS.VALUES_ALIGNMENT +
    commFlow * WEIGHTS.COMMUNICATION_FLOW +
    genScore * WEIGHTS.GENERATION_SYNERGY -
    conflict * WEIGHTS.CONFLICT_RISK;

  const finalScore = Math.round(Math.max(0, Math.min(100, weightedScore)));

  // Generate insights
  const insights: string[] = [];
  if (commFlow === 100) {
    insights.push('I loro ruoli comunicano frequentemente – ottimo averli vicini.');
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
      communicationFlow: Math.round(commFlow),
      generationSynergy: Math.round(genScore),
      conflictRisk: Math.round(conflict),
    },
    synergyResult,
    insights,
    level,
  };
}

// --- HEATMAP COLOR HELPERS ---

export function getProximityColor(score: number): string {
  if (score >= 75) return '#22c55e'; // green
  if (score >= 55) return '#84cc16'; // lime
  if (score >= 35) return '#f59e0b'; // amber
  return '#ef4444'; // red
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
  // Convert to absolute canvas coordinates
  const absAx = (roomA?.x ?? 0) + deskA.x;
  const absAy = (roomA?.y ?? 0) + deskA.y;
  const absBx = (roomB?.x ?? 0) + deskB.x;
  const absBy = (roomB?.y ?? 0) + deskB.y;

  return Math.sqrt((absAx - absBx) ** 2 + (absAy - absBy) ** 2);
}

// --- ADJACENCY THRESHOLD ---
// Desks within this pixel distance are considered "neighbors"
export const ADJACENCY_THRESHOLD = 200;

export function areDesksAdjacent(distance: number): boolean {
  return distance <= ADJACENCY_THRESHOLD;
}
