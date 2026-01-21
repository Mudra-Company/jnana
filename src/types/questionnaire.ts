// =============================================
// QUESTIONNAIRE MANAGER - TYPE DEFINITIONS
// =============================================

// UI Styles for questionnaire rendering
export type QuestionnaireUIStyle = 'step' | 'chat' | 'swipe';

// Section types
export type SectionType = 'forced_choice' | 'checklist' | 'likert' | 'open_text';

// Question types
export type QuestionType = 'single_choice' | 'multiple_choice' | 'likert' | 'open_text' | 'binary';

// =============================================
// CONFIGURATION INTERFACES
// =============================================

export interface QuestionnaireConfig {
  primaryColor?: string;
  secondaryColor?: string;
  showProgress?: boolean;
  allowSkip?: boolean;
  randomizeSections?: boolean;
  randomizeQuestions?: boolean;
  timeLimitMinutes?: number;
  showSectionTitles?: boolean;
  completionMessage?: string;
}

export interface SectionConfig {
  maxSelection?: number;
  minSelection?: number;
  showDescription?: boolean;
  columns?: 1 | 2 | 3;
}

export interface QuestionConfig {
  helpText?: string;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  conditionalLogic?: ConditionalLogic[];
}

export interface ConditionalLogic {
  showIf: {
    questionId: string;
    operator: 'equals' | 'not_equals' | 'contains';
    value: string;
  };
}

// =============================================
// CORE DATA STRUCTURES
// =============================================

export interface ScoringDimension {
  id: string;
  questionnaireId: string;
  code: string;
  label: string;
  description?: string;
  color?: string;
  sortOrder: number;
}

export interface ScoringWeight {
  id: string;
  optionId: string;
  dimensionId: string;
  weight: number;
}

export interface QuestionOption {
  id: string;
  questionId: string;
  text: string;
  icon?: string;
  imageUrl?: string;
  sortOrder: number;
  metadata?: Record<string, unknown>;
  weights?: ScoringWeight[];
}

export interface Question {
  id: string;
  sectionId: string;
  text: string;
  type: QuestionType;
  isRequired: boolean;
  sortOrder: number;
  imageUrl?: string;
  icon?: string;
  config?: QuestionConfig;
  options?: QuestionOption[];
}

export interface QuestionnaireSection {
  id: string;
  questionnaireId: string;
  title: string;
  description?: string;
  type: SectionType;
  sortOrder: number;
  config?: SectionConfig;
  questions?: Question[];
}

export interface Questionnaire {
  id: string;
  slug: string;
  title: string;
  description?: string;
  uiStyle: QuestionnaireUIStyle;
  version: number;
  isPublished: boolean;
  isSystem: boolean;
  config?: QuestionnaireConfig;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  sections?: QuestionnaireSection[];
  dimensions?: ScoringDimension[];
}

// =============================================
// RESPONSE STRUCTURES
// =============================================

export interface ResponseAnswer {
  id: string;
  responseId: string;
  questionId: string;
  selectedOptionId?: string;
  textAnswer?: string;
  likertValue?: number;
  answeredAt: string;
}

export interface UserQuestionnaireResponse {
  id: string;
  userId: string;
  questionnaireId: string;
  companyId?: string;
  versionCompleted: number;
  computedScores: Record<string, number>;
  rawAnswers: ResponseAnswer[];
  startedAt: string;
  completedAt?: string;
}

// =============================================
// COMPUTED RESULTS
// =============================================

export interface QuestionnaireResult {
  questionnaireId: string;
  questionnaireTitle: string;
  scores: DimensionScore[];
  profileCode?: string;
  completedAt: string;
}

export interface DimensionScore {
  dimensionId: string;
  code: string;
  label: string;
  color?: string;
  rawScore: number;
  normalizedScore: number; // 0-100
  maxPossibleScore: number;
}

// =============================================
// EDITOR TYPES (Super Admin)
// =============================================

export interface QuestionnaireFormData {
  slug: string;
  title: string;
  description?: string;
  uiStyle: QuestionnaireUIStyle;
  config?: QuestionnaireConfig;
}

export interface SectionFormData {
  title: string;
  description?: string;
  type: SectionType;
  config?: SectionConfig;
}

export interface QuestionFormData {
  text: string;
  type: QuestionType;
  isRequired: boolean;
  imageUrl?: string;
  icon?: string;
  config?: QuestionConfig;
}

export interface OptionFormData {
  text: string;
  icon?: string;
  imageUrl?: string;
  weights?: { dimensionCode: string; weight: number }[];
}

export interface DimensionFormData {
  code: string;
  label: string;
  description?: string;
  color?: string;
}

// =============================================
// LIST/FILTER TYPES
// =============================================

export type QuestionnaireFilter = 'all' | 'published' | 'draft' | 'system';

export interface QuestionnaireListItem {
  id: string;
  slug: string;
  title: string;
  description?: string;
  uiStyle: QuestionnaireUIStyle;
  version: number;
  isPublished: boolean;
  isSystem: boolean;
  sectionCount: number;
  questionCount: number;
  responseCount: number;
  createdAt: string;
  updatedAt: string;
}
