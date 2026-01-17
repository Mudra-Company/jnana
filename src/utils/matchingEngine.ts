// =============================================
// MATCHING ENGINE - RIASEC + Skills + Seniority + Generation Synergy
// =============================================

import type { RiasecScore, SeniorityLevel, SynergyResult } from '../../types';
import { analyzeSynergy, type UserWithGeneration } from '../../services/generationService';

export interface MatchingTarget {
  riasecScore?: RiasecScore;
  requiredSkills?: string[];
  preferredSkills?: string[];
  seniorityLevels?: SeniorityLevel[];
  workTypes?: string[];
  minExperience?: number;
  maxExperience?: number;
  // Target user for synergy calculation (e.g., hiring manager)
  targetUser?: UserWithGeneration;
}

export interface MatchingCandidate {
  riasecScore?: RiasecScore;
  skills: string[];
  seniorityLevel?: SeniorityLevel;
  workType?: string;
  yearsExperience?: number;
  // Candidate data for synergy calculation
  birthDate?: string;
  age?: number;
  hardSkills?: Array<{ name: string; proficiencyLevel?: number; category?: string }>;
}

export interface MatchResult {
  totalScore: number; // 0-100
  riasecScore: number; // 0-100
  skillsScore: number; // 0-100
  seniorityMatch: boolean;
  workTypeMatch: boolean;
  experienceMatch: boolean;
  matchingSkills: string[];
  missingSkills: string[];
  // NEW: Synergy result for intergenerational matching
  synergyResult?: SynergyResult;
  breakdown: {
    riasecWeight: number;
    skillsWeight: number;
    bonuses: number;
    synergyWeight: number;
  };
}

// RIASEC dimension weights - some dimensions are more predictive for job performance
const RIASEC_WEIGHTS: Record<keyof RiasecScore, number> = {
  R: 1.0, // Realistic
  I: 1.0, // Investigative
  A: 1.0, // Artistic
  S: 1.0, // Social
  E: 1.0, // Enterprising
  C: 1.0, // Conventional
};

/**
 * Calculate RIASEC match score using cosine similarity
 * This method is more robust than simple difference for profile matching
 */
export function calculateRiasecMatch(
  candidate: RiasecScore,
  target: RiasecScore
): number {
  const dimensions: (keyof RiasecScore)[] = ['R', 'I', 'A', 'S', 'E', 'C'];
  
  // Weighted values
  const candidateWeighted = dimensions.map(d => (candidate[d] || 0) * RIASEC_WEIGHTS[d]);
  const targetWeighted = dimensions.map(d => (target[d] || 0) * RIASEC_WEIGHTS[d]);
  
  // Cosine similarity
  let dotProduct = 0;
  let candidateMagnitude = 0;
  let targetMagnitude = 0;
  
  for (let i = 0; i < dimensions.length; i++) {
    dotProduct += candidateWeighted[i] * targetWeighted[i];
    candidateMagnitude += candidateWeighted[i] ** 2;
    targetMagnitude += targetWeighted[i] ** 2;
  }
  
  candidateMagnitude = Math.sqrt(candidateMagnitude);
  targetMagnitude = Math.sqrt(targetMagnitude);
  
  if (candidateMagnitude === 0 || targetMagnitude === 0) {
    return 50; // Default to middle score if no data
  }
  
  const cosineSimilarity = dotProduct / (candidateMagnitude * targetMagnitude);
  
  // Convert to 0-100 scale (cosine similarity ranges from -1 to 1)
  return Math.round(((cosineSimilarity + 1) / 2) * 100);
}

/**
 * Calculate RIASEC match using profile code comparison
 * Compares the top 3 letters (e.g., "RIA" vs "RIE")
 */
export function calculateProfileCodeMatch(
  candidateCode: string,
  targetCode: string
): number {
  if (!candidateCode || !targetCode || candidateCode.length < 3 || targetCode.length < 3) {
    return 50;
  }
  
  const candidateTop3 = candidateCode.slice(0, 3).toUpperCase().split('');
  const targetTop3 = targetCode.slice(0, 3).toUpperCase().split('');
  
  let score = 0;
  
  // Exact position matches (most valuable)
  for (let i = 0; i < 3; i++) {
    if (candidateTop3[i] === targetTop3[i]) {
      score += 25; // 25 points for each exact position match
    }
  }
  
  // Presence matches (less valuable but still counts)
  for (const letter of candidateTop3) {
    if (targetTop3.includes(letter) && !candidateTop3.includes(letter)) {
      score += 8; // 8 points for letter present but in wrong position
    }
  }
  
  return Math.min(100, score);
}

/**
 * Calculate skills match score
 */
export function calculateSkillsMatch(
  candidateSkills: string[],
  requiredSkills: string[],
  preferredSkills: string[] = []
): { score: number; matching: string[]; missing: string[] } {
  if (requiredSkills.length === 0 && preferredSkills.length === 0) {
    return { score: 100, matching: candidateSkills, missing: [] };
  }
  
  const normalizedCandidate = candidateSkills.map(s => s.toLowerCase().trim());
  const normalizedRequired = requiredSkills.map(s => s.toLowerCase().trim());
  const normalizedPreferred = preferredSkills.map(s => s.toLowerCase().trim());
  
  // Find matching and missing required skills
  const matchingRequired = normalizedRequired.filter(skill => 
    normalizedCandidate.some(cs => cs.includes(skill) || skill.includes(cs))
  );
  const missingRequired = normalizedRequired.filter(skill => 
    !normalizedCandidate.some(cs => cs.includes(skill) || skill.includes(cs))
  );
  
  // Find matching preferred skills
  const matchingPreferred = normalizedPreferred.filter(skill => 
    normalizedCandidate.some(cs => cs.includes(skill) || skill.includes(cs))
  );
  
  // Calculate score
  // Required skills: 70% weight
  // Preferred skills: 30% weight
  let score = 0;
  
  if (requiredSkills.length > 0) {
    const requiredScore = (matchingRequired.length / requiredSkills.length) * 70;
    score += requiredScore;
  } else {
    score += 70; // Full required score if no required skills specified
  }
  
  if (preferredSkills.length > 0) {
    const preferredScore = (matchingPreferred.length / preferredSkills.length) * 30;
    score += preferredScore;
  } else {
    score += 30; // Full preferred score if no preferred skills specified
  }
  
  // Get original-case skill names for display
  const matching = requiredSkills.filter((_, i) => 
    matchingRequired.includes(normalizedRequired[i])
  ).concat(
    preferredSkills.filter((_, i) => 
      matchingPreferred.includes(normalizedPreferred[i])
    )
  );
  
  const missing = requiredSkills.filter((_, i) => 
    missingRequired.includes(normalizedRequired[i])
  );
  
  return {
    score: Math.round(score),
    matching,
    missing,
  };
}

/**
 * Check seniority level match
 */
export function checkSeniorityMatch(
  candidate: SeniorityLevel | undefined,
  targetLevels: SeniorityLevel[] | undefined
): boolean {
  if (!targetLevels || targetLevels.length === 0) {
    return true; // No seniority requirement = match
  }
  if (!candidate) {
    return false; // Required but candidate has no assessment
  }
  return targetLevels.includes(candidate);
}

/**
 * Check experience range match
 */
export function checkExperienceMatch(
  candidateYears: number | undefined,
  minYears: number | undefined,
  maxYears: number | undefined
): boolean {
  if (minYears === undefined && maxYears === undefined) {
    return true;
  }
  if (candidateYears === undefined) {
    return false;
  }
  if (minYears !== undefined && candidateYears < minYears) {
    return false;
  }
  if (maxYears !== undefined && candidateYears > maxYears) {
    return false;
  }
  return true;
}

/**
 * Main matching function - calculates overall match score
 * Now includes synergy bonus for intergenerational matching
 */
export function calculateMatchScore(
  candidate: MatchingCandidate,
  target: MatchingTarget
): MatchResult {
  // Weights for final score calculation (rebalanced to include synergy)
  const RIASEC_WEIGHT = 0.30;  // 30% RIASEC match (was 35%)
  const SKILLS_WEIGHT = 0.40;  // 40% Skills match (was 45%)
  const BONUS_WEIGHT = 0.20;   // 20% for seniority, work type, experience bonuses
  const SYNERGY_WEIGHT = 0.10; // 10% for intergenerational synergy (NEW)
  
  // Calculate RIASEC score
  let riasecScore = 50; // Default middle score
  if (candidate.riasecScore && target.riasecScore) {
    riasecScore = calculateRiasecMatch(candidate.riasecScore, target.riasecScore);
  }
  
  // Calculate skills score
  const skillsResult = calculateSkillsMatch(
    candidate.skills,
    target.requiredSkills || [],
    target.preferredSkills || []
  );
  
  // Calculate bonuses
  const seniorityMatch = checkSeniorityMatch(candidate.seniorityLevel, target.seniorityLevels);
  const workTypeMatch = !target.workTypes?.length || 
    (!!candidate.workType && target.workTypes.includes(candidate.workType));
  const experienceMatch = checkExperienceMatch(
    candidate.yearsExperience,
    target.minExperience,
    target.maxExperience
  );
  
  // Bonus score (each match adds to the bonus pool)
  const bonusCount = [seniorityMatch, workTypeMatch, experienceMatch].filter(Boolean).length;
  const bonusScore = (bonusCount / 3) * 100;
  
  // Calculate synergy score (NEW)
  let synergyResult: SynergyResult | undefined;
  let synergyScore = 50; // Default neutral score
  
  if (target.targetUser && (candidate.birthDate || candidate.age)) {
    synergyResult = analyzeSynergy(
      {
        birthDate: candidate.birthDate,
        age: candidate.age,
        hardSkills: candidate.hardSkills
      },
      target.targetUser
    );
    synergyScore = synergyResult.score || 50;
  }
  
  // Final weighted score
  const totalScore = Math.round(
    (riasecScore * RIASEC_WEIGHT) +
    (skillsResult.score * SKILLS_WEIGHT) +
    (bonusScore * BONUS_WEIGHT) +
    (synergyScore * SYNERGY_WEIGHT)
  );
  
  return {
    totalScore: Math.min(100, totalScore),
    riasecScore,
    skillsScore: skillsResult.score,
    seniorityMatch,
    workTypeMatch,
    experienceMatch,
    matchingSkills: skillsResult.matching,
    missingSkills: skillsResult.missing,
    synergyResult,
    breakdown: {
      riasecWeight: Math.round(riasecScore * RIASEC_WEIGHT),
      skillsWeight: Math.round(skillsResult.score * SKILLS_WEIGHT),
      bonuses: Math.round(bonusScore * BONUS_WEIGHT),
      synergyWeight: Math.round(synergyScore * SYNERGY_WEIGHT),
    },
  };
}

/**
 * Get match quality label based on score
 */
export function getMatchQuality(score: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (score >= 85) {
    return {
      label: 'Eccellente',
      color: 'text-green-700 dark:text-green-300',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    };
  }
  if (score >= 70) {
    return {
      label: 'Ottimo',
      color: 'text-blue-700 dark:text-blue-300',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    };
  }
  if (score >= 55) {
    return {
      label: 'Buono',
      color: 'text-amber-700 dark:text-amber-300',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    };
  }
  if (score >= 40) {
    return {
      label: 'Discreto',
      color: 'text-orange-700 dark:text-orange-300',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    };
  }
  return {
    label: 'Basso',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  };
}

/**
 * Sort candidates by match score with tie-breakers
 */
export function sortCandidatesByMatch(
  candidates: Array<{ matchResult: MatchResult; [key: string]: any }>
): typeof candidates {
  return [...candidates].sort((a, b) => {
    // Primary: total score
    if (b.matchResult.totalScore !== a.matchResult.totalScore) {
      return b.matchResult.totalScore - a.matchResult.totalScore;
    }
    // Secondary: skills score (skills are often more important for immediate productivity)
    if (b.matchResult.skillsScore !== a.matchResult.skillsScore) {
      return b.matchResult.skillsScore - a.matchResult.skillsScore;
    }
    // Tertiary: RIASEC score (cultural/personality fit)
    return b.matchResult.riasecScore - a.matchResult.riasecScore;
  });
}
