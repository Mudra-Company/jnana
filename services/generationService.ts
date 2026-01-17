// =============================================
// GENERATION SERVICE - Intergenerational Matching
// =============================================

import type { RiasecScore, SeniorityLevel } from '../types';

// Generation type definitions
export type GenerationType =
  | 'Builders'      // Pre-1946
  | 'Baby Boomer'   // 1946-1964
  | 'Gen X'         // 1965-1980
  | 'Millennial'    // 1981-1996
  | 'Gen Z'         // 1997-2012
  | 'Gen Alpha';    // Post-2012

// Synergy analysis result
export interface SynergyResult {
  type: 'Mentoring' | 'Reverse Mentoring' | 'Peer Support' | 'None';
  score: number; // 0-100
  reason: string;
  techSkillsBonus?: string[]; // Tech skills enabling reverse mentoring
  generationA?: GenerationType;
  generationB?: GenerationType;
  ageGap?: number;
}

// User data needed for synergy analysis
export interface UserWithGeneration {
  birthDate?: string;
  age?: number;
  hardSkills?: Array<{ name: string; proficiencyLevel?: number; category?: string }>;
  karmaData?: {
    softSkills?: string[];
    seniorityAssessment?: SeniorityLevel;
  };
  results?: RiasecScore;
}

// Generation color palette for UI
export const GENERATION_COLORS: Record<GenerationType, { bg: string; text: string; border: string }> = {
  'Builders': {
    bg: 'bg-slate-100 dark:bg-slate-800/40',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-600'
  },
  'Baby Boomer': {
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-600'
  },
  'Gen X': {
    bg: 'bg-purple-100 dark:bg-purple-900/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-600'
  },
  'Millennial': {
    bg: 'bg-pink-100 dark:bg-pink-900/40',
    text: 'text-pink-700 dark:text-pink-300',
    border: 'border-pink-300 dark:border-pink-600'
  },
  'Gen Z': {
    bg: 'bg-green-100 dark:bg-green-900/40',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-300 dark:border-green-600'
  },
  'Gen Alpha': {
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-600'
  }
};

// Generation labels in Italian
export const GENERATION_LABELS: Record<GenerationType, { short: string; full: string; years: string }> = {
  'Builders': { short: 'Builders', full: 'Silent Generation', years: 'Pre-1946' },
  'Baby Boomer': { short: 'Boomer', full: 'Baby Boomer', years: '1946-1964' },
  'Gen X': { short: 'Gen X', full: 'Generazione X', years: '1965-1980' },
  'Millennial': { short: 'Millennial', full: 'Millennial (Gen Y)', years: '1981-1996' },
  'Gen Z': { short: 'Gen Z', full: 'Generazione Z', years: '1997-2012' },
  'Gen Alpha': { short: 'Gen Alpha', full: 'Generazione Alpha', years: '2013+' }
};

// Tech skills that enable reverse mentoring
const TECH_SKILLS: string[] = [
  'ai', 'artificial intelligence', 'machine learning', 'deep learning',
  'python', 'react', 'javascript', 'typescript', 'node',
  'cloud', 'aws', 'azure', 'gcp', 'kubernetes', 'docker',
  'social media', 'marketing digitale', 'digital marketing', 'seo', 'sem',
  'automation', 'rpa', 'no-code', 'low-code',
  'data analysis', 'data science', 'analytics', 'power bi', 'tableau',
  'ux design', 'ui design', 'figma', 'design thinking',
  'blockchain', 'web3', 'crypto',
  'agile', 'scrum', 'devops', 'ci/cd',
  'mobile development', 'flutter', 'react native',
  'cybersecurity', 'security'
];

/**
 * Get generation type from birth date
 */
export function getGeneration(birthDate: string | undefined | null): GenerationType | null {
  if (!birthDate) return null;
  
  try {
    const year = new Date(birthDate).getFullYear();
    
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
      return null;
    }
    
    if (year >= 2013) return 'Gen Alpha';
    if (year >= 1997) return 'Gen Z';
    if (year >= 1981) return 'Millennial';
    if (year >= 1965) return 'Gen X';
    if (year >= 1946) return 'Baby Boomer';
    return 'Builders';
  } catch {
    return null;
  }
}

/**
 * Get generation from age (fallback when birthDate is not available)
 */
export function getGenerationFromAge(age: number | undefined | null): GenerationType | null {
  if (age === undefined || age === null || age < 0) return null;
  
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - age;
  
  if (birthYear >= 2013) return 'Gen Alpha';
  if (birthYear >= 1997) return 'Gen Z';
  if (birthYear >= 1981) return 'Millennial';
  if (birthYear >= 1965) return 'Gen X';
  if (birthYear >= 1946) return 'Baby Boomer';
  return 'Builders';
}

/**
 * Calculate precise age from birth date
 */
export function calculateAge(birthDate: string | undefined | null): number | null {
  if (!birthDate) return null;
  
  try {
    const today = new Date();
    const birth = new Date(birthDate);
    
    if (isNaN(birth.getTime())) return null;
    
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age >= 0 ? age : null;
  } catch {
    return null;
  }
}

/**
 * Get user's age - prioritizes calculated age from birthDate, falls back to stored age
 */
export function getUserAge(user: UserWithGeneration): number | null {
  if (user.birthDate) {
    return calculateAge(user.birthDate);
  }
  return user.age ?? null;
}

/**
 * Get user's generation - prioritizes birthDate, falls back to age
 */
export function getUserGeneration(user: UserWithGeneration): GenerationType | null {
  if (user.birthDate) {
    return getGeneration(user.birthDate);
  }
  if (user.age !== undefined && user.age !== null) {
    return getGenerationFromAge(user.age);
  }
  return null;
}

/**
 * Check if a skill is a tech skill (for reverse mentoring detection)
 */
function isTechSkill(skillName: string): boolean {
  const normalized = skillName.toLowerCase().trim();
  return TECH_SKILLS.some(tech => 
    normalized.includes(tech) || tech.includes(normalized)
  );
}

/**
 * Extract tech skills from user's hard skills
 */
function extractTechSkills(user: UserWithGeneration): string[] {
  if (!user.hardSkills) return [];
  
  return user.hardSkills
    .filter(skill => isTechSkill(skill.name))
    .map(skill => skill.name);
}

/**
 * Analyze synergy potential between two users
 * Core algorithm for intergenerational matching
 */
export function analyzeSynergy(
  userA: UserWithGeneration,
  userB: UserWithGeneration
): SynergyResult {
  const ageA = getUserAge(userA);
  const ageB = getUserAge(userB);
  
  // Cannot analyze without age data
  if (ageA === null || ageB === null) {
    return {
      type: 'None',
      score: 0,
      reason: 'Dati anagrafici insufficienti per analisi generazionale'
    };
  }
  
  const generationA = getUserGeneration(userA);
  const generationB = getUserGeneration(userB);
  const ageGap = Math.abs(ageA - ageB);
  
  // Identify senior and junior
  const [senior, junior, seniorGen, juniorGen] = ageA > ageB 
    ? [userA, userB, generationA, generationB]
    : [userB, userA, generationB, generationA];
  
  const result: SynergyResult = {
    type: 'None',
    score: 0,
    reason: '',
    generationA: generationA ?? undefined,
    generationB: generationB ?? undefined,
    ageGap
  };
  
  // PEER SUPPORT: Age gap < 5 years (same generational cohort)
  if (ageGap < 5) {
    result.type = 'Peer Support';
    result.score = 60;
    result.reason = generationA 
      ? `Stesso range generazionale (${GENERATION_LABELS[generationA].short}) - collaborazione alla pari efficace`
      : 'Stesso range generazionale - collaborazione alla pari efficace';
    return result;
  }
  
  // SIGNIFICANT GAP: Check mentoring potential (gap >= 15 years)
  if (ageGap >= 15) {
    // Check for reverse mentoring: Junior has tech skills?
    const juniorTechSkills = extractTechSkills(junior);
    
    if (juniorTechSkills.length >= 2) {
      result.type = 'Reverse Mentoring';
      result.score = 85;
      result.techSkillsBonus = juniorTechSkills.slice(0, 5); // Top 5
      result.reason = juniorGen && seniorGen
        ? `${GENERATION_LABELS[juniorGen].short} con competenze tech può guidare ${GENERATION_LABELS[seniorGen].short} su temi digitali`
        : 'Profilo junior con forti competenze tech può guidare il profilo senior su temi digitali';
      return result;
    }
    
    // Classic mentoring: Senior guides Junior
    result.type = 'Mentoring';
    result.score = 80;
    result.reason = seniorGen && juniorGen
      ? `${GENERATION_LABELS[seniorGen].short} può trasferire esperienza e visione strategica a ${GENERATION_LABELS[juniorGen].short}`
      : 'Il profilo senior può trasferire esperienza e visione strategica al profilo junior';
    return result;
  }
  
  // MODERATE GAP: 5-15 years (light mentoring opportunity)
  if (ageGap >= 5) {
    // Still check for reverse mentoring if junior has strong tech skills
    const juniorTechSkills = extractTechSkills(junior);
    
    if (juniorTechSkills.length >= 3) {
      result.type = 'Reverse Mentoring';
      result.score = 70;
      result.techSkillsBonus = juniorTechSkills.slice(0, 5);
      result.reason = 'Gap generazionale moderato con forte complementarità tech - opportunità di reverse mentoring';
      return result;
    }
    
    result.type = 'Mentoring';
    result.score = 65;
    result.reason = 'Gap generazionale moderato - opportunità di scambio bidirezionale e mentoring leggero';
    return result;
  }
  
  return result;
}

/**
 * Calculate synergy score as a percentage bonus for matching
 * Returns a value 0-100 that can be weighted into the overall match score
 */
export function calculateSynergyBonus(synergyResult: SynergyResult): number {
  if (synergyResult.type === 'None') return 0;
  return synergyResult.score;
}

/**
 * Get generation distribution from a list of users
 */
export function getGenerationDistribution(
  users: UserWithGeneration[]
): Record<GenerationType, number> {
  const distribution: Record<GenerationType, number> = {
    'Builders': 0,
    'Baby Boomer': 0,
    'Gen X': 0,
    'Millennial': 0,
    'Gen Z': 0,
    'Gen Alpha': 0
  };
  
  users.forEach(user => {
    const gen = getUserGeneration(user);
    if (gen) {
      distribution[gen]++;
    }
  });
  
  return distribution;
}

/**
 * Calculate generation diversity score (0-100)
 * Higher score = more diverse generational mix
 */
export function calculateGenerationDiversity(users: UserWithGeneration[]): number {
  const distribution = getGenerationDistribution(users);
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  
  if (total === 0) return 0;
  
  // Count non-empty generations
  const activeGenerations = Object.values(distribution).filter(v => v > 0).length;
  
  // Calculate evenness using Shannon diversity index normalized
  let entropy = 0;
  Object.values(distribution).forEach(count => {
    if (count > 0) {
      const p = count / total;
      entropy -= p * Math.log2(p);
    }
  });
  
  // Normalize: max entropy is log2(6) ≈ 2.585 (6 generations)
  const maxEntropy = Math.log2(6);
  const normalizedEntropy = entropy / maxEntropy;
  
  // Combine evenness with active generations count
  const generationBonus = (activeGenerations / 6) * 30; // Up to 30 points for having all generations
  const evennessScore = normalizedEntropy * 70; // Up to 70 points for even distribution
  
  return Math.round(generationBonus + evennessScore);
}

/**
 * Get average age of users
 */
export function getAverageAge(users: UserWithGeneration[]): number | null {
  const ages = users
    .map(getUserAge)
    .filter((age): age is number => age !== null);
  
  if (ages.length === 0) return null;
  
  return Math.round(ages.reduce((a, b) => a + b, 0) / ages.length);
}

/**
 * Get dominant generation in a group
 */
export function getDominantGeneration(users: UserWithGeneration[]): GenerationType | null {
  const distribution = getGenerationDistribution(users);
  
  let maxGen: GenerationType | null = null;
  let maxCount = 0;
  
  (Object.keys(distribution) as GenerationType[]).forEach(gen => {
    if (distribution[gen] > maxCount) {
      maxCount = distribution[gen];
      maxGen = gen;
    }
  });
  
  return maxGen;
}

/**
 * Generate insights about generational composition
 */
export function generateGenerationalInsights(users: UserWithGeneration[]): {
  avgAge: number | null;
  dominantGen: GenerationType | null;
  diversityScore: number;
  distribution: Record<GenerationType, number>;
  insights: string[];
} {
  const distribution = getGenerationDistribution(users);
  const avgAge = getAverageAge(users);
  const dominantGen = getDominantGeneration(users);
  const diversityScore = calculateGenerationDiversity(users);
  
  const insights: string[] = [];
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  
  if (total === 0) {
    insights.push('Dati anagrafici insufficienti per l\'analisi generazionale.');
    return { avgAge, dominantGen, diversityScore, distribution, insights };
  }
  
  // Generate contextual insights
  if (dominantGen) {
    const dominantPct = Math.round((distribution[dominantGen] / total) * 100);
    if (dominantPct > 60) {
      insights.push(
        `La generazione ${GENERATION_LABELS[dominantGen].short} domina con il ${dominantPct}% del team. ` +
        `Considera programmi di mentoring intergenerazionale per aumentare la diversità di pensiero.`
      );
    }
  }
  
  // Check for mentoring opportunities
  const seniorGens = distribution['Builders'] + distribution['Baby Boomer'] + distribution['Gen X'];
  const juniorGens = distribution['Millennial'] + distribution['Gen Z'] + distribution['Gen Alpha'];
  
  if (seniorGens > 0 && juniorGens > 0) {
    const ratio = seniorGens / juniorGens;
    if (ratio > 2) {
      insights.push(
        'Alto potenziale per programmi di Mentoring classico: molti senior possono guidare i junior.'
      );
    } else if (ratio < 0.5) {
      insights.push(
        'Alto potenziale per Reverse Mentoring: i profili junior con competenze tech possono formare i senior su temi digitali.'
      );
    } else {
      insights.push(
        'Buon bilanciamento generazionale: opportunità sia per mentoring classico che reverse mentoring.'
      );
    }
  }
  
  if (diversityScore > 70) {
    insights.push(
      'Eccellente diversità generazionale! Questo favorisce innovazione e trasferimento di conoscenze.'
    );
  } else if (diversityScore < 30) {
    insights.push(
      'Bassa diversità generazionale. Considera di ampliare il reclutamento verso altre fasce d\'età.'
    );
  }
  
  return { avgAge, dominantGen, diversityScore, distribution, insights };
}
