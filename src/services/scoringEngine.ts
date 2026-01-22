// =============================================
// SCORING ENGINE SERVICE
// Calculates questionnaire scores based on user answers
// =============================================

import type {
  Questionnaire,
  QuestionnaireSection,
  Question,
  QuestionOption,
  ScoringDimension,
  DimensionScore,
} from '@/src/types/questionnaire';

// =============================================
// TYPES
// =============================================

export interface SwipeAnswer {
  questionId: string;
  selectedOptionId?: string;
  textAnswer?: string;
  likertValue?: number;
  swipeDirection?: 'left' | 'right';
}

export interface ScoringInput {
  questionnaire: Questionnaire;
  answers: SwipeAnswer[];
}

export interface ScoringOutput {
  dimensionScores: DimensionScore[];
  profileCode: string;
  rawAnswers: { 
    questionId: string; 
    questionText: string;
    answer: string; 
    type: 'option' | 'likert' | 'text' | 'skipped';
  }[];
}

interface DimensionAccumulator {
  raw: number;
  max: number;
}

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Find a question by ID across all sections
 */
function findQuestion(sections: QuestionnaireSection[], questionId: string): Question | undefined {
  for (const section of sections) {
    const question = section.questions?.find(q => q.id === questionId);
    if (question) return question;
  }
  return undefined;
}

/**
 * Find an option by ID across all questions in all sections
 */
function findOption(sections: QuestionnaireSection[], optionId: string): QuestionOption | undefined {
  for (const section of sections) {
    for (const question of section.questions || []) {
      const option = question.options?.find(o => o.id === optionId);
      if (option) return option;
    }
  }
  return undefined;
}

/**
 * Get the maximum possible weight for a dimension from a question's options
 */
function getMaxWeightForQuestion(question: Question, dimensionId: string): number {
  if (!question.options || question.options.length === 0) return 0;
  
  // Find the maximum weight among all options for this dimension
  let maxWeight = 0;
  for (const option of question.options) {
    const weight = option.weights?.find(w => w.dimensionId === dimensionId)?.weight || 0;
    maxWeight = Math.max(maxWeight, Math.abs(weight));
  }
  return maxWeight;
}

/**
 * Normalize a score to 0-100 range
 */
function normalizeScore(raw: number, max: number): number {
  if (max === 0) return 0;
  // Clamp between 0 and max, then normalize
  const clamped = Math.max(0, Math.min(raw, max));
  return Math.round((clamped / max) * 100);
}

/**
 * Generate profile code from top N dimensions
 */
function generateProfileCode(scores: DimensionScore[], topN: number = 3): string {
  const sorted = [...scores]
    .filter(s => s.normalizedScore > 0)
    .sort((a, b) => b.normalizedScore - a.normalizedScore);
  
  return sorted
    .slice(0, topN)
    .map(s => s.code)
    .join('-');
}

// =============================================
// MAIN SCORING FUNCTION
// =============================================

/**
 * Calculate scores for all dimensions based on user answers
 */
export function calculateScores(input: ScoringInput): ScoringOutput {
  const { questionnaire, answers } = input;
  const sections = questionnaire.sections || [];
  const dimensions = questionnaire.dimensions || [];
  
  // Initialize accumulators for each dimension
  const accumulator: Record<string, DimensionAccumulator> = {};
  for (const dim of dimensions) {
    accumulator[dim.id] = { raw: 0, max: 0 };
  }
  
  // Process raw answers for display
  const rawAnswers: ScoringOutput['rawAnswers'] = [];
  
  // Process each answer
  for (const answer of answers) {
    const question = findQuestion(sections, answer.questionId);
    if (!question) continue;
    
    // Build raw answer entry
    let answerEntry: ScoringOutput['rawAnswers'][0];
    
    if (answer.likertValue !== undefined) {
      // Likert scale answer (1-5)
      answerEntry = {
        questionId: answer.questionId,
        questionText: question.text,
        answer: `${answer.likertValue}/5`,
        type: 'likert',
      };
      
      // For Likert questions, we apply the weight based on the value
      // Assuming all options share the same weights (or use first option's weights)
      if (question.options && question.options.length > 0) {
        const referenceOption = question.options[0];
        for (const dim of dimensions) {
          const weight = referenceOption.weights?.find(w => w.dimensionId === dim.id)?.weight || 0;
          if (weight !== 0) {
            // Scale: likertValue (1-5) * weight
            // Max possible: 5 * |weight|
            accumulator[dim.id].raw += answer.likertValue * weight;
            accumulator[dim.id].max += 5 * Math.abs(weight);
          }
        }
      }
      
    } else if (answer.selectedOptionId) {
      // Option-based answer
      const option = findOption(sections, answer.selectedOptionId);
      
      answerEntry = {
        questionId: answer.questionId,
        questionText: question.text,
        answer: option?.text || 'Unknown option',
        type: 'option',
      };
      
      if (option) {
        // Add weights from selected option
        for (const dim of dimensions) {
          const weight = option.weights?.find(w => w.dimensionId === dim.id)?.weight || 0;
          const maxWeight = getMaxWeightForQuestion(question, dim.id);
          
          if (weight !== 0) {
            accumulator[dim.id].raw += weight;
          }
          if (maxWeight > 0) {
            accumulator[dim.id].max += maxWeight;
          }
        }
      }
      
    } else if (answer.textAnswer) {
      // Text answer - doesn't contribute to scoring
      answerEntry = {
        questionId: answer.questionId,
        questionText: question.text,
        answer: answer.textAnswer.substring(0, 50) + (answer.textAnswer.length > 50 ? '...' : ''),
        type: 'text',
      };
      
    } else {
      // Skipped question
      answerEntry = {
        questionId: answer.questionId,
        questionText: question.text,
        answer: 'Saltata',
        type: 'skipped',
      };
    }
    
    rawAnswers.push(answerEntry);
  }
  
  // Calculate normalized scores for each dimension
  const dimensionScores: DimensionScore[] = dimensions.map(dim => ({
    dimensionId: dim.id,
    code: dim.code,
    label: dim.label,
    color: dim.color,
    rawScore: accumulator[dim.id].raw,
    maxPossibleScore: accumulator[dim.id].max,
    normalizedScore: normalizeScore(accumulator[dim.id].raw, accumulator[dim.id].max),
  }));
  
  // Generate profile code from top dimensions
  const profileCode = generateProfileCode(dimensionScores);
  
  return {
    dimensionScores,
    profileCode,
    rawAnswers,
  };
}

// =============================================
// UTILITY EXPORTS
// =============================================

export { normalizeScore, generateProfileCode, findQuestion, findOption };
