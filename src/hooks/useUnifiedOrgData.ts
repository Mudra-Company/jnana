/**
 * useUnifiedOrgData Hook
 * 
 * Combines roles, assignments, and user profiles into unified positions
 * for the org chart. Calculates metrics for quick display and detailed modal views.
 */

import { useState, useCallback, useMemo } from 'react';
import { supabase } from '../integrations/supabase/client';
import type { CompanyRole, RoleAssignment } from '../types/roles';
import type { UnifiedPosition, UnifiedPositionMetrics, DetailedMetrics, ManagerFitDetail, AssignmentHistoryEntry, UserHardSkillDisplay } from '../types/unified-org';
import type { User, SeniorityLevel } from '../../types';
import { calculateUserCompatibility } from '../../services/riasecService';

const SENIORITY_LEVELS: Record<SeniorityLevel, number> = { 
  'Junior': 1, 'Mid': 2, 'Senior': 3, 'Lead': 4, 'C-Level': 5 
};

interface UseUnifiedOrgDataResult {
  positions: UnifiedPosition[];
  isLoading: boolean;
  error: string | null;
  buildUnifiedPositions: (
    roles: CompanyRole[], 
    users: User[], 
    companyValues?: string[],
    parentManagers?: User[]
  ) => UnifiedPosition[];
  buildLegacyPositions: (
    users: User[], 
    companyValues?: string[],
    parentManagers?: User[]
  ) => UnifiedPosition[];
  buildMergedPositions: (
    roles: CompanyRole[], 
    users: User[], 
    nodeId: string,
    companyValues?: string[],
    parentManagers?: User[]
  ) => UnifiedPosition[];
  calculateDetailedMetrics: (
    role: CompanyRole, 
    assignee: User | null, 
    companyValues?: string[],
    parentManagers?: User[]
  ) => DetailedMetrics;
  fetchAssignmentHistory: (roleId: string) => Promise<AssignmentHistoryEntry[]>;
  fetchUserHardSkills: (userId: string) => Promise<UserHardSkillDisplay[]>;
}

export const useUnifiedOrgData = (): UseUnifiedOrgDataResult => {
  const [positions, setPositions] = useState<UnifiedPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Calculate quick metrics for card display
   */
  const calculateQuickMetrics = useCallback((
    role: CompanyRole,
    assignee: User | null,
    companyValues?: string[],
    parentManagers?: User[]
  ): UnifiedPositionMetrics => {
    if (!assignee) {
      return {
        roleFitScore: 0,
        managerFitScore: null,
        cultureFitScore: 0,
        isLeader: false
      };
    }

    // Role Fit Score (based on soft skills match)
    let roleFitScore = 0;
    const requiredSoftSkills = role.requiredSoftSkills?.map(s => s.name) || [];
    const userSoftSkills = assignee.karmaData?.softSkills || [];
    
    if (requiredSoftSkills.length > 0) {
      const matches = requiredSoftSkills.filter(reqSkill => 
        userSoftSkills.some(us => 
          us.toLowerCase().includes(reqSkill.toLowerCase()) || 
          reqSkill.toLowerCase().includes(us.toLowerCase())
        )
      ).length;
      
      // Also factor in seniority
      let seniorityScore = 100;
      const reqSeniority = role.requiredSeniority;
      const userSeniority = assignee.karmaData?.seniorityAssessment;
      
      if (reqSeniority && userSeniority) {
        const reqLevel = SENIORITY_LEVELS[reqSeniority] || 0;
        const userLevel = SENIORITY_LEVELS[userSeniority] || 0;
        const diff = userLevel - reqLevel;
        if (diff > 0) seniorityScore = Math.max(0, 100 - (diff * 30));
        else if (diff < 0) seniorityScore = Math.max(0, 100 + (diff * 15));
      }
      
      const skillScore = (matches / requiredSoftSkills.length) * 100;
      roleFitScore = Math.round((skillScore * 0.5) + (seniorityScore * 0.5));
    } else {
      roleFitScore = 100; // No requirements = perfect fit
    }

    // Manager Fit (average compatibility with parent managers)
    let managerFitScore: number | null = null;
    if (parentManagers && parentManagers.length > 0 && assignee.profileCode) {
      const scores = parentManagers
        .filter(m => m.profileCode)
        .map(m => calculateUserCompatibility(assignee, m));
      
      if (scores.length > 0) {
        managerFitScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      }
    }

    // Culture Fit (values alignment)
    let cultureFitScore = 0;
    if (companyValues && companyValues.length > 0 && assignee.karmaData?.primaryValues) {
      const matches = assignee.karmaData.primaryValues.filter(pv => 
        companyValues.some(cv => 
          cv.toLowerCase().includes(pv.toLowerCase()) || 
          pv.toLowerCase().includes(cv.toLowerCase())
        )
      ).length;
      cultureFitScore = Math.round((matches / Math.max(assignee.karmaData.primaryValues.length, 1)) * 100);
      if (cultureFitScore > 100) cultureFitScore = 100;
    }

    // Check if user is a leader (manager-like title)
    const isLeader = !!(assignee.jobTitle && (
      assignee.jobTitle.toLowerCase().includes('head') ||
      assignee.jobTitle.toLowerCase().includes('manager') ||
      assignee.jobTitle.toLowerCase().includes('lead') ||
      assignee.jobTitle.toLowerCase().includes('director') ||
      assignee.jobTitle.toLowerCase().includes('ceo') ||
      assignee.jobTitle.toLowerCase().includes('cto') ||
      assignee.jobTitle.toLowerCase().includes('coo')
    ));

    return {
      roleFitScore,
      managerFitScore,
      cultureFitScore,
      isLeader
    };
  }, []);

  /**
   * Calculate detailed metrics for modal display
   */
  const calculateDetailedMetrics = useCallback((
    role: CompanyRole,
    assignee: User | null,
    companyValues?: string[],
    parentManagers?: User[]
  ): DetailedMetrics => {
    const quickMetrics = calculateQuickMetrics(role, assignee, companyValues, parentManagers);
    
    if (!assignee) {
      return {
        ...quickMetrics,
        softSkillsMatched: [],
        softSkillsMissing: [],
        hardSkillsMatched: [],
        hardSkillsMissing: [],
        seniorityMatch: null,
        managerFitBreakdown: [],
        matchedValues: []
      };
    }

    // Soft Skills breakdown
    const requiredSoftSkills = role.requiredSoftSkills?.map(s => s.name) || [];
    const userSoftSkills = assignee.karmaData?.softSkills || [];
    const softSkillsMatched: string[] = [];
    const softSkillsMissing: string[] = [];

    requiredSoftSkills.forEach(reqSkill => {
      const found = userSoftSkills.some(us =>
        us.toLowerCase().includes(reqSkill.toLowerCase()) ||
        reqSkill.toLowerCase().includes(us.toLowerCase())
      );
      if (found) softSkillsMatched.push(reqSkill);
      else softSkillsMissing.push(reqSkill);
    });

    // Hard Skills (required from role)
    const requiredHardSkills = role.requiredHardSkills?.map(s => s.name) || [];
    const userHardSkillNames = assignee.hardSkills?.map(s => s.name) || [];
    const hardSkillsMatched: string[] = [];
    const hardSkillsMissing: string[] = [];

    requiredHardSkills.forEach(reqSkill => {
      const found = userHardSkillNames.some(us =>
        us.toLowerCase().includes(reqSkill.toLowerCase()) ||
        reqSkill.toLowerCase().includes(us.toLowerCase())
      );
      if (found) hardSkillsMatched.push(reqSkill);
      else hardSkillsMissing.push(reqSkill);
    });

    // Seniority comparison
    let seniorityMatch: 'match' | 'above' | 'below' | null = null;
    const reqSeniority = role.requiredSeniority;
    const userSeniority = assignee.karmaData?.seniorityAssessment;

    if (reqSeniority && userSeniority) {
      const reqLevel = SENIORITY_LEVELS[reqSeniority] || 0;
      const userLevel = SENIORITY_LEVELS[userSeniority] || 0;
      if (userLevel === reqLevel) seniorityMatch = 'match';
      else if (userLevel > reqLevel) seniorityMatch = 'above';
      else seniorityMatch = 'below';
    }

    // Manager fit breakdown
    const managerFitBreakdown: ManagerFitDetail[] = [];
    if (parentManagers && parentManagers.length > 0) {
      parentManagers
        .filter(m => m.firstName || m.lastName)
        .forEach(manager => {
          const score = (assignee.profileCode && manager.profileCode)
            ? calculateUserCompatibility(assignee, manager)
            : -1;
          
          managerFitBreakdown.push({
            managerId: manager.id,
            managerName: `${manager.firstName || ''} ${manager.lastName || ''}`.trim(),
            managerProfileCode: manager.profileCode,
            score
          });
        });
    }

    // Culture fit - matched values
    const matchedValues: string[] = [];
    if (companyValues && assignee.karmaData?.primaryValues) {
      assignee.karmaData.primaryValues.forEach(pv => {
        if (companyValues.some(cv =>
          cv.toLowerCase().includes(pv.toLowerCase()) ||
          pv.toLowerCase().includes(cv.toLowerCase())
        )) {
          matchedValues.push(pv);
        }
      });
    }

    return {
      ...quickMetrics,
      softSkillsMatched,
      softSkillsMissing,
      hardSkillsMatched,
      hardSkillsMissing,
      seniorityMatch,
      userSeniority: userSeniority as SeniorityLevel | undefined,
      requiredSeniority: reqSeniority || undefined,
      managerFitBreakdown,
      matchedValues
    };
  }, [calculateQuickMetrics]);

  /**
   * Build unified positions from roles and users
   */
  const buildUnifiedPositions = useCallback((
    roles: CompanyRole[],
    users: User[],
    companyValues?: string[],
    parentManagers?: User[]
  ): UnifiedPosition[] => {
    return roles.map(role => {
      // Find the assignee from the role's assignments or current assignee
      let assignee: User | null = null;
      let assignment: RoleAssignment | null = null;

      if (role.currentAssignee) {
        // If role has currentAssignee loaded from join
        assignee = users.find(u => u.id === role.currentAssignee?.id) || null;
      }

      if (role.assignments && role.assignments.length > 0) {
        // Find primary assignment
        const primaryAssignment = role.assignments.find(a => a.assignmentType === 'primary');
        if (primaryAssignment) {
          assignment = primaryAssignment;
          if (primaryAssignment.userId) {
            assignee = users.find(u => u.id === primaryAssignment.userId) || null;
          }
        }
      }

      const metrics = calculateQuickMetrics(role, assignee, companyValues, parentManagers);

      return {
        role,
        assignee,
        assignment,
        metrics
      };
    });
  }, [calculateQuickMetrics]);

  /**
   * Build legacy positions from users without explicit roles
   * Creates "implicit roles" based on job_title
   */
  const buildLegacyPositions = useCallback((
    users: User[],
    companyValues?: string[],
    parentManagers?: User[]
  ): UnifiedPosition[] => {
    return users.map(user => {
      // Create an implicit role from the user's job_title
      const implicitRole: CompanyRole = {
        id: `implicit-${user.id}`,
        companyId: user.companyId || '',
        orgNodeId: user.departmentId,
        title: user.jobTitle || 'Posizione',
        code: undefined,
        description: undefined,
        responsibilities: undefined,
        dailyTasks: undefined,
        kpis: undefined,
        requiredHardSkills: user.requiredProfile?.hardSkills?.map(s => ({ name: s })),
        requiredSoftSkills: user.requiredProfile?.softSkills?.map(s => ({ name: s })),
        requiredSeniority: user.requiredProfile?.seniority as SeniorityLevel || null,
        requiredEducation: undefined,
        requiredCertifications: undefined,
        requiredLanguages: undefined,
        yearsExperienceMin: null,
        yearsExperienceMax: null,
        ccnlLevel: null,
        ralRangeMin: null,
        ralRangeMax: null,
        contractType: null,
        workHoursType: undefined,
        remotePolicy: undefined,
        reportsToRoleId: null,
        status: user.isHiring ? 'vacant' : 'active',
        headcount: 1,
        isHiring: user.isHiring || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        currentAssignee: user.isHiring ? null : user
      };

      // Calculate metrics
      const assignee = user.isHiring ? null : user;
      const metrics = calculateQuickMetrics(implicitRole, assignee, companyValues, parentManagers);

      return {
        role: implicitRole,
        assignee,
        assignment: null,
        metrics
      };
    });
  }, [calculateQuickMetrics]);

  /**
   * Build merged positions: combines explicit roles with legacy users
   */
  const buildMergedPositions = useCallback((
    roles: CompanyRole[],
    users: User[],
    nodeId: string,
    companyValues?: string[],
    parentManagers?: User[]
  ): UnifiedPosition[] => {
    const nodeRoles = roles.filter(r => r.orgNodeId === nodeId);
    const nodeUsers = users.filter(u => u.departmentId === nodeId);
    
    if (nodeRoles.length > 0) {
      const rolePositions = buildUnifiedPositions(nodeRoles, users, companyValues, parentManagers);
      
      const assignedUserIds = new Set(
        nodeRoles
          .filter(r => r.currentAssignee?.id)
          .map(r => r.currentAssignee!.id)
      );
      
      const unassignedUsers = nodeUsers.filter(u => 
        !assignedUserIds.has(u.id) && 
        !u.isHiring && 
        (u.firstName || u.lastName)
      );
      
      const legacyPositions = buildLegacyPositions(unassignedUsers, companyValues, parentManagers);
      
      return [...rolePositions, ...legacyPositions];
    }
    
    return buildLegacyPositions(nodeUsers, companyValues, parentManagers);
  }, [buildUnifiedPositions, buildLegacyPositions]);

  /**
   * Fetch assignment history for a role
   */
  const fetchAssignmentHistory = useCallback(async (roleId: string): Promise<AssignmentHistoryEntry[]> => {
    setIsLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('company_role_assignments')
        .select(`
          *,
          profiles:user_id (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('role_id', roleId)
        .order('start_date', { ascending: false });

      if (fetchError) throw fetchError;

      return (data || []).map(row => ({
        id: row.id,
        assignee: row.profiles ? {
          id: (row.profiles as { id: string }).id,
          firstName: (row.profiles as { first_name: string }).first_name,
          lastName: (row.profiles as { last_name: string }).last_name,
          email: (row.profiles as { email: string }).email
        } : null,
        assignmentType: row.assignment_type,
        startDate: row.start_date,
        endDate: row.end_date,
        ftePercentage: row.fte_percentage,
        notes: row.notes ?? undefined
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch history';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch user hard skills
   */
  const fetchUserHardSkills = useCallback(async (userId: string): Promise<UserHardSkillDisplay[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('user_hard_skills')
        .select(`
          proficiency_level,
          custom_skill_name,
          hard_skills_catalog:skill_id (
            name,
            category
          )
        `)
        .eq('user_id', userId);

      if (fetchError) throw fetchError;

      return (data || []).map(row => ({
        name: row.custom_skill_name || (row.hard_skills_catalog as { name: string } | null)?.name || 'Unknown',
        proficiencyLevel: row.proficiency_level,
        category: (row.hard_skills_catalog as { category: string } | null)?.category
      }));
    } catch (err) {
      return [];
    }
  }, []);

  return {
    positions,
    isLoading,
    error,
    buildUnifiedPositions,
    buildLegacyPositions,
    buildMergedPositions,
    calculateDetailedMetrics,
    fetchAssignmentHistory,
    fetchUserHardSkills
  };
};
