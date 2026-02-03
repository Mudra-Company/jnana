/**
 * Unified Org Chart Types
 * 
 * Types for the unified role-person org chart architecture.
 * Each position shows both the Role (primary entity) and the Person assigned to it.
 */

import type { CompanyRole, RoleAssignment } from './roles';
import type { User, SeniorityLevel } from '../../types';

/**
 * Pre-calculated metrics for quick display on the card
 */
export interface UnifiedPositionMetrics {
  roleFitScore: number;
  managerFitScore: number | null;
  cultureFitScore: number;
  isLeader: boolean;
}

/**
 * Detailed metrics for the full modal view
 */
export interface DetailedMetrics extends UnifiedPositionMetrics {
  softSkillsMatched: string[];
  softSkillsMissing: string[];
  hardSkillsMatched: string[];
  hardSkillsMissing: string[];
  seniorityMatch: 'match' | 'above' | 'below' | null;
  userSeniority?: SeniorityLevel;
  requiredSeniority?: SeniorityLevel;
  managerFitBreakdown: ManagerFitDetail[];
  matchedValues: string[];
}

export interface ManagerFitDetail {
  managerId: string;
  managerName: string;
  managerProfileCode?: string;
  score: number; // -1 means N/A
}

/**
 * Unified Position - combines Role + Person + Metrics
 * This is the primary entity shown in the org chart
 */
export interface UnifiedPosition {
  // Role data (primary entity)
  role: CompanyRole;
  
  // Assignee data (optional - may be vacant)
  assignee?: User | null;
  assignment?: RoleAssignment | null;
  
  // Quick metrics for card display
  metrics: UnifiedPositionMetrics;
  
  // Detailed metrics (loaded on demand for modal)
  detailedMetrics?: DetailedMetrics;
}

/**
 * User hard skill display structure
 */
export interface UserHardSkillDisplay {
  name: string;
  proficiencyLevel: number;
  category?: string;
}

/**
 * Role assignment history entry
 */
export interface AssignmentHistoryEntry {
  id: string;
  assignee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  assignmentType: string;
  startDate: string;
  endDate: string | null;
  ftePercentage: number;
  notes?: string;
}
