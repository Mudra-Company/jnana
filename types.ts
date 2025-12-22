export type RiasecDimension = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

// Common Item Interface
export interface TestItem {
  id: string;
  text: string;
  impactDimensions: RiasecDimension[]; 
}

// Section Types
export type TestSectionType = 'forced_choice' | 'checklist';

export interface BaseSection {
  id: string;
  title: string;
  description: string;
  type: TestSectionType;
}

export interface ForcedChoiceOption {
  id: string;
  text: string;
  impactDimensions: RiasecDimension[];
}

export interface ForcedChoiceQuestion {
  id: string;
  text: string;
  options: [ForcedChoiceOption, ForcedChoiceOption]; // Strictly pairs
}

export interface ForcedChoiceSection extends BaseSection {
  type: 'forced_choice';
  questions: ForcedChoiceQuestion[];
}

export interface ChecklistSection extends BaseSection {
  type: 'checklist';
  items: TestItem[];
  maxSelection?: number;
}

export type TestSection = ForcedChoiceSection | ChecklistSection;

export type RiasecScore = Record<RiasecDimension, number>;

export type TestStatus = 'pending' | 'invited' | 'test_completed' | 'completed';

// --- KARMA CHAT TYPES ---
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface KarmaData {
  transcript: ChatMessage[];
  summary?: string; // AI generated summary of the interview
  softSkills?: string[]; // Extracted soft skills
  primaryValues?: string[]; // Values extracted from chat (Personal Values)
  riskFactors?: string[]; // Cultural Entropy factors (e.g. "Micromanagement", "Burnout Risk")
  seniorityAssessment?: SeniorityLevel; // AI assessment of seniority
}

// --- CLIMATE SURVEY TYPES ---
export interface ClimateQuestion {
  id: string;
  text: string;
}

export interface ClimateSection {
  id: string;
  title: string;
  questions: ClimateQuestion[];
}

export interface ClimateData {
  rawScores: Record<string, number>; // questionId -> score (1-5)
  sectionAverages: Record<string, number>; // sectionTitle -> average score
  overallAverage: number;
  submissionDate: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  gender?: 'M' | 'F';
  age?: number;
  companyId: string;
  status: TestStatus;
  results?: RiasecScore;
  profileCode?: string; // RIASEC Code (e.g. R-I-A)
  karmaData?: KarmaData; 
  climateData?: ClimateData; 
  submissionDate?: string;
  jobTitle?: string;
  departmentId?: string; // Links to OrgNode.id
}

export interface Company {
  id: string;
  name: string;
  adminName: string;
  email: string;
}

// --- ORG CHART STRUCTURES ---

export type SeniorityLevel = 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'C-Level';

export interface TargetProfile {
  hardSkills: string[];
  softSkills: string[];
  seniority: SeniorityLevel;
  description?: string;
}

export interface OrgNode {
  id: string;
  name: string; 
  type: 'root' | 'department' | 'team';
  children: OrgNode[];
  targetProfile?: TargetProfile; 
  isCulturalDriver?: boolean; 
}

export interface CompanyProfile {
  id: string; 
  name: string;
  email?: string; 
  industry: string; 
  sizeRange: string; 
  vatNumber?: string;
  logoUrl?: string;
  foundationYear?: number;
  website?: string;
  address?: string;
  description?: string;
  cultureValues?: string[]; 
  structure: OrgNode; 
}

// --- CULTURE ANALYSIS ---
export interface CultureAnalysis {
  matchScore: number; // 0-100%
  alignedValues: string[]; 
  gapValues: string[]; 
  effectiveValues: string[]; 
  hiddenRisks: string[]; 
  driverCount: number; 
}

// --- JOB DB STRUCTURES ---

export interface JobSuggestion {
  title: string;
  sector: string;
  idealScore?: RiasecScore; 
}

// Key is the Triplet Code (e.g. "RIA")
export type JobDatabase = Record<string, JobSuggestion[]>;

export type ViewState = 
  | { type: 'LOADING' }
  | { type: 'LOGIN' }
  | { type: 'SEED_DATA' }
  | { type: 'SUPER_ADMIN_DASHBOARD' }
  | { type: 'SUPER_ADMIN_JOBS' }
  | { type: 'ADMIN_DASHBOARD' }
  | { type: 'ADMIN_ORG_CHART' }
  | { type: 'ADMIN_IDENTITY_HUB' } 
  | { type: 'ADMIN_COMPANY_PROFILE' }
  | { type: 'ADMIN_USER_DETAIL'; userId: string }
  | { type: 'USER_WELCOME'; userId: string }
  | { type: 'USER_TEST'; userId: string }
  | { type: 'USER_CHAT'; userId: string } 
  | { type: 'USER_CLIMATE_TEST'; userId: string } 
  | { type: 'USER_RESULT'; userId: string };