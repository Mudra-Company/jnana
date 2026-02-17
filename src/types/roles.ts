/**
 * Role-Centric Architecture Types
 * 
 * This module defines the types for the role-centric organizational model.
 * Key paradigm: Roles are the primary entities, people are assigned to roles.
 */

import type { SeniorityLevel, User } from '../../types';

// ============= ENUMs =============

export type RoleStatus = 'active' | 'vacant' | 'frozen' | 'planned';

export type ContractType = 
  | 'permanent'      // Indeterminato
  | 'fixed_term'     // Determinato
  | 'apprenticeship' // Apprendistato
  | 'internship'     // Stage/Tirocinio
  | 'freelance'      // Partita IVA
  | 'consulting';    // Consulenza

export type WorkHoursType = 
  | 'full_time'  // Tempo pieno
  | 'part_time'  // Part-time
  | 'flexible';  // Flessibile

export type RemotePolicy = 
  | 'on_site'   // In sede
  | 'hybrid'    // Ibrido
  | 'remote'    // Full remote
  | 'flexible'; // A scelta

export type AssignmentType = 
  | 'primary'   // Ruolo principale
  | 'interim'   // Ad interim (temporaneo)
  | 'backup'    // Backup/Sostituto
  | 'training'; // In formazione

// ============= Collaboration Profile =============

export interface CollaborationMemberBreakdown {
  memberId: string;
  memberLabel: string;
  percentage: number;
  affinity?: number; // 1-5 personal affinity per member
}

export interface CollaborationLink {
  targetType: 'team' | 'member';
  targetId: string;
  targetLabel: string;
  collaborationPercentage: number; // 0-100
  personalAffinity: number; // 1-5
  memberBreakdown?: CollaborationMemberBreakdown[];
}

export interface CollaborationProfile {
  links: CollaborationLink[];
  environmentalImpact: number; // 1-5 Likert (noise/disturbance)
  operationalFluidity: number; // 1-5 Likert (calls/exits/interruptions)
}

// ============= Sub-types for JSONB fields =============

export interface RequiredSkill {
  name: string;
  level?: number; // 1-5 proficiency
  mandatory?: boolean;
}

export interface EducationRequirement {
  degree: string;
  field?: string;
  mandatory?: boolean;
}

export interface LanguageRequirement {
  language: string;
  level: 'basic' | 'intermediate' | 'advanced' | 'native';
}

export interface KPI {
  name: string;
  description?: string;
  target?: string;
  measurementUnit?: string;
}

// ============= Main Entities =============

/**
 * CompanyRole - The primary organizational entity
 * 
 * Represents a position within the company with all its characteristics:
 * - Job description (mansionario)
 * - Requirements (skills, education, experience)
 * - Contractual framework (CCNL level, salary range, contract type)
 * - Hierarchical position
 */
export interface CompanyRole {
  id: string;
  companyId: string;
  orgNodeId?: string | null;
  
  // Basic Info
  title: string;
  code?: string | null;
  description?: string | null;
  
  // Mansionario (Job Description)
  responsibilities?: string[];
  dailyTasks?: string[];
  kpis?: KPI[];
  
  // Required Skills
  requiredHardSkills?: RequiredSkill[];
  requiredSoftSkills?: RequiredSkill[];
  requiredSeniority?: SeniorityLevel | null;
  requiredEducation?: EducationRequirement[];
  requiredCertifications?: string[];
  requiredLanguages?: LanguageRequirement[];
  yearsExperienceMin?: number | null;
  yearsExperienceMax?: number | null;
  
  // Contractual Framework (Inquadramento)
  ccnlLevel?: string | null;
  ralRangeMin?: number | null;
  ralRangeMax?: number | null;
  contractType?: ContractType | null;
  workHoursType?: WorkHoursType;
  remotePolicy?: RemotePolicy;
  
  // Hierarchy
  reportsToRoleId?: string | null;
  
  // Status
  status: RoleStatus;
  headcount: number;
  isHiring: boolean;
  
  // Collaboration Profile
  collaborationProfile?: CollaborationProfile;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Populated relations (from joins)
  assignments?: RoleAssignment[];
  currentAssignee?: User | null;
  reportsToRole?: CompanyRole | null;
  orgNode?: { id: string; name: string; type: string } | null;
}

/**
 * RoleAssignment - Maps a person to a role
 * 
 * Supports:
 * - Multiple assignment types (primary, interim, backup)
 * - Partial FTE allocation (e.g., 50% on two roles)
 * - Historical tracking (start/end dates)
 */
export interface RoleAssignment {
  id: string;
  roleId: string;
  userId?: string | null;
  companyMemberId?: string | null;
  
  // Assignment Details
  assignmentType: AssignmentType;
  startDate: string;
  endDate?: string | null;
  ftePercentage: number;
  notes?: string | null;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Populated relations
  user?: User | null;
  role?: CompanyRole | null;
}

// ============= Input Types for CRUD =============

export interface CreateRoleInput {
  companyId: string;
  orgNodeId?: string;
  title: string;
  code?: string;
  description?: string;
  responsibilities?: string[];
  dailyTasks?: string[];
  kpis?: KPI[];
  requiredHardSkills?: RequiredSkill[];
  requiredSoftSkills?: RequiredSkill[];
  requiredSeniority?: SeniorityLevel;
  requiredEducation?: EducationRequirement[];
  requiredCertifications?: string[];
  requiredLanguages?: LanguageRequirement[];
  yearsExperienceMin?: number;
  yearsExperienceMax?: number;
  ccnlLevel?: string;
  ralRangeMin?: number;
  ralRangeMax?: number;
  contractType?: ContractType;
  workHoursType?: WorkHoursType;
  remotePolicy?: RemotePolicy;
  reportsToRoleId?: string;
  status?: RoleStatus;
  headcount?: number;
  isHiring?: boolean;
  collaborationProfile?: CollaborationProfile;
}

export interface UpdateRoleInput {
  title?: string;
  code?: string;
  description?: string;
  orgNodeId?: string | null;
  responsibilities?: string[];
  dailyTasks?: string[];
  kpis?: KPI[];
  requiredHardSkills?: RequiredSkill[];
  requiredSoftSkills?: RequiredSkill[];
  requiredSeniority?: SeniorityLevel | null;
  requiredEducation?: EducationRequirement[];
  requiredCertifications?: string[];
  requiredLanguages?: LanguageRequirement[];
  yearsExperienceMin?: number | null;
  yearsExperienceMax?: number | null;
  ccnlLevel?: string | null;
  ralRangeMin?: number | null;
  ralRangeMax?: number | null;
  contractType?: ContractType | null;
  workHoursType?: WorkHoursType;
  remotePolicy?: RemotePolicy;
  reportsToRoleId?: string | null;
  status?: RoleStatus;
  headcount?: number;
  isHiring?: boolean;
  collaborationProfile?: CollaborationProfile;
}

export interface CreateAssignmentInput {
  roleId: string;
  userId?: string;
  companyMemberId?: string;
  assignmentType?: AssignmentType;
  startDate?: string;
  endDate?: string;
  ftePercentage?: number;
  notes?: string;
}

export interface UpdateAssignmentInput {
  assignmentType?: AssignmentType;
  startDate?: string;
  endDate?: string;
  ftePercentage?: number;
  notes?: string;
}

// ============= Display Labels =============

export const ROLE_STATUS_LABELS: Record<RoleStatus, string> = {
  active: 'Attivo',
  vacant: 'Vacante',
  frozen: 'Congelato',
  planned: 'Pianificato'
};

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  permanent: 'Indeterminato',
  fixed_term: 'Determinato',
  apprenticeship: 'Apprendistato',
  internship: 'Stage/Tirocinio',
  freelance: 'Partita IVA',
  consulting: 'Consulenza'
};

export const WORK_HOURS_LABELS: Record<WorkHoursType, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  flexible: 'Flessibile'
};

export const REMOTE_POLICY_LABELS: Record<RemotePolicy, string> = {
  on_site: 'In sede',
  hybrid: 'Ibrido',
  remote: 'Full remote',
  flexible: 'A scelta'
};

export const ASSIGNMENT_TYPE_LABELS: Record<AssignmentType, string> = {
  primary: 'Primario',
  interim: 'Ad interim',
  backup: 'Backup',
  training: 'In formazione'
};
