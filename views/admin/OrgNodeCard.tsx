import React, { useMemo, useState } from 'react';
import { 
  Crown, 
  Plus, 
  Edit2, 
  UserPlus,
  ThermometerSun,
  Handshake,
  Building,
  Search,
  AlertTriangle,
  Mail,
  Clock,
  CheckCircle2,
  Target,
  Briefcase
} from 'lucide-react';
import { Card } from '../../components/Card';
import { OrgNode, User, RequiredProfile } from '../../types';
import { calculateUserCompatibility } from '../../services/riasecService';
import { UnifiedRolePersonCard } from '../../src/components/roles/UnifiedRolePersonCard';
import type { CompanyRole } from '../../src/types/roles';
import type { UnifiedPosition } from '../../src/types/unified-org';

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
  onSelectUserForComparison: (user: User) => void;
  onEmployeeProfileClick?: (profileData: EmployeeProfileData) => void;
  companyValues?: string[];
  parentManagers?: User[]; // Changed from parentManager to parentManagers (array)
  allHiringPositions?: User[]; // All open positions in the company
  // New role-centric props
  roles?: CompanyRole[];
  onRoleClick?: (role: CompanyRole) => void;
  onAddRole?: (nodeId: string) => void;
  useRoleCentric?: boolean; // Feature flag for role-centric view
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

const calculateCultureFitScore = (assignee: User, companyValues: string[]): number => {
  if (!companyValues.length || !assignee.karmaData?.primaryValues?.length) return 0;
  
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

// Status badge component
const StatusBadge: React.FC<{ status: 'hiring' | 'invited' | 'pending' | 'completed' | 'test_completed' }> = ({ status }) => {
  const config = {
    hiring: {
      bg: 'bg-emerald-100 dark:bg-emerald-900/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-300 dark:border-emerald-700',
      icon: Search,
      label: 'HIRING'
    },
    invited: {
      bg: 'bg-amber-100 dark:bg-amber-900/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-300 dark:border-amber-700',
      icon: Mail,
      label: 'INVITATO'
    },
    pending: {
      bg: 'bg-gray-100 dark:bg-gray-700/40',
      text: 'text-gray-600 dark:text-gray-400',
      border: 'border-gray-300 dark:border-gray-600',
      icon: Clock,
      label: 'IN ATTESA'
    },
    completed: {
      bg: 'bg-blue-100 dark:bg-blue-900/40',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-300 dark:border-blue-700',
      icon: CheckCircle2,
      label: 'COMPLETO'
    },
    test_completed: {
      bg: 'bg-green-100 dark:bg-green-900/40',
      text: 'text-green-700 dark:text-green-300',
      border: 'border-green-300 dark:border-green-700',
      icon: CheckCircle2,
      label: 'COMPLETATO'
    }
  };

  const { bg, text, border, icon: Icon, label } = config[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full border ${bg} ${text} ${border}`}>
      <Icon size={10} />
      {label}
    </span>
  );
};

export const OrgNodeCard: React.FC<OrgNodeCardProps> = ({
  node,
  users,
  onAddNode,
  onEditNode,
  onInviteUser,
  onSelectUserForComparison,
  onEmployeeProfileClick,
  companyValues,
  parentManagers = [], // Changed from parentManager to parentManagers
  allHiringPositions,
  // New role-centric props
  roles = [],
  onRoleClick,
  onAddRole,
  useRoleCentric = false
}) => {
  // State for showing manager fit breakdown popover
  const [showManagerBreakdown, setShowManagerBreakdown] = useState<string | null>(null);
  
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
            
            {/* Show hiring count - supports both legacy and role-centric */}
            {(useRoleCentric ? roleHiringCount : hiringCount) > 0 && (
              <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                <Search size={12} /> 
                {useRoleCentric ? roleHiringCount : hiringCount} {(useRoleCentric ? roleHiringCount : hiringCount) === 1 ? 'aperta' : 'aperte'}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex gap-1 shrink-0">
          {/* Role-centric: Add Role button */}
          {useRoleCentric && onAddRole && (
            <button 
              onClick={() => onAddRole(node.id)} 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-emerald-600 transition-all" 
              title="Aggiungi Ruolo"
            >
              <Briefcase size={16}/>
            </button>
          )}
          {/* Legacy: Add Person button */}
          {!useRoleCentric && (
            <button 
              onClick={() => onInviteUser(node.id)} 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-blue-600 transition-all" 
              title="Aggiungi/Invita Persona"
            >
              <UserPlus size={16}/>
            </button>
          )}
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

      {/* Content: Roles (role-centric) or Users (legacy) */}
      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
        {useRoleCentric ? (
          // UNIFIED VIEW: Show UnifiedRolePersonCard for each role
          nodeRoles.length > 0 ? (
            nodeRoles.map(role => {
              // Find the assignee for this role
              const assignee = role.currentAssignee 
                ? users.find(u => u.id === role.currentAssignee?.id) || null
                : null;
              
              // Build unified position with quick metrics
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
                  assignee.jobTitle.toLowerCase().includes('director')
                ))
              };
              
              const position: UnifiedPosition = {
                role,
                assignee,
                assignment: role.assignments?.[0] || null,
                metrics
              };
              
              return (
                <UnifiedRolePersonCard
                  key={role.id}
                  position={position}
                  onClick={onRoleClick ? () => onRoleClick(role) : undefined}
                />
              );
            })
          ) : (
            <div className="text-center py-6 text-sm text-gray-400 italic bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
              <Briefcase size={24} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              Nessun ruolo definito
            </div>
          )
        ) : (
          // LEGACY VIEW: Show User cards
          nodeUsers.length > 0 ? (
          nodeUsers.map(u => {
            const status = getUserStatus(u);
            
            // Cultural Fit (Company Values)
            let cultureFitScore = 0;
            if (companyValues && companyValues.length > 0 && u.karmaData?.primaryValues) {
              const matches = u.karmaData.primaryValues.filter(pv => 
                companyValues.some(cv => cv.toLowerCase().includes(pv.toLowerCase()) || pv.toLowerCase().includes(cv.toLowerCase()))
              ).length;
              cultureFitScore = Math.round((matches / Math.max(u.karmaData.primaryValues.length, 1)) * 100);
              if (cultureFitScore > 100) cultureFitScore = 100;
            }

            // Manager Fit (Average compatibility with ALL PARENT NODE Managers)
            // Include ALL managers in breakdown, but only calculate scores for those with profileCode
            const managerFitBreakdown: ManagerFitBreakdown[] = parentManagers.length > 0
              ? parentManagers
                  .filter(pm => pm.firstName || pm.lastName) // Include all managers with names
                  .map(pm => ({
                    managerId: pm.id,
                    managerName: `${pm.firstName || ''} ${pm.lastName || ''}`.trim(),
                    score: pm.profileCode ? calculateUserCompatibility(u, pm) : -1 // -1 = no profile data
                  }))
              : [];
            
            // Calculate average only from managers WITH profile data (score >= 0)
            const managersWithScores = managerFitBreakdown.filter(m => m.score >= 0);
            const managerFitScore = managersWithScores.length > 0
              ? Math.round(managersWithScores.reduce((sum, m) => sum + m.score, 0) / managersWithScores.length)
              : null;
            
            // Check if this user is one of the leaders in this Cultural Driver node
            const isInternalLeader = currentNodeManagers.some(m => m.id === u.id);

            // Calculate role fit for this user (against their own requiredProfile)
            const calculateRoleFit = (user: User): {
              roleFitScore: number;
              softSkillsMatched: string[];
              softSkillsMissing: string[];
              seniorityMatch: 'match' | 'above' | 'below' | undefined;
            } => {
              const SENIORITY_LEVELS: Record<string, number> = { 
                'Junior': 1, 'Mid': 2, 'Senior': 3, 'Lead': 4, 'C-Level': 5 
              };
              const required = user.requiredProfile;
              if (!required) return { roleFitScore: 100, softSkillsMatched: [], softSkillsMissing: [], seniorityMatch: undefined };
              
              const userSoftSkills = user.karmaData?.softSkills || [];
              const userSeniority = user.karmaData?.seniorityAssessment;
              
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
              
              let seniorityMatch: 'match' | 'above' | 'below' | undefined = undefined;
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
              
              const softSkillScore = (required.softSkills?.length || 0) > 0 
                ? (softMatches.length / required.softSkills.length) * 100 
                : 100;
              
              const roleFitScore = Math.round((softSkillScore * 0.5) + (seniorityScore * 0.5));
              
              return { roleFitScore, softSkillsMatched: softMatches, softSkillsMissing: softGaps, seniorityMatch };
            };

            const roleFitData = status !== 'hiring' ? calculateRoleFit(u) : null;

            return (
              <div 
                key={u.id} 
                onClick={() => {
                  if (status === 'hiring') {
                    // Hiring position -> open RoleComparisonModal
                    onSelectUserForComparison(u);
                  } else if (onEmployeeProfileClick) {
                    // Regular employee -> open EmployeeProfilePopover
                    onEmployeeProfileClick({
                      user: u,
                      roleFitScore: roleFitData?.roleFitScore || 0,
                      softSkillsMatched: roleFitData?.softSkillsMatched || [],
                      softSkillsMissing: roleFitData?.softSkillsMissing || [],
                      hardSkillsRequired: u.requiredProfile?.hardSkills || [],
                      seniorityMatch: roleFitData?.seniorityMatch,
                      userSeniority: u.karmaData?.seniorityAssessment,
                      requiredSeniority: u.requiredProfile?.seniority,
                      managerFitScore,
                      managerFitBreakdown,
                      cultureFitScore,
                      userHardSkills: u.hardSkills || [],
                    });
                  } else {
                    // Fallback to comparison modal
                    onSelectUserForComparison(u);
                  }
                }}
                className={`flex flex-col p-3 rounded-xl transition-all duration-200 cursor-pointer group/user border-2 hover:shadow-md ${
                  status === 'hiring' 
                    ? 'border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' 
                    : 'border-transparent bg-gray-50 dark:bg-gray-700/30 hover:bg-white dark:hover:bg-gray-700/60 hover:border-gray-200 dark:hover:border-gray-600'
                }`}
              >
                {/* User Header Row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {/* Avatar - larger and more prominent */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-md ${
                      status === 'hiring' ? 'bg-emerald-500' :
                      isInternalLeader && node.isCulturalDriver ? 'bg-amber-500 ring-2 ring-amber-200 dark:ring-amber-800' : 
                      'bg-jnana-sage'
                    }`}>
                      {status === 'hiring' ? <Search size={16}/> : `${u.firstName?.[0] || '?'}${u.lastName?.[0] || ''}`}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate group-hover/user:text-indigo-600 dark:group-hover/user:text-indigo-400 transition-colors">
                        {u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : <span className="text-gray-400 italic">Da assegnare</span>}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.jobTitle}</div>
                    </div>
                  </div>
                  
                  {/* Right side: Status badge or profile code */}
                  <div className="shrink-0 flex items-center gap-2">
                    {status === 'hiring' && <StatusBadge status="hiring" />}
                    {status !== 'hiring' && u.profileCode && (
                      <span className="text-xs font-mono font-bold bg-white dark:bg-gray-800 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400">
                        {u.profileCode}
                      </span>
                    )}
                  </div>
                </div>

                {/* Metrics Row - only for non-hiring users */}
                {status !== 'hiring' && (
                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-200/50 dark:border-gray-600/50">
                    {/* Cultural Fit */}
                    <div className="flex items-center gap-2" title="Fit Culturale (Azienda)">
                      <Building size={14} className={cultureFitScore > 60 ? "text-blue-500" : "text-gray-400"} />
                      <div className="w-16 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${cultureFitScore > 70 ? 'bg-blue-500' : cultureFitScore > 40 ? 'bg-blue-300' : 'bg-red-300'}`} 
                          style={{width: `${cultureFitScore}%`}}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{cultureFitScore}%</span>
                    </div>

                    {/* Manager Fit with breakdown popover */}
                    {parentManagers.length > 0 && managerFitScore !== null && (
                      <div 
                        className="flex items-center gap-2 ml-auto relative cursor-pointer"
                        onMouseEnter={() => setShowManagerBreakdown(u.id)}
                        onMouseLeave={() => setShowManagerBreakdown(null)}
                        title={`Compatibilità Media Responsabili: ${managerFitScore}%`}
                      >
                        <Handshake size={14} className={managerFitScore > 60 ? "text-green-500" : "text-gray-400"} />
                        <div className="w-16 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${managerFitScore > 70 ? 'bg-green-500' : managerFitScore > 40 ? 'bg-yellow-400' : 'bg-red-400'}`} 
                            style={{width: `${managerFitScore}%`}}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{managerFitScore}%</span>
                        
                        {/* Breakdown Popover */}
                        {showManagerBreakdown === u.id && managerFitBreakdown.length > 1 && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 p-3 min-w-[200px]">
                            <div className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                              <Handshake size={12}/> Compatibilità Responsabili
                            </div>
                            <div className="space-y-2">
                              {managerFitBreakdown.map(mb => (
                                <div key={mb.managerId} className="flex items-center justify-between gap-2">
                                  <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[120px]">
                                    {mb.managerName}
                                  </span>
                                  {mb.score >= 0 ? (
                                    <span className={`text-xs font-bold ${mb.score > 70 ? 'text-green-600' : mb.score > 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                                      {mb.score}%
                                    </span>
                                  ) : (
                                    <span className="text-xs italic text-gray-400">N/A</span>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Media</span>
                              <span className={`text-xs font-bold ${managerFitScore > 70 ? 'text-green-600' : managerFitScore > 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {managerFitScore}%
                              </span>
                            </div>
                            {/* Arrow pointing down */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white dark:border-t-gray-800"></div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Leader badge - show for ALL users in Cultural Driver node */}
                    {isInternalLeader && node.isCulturalDriver && (
                      <span className="ml-auto flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                        <Crown size={12}/> LEADER
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-6 text-sm text-gray-400 italic bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <UserPlus size={24} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            Nessun dipendente assegnato
          </div>
        )
        )}
      </div>
    </Card>
  );
};

// Export both helper functions for use in parent components
export { findNodeManager, findNodeManagers };
