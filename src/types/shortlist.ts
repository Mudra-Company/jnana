// =============================================
// SHORTLIST TYPES
// =============================================

import type { KarmaProfile, CandidateMatch } from './karma';
import type { RiasecScore } from '../../types';

// Re-export for convenience
export type { RiasecScore };

// User type for internal candidates (subset of what we need)
export interface ShortlistUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatarUrl?: string;
  jobTitle?: string;
  seniority?: string;
  yearsExperience?: number;
  location?: string;
  profileCode?: string;
  riasecScore?: RiasecScore;
  karmaData?: {
    softSkills?: string[];
    seniorityAssessment?: string;
  };
}

// Shortlist status
export type ShortlistStatus = 'active' | 'completed' | 'cancelled';

// Candidate status in shortlist
export type CandidateStatus = 'shortlisted' | 'interviewing' | 'offered' | 'rejected' | 'hired';

// Candidate type
export type CandidateType = 'internal' | 'external';

// Position Shortlist
export interface PositionShortlist {
  id: string;
  positionId: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  status: ShortlistStatus;
  notes?: string;
}

// Match details stored for historical reference
export interface StoredMatchDetails {
  riasecMatch?: number;
  skillsMatch?: number;
  skillsOverlap?: string[];
  missingSkills?: string[];
  softSkillsMatch?: number;
  seniorityMatch?: boolean;
  riasecScore?: RiasecScore;
  profileCode?: string;
}

// Shortlist Candidate
export interface ShortlistCandidate {
  id: string;
  shortlistId: string;
  candidateType: CandidateType;
  internalUserId?: string;
  externalProfileId?: string;
  matchScore?: number;
  matchDetails: StoredMatchDetails;
  status: CandidateStatus;
  hrNotes?: string;
  rating?: number;
  addedAt: string;
  updatedAt: string;
  // Joined data (loaded separately)
  internalUser?: User;
  externalProfile?: KarmaProfile;
  externalMatch?: CandidateMatch;
}

// Unified candidate for comparison (internal or external)
export interface UnifiedCandidate {
  id: string; // shortlist_candidate.id
  type: CandidateType;
  name: string;
  email?: string;
  avatarUrl?: string;
  jobTitle?: string;
  matchScore: number;
  riasecScore?: RiasecScore;
  profileCode?: string;
  skills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  softSkills?: string[];
  seniority?: string;
  seniorityMatch?: boolean;
  yearsExperience?: number;
  location?: string;
  status: CandidateStatus;
  hrNotes?: string;
  rating?: number;
  // Original references
  internalUserId?: string;
  externalProfileId?: string;
  internalUser?: ShortlistUser;
}

// Comparison data for side-by-side view
export interface CandidateComparisonData {
  position: {
    id: string;
    title: string;
    requiredSkills: string[];
    requiredSeniority?: string;
    targetRiasec?: RiasecScore;
  };
  candidates: UnifiedCandidate[];
}
