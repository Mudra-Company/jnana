import React, { useMemo, useState } from 'react';
import { 
  Crown, 
  Plus, 
  Edit2, 
  UserPlus,
  ThermometerSun,
  Search,
  AlertTriangle,
  Briefcase
} from 'lucide-react';
import { Card } from '../../components/Card';
import { OrgNode, User } from '../../types';
import { calculateUserCompatibility } from '../../services/riasecService';
import { UnifiedRolePersonCard } from '../../src/components/roles/UnifiedRolePersonCard';
import type { CompanyRole } from '../../src/types/roles';
import type { UnifiedPosition } from '../../src/types/unified-org';
import type { RequiredProfile } from '../../types';

// Quick match data for popup
export interface QuickMatchData {
  user: User;
  hiringPosition: {
    id: string;
    jobTitle: string;
    requiredProfile?: RequiredProfile;
  };
  matchScore: number;
  softSkillsMatched: string[];
  softSkillsMissing: string[];
  seniorityMatch: 'match' | 'above' | 'below';
}

// Manager fit breakdown for popover display
export interface ManagerFitBreakdown {
  managerId: string;
  managerName: string;
  score: number;
}

// Employee profile data for popover (non-hiring users)
export interface EmployeeProfileData {
  user: User;
  roleFitScore: number;
  softSkillsMatched: string[];
  softSkillsMissing: string[];
  hardSkillsRequired: string[];
  seniorityMatch: 'match' | 'above' | 'below' | undefined;
  userSeniority: string | undefined;
  requiredSeniority: string | undefined;
  managerFitScore: number | null;
  managerFitBreakdown: ManagerFitBreakdown[];
  cultureFitScore: number;
  userHardSkills?: { name: string; proficiencyLevel: number; category?: string }[];
}

interface OrgNodeCardProps {
  node: OrgNode;
  users: User[];
  onAddNode: (parentId: string, type: 'department' | 'team') => void;
  onEditNode: (node: OrgNode) => void;
  onInviteUser: (nodeId: string) => void;
  onPositionClick?: (position: UnifiedPosition) => void;
  companyValues?: string[];
  parentManagers?: User[]; // Changed from parentManager to parentManagers (array)
  allHiringPositions?: User[]; // All open positions in the company
  // New role-centric props
  roles?: CompanyRole[];
  onAddRole?: (nodeId: string) => void;
}

// Helper function to find ALL leaders within a node (for Cultural Driver nodes, all users are leaders)
const findNodeManagers = (nodeUsers: User[], node: OrgNode): User[] => {
  // If the node is a Cultural Driver, ALL users in the node are leaders
  if (node.isCulturalDriver) {
    return nodeUsers.filter(u => !u.isHiring && (u.firstName || u.lastName));
  }
  
  // Otherwise, find users with manager-like titles
  const managers = nodeUsers.filter(u => 
    !u.isHiring && 
    (u.firstName || u.lastName) &&
    (u.jobTitle?.toLowerCase().includes('head') || 
     u.jobTitle?.toLowerCase().includes('manager') || 
     u.jobTitle?.toLowerCase().includes('lead') || 
     u.jobTitle?.toLowerCase().includes('director') ||
     u.jobTitle?.toLowerCase().includes('ceo') ||
     u.jobTitle?.toLowerCase().includes('ad'))
  );
  
  // If no managers found, return empty array (fallback to first user if needed elsewhere)
  return managers.length > 0 ? managers : [];
};

// Legacy helper for backward compatibility - returns first manager
const findNodeManager = (nodeUsers: User[], node: OrgNode): User | undefined => {
  const managers = findNodeManagers(nodeUsers, node);
  return managers[0] || nodeUsers.find(u => !u.isHiring && (u.firstName || u.lastName));
};

// Helper functions for unified position metrics
const SENIORITY_LEVELS_MAP: Record<string, number> = { 
  'Junior': 1, 'Mid': 2, 'Senior': 3, 'Lead': 4, 'C-Level': 5 
};

const calculateRoleFitScore = (role: CompanyRole, assignee: User): number => {
  const requiredSoftSkills = role.requiredSoftSkills?.map(s => s.name) || [];
  const userSoftSkills = assignee.karmaData?.softSkills || [];
  
  if (requiredSoftSkills.length === 0) return 100;
  
  const matches = requiredSoftSkills.filter(reqSkill => 
    userSoftSkills.some(us => 
      us.toLowerCase().includes(reqSkill.toLowerCase()) || 
      reqSkill.toLowerCase().includes(us.toLowerCase())
    )
  ).length;
  
  let seniorityScore = 100;
  const reqSeniority = role.requiredSeniority;
  const userSeniority = assignee.karmaData?.seniorityAssessment;
  
  if (reqSeniority && userSeniority) {
    const reqLevel = SENIORITY_LEVELS_MAP[reqSeniority] || 0;
    const userLevel = SENIORITY_LEVELS_MAP[userSeniority] || 0;
    const diff = userLevel - reqLevel;
    if (diff > 0) seniorityScore = Math.max(0, 100 - (diff * 30));
    else if (diff < 0) seniorityScore = Math.max(0, 100 + (diff * 15));
  }
  
  const skillScore = (matches / requiredSoftSkills.length) * 100;
  return Math.round((skillScore * 0.5) + (seniorityScore * 0.5));
};

const calculateManagerFitAverage = (assignee: User, managers: User[]): number | null => {
  if (!assignee.profileCode) return null;
  
  const scores = managers
    .filter(m => m.profileCode)
    .map(m => calculateUserCompatibility(assignee, m));
  
  if (scores.length === 0) return null;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
};

const calculateCultureFitScore = (assignee: User, companyValues?: string[]): number => {
  if (!companyValues || !companyValues.length || !assignee.karmaData?.primaryValues?.length) return 0;
  
  const matches = assignee.karmaData.primaryValues.filter(pv => 
    companyValues.some(cv => 
      cv.toLowerCase().includes(pv.toLowerCase()) || 
      pv.toLowerCase().includes(cv.toLowerCase())
    )
  ).length;
  
  const score = Math.round((matches / Math.max(assignee.karmaData.primaryValues.length, 1)) * 100);
  return Math.min(score, 100);
};

// Helper to get user status
const getUserStatus = (user: User): 'hiring' | 'invited' | 'pending' | 'completed' | 'test_completed' => {
  if (user.isHiring) return 'hiring';
  if (!user.firstName && !user.lastName) return 'pending';
  if (user.status === 'test_completed') return 'test_completed';
  if (user.profileCode) return 'completed';
  return 'invited';
};

export const OrgNodeCard: React.FC<OrgNodeCardProps> = ({
  node,
  users,
  onAddNode,
  onEditNode,
  onInviteUser,
  onPositionClick,
  companyValues,
  parentManagers = [], // Changed from parentManager to parentManagers
  allHiringPositions,
  // New role-centric props
  roles = [],
  onAddRole
}) => {
  // Find users BELONGING to this node
  const nodeUsers = users.filter(u => u.departmentId === node.id);
  
  // Find hiring positions in this node (users with isHiring = true)
  const hiringPositions = nodeUsers.filter(u => u.isHiring);
  
  // Determine ALL "Leaders" of THIS node (for Cultural Driver nodes, all users are leaders)
  const currentNodeManagers = findNodeManagers(nodeUsers, node);

  // Calculate Node Climate Average
  const nodeClimateScore = useMemo(() => {
    const usersWithClimate = nodeUsers.filter(u => u.climateData);
    if (usersWithClimate.length === 0) return null;
    const totalAvg = usersWithClimate.reduce((sum, u) => sum + (u.climateData?.overallAverage || 0), 0);
    return totalAvg / usersWithClimate.length;
  }, [nodeUsers]);

  // Calculate Skill Gap Mismatch Average
  const skillMismatchScore = useMemo(() => {
    let totalGaps = 0;
    let totalRequired = 0;
    
    nodeUsers.forEach(user => {
      const profile = user.requiredProfile;
      if (!profile) return;
      
      const requiredSkills = [...(profile.softSkills || []), ...(profile.hardSkills || [])];
      const userSkills = [...(user.karmaData?.softSkills || [])];
      
      requiredSkills.forEach(required => {
        totalRequired++;
        const hasSkill = userSkills.some(s => 
          s.toLowerCase().includes(required.toLowerCase()) || 
          required.toLowerCase().includes(s.toLowerCase())
        );
        if (!hasSkill) totalGaps++;
      });
    });
    
    if (totalRequired === 0) return null;
    return Math.round((totalGaps / totalRequired) * 100);
  }, [nodeUsers]);

  // Calculate quick match score between a user and a hiring position
  const calculateQuickMatchScore = (user: User, hiringUser: User): QuickMatchData | null => {
    if (!hiringUser.requiredProfile) return null;
    
    const SENIORITY_LEVELS: Record<string, number> = { 
      'Junior': 1, 'Mid': 2, 'Senior': 3, 'Lead': 4, 'C-Level': 5 
    };
    
    const required = hiringUser.requiredProfile;
    const userSoftSkills = user.karmaData?.softSkills || [];
    const userSeniority = user.karmaData?.seniorityAssessment;
    
    // Soft skills matching
    const softMatches: string[] = [];
    const softGaps: string[] = [];
    
    (required.softSkills || []).forEach(reqSkill => {
      const found = userSoftSkills.some(us => 
        us.toLowerCase().includes(reqSkill.toLowerCase()) || 
        reqSkill.toLowerCase().includes(us.toLowerCase())
      );
      if (found) softMatches.push(reqSkill);
      else softGaps.push(reqSkill);
    });
    
    // Seniority comparison
    let seniorityMatch: 'match' | 'above' | 'below' = 'match';
    let seniorityScore = 100;
    
    if (required.seniority && userSeniority) {
      const reqLevel = SENIORITY_LEVELS[required.seniority] || 0;
      const userLevel = SENIORITY_LEVELS[userSeniority] || 0;
      const levelDiff = userLevel - reqLevel;
      
      if (levelDiff === 0) {
        seniorityMatch = 'match';
      } else if (levelDiff > 0) {
        seniorityMatch = 'above';
        seniorityScore = Math.max(0, 100 - (levelDiff * 30));
      } else {
        seniorityMatch = 'below';
        seniorityScore = Math.max(0, 100 + (levelDiff * 15));
      }
    }
    
    // Calculate score
    const softSkillScore = (required.softSkills?.length || 0) > 0 
      ? (softMatches.length / required.softSkills.length) * 100 
      : 100;
    
    const finalScore = Math.round((softSkillScore * 0.5) + (seniorityScore * 0.5));
    
    return {
      user,
      hiringPosition: {
        id: hiringUser.id,
        jobTitle: hiringUser.jobTitle || 'Posizione aperta',
        requiredProfile: required,
      },
      matchScore: finalScore,
      softSkillsMatched: softMatches,
      softSkillsMissing: softGaps,
      seniorityMatch,
    };
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700';
    if (score >= 3) return 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700';
    return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700';
  };

  const getGapColor = (gap: number) => {
    if (gap <= 20) return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700';
    if (gap <= 50) return 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700';
    return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700';
  };

  // Get hierarchy style based on node type
  const getHierarchyStyle = () => {
    switch (node.type) {
      case 'root':
        return 'border-l-4 border-l-purple-500 shadow-lg shadow-purple-100 dark:shadow-purple-900/20 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/30 dark:to-gray-800';
      case 'department':
        return 'border-l-4 border-l-blue-500 shadow-md shadow-blue-100 dark:shadow-blue-900/20 bg-white dark:bg-gray-800';
      case 'team':
        return 'border-l-2 border-l-green-500 shadow-sm bg-white dark:bg-gray-800';
      default:
        return 'bg-white dark:bg-gray-800';
    }
  };

  const hiringCount = nodeUsers.filter(u => u.isHiring).length;
  
  // Filter roles for this node (role-centric mode)
  const nodeRoles = roles.filter(r => r.orgNodeId === node.id);
  const roleHiringCount = nodeRoles.filter(r => r.isHiring).length;

  // Build unified positions - merge roles with legacy users
  const unifiedPositions = useMemo((): UnifiedPosition[] => {
    // If we have explicit roles, use them as primary
    if (nodeRoles.length > 0) {
      // Build positions from explicit roles
      const rolePositions = nodeRoles.map(role => {
        const assignee = role.currentAssignee 
          ? users.find(u => u.id === role.currentAssignee?.id) || null
          : null;
        
        const metrics = {
          roleFitScore: assignee ? calculateRoleFitScore(role, assignee) : 0,
          managerFitScore: assignee && parentManagers.length > 0 
            ? calculateManagerFitAverage(assignee, parentManagers) 
            : null,
          cultureFitScore: assignee && companyValues 
            ? calculateCultureFitScore(assignee, companyValues) 
            : 0,
          isLeader: !!(assignee?.jobTitle && (
            assignee.jobTitle.toLowerCase().includes('head') ||
            assignee.jobTitle.toLowerCase().includes('manager') ||
            assignee.jobTitle.toLowerCase().includes('lead') ||
            assignee.jobTitle.toLowerCase().includes('director') ||
            assignee.jobTitle.toLowerCase().includes('ceo') ||
            assignee.jobTitle.toLowerCase().includes('cto')
          ))
        };
        
        return {
          role,
          assignee,
          assignment: role.assignments?.[0] || null,
          metrics
        } as UnifiedPosition;
      });
      
      // Find users in this node NOT assigned to any explicit role
      const assignedUserIds = new Set(
        nodeRoles
          .filter(r => r.currentAssignee?.id)
          .map(r => r.currentAssignee!.id)
      );
      
      const unassignedUsers = nodeUsers.filter(u => 
        !assignedUserIds.has(u.id)
      );
      
      // Create implicit roles for unassigned users
      const legacyPositions = unassignedUsers.map(user => createImplicitPosition(user));
      
      return [...rolePositions, ...legacyPositions];
    }
    
    // No explicit roles: show all users as implicit roles
    return nodeUsers.map(user => createImplicitPosition(user));
  }, [nodeRoles, nodeUsers, users, parentManagers, companyValues]);
  
  // Helper to create implicit position from user
  function createImplicitPosition(user: User): UnifiedPosition {
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
      requiredSeniority: user.requiredProfile?.seniority || null,
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
    
    const assignee = user.isHiring ? null : user;
    const metrics = {
      roleFitScore: assignee ? calculateRoleFitScore(implicitRole, assignee) : 0,
      managerFitScore: assignee && parentManagers.length > 0 
        ? calculateManagerFitAverage(assignee, parentManagers) 
        : null,
      cultureFitScore: assignee && companyValues 
        ? calculateCultureFitScore(assignee, companyValues) 
        : 0,
      isLeader: !!(assignee?.jobTitle && (
        assignee.jobTitle.toLowerCase().includes('head') ||
        assignee.jobTitle.toLowerCase().includes('manager') ||
        assignee.jobTitle.toLowerCase().includes('lead') ||
        assignee.jobTitle.toLowerCase().includes('director') ||
        assignee.jobTitle.toLowerCase().includes('ceo') ||
        assignee.jobTitle.toLowerCase().includes('cto')
      ))
    };
    
    return {
      role: implicitRole,
      assignee,
      assignment: null,
      metrics
    };
  }

  // Calculate total hiring count from unified positions
  const totalHiringCount = unifiedPositions.filter(p => p.role.isHiring).length;

  return (
    <Card 
      className={`relative min-w-[300px] max-w-[400px] w-max flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl ${getHierarchyStyle()}`}
      padding="sm"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-200 dark:border-gray-700 gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-gray-800 dark:text-gray-100 text-base leading-snug break-words">
            {node.name}
          </h4>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
              node.type === 'root' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' :
              node.type === 'department' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
              'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
            }`}>
              {node.type}
            </span>
            
            {nodeClimateScore !== null && (
              <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded border ${getScoreColor(nodeClimateScore)}`}>
                <ThermometerSun size={12} />
                {nodeClimateScore.toFixed(1)}/5
              </div>
            )}
            
            {skillMismatchScore !== null && (
              <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded border ${getGapColor(skillMismatchScore)}`}>
                <AlertTriangle size={12} />
                {skillMismatchScore}% gap
              </div>
            )}
            
            {/* Show hiring count */}
            {totalHiringCount > 0 && (
              <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                <Search size={12} /> 
                {totalHiringCount} {totalHiringCount === 1 ? 'aperta' : 'aperte'}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex gap-1 shrink-0">
          {/* Add Role button */}
          {onAddRole && (
            <button 
              onClick={() => onAddRole(node.id)} 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-emerald-600 transition-all" 
              title="Aggiungi Ruolo"
            >
              <Briefcase size={16}/>
            </button>
          )}
          {/* Add Person button */}
          <button 
            onClick={() => onInviteUser(node.id)} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-blue-600 transition-all" 
            title="Aggiungi/Invita Persona"
          >
            <UserPlus size={16}/>
          </button>
          <button 
            onClick={() => onEditNode(node)} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-indigo-600 transition-all"
            title="Modifica nodo"
          >
            <Edit2 size={16}/>
          </button>
          <button 
            onClick={() => onAddNode(node.id, node.type === 'root' ? 'department' : 'team')} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-green-600 transition-all"
            title={node.type === 'root' ? 'Aggiungi Dipartimento' : 'Aggiungi Team'}
          >
            <Plus size={16}/>
          </button>
        </div>
      </div>

      {/* Content: Unified Positions (Roles + Persons) */}
      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
        {unifiedPositions.length > 0 ? (
          unifiedPositions.map(position => (
            <UnifiedRolePersonCard
              key={position.role.id}
              position={position}
              onClick={onPositionClick ? () => onPositionClick(position) : undefined}
            />
          ))
        ) : (
          <div className="text-center py-6 text-sm text-gray-400 italic bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <Briefcase size={24} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            Nessuna posizione definita
          </div>
        )}
      </div>
    </Card>
  );
};

// Export both helper functions for use in parent components
export { findNodeManager, findNodeManagers };
