// =============================================
// KARMA PLATFORM TYPES
// =============================================

import type { RiasecScore, KarmaData, ChatMessage, SeniorityLevel } from '../../types';

// Hard Skills
export interface HardSkill {
  id: string;
  name: string;
  category?: string;
  createdAt?: string;
}

export interface UserHardSkill {
  id: string;
  userId: string;
  skillId?: string;
  customSkillName?: string;
  proficiencyLevel: 1 | 2 | 3 | 4 | 5;
  createdAt?: string;
  skill?: HardSkill; // joined data from catalog
}

// Portfolio
export type PortfolioItemType = 'cv' | 'certificate' | 'project' | 'image';

export interface PortfolioItem {
  id: string;
  userId: string;
  itemType: PortfolioItemType;
  title: string;
  description?: string;
  fileUrl?: string;
  externalUrl?: string;
  sortOrder: number;
  createdAt?: string; // Made optional for DB compatibility
}

// Work Experience
export interface UserExperience {
  id: string;
  userId: string;
  company: string;
  role: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
  location?: string;
  sortOrder: number;
  createdAt?: string;
}

// Education
export interface UserEducation {
  id: string;
  userId: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startYear?: number;
  endYear?: number;
  description?: string;
  sortOrder: number;
  createdAt?: string;
}

// Certification
export interface UserCertification {
  id: string;
  userId: string;
  name: string;
  issuingOrganization?: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  createdAt?: string;
}

// Language
export type LanguageProficiency = 'native' | 'fluent' | 'professional' | 'intermediate' | 'basic';

export interface UserLanguage {
  id: string;
  userId: string;
  language: string;
  proficiency: LanguageProficiency;
  createdAt?: string;
}

// Social Links
export type SocialPlatform = 'linkedin' | 'github' | 'portfolio' | 'twitter' | 'dribbble' | 'behance' | 'other';

export interface SocialLink {
  id: string;
  userId: string;
  platform: SocialPlatform;
  url: string;
  createdAt?: string;
}

// Subscription Plans
export type SubscriptionPlanName = 'basic' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'past_due';

export interface SubscriptionPlan {
  id: string;
  name: SubscriptionPlanName;
  displayName: string;
  description?: string;
  features: string[];
  monthlyPriceCents: number;
  annualPriceCents: number;
  maxProfileViewsMonthly: number;
  canInviteCandidates: boolean;
  canAccessMatching: boolean;
  canExportData: boolean;
  isActive: boolean;
  createdAt?: string; // Made optional for DB compatibility
}

export interface CompanySubscription {
  id: string;
  companyId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  profileViewsUsed: number;
  stripeSubscriptionId?: string;
  createdAt?: string; // Made optional for DB compatibility
  updatedAt?: string; // Made optional for DB compatibility
  plan?: SubscriptionPlan; // joined data
}

// Profile Views
export interface ProfileViewLog {
  id: string;
  viewerCompanyId: string;
  viewedProfileId: string;
  viewedAt: string;
}

// Work Preferences
export type WorkType = 'remote' | 'hybrid' | 'onsite' | 'any';
export type ProfileVisibility = 'private' | 'subscribers_only';

// Extended Karma Profile
export interface KarmaProfile {
  id: string;
  email: string;
  firstName?: string;
  wantsKarmaVisibility?: boolean; // Explicit opt-in to Karma talent pool
  lastName?: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  region?: string; // Italian region for geographical filtering
  headline?: string;
  jobTitle?: string;
  gender?: 'M' | 'F';
  age?: number;
  birthDate?: string; // Format YYYY-MM-DD (master field for generation calculation)
  isKarmaProfile: boolean;
  profileVisibility: ProfileVisibility;
  lookingForWork: boolean;
  preferredWorkType?: WorkType;
  yearsExperience?: number;
  isJnanaUser?: boolean; // User belongs to a company (invited via Jnana)
  companyName?: string; // Company name for Jnana users
  createdAt: string;
  updatedAt: string;
  
  // Related data (loaded separately)
  hardSkills?: UserHardSkill[];
  portfolio?: PortfolioItem[];
  socialLinks?: SocialLink[];
  experiences?: UserExperience[];
  education?: UserEducation[];
  certifications?: UserCertification[];
  languages?: UserLanguage[];
  
  // Test results
  riasecScore?: RiasecScore;
  profileCode?: string;
  karmaData?: KarmaData;
}

// CV Parsing Result (from AI)
export interface ParsedCVData {
  firstName?: string;
  lastName?: string;
  headline?: string;
  bio?: string;
  location?: string;
  yearsExperience?: number;
  skills: string[];
  experiences: {
    company: string;
    role: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }[];
  education: {
    institution: string;
    degree: string;
    field?: string;
    year?: number;
  }[];
  certifications: string[];
  languages: string[];
}

// Matching Score for Talent Search
export interface CandidateMatch {
  profile: KarmaProfile;
  matchScore: number; // 0-100
  riasecMatch: number; // 0-100
  skillsMatch: number; // 0-100
  skillsOverlap: string[]; // matching skills
  missingSkills: string[]; // required but missing
  softSkillsMatch?: number; // 0-100 (from Karma AI)
  seniorityMatch: boolean;
}

// Search Filters for Talent Search
export interface TalentSearchFilters {
  query?: string;
  skills?: string[];
  minExperience?: number;
  maxExperience?: number;
  locations?: string[];
  workTypes?: WorkType[];
  lookingForWorkOnly?: boolean;
  seniorityLevels?: SeniorityLevel[];
  riasecCodes?: string[];
}

// Karma ViewStates (to add to main ViewState)
export type KarmaViewState = 
  | { type: 'KARMA_ONBOARDING' }
  | { type: 'KARMA_ONBOARDING_STEP'; step: number }
  | { type: 'KARMA_DASHBOARD' }
  | { type: 'KARMA_PROFILE_EDIT' }
  | { type: 'KARMA_PROFILE_VIEW'; userId: string }
  | { type: 'KARMA_TEST_RIASEC' }
  | { type: 'KARMA_TEST_CHAT' }
  | { type: 'KARMA_RESULTS' }
  | { type: 'COMPANY_TALENT_SEARCH' }
  | { type: 'COMPANY_SUBSCRIPTION' }
  | { type: 'COMPANY_CANDIDATE_VIEW'; userId: string };
