import React, { useState, useMemo, useEffect } from 'react';
import { Tree, TreeNode } from 'react-organizational-chart';
import { 
  X, 
  Crown, 
  Target, 
  Plus, 
  Edit2, 
  Edit3,
  Users, 
  Fingerprint, 
  UserPlus,
  ThermometerSun,
  Handshake,
  Building,
  BarChart3,
  AlertTriangle,
  Search,
  Check,
  AlertCircle,
  Sparkles,
  ExternalLink,
  UserCheck,
  Medal,
  ArrowRight,
  Shuffle,
  Trash2,
  Save,
  MapPin,
  Loader2,
  Award,
  Download,
  Briefcase
} from 'lucide-react';
import { OrgChartExportModal } from '../../src/components/admin/OrgChartExportModal';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { OrgNode, CompanyProfile, User, RequiredProfile, SeniorityLevel } from '../../types';
import { SOFT_SKILLS_OPTIONS } from '../../constants';
import { calculateUserCompatibility } from '../../services/riasecService';
import { InviteToSlotModal } from '../../src/components/InviteToSlotModal';
import { useCompanyMembers } from '../../src/hooks/useCompanyMembers';
import { useTalentSearch } from '../../src/hooks/useTalentSearch';
import { usePositionShortlist, type InternalMatchData } from '../../src/hooks/usePositionShortlist';
import type { CandidateMatch } from '../../src/types/karma';

import { toast } from '../../src/hooks/use-toast';
import { OrgNodeCard, findNodeManager, findNodeManagers, EmployeeProfileData } from './OrgNodeCard';
import { getMatchQuality } from '../../src/utils/matchingEngine';
import { MatchScorePopover, MatchBreakdown } from '../../src/components/shortlist/MatchScorePopover';
import { EmployeeProfilePopover } from '../../src/components/shortlist/EmployeeProfilePopover';
import type { ShortlistUser } from '../../src/types/shortlist';

// Role-centric imports
import { useCompanyRoles } from '../../src/hooks/useCompanyRoles';
import { RoleCreationModal } from '../../src/components/roles/RoleCreationModal';
import { RoleDetailModal } from '../../src/components/roles/RoleDetailModal';
import { UnifiedDetailModal } from '../../src/components/roles/UnifiedDetailModal';
import type { CompanyRole, CreateRoleInput } from '../../src/types/roles';
import type { UnifiedPosition } from '../../src/types/unified-org';

const SENIORITY_OPTIONS: SeniorityLevel[] = ['Junior', 'Mid', 'Senior', 'Lead', 'C-Level'];
const SENIORITY_LEVELS: Record<SeniorityLevel, number> = { 'Junior': 1, 'Mid': 2, 'Senior': 3, 'Lead': 4, 'C-Level': 5 };

// --- CANDIDATE MATCH CALCULATION (with seniority penalty) ---
const calculateCandidateMatch = (candidate: User, required: RequiredProfile | undefined): { 
  score: number; 
  softMatches: string[]; 
  softGaps: string[]; 
  seniorityMatch: 'match' | 'above' | 'below';
  seniorityPenalty: number;
} => {
  if (!required) return { score: 100, softMatches: [], softGaps: [], seniorityMatch: 'match', seniorityPenalty: 0 };
  
  const userSoftSkills = candidate.karmaData?.softSkills || [];
  const userSeniority = candidate.karmaData?.seniorityAssessment as SeniorityLevel | undefined;
  
  // Soft skills comparison
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
  
  // Seniority comparison with penalty system
  let seniorityMatch: 'match' | 'above' | 'below' = 'match';
  let seniorityScore = 100;
  let seniorityPenalty = 0;
  
  if (required.seniority && userSeniority) {
    const reqLevel = SENIORITY_LEVELS[required.seniority] || 0;
    const userLevel = SENIORITY_LEVELS[userSeniority] || 0;
    const levelDiff = userLevel - reqLevel;
    
    if (levelDiff === 0) {
      seniorityMatch = 'match';
      seniorityScore = 100;
    } else if (levelDiff > 0) {
      // Over-senior: heavy penalty (30% per level above)
      seniorityPenalty = Math.min(levelDiff * 30, 100);
      seniorityScore = Math.max(0, 100 - seniorityPenalty);
      seniorityMatch = 'above';
    } else {
      // Under-senior: light penalty (15% per level below)
      seniorityScore = Math.max(0, 100 + (levelDiff * 15));
      seniorityMatch = 'below';
    }
  }
  
  // Calculate overall score (50% soft skills, 50% seniority)
  const softSkillScore = (required.softSkills?.length || 0) > 0 
    ? (softMatches.length / (required.softSkills?.length || 1)) * 100 
    : 100;
  
  const finalScore = Math.round(
    (softSkillScore * 0.5) + (seniorityScore * 0.5)
  );
  
  return { score: Math.max(0, Math.min(finalScore, 100)), softMatches, softGaps, seniorityMatch, seniorityPenalty };
};

// --- ROLE COMPARISON MODAL ---
interface RoleComparisonModalProps {
  user: User;
  allUsers: User[];
  orgStructure: OrgNode;
  companyId: string;
  onClose: () => void;
  onViewFullProfile: () => void;
  onViewUser: (userId: string) => void;
  onAssignUser: (slotUserId: string, selectedUserId: string) => void;
  onInviteToSlot: (slotUser: User) => void;
  onRemoveFromSlot: (user: User) => void;
  onDeletePosition: (user: User) => void;
  onUpdateRequiredProfile: (user: User, profile: RequiredProfile) => Promise<void>;
  onViewExternalCandidate?: (userId: string) => void;
  onOpenPositionMatching?: (positionId: string, initialTab?: 'internal' | 'external' | 'shortlist') => void;
}

const calculateMatchScore = (user: User): { score: number; hardMatches: string[]; hardGaps: string[]; softMatches: string[]; softGaps: string[]; bonusSkills: string[]; seniorityMatch: 'match' | 'above' | 'below'; seniorityPenalty: number } => {
  const required = user.requiredProfile;
  const userSoftSkills = user.karmaData?.softSkills || [];
  const userSeniority = user.karmaData?.seniorityAssessment as SeniorityLevel | undefined;
  
  // Hard skills - comparing with requiredProfile.hardSkills (we don't have user hard skills from tests, so we'll show gaps only)
  const hardMatches: string[] = [];
  const hardGaps: string[] = required?.hardSkills || [];
  
  // Soft skills comparison
  const softMatches: string[] = [];
  const softGaps: string[] = [];
  const bonusSkills: string[] = [];
  
  (required?.softSkills || []).forEach(reqSkill => {
    const found = userSoftSkills.some(us => 
      us.toLowerCase().includes(reqSkill.toLowerCase()) || 
      reqSkill.toLowerCase().includes(us.toLowerCase())
    );
    if (found) softMatches.push(reqSkill);
    else softGaps.push(reqSkill);
  });
  
  // Bonus skills (user has but not required)
  userSoftSkills.forEach(us => {
    const isRequired = (required?.softSkills || []).some(rs =>
      rs.toLowerCase().includes(us.toLowerCase()) || 
      us.toLowerCase().includes(rs.toLowerCase())
    );
    if (!isRequired) bonusSkills.push(us);
  });
  
  // Seniority comparison with penalty system
  let seniorityMatch: 'match' | 'above' | 'below' = 'match';
  let seniorityScore = 100;
  let seniorityPenalty = 0;
  
  if (required?.seniority && userSeniority) {
    const reqLevel = SENIORITY_LEVELS[required.seniority] || 0;
    const userLevel = SENIORITY_LEVELS[userSeniority] || 0;
    const levelDiff = userLevel - reqLevel;
    
    if (levelDiff === 0) {
      seniorityMatch = 'match';
      seniorityScore = 100;
    } else if (levelDiff > 0) {
      // Over-senior: heavy penalty (30% per level above)
      seniorityPenalty = Math.min(levelDiff * 30, 100);
      seniorityScore = Math.max(0, 100 - seniorityPenalty);
      seniorityMatch = 'above';
    } else {
      // Under-senior: light penalty (15% per level below)
      seniorityScore = Math.max(0, 100 + (levelDiff * 15));
      seniorityMatch = 'below';
    }
  }
  
  // Calculate overall score (50% soft skills, 50% seniority)
  const softSkillScore = (required?.softSkills?.length || 0) > 0 
    ? (softMatches.length / (required?.softSkills?.length || 1)) * 100 
    : 100;
  
  const finalScore = Math.round(
    (softSkillScore * 0.5) + (seniorityScore * 0.5)
  );
  
  return { score: Math.max(0, Math.min(finalScore, 100)), hardMatches, hardGaps, softMatches, softGaps, bonusSkills, seniorityMatch, seniorityPenalty };
};

// Helper to find node name by id
const findNodeName = (structure: OrgNode, nodeId: string): string => {
  if (structure.id === nodeId) return structure.name;
  for (const child of structure.children) {
    const found = findNodeName(child, nodeId);
    if (found) return found;
  }
  return '';
};

const RoleComparisonModal: React.FC<RoleComparisonModalProps> = ({ 
  user, 
  allUsers, 
  orgStructure, 
  companyId,
  onClose, 
  onViewFullProfile,
  onViewUser,
  onAssignUser,
  onInviteToSlot,
  onRemoveFromSlot,
  onDeletePosition,
  onUpdateRequiredProfile,
  onViewExternalCandidate,
  onOpenPositionMatching
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAssignSection, setShowAssignSection] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showDeletePositionConfirm, setShowDeletePositionConfirm] = useState(false);
  
  // Role editing state
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [editedProfile, setEditedProfile] = useState<RequiredProfile>({
    seniority: user.requiredProfile?.seniority,
    hardSkills: [...(user.requiredProfile?.hardSkills || [])],
    softSkills: [...(user.requiredProfile?.softSkills || [])]
  });
  const [newHardSkill, setNewHardSkill] = useState('');
  const [newSoftSkill, setNewSoftSkill] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const match = useMemo(() => calculateMatchScore(user), [user]);
  const required = user.requiredProfile;
  
  // Check if this is an empty slot or hiring position (moved before hooks that depend on it)
  const isEmptySlot = !user.firstName && !user.lastName;
  const isHiringSlot = user.isHiring === true;
  const needsAssignment = isEmptySlot || isHiringSlot;
  
  // External candidates (Karma Talents)
  const { candidates: externalCandidates, isLoading: externalLoading, searchCandidates } = useTalentSearch();
  
  // Shortlist hook - use user.memberId as positionId (the slot's member id)
  const positionId = user.memberId || user.id;
  const {
    shortlist,
    candidates: shortlistCandidates,
    unifiedCandidates: unifiedShortlistCandidates,
    isLoading: shortlistLoading,
    addInternalCandidate,
    addExternalCandidate,
    isInShortlist: checkIsInShortlist,
    error: shortlistError
  } = usePositionShortlist(isHiringSlot ? positionId : '', companyId);
  
  const [showExternalSection, setShowExternalSection] = useState(false);
  const [showInternalSection, setShowInternalSection] = useState(false); // Internal candidates collapsed by default
  
  // Popover state for showing match breakdown
  const [popoverData, setPopoverData] = useState<{
    isOpen: boolean;
    candidateName: string;
    candidateType: 'internal' | 'external';
    breakdown: MatchBreakdown;
    candidateId?: string;
    isExternal?: boolean;
    candidateData?: {
      internalUser?: User;
      externalMatch?: CandidateMatch;
      matchData?: InternalMatchData;
    };
  } | null>(null);
  
  // Fetch external candidates when hiring slot is opened
  useEffect(() => {
    if (isHiringSlot && showExternalSection && required) {
      const requiredSkills = required.hardSkills || [];
      const seniorityLevels = required.seniority ? [required.seniority] : undefined;
      
      searchCandidates(
        {
          lookingForWorkOnly: true,
          seniorityLevels: seniorityLevels as SeniorityLevel[] | undefined,
        },
        undefined,
        requiredSkills
      );
    }
  }, [isHiringSlot, showExternalSection, required]);
  
  const handleSaveRole = async () => {
    setIsSaving(true);
    try {
      await onUpdateRequiredProfile(user, editedProfile);
      setIsEditingRole(false);
    } finally {
      setIsSaving(false);
    }
  };
  
  const addHardSkill = () => {
    if (newHardSkill.trim() && !editedProfile.hardSkills?.includes(newHardSkill.trim())) {
      setEditedProfile(prev => ({
        ...prev,
        hardSkills: [...(prev.hardSkills || []), newHardSkill.trim()]
      }));
      setNewHardSkill('');
    }
  };
  
  const removeHardSkill = (skill: string) => {
    setEditedProfile(prev => ({
      ...prev,
      hardSkills: (prev.hardSkills || []).filter(s => s !== skill)
    }));
  };
  
  const addSoftSkill = () => {
    if (newSoftSkill.trim() && !editedProfile.softSkills?.includes(newSoftSkill.trim())) {
      setEditedProfile(prev => ({
        ...prev,
        softSkills: [...(prev.softSkills || []), newSoftSkill.trim()]
      }));
      setNewSoftSkill('');
    }
  };
  
  const removeSoftSkill = (skill: string) => {
    setEditedProfile(prev => ({
      ...prev,
      softSkills: (prev.softSkills || []).filter(s => s !== skill)
    }));
  };
  
  // Available employees for assignment (exclude current slot and other hiring slots)
  const availableEmployees = useMemo(() => {
    return allUsers.filter(u => 
      u.id !== user.id && 
      !u.isHiring && 
      u.firstName && 
      u.lastName &&
      (searchQuery === '' || 
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [allUsers, user.id, searchQuery]);
  
  // Internal candidates ranked by match score (for hiring slots), filtered for over-senior
  const internalCandidates = useMemo(() => {
    if (!isHiringSlot) return [];
    
    const requiredLevel = SENIORITY_LEVELS[user.requiredProfile?.seniority as SeniorityLevel] || 0;
    
    return allUsers
      .filter(u => {
        if (u.id === user.id || u.isHiring || !u.firstName || !u.lastName) return false;
        
        // Filter out candidates who are more than 1 level above required
        const userSeniority = u.karmaData?.seniorityAssessment as SeniorityLevel | undefined;
        if (userSeniority && requiredLevel > 0) {
          const userLevel = SENIORITY_LEVELS[userSeniority] || 0;
          const levelDiff = userLevel - requiredLevel;
          if (levelDiff > 1) return false;
        }
        return true;
      })
      .map(candidate => ({
        user: candidate,
        matchData: calculateCandidateMatch(candidate, user.requiredProfile),
        currentDepartment: candidate.departmentId ? findNodeName(orgStructure, candidate.departmentId) : 'Non assegnato'
      }))
      .sort((a, b) => b.matchData.score - a.matchData.score)
      .slice(0, 5);
  }, [allUsers, user, isHiringSlot, orgStructure]);
  
  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getProgressColor = (score: number) => {
    if (score >= 75) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const getMedalIcon = (index: number) => {
    if (index === 0) return <span className="text-yellow-500">🥇</span>;
    if (index === 1) return <span className="text-gray-400">🥈</span>;
    if (index === 2) return <span className="text-amber-600">🥉</span>;
    return <span className="text-gray-400">{index + 1}.</span>;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[130] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold dark:text-gray-100 flex items-center gap-2">
            <Target size={20}/> {needsAssignment ? 'Posizione da Assegnare' : 'Confronto Ruolo/Persona'}
          </h3>
          <button onClick={onClose}><X className="text-gray-400 hover:text-red-500" /></button>
        </div>
        
        {/* User Header */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl mb-4">
          <div className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
            🎯 {user.jobTitle}
            {isHiringSlot && (
              <span className="text-xs bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <Search size={10}/> HIRING
              </span>
            )}
            {isHiringSlot && shortlistCandidates.length > 0 && (
              <button 
                onClick={() => onOpenPositionMatching?.(positionId, 'shortlist')}
                className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 hover:bg-purple-200 dark:hover:bg-purple-700 transition-colors cursor-pointer"
              >
                <Users size={10}/> Shortlist: {shortlistCandidates.length}
                <ExternalLink size={10}/>
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white ${user.isHiring ? 'bg-green-500' : isEmptySlot ? 'bg-gray-400' : 'bg-jnana-sage'}`}>
              {user.isHiring || isEmptySlot ? <Search size={20}/> : `${user.firstName?.[0] || '?'}${user.lastName?.[0] || ''}`}
            </div>
            <div>
              <div className="font-bold text-gray-800 dark:text-gray-100">
                {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : <span className="text-gray-400 italic">Posizione da assegnare</span>}
              </div>
              {user.profileCode && <span className="text-xs font-mono text-gray-500">{user.profileCode}</span>}
            </div>
          </div>
        </div>
        
        {/* ASSIGN PERSON SECTION (for empty/hiring slots) */}
        {needsAssignment && (
          <div className="mb-4 p-4 border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-xl bg-blue-50/50 dark:bg-blue-900/10">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <UserCheck size={16}/> Assegna una Persona
              </label>
              <button 
                onClick={() => setShowAssignSection(!showAssignSection)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                {showAssignSection ? 'Nascondi' : 'Mostra'}
              </button>
            </div>
            
            {showAssignSection && (
              <>
                {/* Search Bar */}
                <div className="relative mb-3">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input
                    type="text"
                    placeholder="Cerca dipendente per nome o ruolo..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {/* Available Employees List */}
                <div className="max-h-48 overflow-y-auto space-y-2 mb-3">
                  {availableEmployees.length > 0 ? (
                    availableEmployees.slice(0, 10).map(emp => {
                      const empMatch = calculateCandidateMatch(emp, user.requiredProfile);
                      return (
                        <div 
                          key={emp.id}
                          className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-400 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-jnana-sage flex items-center justify-center text-xs font-bold text-white">
                              {emp.firstName?.[0]}{emp.lastName?.[0]}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-800 dark:text-gray-100">{emp.firstName} {emp.lastName}</div>
                              <div className="text-[10px] text-gray-500">{emp.jobTitle}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${getScoreColor(empMatch.score)}`}>{empMatch.score}%</span>
                            <Button 
                              size="sm" 
                              onClick={() => onAssignUser(user.id, emp.id)}
                              className="text-xs px-2 py-1"
                            >
                              Assegna
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-gray-400 text-sm italic">
                      {searchQuery ? 'Nessun dipendente trovato' : 'Nessun dipendente disponibile'}
                    </div>
                  )}
                </div>
                
                {/* Invite New Person Button */}
                <Button 
                  variant="ghost" 
                  fullWidth 
                  onClick={() => {
                    onInviteToSlot(user);
                    onClose();
                  }}
                  className="flex items-center justify-center gap-2 border-dashed border-2 border-gray-300 dark:border-gray-600"
                >
                  <UserPlus size={16}/> Invita Nuova Persona
                </Button>
              </>
            )}
          </div>
        )}
        
        {/* INTERNAL CANDIDATES SECTION (only for HIRING slots) */}
        {isHiringSlot && internalCandidates.length > 0 && (
          <div className="mb-4 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                <Shuffle size={16}/> Candidati Interni (Job Rotation)
                <span className="text-xs font-normal bg-purple-100 dark:bg-purple-800 px-2 py-0.5 rounded-full">{internalCandidates.length}</span>
              </label>
              <button 
                onClick={() => setShowInternalSection(!showInternalSection)}
                className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
              >
                {showInternalSection ? 'Nascondi' : 'Mostra candidati'}
              </button>
            </div>
            
            {showInternalSection && (
              <>
                <p className="text-xs text-purple-600 dark:text-purple-400 mb-3">
                  Migliori match interni per questo ruolo:
                </p>
            
                <div className="space-y-2">
              {internalCandidates.map((candidate, index) => {
                // Build breakdown for internal candidate
                const internalBreakdown: MatchBreakdown = {
                  totalScore: candidate.matchData.score,
                  softSkillsMatched: candidate.matchData.softMatches,
                  softSkillsMissing: candidate.matchData.softGaps,
                  seniorityMatch: candidate.matchData.seniorityMatch,
                  candidateSeniority: candidate.user.karmaData?.seniorityAssessment,
                  requiredSeniority: user.requiredProfile?.seniority,
                };
                
                // Build match data for shortlist
                const matchDataForShortlist: InternalMatchData = {
                  matchScore: candidate.matchData.score,
                  skillsOverlap: candidate.matchData.softMatches,
                  missingSkills: candidate.matchData.softGaps,
                  seniorityMatch: candidate.matchData.seniorityMatch === 'match',
                };
                
                const candidateInShortlist = checkIsInShortlist(candidate.user.id, 'internal');
                
                return (
                  <div 
                    key={candidate.user.id}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-100 dark:border-purple-700 hover:shadow-md hover:border-purple-300 transition-all cursor-pointer"
                    onClick={() => setPopoverData({
                      isOpen: true,
                      candidateName: `${candidate.user.firstName} ${candidate.user.lastName}`,
                      candidateType: 'internal',
                      breakdown: internalBreakdown,
                      candidateId: candidate.user.id,
                      isExternal: false,
                      candidateData: {
                        internalUser: candidate.user,
                        matchData: matchDataForShortlist,
                      },
                    })}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-lg">{getMedalIcon(index)}</div>
                      <div className="w-10 h-10 rounded-full bg-jnana-sage flex items-center justify-center text-sm font-bold text-white">
                        {candidate.user.firstName?.[0]}{candidate.user.lastName?.[0]}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-800 dark:text-gray-100">{candidate.user.firstName} {candidate.user.lastName}</div>
                        <div className="text-[10px] text-gray-500 flex items-center gap-2">
                          <span>{candidate.user.karmaData?.seniorityAssessment || 'N/A'} - {candidate.user.jobTitle}</span>
                        </div>
                        <div className="text-[9px] text-purple-500 dark:text-purple-400 flex items-center gap-1">
                          <Building size={9}/> Attualmente in: {candidate.currentDepartment}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className={`text-lg font-bold ${getScoreColor(candidate.matchData.score)}`}>
                        {candidate.matchData.score}%
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-gray-500">
                        <span className="text-green-600">✓ {candidate.matchData.softMatches.length}</span>
                        {candidate.matchData.softGaps.length > 0 && (
                          <span className="text-orange-500">⚠ {candidate.matchData.softGaps.length}</span>
                        )}
                      </div>
                      {/* Shortlist status indicator */}
                      {candidateInShortlist ? (
                        <span className="text-[10px] px-2 py-0.5 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 rounded-full font-medium flex items-center gap-1">
                          <Check size={10}/> In Shortlist
                        </span>
                      ) : (
                        <div className="flex gap-1 mt-1">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onAssignUser(user.id, candidate.user.id);
                            }}
                            className="text-[10px] px-2 py-1 bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 rounded hover:bg-purple-200 dark:hover:bg-purple-700 transition-colors flex items-center gap-1"
                          >
                            <ArrowRight size={10}/> Assegna
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
              </>
            )}
          </div>
        )}
        
        {/* EXTERNAL CANDIDATES SECTION (Karma Talents) - only for HIRING slots */}
        {isHiringSlot && (
          <div className="mb-4 p-4 bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-xl border border-green-100 dark:border-green-800">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-green-700 dark:text-green-300 flex items-center gap-2">
                <Users size={16}/> Candidati Esterni (Karma Talents)
              </label>
              <button 
                onClick={() => setShowExternalSection(!showExternalSection)}
                className="text-xs text-green-600 dark:text-green-400 hover:underline"
              >
                {showExternalSection ? 'Nascondi' : 'Mostra'}
              </button>
            </div>
            
            {showExternalSection && (
              <>
                {externalLoading && (
                  <div className="text-center py-4">
                    <Loader2 size={20} className="animate-spin text-green-500 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Ricerca candidati...</p>
                  </div>
                )}
                
                {!externalLoading && externalCandidates.length > 0 && (
                  <div className="space-y-2">
                    {externalCandidates.slice(0, 5).map((candidate, index) => {
                      const quality = getMatchQuality(candidate.matchScore);
                      
                      // Helper to calculate seniority match
                      const getSeniorityMatch = (): 'match' | 'above' | 'below' | undefined => {
                        const candidateSen = candidate.profile.karmaData?.seniorityAssessment as SeniorityLevel | undefined;
                        const requiredSen = user.requiredProfile?.seniority as SeniorityLevel | undefined;
                        if (!candidateSen || !requiredSen) return undefined;
                        const candLevel = SENIORITY_LEVELS[candidateSen] || 0;
                        const reqLevel = SENIORITY_LEVELS[requiredSen] || 0;
                        if (candLevel === reqLevel) return 'match';
                        return candLevel > reqLevel ? 'above' : 'below';
                      };
                      
                      // Build breakdown for external candidate
                      const externalBreakdown: MatchBreakdown = {
                        totalScore: candidate.matchScore,
                        riasecMatch: candidate.riasecMatch,
                        skillsMatch: candidate.skillsMatch,
                        hardSkillsMatched: candidate.skillsOverlap,
                        hardSkillsMissing: candidate.missingSkills,
                        candidateProfileCode: candidate.profile.profileCode,
                        targetProfileCode: undefined,
                        candidateSeniority: candidate.profile.karmaData?.seniorityAssessment,
                        requiredSeniority: user.requiredProfile?.seniority,
                        seniorityMatch: getSeniorityMatch(),
                      };
                      
                      const externalInShortlist = checkIsInShortlist(candidate.profile.id, 'external');
                      
                      return (
                        <div 
                          key={candidate.profile.id}
                          className="relative flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-100 dark:border-green-700 hover:shadow-md hover:border-green-300 transition-all cursor-pointer"
                          onClick={() => setPopoverData({
                            isOpen: true,
                            candidateName: `${candidate.profile.firstName || ''} ${candidate.profile.lastName || ''}`.trim() || 'Candidato',
                            candidateType: 'external',
                            breakdown: externalBreakdown,
                            candidateId: candidate.profile.id,
                            isExternal: true,
                            candidateData: {
                              externalMatch: candidate,
                            },
                          })}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-sm font-bold text-white">
                              {candidate.profile.firstName?.[0] || 'U'}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-800 dark:text-gray-100">
                                {candidate.profile.firstName} {candidate.profile.lastName}
                              </div>
                              <div className="text-[10px] text-gray-500">{candidate.profile.headline || candidate.profile.jobTitle}</div>
                              {candidate.profile.location && (
                                <div className="text-[9px] text-gray-400 flex items-center gap-1">
                                  <MapPin size={8}/> {candidate.profile.location}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className={`px-2 py-0.5 rounded-full ${quality.bgColor}`}>
                              <span className={`text-sm font-bold ${quality.color}`}>{candidate.matchScore}%</span>
                            </div>
                            {/* Shortlist status indicator */}
                            {externalInShortlist ? (
                              <span className="text-[10px] px-2 py-0.5 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 rounded-full font-medium flex items-center gap-1">
                                <Check size={10}/> In Shortlist
                              </span>
                            ) : onViewExternalCandidate && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onViewExternalCandidate(candidate.profile.id);
                                }}
                                className="text-[10px] px-2 py-1 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 rounded hover:bg-green-200 dark:hover:bg-green-700 transition-colors flex items-center gap-1"
                              >
                                <ExternalLink size={10}/> Profilo
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {!externalLoading && externalCandidates.length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-2">Nessun candidato esterno trovato</p>
                )}
              </>
            )}
          </div>
        )}
        
        {/* Show comparison only if person is assigned */}
        {!isEmptySlot && !isHiringSlot && (
          <>
            {/* Seniority Comparison */}
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2 flex items-center gap-1">
                <BarChart3 size={12}/> Seniority
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                  <div className="text-[10px] uppercase text-blue-600 dark:text-blue-400 font-bold mb-1">Richiesta</div>
                  <div className="font-bold text-blue-800 dark:text-blue-200">{required?.seniority || 'Non specificata'}</div>
                </div>
                <div className={`p-3 rounded-lg border ${
                  match.seniorityMatch === 'match' ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800' :
                  match.seniorityMatch === 'above' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800' :
                  'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800'
                }`}>
                  <div className={`text-[10px] uppercase font-bold mb-1 ${
                    match.seniorityMatch === 'match' ? 'text-green-600 dark:text-green-400' :
                    match.seniorityMatch === 'above' ? 'text-blue-600 dark:text-blue-400' :
                    'text-orange-600 dark:text-orange-400'
                  }`}>Attuale</div>
                  <div className={`font-bold flex items-center gap-1 ${
                    match.seniorityMatch === 'match' ? 'text-green-800 dark:text-green-200' :
                    match.seniorityMatch === 'above' ? 'text-blue-800 dark:text-blue-200' :
                    'text-orange-800 dark:text-orange-200'
                  }`}>
                    {user.karmaData?.seniorityAssessment || 'Non valutata'}
                    {match.seniorityMatch === 'match' && <Check size={14}/>}
                    {match.seniorityMatch === 'above' && <Sparkles size={14}/>}
                    {match.seniorityMatch === 'below' && <AlertCircle size={14}/>}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Hard Skills */}
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">💼 Hard Skills</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="text-[10px] uppercase text-gray-500 font-bold mb-2">Richieste</div>
                  <div className="flex flex-wrap gap-1">
                    {(required?.hardSkills || []).length > 0 ? (
                      required?.hardSkills?.map(skill => (
                        <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded text-xs">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">Nessuna richiesta</span>
                    )}
                  </div>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-800">
                  <div className="text-[10px] uppercase text-orange-600 dark:text-orange-400 font-bold mb-2 flex items-center gap-1">
                    <AlertCircle size={10}/> Gap da colmare
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {match.hardGaps.length > 0 ? (
                      match.hardGaps.map(skill => (
                        <span key={skill} className="px-2 py-1 bg-orange-100 text-orange-700 dark:bg-orange-800/50 dark:text-orange-300 rounded text-xs">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-green-600">✓ Tutte coperte</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Soft Skills */}
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">🎭 Soft Skills</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="text-[10px] uppercase text-gray-500 font-bold mb-2">Richieste</div>
                  <div className="space-y-1">
                    {(required?.softSkills || []).length > 0 ? (
                      required?.softSkills?.map(skill => {
                        const isMatch = match.softMatches.includes(skill);
                        return (
                          <div key={skill} className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                            isMatch ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                          }`}>
                            {isMatch && <Check size={10}/>}
                            {skill}
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-xs text-gray-400 italic">Nessuna richiesta</span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {match.softGaps.length > 0 && (
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-800">
                      <div className="text-[10px] uppercase text-orange-600 dark:text-orange-400 font-bold mb-2 flex items-center gap-1">
                        <AlertCircle size={10}/> Gap
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {match.softGaps.map(skill => (
                          <span key={skill} className="px-2 py-1 bg-orange-100 text-orange-700 dark:bg-orange-800/50 dark:text-orange-300 rounded text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {match.bonusSkills.length > 0 && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                      <div className="text-[10px] uppercase text-blue-600 dark:text-blue-400 font-bold mb-2 flex items-center gap-1">
                        <Sparkles size={10}/> Bonus
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {match.bonusSkills.slice(0, 5).map(skill => (
                          <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-800/50 dark:text-blue-300 rounded text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {match.softGaps.length === 0 && match.bonusSkills.length === 0 && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800 text-center">
                      <span className="text-xs text-green-600">✓ Match perfetto</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Match Score */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase text-gray-500">📈 Match Score</label>
                <span className={`text-2xl font-bold ${getScoreColor(match.score)}`}>{match.score}%</span>
              </div>
              <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${getProgressColor(match.score)}`}
                  style={{ width: `${match.score}%` }}
                />
              </div>
            </div>
          </>
        )}
        
        {/* Show requirements summary for empty/hiring slots */}
        {(isEmptySlot || isHiringSlot) && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <label className="block text-xs font-bold uppercase text-gray-500 mb-3">📋 Requisiti per questa Posizione</label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-bold mb-1">Seniority</div>
                <div className="text-sm font-bold text-gray-700 dark:text-gray-300">{required?.seniority || 'Non definita'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-bold mb-1">Hard Skills</div>
                <div className="flex flex-wrap gap-1">
                  {(required?.hardSkills || []).length > 0 ? (
                    required?.hardSkills?.slice(0, 3).map(s => (
                      <span key={s} className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded">{s}</span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-bold mb-1">Soft Skills</div>
                <div className="flex flex-wrap gap-1">
                  {(required?.softSkills || []).length > 0 ? (
                    required?.softSkills?.slice(0, 3).map(s => (
                      <span key={s} className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded">{s}</span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Remove Confirmation Dialog */}
        {showRemoveConfirm && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
              Sei sicuro di voler rimuovere <strong>{user.firstName} {user.lastName}</strong> da questo slot?
            </p>
            <p className="text-xs text-red-500 dark:text-red-400 mb-3">
              L'utente non verrà eliminato dal sistema, ma sarà rimosso da questa posizione nell'organigramma.
            </p>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowRemoveConfirm(false)}
              >
                Annulla
              </Button>
              <Button 
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  onRemoveFromSlot(user);
                  onClose();
                }}
              >
                Conferma Rimozione
              </Button>
            </div>
          </div>
        )}
        
        {/* Role Editing Section */}
        {isEditingRole && (
          <div className="mb-4 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border-2 border-indigo-200 dark:border-indigo-700">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                <Edit3 size={16}/> Modifica Requisiti Ruolo
              </label>
            </div>
            
            {/* Seniority Dropdown */}
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Seniority Richiesta</label>
              <select
                className="w-full p-3 border rounded-xl bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={editedProfile.seniority || ''}
                onChange={e => setEditedProfile(prev => ({ ...prev, seniority: e.target.value as SeniorityLevel || undefined }))}
              >
                <option value="">Non specificata</option>
                {SENIORITY_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            
            {/* Hard Skills */}
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">💼 Hard Skills</label>
              <div className="flex flex-wrap gap-1 mb-2">
                {(editedProfile.hardSkills || []).map(skill => (
                  <span 
                    key={skill} 
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded text-xs"
                  >
                    {skill}
                    <button 
                      onClick={() => removeHardSkill(skill)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X size={12}/>
                    </button>
                  </span>
                ))}
                {(editedProfile.hardSkills || []).length === 0 && (
                  <span className="text-xs text-gray-400 italic">Nessuna hard skill</span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Aggiungi hard skill..."
                  className="flex-1 p-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={newHardSkill}
                  onChange={e => setNewHardSkill(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && addHardSkill()}
                />
                <Button size="sm" variant="ghost" onClick={addHardSkill}>
                  <Plus size={16}/>
                </Button>
              </div>
            </div>
            
            {/* Soft Skills */}
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">🎭 Soft Skills</label>
              <div className="flex flex-wrap gap-1 mb-2">
                {(editedProfile.softSkills || []).map(skill => (
                  <span 
                    key={skill} 
                    className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded text-xs"
                  >
                    {skill}
                    <button 
                      onClick={() => removeSoftSkill(skill)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X size={12}/>
                    </button>
                  </span>
                ))}
                {(editedProfile.softSkills || []).length === 0 && (
                  <span className="text-xs text-gray-400 italic">Nessuna soft skill</span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Aggiungi soft skill..."
                  className="flex-1 p-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={newSoftSkill}
                  onChange={e => setNewSoftSkill(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && addSoftSkill()}
                />
                <Button size="sm" variant="ghost" onClick={addSoftSkill}>
                  <Plus size={16}/>
                </Button>
              </div>
            </div>
            
            {/* Save/Cancel Buttons */}
            <div className="flex gap-2 pt-3 border-t border-indigo-200 dark:border-indigo-700">
              <Button 
                onClick={handleSaveRole} 
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Save size={16}/> {isSaving ? 'Salvataggio...' : 'Salva Modifiche'}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => {
                  setIsEditingRole(false);
                  setEditedProfile({
                    seniority: user.requiredProfile?.seniority,
                    hardSkills: [...(user.requiredProfile?.hardSkills || [])],
                    softSkills: [...(user.requiredProfile?.softSkills || [])]
                  });
                }}
              >
                Annulla
              </Button>
            </div>
          </div>
        )}
        
        {/* Delete Position Confirmation (for hiring/empty slots) */}
        {showDeletePositionConfirm && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-700 dark:text-red-300 mb-2">
              Sei sicuro di voler eliminare la posizione <strong>"{user.jobTitle}"</strong>?
            </p>
            <p className="text-xs text-red-500 dark:text-red-400 mb-3">
              Questa azione rimuoverà completamente la posizione dall'organigramma.
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowDeletePositionConfirm(false)}>
                Annulla
              </Button>
              <Button 
                size="sm" 
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  onDeletePosition(user);
                  onClose();
                }}
              >
                Elimina Posizione
              </Button>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
          {/* Row 1: Primary Actions */}
          <div className="flex gap-2">
            {!isEditingRole && (
              <Button 
                variant="ghost" 
                onClick={() => setIsEditingRole(true)}
                className="flex items-center gap-1"
              >
                <Edit3 size={16}/> Modifica Ruolo
              </Button>
            )}
            {!isEmptySlot && !isHiringSlot && !isEditingRole && (
              <Button fullWidth onClick={onViewFullProfile} className="flex items-center justify-center gap-2">
                <ExternalLink size={16}/> Vai al Profilo Completo
              </Button>
            )}
            {!isEditingRole && <Button variant="ghost" onClick={onClose}>Chiudi</Button>}
          </div>
          
          {/* Row 2: Destructive Actions */}
          {!isEditingRole && (
            <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              {/* For assigned users: remove from slot */}
              {!isEmptySlot && !isHiringSlot && (
                <Button 
                  variant="ghost" 
                  onClick={() => setShowRemoveConfirm(true)}
                  className="text-orange-500 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 flex items-center gap-1 text-sm"
                >
                  <Trash2 size={14}/> Rimuovi Persona
                </Button>
              )}
              
              {/* For empty/hiring slots: delete position */}
              {needsAssignment && (
                <Button 
                  variant="ghost" 
                  onClick={() => setShowDeletePositionConfirm(true)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-1 text-sm"
                >
                  <Trash2 size={14}/> Elimina Posizione
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
      
      {/* MatchScorePopover for candidate details */}
      {popoverData && (
        <MatchScorePopover
          isOpen={popoverData.isOpen}
          onClose={() => setPopoverData(null)}
          candidateName={popoverData.candidateName}
          candidateType={popoverData.candidateType}
          breakdown={popoverData.breakdown}
          isInShortlist={popoverData.candidateId ? checkIsInShortlist(popoverData.candidateId, popoverData.candidateType) : false}
          onAddToShortlist={async () => {
            if (!popoverData.candidateId) return;
            
            try {
              let success = false;
              
              if (popoverData.candidateType === 'internal' && popoverData.candidateData?.internalUser && popoverData.candidateData?.matchData) {
                // Add internal candidate
                const internalUser = popoverData.candidateData.internalUser;
                const matchData = popoverData.candidateData.matchData;
                
                const shortlistUser: ShortlistUser = {
                  id: internalUser.id,
                  firstName: internalUser.firstName,
                  lastName: internalUser.lastName,
                  email: internalUser.email,
                  jobTitle: internalUser.jobTitle,
                  seniority: internalUser.karmaData?.seniorityAssessment,
                  profileCode: internalUser.profileCode,
                  riasecScore: internalUser.results,
                  karmaData: {
                    softSkills: internalUser.karmaData?.softSkills,
                    seniorityAssessment: internalUser.karmaData?.seniorityAssessment,
                  },
                };
                
                success = await addInternalCandidate(shortlistUser, matchData);
              } else if (popoverData.candidateType === 'external' && popoverData.candidateData?.externalMatch) {
                // Add external candidate
                success = await addExternalCandidate(popoverData.candidateData.externalMatch);
              }
              
              if (success) {
                toast({ title: "Candidato aggiunto alla shortlist" });
              } else if (shortlistError) {
                toast({ title: "Errore", description: shortlistError, variant: "destructive" });
              }
            } catch (err) {
              toast({ title: "Errore nell'aggiunta", variant: "destructive" });
            }
            
            setPopoverData(null);
          }}
          onViewProfile={() => {
            if (popoverData.isExternal && popoverData.candidateId && onViewExternalCandidate) {
              onViewExternalCandidate(popoverData.candidateId);
            } else if (!popoverData.isExternal && popoverData.candidateId) {
              // For internal candidates, use onViewUser to show the correct profile
              onViewUser(popoverData.candidateId);
            }
            setPopoverData(null);
          }}
        />
      )}
    </div>
  );
};

// --- SUB-COMPONENTS ---

// --- Helper to compute team skill aggregations ---
interface TeamSkillStats {
    hardSkillCounts: Record<string, number>;
    softSkillCounts: Record<string, number>;
    seniorityCounts: Record<string, number>;
    membersWithProfile: number;
    membersWithoutProfile: number;
    gaps: { skill: string; type: 'hard' | 'soft'; membersMissing: number }[];
}

const computeTeamSkillStats = (nodeUsers: User[]): TeamSkillStats => {
    const hardSkillCounts: Record<string, number> = {};
    const softSkillCounts: Record<string, number> = {};
    const seniorityCounts: Record<string, number> = {};
    let membersWithProfile = 0;
    let membersWithoutProfile = 0;
    const gaps: { skill: string; type: 'hard' | 'soft'; membersMissing: number }[] = [];

    nodeUsers.forEach(user => {
        const profile = user.requiredProfile;
        if (profile && (profile.hardSkills?.length || profile.softSkills?.length)) {
            membersWithProfile++;
            profile.hardSkills?.forEach(skill => {
                hardSkillCounts[skill] = (hardSkillCounts[skill] || 0) + 1;
            });
            profile.softSkills?.forEach(skill => {
                softSkillCounts[skill] = (softSkillCounts[skill] || 0) + 1;
            });
            if (profile.seniority) {
                seniorityCounts[profile.seniority] = (seniorityCounts[profile.seniority] || 0) + 1;
            }
        } else {
            membersWithoutProfile++;
        }
    });

    // Gap Analysis: check if members have the skills their profile requires
    nodeUsers.forEach(user => {
        const profile = user.requiredProfile;
        if (!profile) return;
        
        // Check hard skills - compare with user's karma soft skills (simplified check)
        const userSoftSkills = user.karmaData?.softSkills || [];
        profile.softSkills?.forEach(requiredSkill => {
            if (!userSoftSkills.some(s => s.toLowerCase().includes(requiredSkill.toLowerCase()))) {
                const existing = gaps.find(g => g.skill === requiredSkill && g.type === 'soft');
                if (existing) existing.membersMissing++;
                else gaps.push({ skill: requiredSkill, type: 'soft', membersMissing: 1 });
            }
        });
    });

    return { hardSkillCounts, softSkillCounts, seniorityCounts, membersWithProfile, membersWithoutProfile, gaps };
};

const NodeEditorModal: React.FC<{ 
    node: OrgNode;
    nodeUsers: User[];
    onSave: (node: OrgNode) => void; 
    onDelete: (id: string) => void;
    onClose: () => void; 
}> = ({ node, nodeUsers, onSave, onDelete, onClose }) => {
    const [formData, setFormData] = useState(node);
    
    const teamStats = useMemo(() => computeTeamSkillStats(nodeUsers), [nodeUsers]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const sortedHardSkills = Object.entries(teamStats.hardSkillCounts)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 5);
    
    const sortedSoftSkills = Object.entries(teamStats.softSkillCounts)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 5);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold dark:text-gray-100">Modifica Nodo</h3>
                    <button onClick={onClose}><X className="text-gray-400 hover:text-red-500" /></button>
                </div>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Nome Reparto/Team</label>
                        <input 
                            required 
                            className="w-full p-3 border rounded-xl bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Tipo Nodo</label>
                        <select
                            className="w-full p-3 border rounded-xl bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={formData.type}
                            onChange={e => setFormData({...formData, type: e.target.value as 'root' | 'department' | 'team'})}
                            disabled={formData.type === 'root'}
                        >
                            <option value="department">📁 Dipartimento</option>
                            <option value="team">👥 Team</option>
                            {formData.type === 'root' && <option value="root">🏢 Root (Azienda)</option>}
                        </select>
                        <p className="text-xs text-gray-400 mt-1 italic">
                            {formData.type === 'root' ? 'Nodo radice dell\'organizzazione' : 
                             formData.type === 'department' ? 'Unità organizzativa principale' : 
                             'Gruppo di lavoro operativo'}
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
                        <input 
                            type="checkbox" 
                            id="isCulturalDriver"
                            checked={formData.isCulturalDriver || false}
                            onChange={e => setFormData({...formData, isCulturalDriver: e.target.checked})}
                            className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                        />
                        <label htmlFor="isCulturalDriver" className="text-sm font-bold text-amber-800 dark:text-amber-200 cursor-pointer select-none flex items-center gap-2">
                            <Crown size={16}/> Cultural Driver (Nodo Strategico)
                        </label>
                    </div>

                    {/* TEAM STATISTICS SECTION */}
                    <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-4">
                        <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <BarChart3 size={16}/> Analisi Skills del Team ({nodeUsers.length} membri)
                        </h4>
                        
                        {nodeUsers.length === 0 ? (
                            <div className="text-center py-6 text-gray-400 text-sm italic">
                                Nessun membro assegnato a questo nodo
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Hard Skills */}
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Hard Skills Più Richieste</label>
                                    {sortedHardSkills.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {sortedHardSkills.map(([skill, count]) => (
                                                <span key={skill} className="px-2 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded text-xs border border-blue-100 dark:border-blue-800">
                                                    {skill} <span className="font-bold">({count})</span>
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">Nessuna hard skill definita</span>
                                    )}
                                </div>

                                {/* Soft Skills */}
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Soft Skills Più Richieste</label>
                                    {sortedSoftSkills.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {sortedSoftSkills.map(([skill, count]) => (
                                                <span key={skill} className="px-2 py-1 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded text-xs border border-purple-100 dark:border-purple-800">
                                                    {skill} <span className="font-bold">({count})</span>
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">Nessuna soft skill definita</span>
                                    )}
                                </div>

                                {/* Gap Analysis */}
                                {(teamStats.gaps.length > 0 || teamStats.membersWithoutProfile > 0) && (
                                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800">
                                        <label className="block text-xs font-bold uppercase text-orange-600 dark:text-orange-400 mb-2 flex items-center gap-1">
                                            <AlertTriangle size={12}/> Gap Analysis
                                        </label>
                                        <div className="space-y-1 text-xs text-orange-700 dark:text-orange-300">
                                            {teamStats.membersWithoutProfile > 0 && (
                                                <div>⚠️ {teamStats.membersWithoutProfile} membri senza profilo skill definito</div>
                                            )}
                                            {teamStats.gaps.slice(0, 3).map((gap, i) => (
                                                <div key={i}>⚠️ {gap.membersMissing} membri non hanno "{gap.skill}"</div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Seniority Distribution */}
                                {Object.keys(teamStats.seniorityCounts).length > 0 && (
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Distribuzione Seniority</label>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(teamStats.seniorityCounts).map(([level, count]) => (
                                                <span key={level} className="px-2 py-1 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded text-xs border border-gray-200 dark:border-gray-600">
                                                    {level}: <span className="font-bold">{count}</span>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700 mt-4">
                        <Button type="button" variant="ghost" onClick={() => onDelete(formData.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 mr-auto">Elimina Nodo</Button>
                        <Button type="button" variant="ghost" onClick={onClose}>Annulla</Button>
                        <Button type="submit">Salva</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

// --- RECURSIVE TREE RENDERER ---
const renderOrgTreeChildren = (
    node: OrgNode,
    users: User[],
    onAddNode: (parentId: string, type: 'department' | 'team') => void,
    onEditNode: (node: OrgNode) => void,
    onPositionClick: (position: UnifiedPosition) => void,
    companyValues?: string[],
    parentManagers?: User[], // Changed from parentManager to parentManagers (array)
    allHiringPositions?: User[],
    // Role-centric params
    roles?: CompanyRole[],
    onAddRole?: (nodeId: string) => void
): React.ReactNode => {
    if (!node.children || node.children.length === 0) return null;

    // Find ALL managers in current node to pass to children (for Cultural Driver nodes, all users are managers)
    const nodeUsers = users.filter(u => u.departmentId === node.id);
    const currentManagers = findNodeManagers(nodeUsers, node);

    return node.children.map(child => {
        const childNodeUsers = users.filter(u => u.departmentId === child.id);
        const childManagers = findNodeManagers(childNodeUsers, child);

        return (
            <React.Fragment key={child.id}>
                <TreeNode
                    label={
                        <div className="inline-block relative z-10">
                            <OrgNodeCard
                                node={child}
                                users={users}
                                onAddNode={onAddNode}
                                onEditNode={onEditNode}
                                onPositionClick={onPositionClick}
                                companyValues={companyValues}
                                parentManagers={currentManagers}
                                allHiringPositions={allHiringPositions}
                                // Role-centric props
                                roles={roles}
                                onAddRole={onAddRole}
                            />
                        </div>
                    }
                >
                    {renderOrgTreeChildren(
                        child,
                        users,
                        onAddNode,
                        onEditNode,
                        onPositionClick,
                        companyValues,
                        childManagers,
                        allHiringPositions,
                        roles,
                        onAddRole
                    )}
                </TreeNode>
            </React.Fragment>
        );
    });
};

// --- MAIN COMPONENT ---

export const CompanyOrgView: React.FC<{ 
    company: CompanyProfile; 
    users: User[]; 
    onUpdateStructure: (root: OrgNode) => void;
    onUpdateUsers: (users: User[]) => void;
    onViewUser: (userId: string) => void;
    onViewExternalCandidate?: (userId: string) => void;
    onOpenPositionMatching?: (positionId: string, initialTab?: 'internal' | 'external' | 'shortlist') => void;
}> = ({ company, users, onUpdateStructure, onUpdateUsers, onViewUser, onViewExternalCandidate, onOpenPositionMatching }) => {
    const [editingNode, setEditingNode] = useState<OrgNode | null>(null);
    const [selectedUserForComparison, setSelectedUserForComparison] = useState<User | null>(null);
    
    // State for InviteToSlotModal (simplified invite for existing slots)
    const [inviteToSlotUser, setInviteToSlotUser] = useState<User | null>(null);
    
    // State for Employee Profile popover (from org chart click on regular employees)
    const [employeeProfilePopover, setEmployeeProfilePopover] = useState<EmployeeProfileData | null>(null);
    
    // State for Export Modal
    const [showExportModal, setShowExportModal] = useState(false);
    
    // Use the company members hook for DB persistence
    const { createCompanyMember, updateCompanyMember, assignUserToSlot, deleteCompanyMember, isLoading: isSaving } = useCompanyMembers();
    
    // === ROLE-CENTRIC STATE ===
    const [selectedRole, setSelectedRole] = useState<CompanyRole | null>(null);
    const [showRoleCreationModal, setShowRoleCreationModal] = useState(false);
    const [roleCreationNodeId, setRoleCreationNodeId] = useState<string | null>(null);
    
    // Unified position for the new modal
    const [selectedUnifiedPosition, setSelectedUnifiedPosition] = useState<UnifiedPosition | null>(null);
    
    // Use the company roles hook for role management
    const { 
        roles, 
        isLoading: rolesLoading, 
        fetchRoles, 
        createRole, 
        updateRole, 
        deleteRole,
        fetchRoleWithAssignments 
    } = useCompanyRoles();
    
    // Fetch roles on mount if role-centric mode is enabled
    React.useEffect(() => {
        if (company.id) {
            fetchRoles(company.id);
        }
    }, [company.id, fetchRoles]);
    
    // Calculate all hiring positions in the company
    const allHiringPositions = useMemo(() => users.filter(u => u.isHiring), [users]);

    // Handle employee profile click from org chart (for regular employees, not hiring positions)
    const handleEmployeeProfileClick = (profileData: EmployeeProfileData) => {
        setEmployeeProfilePopover(profileData);
    };
    
    // Handle unified position click from org chart
    const handlePositionClick = async (position: UnifiedPosition) => {
        // For explicit roles (not implicit), fetch full details
        if (!position.role.id.startsWith('implicit-')) {
            const fullRole = await fetchRoleWithAssignments(position.role.id);
            if (fullRole) {
                setSelectedUnifiedPosition({ ...position, role: fullRole });
                return;
            }
        }
        setSelectedUnifiedPosition(position);
    };
    
    // Handle add role button click
    const handleAddRole = (nodeId: string) => {
        setRoleCreationNodeId(nodeId);
        setShowRoleCreationModal(true);
    };
    
    // Handle role creation with optional person assignment
    const handleCreateRole = async (input: CreateRoleInput, assignment?: {
        mode: 'none' | 'existing' | 'invite';
        userId?: string;
        inviteData?: { firstName: string; lastName: string; email: string };
    }) => {
        const result = await createRole({
            ...input,
            companyId: company.id,
            orgNodeId: roleCreationNodeId || undefined,
        });
        
        if (result.success && result.role) {
            // Handle person assignment if provided
            if (assignment?.mode === 'existing' && assignment.userId) {
                // Create role assignment for existing user
                const { createAssignment } = await import('../../src/hooks/useRoleAssignments').then(m => {
                    const hook = m.useRoleAssignments();
                    return hook;
                });
                await createAssignment({
                    roleId: result.role.id,
                    userId: assignment.userId,
                    assignmentType: 'primary',
                    startDate: new Date().toISOString().split('T')[0]
                });
            } else if (assignment?.mode === 'invite' && assignment.inviteData) {
                // Create a placeholder company member and send invite
                await createCompanyMember({
                    companyId: company.id,
                    departmentId: roleCreationNodeId || '',
                    jobTitle: input.title,
                    firstName: assignment.inviteData.firstName,
                    lastName: assignment.inviteData.lastName,
                    email: assignment.inviteData.email,
                    isHiring: false,
                    requiredProfile: {
                        seniority: input.requiredSeniority,
                        softSkills: input.requiredSoftSkills?.map(s => s.name) || [],
                        hardSkills: input.requiredHardSkills?.map(s => s.name) || []
                    }
                });
            }
            
            toast({
                title: "Posizione creata",
                description: assignment?.mode === 'invite' 
                    ? `Posizione "${input.title}" creata e invito inviato`
                    : assignment?.mode === 'existing'
                    ? `Posizione "${input.title}" creata e assegnata`
                    : `Posizione "${input.title}" creata (vacante)`,
            });
            setShowRoleCreationModal(false);
            setRoleCreationNodeId(null);
            
            // Refresh roles
            await fetchRoles(company.id);
        } else {
            toast({
                title: "Errore",
                description: result.error || "Impossibile creare la posizione",
                variant: "destructive",
            });
        }
    };

    // Handle inviting a person to an existing slot (simplified modal)
    const handleInviteToSlot = async (data: { firstName: string; lastName: string; email: string }) => {
        if (!inviteToSlotUser) return;
        
        // Save to database
        const result = await createCompanyMember({
            companyId: company.id,
            departmentId: inviteToSlotUser.departmentId || '',
            jobTitle: inviteToSlotUser.jobTitle || '',
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            isHiring: false,
            requiredProfile: inviteToSlotUser.requiredProfile
        });
        
        if (result.success) {
            // Update local state - replace the slot with the invited person
            const updatedUsers = users.map(u => {
                if (u.id === inviteToSlotUser.id) {
                    return {
                        ...u,
                        id: result.memberId || u.id,
                        firstName: data.firstName,
                        lastName: data.lastName,
                        email: data.email,
                        isHiring: false,
                        status: 'invited' as const
                    };
                }
                return u;
            });
            onUpdateUsers(updatedUsers);
            setInviteToSlotUser(null);
            
            toast({
                title: "Invito inviato",
                description: `${data.firstName} ${data.lastName} è stato invitato per la posizione ${inviteToSlotUser.jobTitle}`,
            });
        } else {
            toast({
                title: "Errore",
                description: result.error || "Impossibile inviare l'invito",
                variant: "destructive",
            });
        }
    };

    // Legacy handleInviteUser removed - now using unified RoleCreationModal with assignment step

    // Recursively find and add child
    const addNodeRecursive = (parent: OrgNode, parentId: string, newNode: OrgNode): OrgNode => {
        if (parent.id === parentId) {
            return { ...parent, children: [...parent.children, newNode] };
        }
        return { ...parent, children: parent.children.map(child => addNodeRecursive(child, parentId, newNode)) };
    };

    const handleAddNode = (parentId: string, type: 'department' | 'team') => {
        const newNode: OrgNode = {
            id: `n_${Date.now()}`,
            name: type === 'department' ? 'Nuovo Dipartimento' : 'Nuovo Team',
            type: type,
            children: [],
            targetProfile: { hardSkills: [], softSkills: [], seniority: 'Mid' }
        };
        const newRoot = addNodeRecursive(company.structure, parentId, newNode);
        onUpdateStructure(newRoot);
    };

    // Recursively find and update node
    const updateNodeRecursive = (root: OrgNode, updatedNode: OrgNode): OrgNode => {
        if (root.id === updatedNode.id) return updatedNode;
        return { ...root, children: root.children.map(child => updateNodeRecursive(child, updatedNode)) };
    };

    const handleSaveNode = (node: OrgNode) => {
        const newRoot = updateNodeRecursive(company.structure, node);
        onUpdateStructure(newRoot);
        setEditingNode(null);
    };

    // Recursively delete
    const deleteNodeRecursive = (root: OrgNode, idToDelete: string): OrgNode | null => {
        if (root.id === idToDelete) return null; 
        return { 
            ...root, 
            children: root.children
                .map(child => deleteNodeRecursive(child, idToDelete))
                .filter(child => child !== null) as OrgNode[]
        };
    };

    const handleDeleteNode = (id: string) => {
        if (id === company.structure.id) {
            alert("Non puoi eliminare la radice.");
            return;
        }
        if (confirm("Eliminare questo nodo e tutti i suoi figli?")) {
            const newRoot = deleteNodeRecursive(company.structure, id);
            if(newRoot) onUpdateStructure(newRoot);
            setEditingNode(null);
        }
    };

    return (
        <div className="p-8 max-w-full overflow-x-auto min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
            {/* Legacy invite modal removed - now using unified RoleCreationModal */}

            <div className="mb-8 text-center">
                 <div className="flex justify-center items-center gap-4 mb-2">
                     <h2 className="text-3xl font-brand font-bold dark:text-gray-100">Organigramma Aziendale</h2>
                     <button 
                         onClick={() => setShowExportModal(true)}
                         className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors text-sm font-medium"
                     >
                         <Download size={16} />
                         Esporta PDF
                     </button>
                 </div>
                 <p className="text-muted-foreground">Struttura gerarchica e funzionale di {company.name}</p>
                 <div className="flex justify-center gap-6 mt-4 text-xs font-bold text-muted-foreground">
                     <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-destructive"></div> Clima Critico (&lt;3)</div>
                     <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-400"></div> Clima Neutro (3-4)</div>
                     <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Clima Ottimo (&gt;4)</div>
                     <div className="w-px h-4 bg-border mx-2"></div>
                     <div className="flex items-center gap-1 text-blue-500"><Building size={12}/> Fit Culturale</div>
                     <div className="flex items-center gap-1 text-green-600"><Handshake size={12}/> Fit Manager (Liv. Superiore)</div>
                 </div>
            </div>
            <div className="pb-20 overflow-x-auto">
                <div className="w-fit mx-auto">
                    <Tree
                        lineWidth="3px"
                        lineColor="rgb(99, 102, 241)"
                        lineBorderRadius="12px"
                        lineHeight="40px"
                        nodePadding="24px"
                        label={
                            <div className="inline-block relative z-10">
                                <OrgNodeCard
                                    node={company.structure}
                                    users={users}
                                    onAddNode={handleAddNode}
                                    onEditNode={setEditingNode}
                                    onPositionClick={handlePositionClick}
                                    companyValues={company.cultureValues}
                                    parentManagers={[]}
                                    allHiringPositions={allHiringPositions}
                                    // Role-centric props
                                    roles={roles}
                                    onAddRole={handleAddRole}
                                />
                            </div>
                        }
                    >
                        {renderOrgTreeChildren(company.structure, users, handleAddNode, setEditingNode, handlePositionClick, company.cultureValues, [], allHiringPositions, roles, handleAddRole)}
                    </Tree>
                </div>
            </div>
            {selectedUserForComparison && (
                <RoleComparisonModal
                    user={selectedUserForComparison}
                    allUsers={users}
                    orgStructure={company.structure}
                    companyId={company.id}
                    onClose={() => setSelectedUserForComparison(null)}
                    onViewFullProfile={() => {
                        onViewUser(selectedUserForComparison.id);
                        setSelectedUserForComparison(null);
                    }}
                    onViewUser={onViewUser}
                    onViewExternalCandidate={onViewExternalCandidate}
                    onOpenPositionMatching={onOpenPositionMatching}
                    onAssignUser={async (slotUserId, selectedUserId) => {
                        const slot = users.find(u => u.id === slotUserId);
                        const selectedUser = users.find(u => u.id === selectedUserId);
                        
                        if (!slot || !selectedUser) return;
                        
                        // Save assignment to database
                        const result = await assignUserToSlot(
                            selectedUserId,
                            company.id,
                            slot.departmentId || '',
                            slot.requiredProfile,
                            slot.jobTitle
                        );
                        
                        if (result.success) {
                            // Update the selected user with slot's department and requirements
                            const updatedUsers = users.map(u => {
                                if (u.id === selectedUserId) {
                                    return {
                                        ...u,
                                        departmentId: slot.departmentId,
                                        jobTitle: slot.jobTitle || u.jobTitle,
                                        requiredProfile: slot.requiredProfile,
                                        isHiring: false
                                    };
                                }
                                return u;
                            }).filter(u => u.id !== slotUserId); // Remove the placeholder slot
                            
                            onUpdateUsers(updatedUsers);
                            setSelectedUserForComparison(null);
                            
                            toast({
                                title: "Assegnazione completata",
                                description: `${selectedUser.firstName} ${selectedUser.lastName} è stato assegnato alla posizione ${slot.jobTitle}`,
                            });
                        } else {
                            toast({
                                title: "Errore",
                                description: result.error || "Impossibile assegnare l'utente",
                                variant: "destructive",
                            });
                        }
                    }}
                    onInviteToSlot={(slotUser) => {
                        setInviteToSlotUser(slotUser);
                        setSelectedUserForComparison(null);
                    }}
                    onRemoveFromSlot={async (userToRemove) => {
                        if (!userToRemove.memberId) {
                            toast({
                                title: "Errore",
                                description: "Impossibile trovare l'associazione membro-azienda",
                                variant: "destructive"
                            });
                            return;
                        }
                        
                        const result = await deleteCompanyMember(userToRemove.memberId);
                        
                        if (result.success) {
                            // Remove user from local state
                            const updatedUsers = users.filter(u => u.id !== userToRemove.id);
                            onUpdateUsers(updatedUsers);
                            
                            toast({
                                title: "Utente rimosso",
                                description: `${userToRemove.firstName} ${userToRemove.lastName} è stato rimosso dallo slot`
                            });
                        } else {
                            toast({
                                title: "Errore",
                                description: result.error || "Impossibile rimuovere l'utente",
                                variant: "destructive"
                            });
                        }
                    }}
                    onDeletePosition={async (positionToDelete) => {
                        if (!positionToDelete.memberId) {
                            toast({
                                title: "Errore",
                                description: "Impossibile trovare l'associazione per questa posizione",
                                variant: "destructive"
                            });
                            return;
                        }
                        
                        const result = await deleteCompanyMember(positionToDelete.memberId);
                        
                        if (result.success) {
                            const updatedUsers = users.filter(u => u.id !== positionToDelete.id);
                            onUpdateUsers(updatedUsers);
                            setSelectedUserForComparison(null);
                            
                            toast({
                                title: "Posizione eliminata",
                                description: `La posizione "${positionToDelete.jobTitle}" è stata rimossa dall'organigramma`
                            });
                        } else {
                            toast({
                                title: "Errore",
                                description: result.error || "Impossibile eliminare la posizione",
                                variant: "destructive"
                            });
                        }
                    }}
                    onUpdateRequiredProfile={async (userToUpdate, newProfile) => {
                        if (!userToUpdate.memberId) {
                            toast({
                                title: "Errore",
                                description: "Impossibile trovare l'associazione membro-azienda",
                                variant: "destructive"
                            });
                            return;
                        }
                        
                        const result = await updateCompanyMember(userToUpdate.memberId, {
                            required_profile: newProfile
                        });
                        
                        if (result.success) {
                            // Update user in local state
                            const updatedUsers = users.map(u => 
                                u.id === userToUpdate.id 
                                    ? { ...u, requiredProfile: newProfile }
                                    : u
                            );
                            onUpdateUsers(updatedUsers);
                            setSelectedUserForComparison(prev => 
                                prev?.id === userToUpdate.id 
                                    ? { ...prev, requiredProfile: newProfile }
                                    : prev
                            );
                            
                            toast({
                                title: "Ruolo aggiornato",
                                description: "I requisiti del ruolo sono stati modificati con successo"
                            });
                        } else {
                            toast({
                                title: "Errore",
                                description: result.error || "Impossibile aggiornare i requisiti del ruolo",
                                variant: "destructive"
                            });
                        }
                    }}
                />
            )}
            {inviteToSlotUser && (
                <InviteToSlotModal
                    jobTitle={inviteToSlotUser.jobTitle || 'Posizione'}
                    requiredProfile={inviteToSlotUser.requiredProfile}
                    onInvite={handleInviteToSlot}
                    onClose={() => setInviteToSlotUser(null)}
                    isLoading={isSaving}
                />
            )}
            {editingNode && (
                <NodeEditorModal 
                    node={editingNode}
                    nodeUsers={users.filter(u => u.departmentId === editingNode.id)}
                    onSave={handleSaveNode} 
                    onDelete={handleDeleteNode}
                    onClose={() => setEditingNode(null)} 
                />
            )}
            {employeeProfilePopover && (
                <EmployeeProfilePopover
                    isOpen={true}
                    onClose={() => setEmployeeProfilePopover(null)}
                    user={employeeProfilePopover.user}
                    metrics={{
                        roleFitScore: employeeProfilePopover.roleFitScore,
                        softSkillsMatched: employeeProfilePopover.softSkillsMatched,
                        softSkillsMissing: employeeProfilePopover.softSkillsMissing,
                        hardSkillsRequired: employeeProfilePopover.hardSkillsRequired,
                        seniorityMatch: employeeProfilePopover.seniorityMatch,
                        userSeniority: employeeProfilePopover.userSeniority,
                        requiredSeniority: employeeProfilePopover.requiredSeniority,
                        managerFitScore: employeeProfilePopover.managerFitScore,
                        managerFitBreakdown: employeeProfilePopover.managerFitBreakdown,
                        cultureFitScore: employeeProfilePopover.cultureFitScore,
                        userHardSkills: employeeProfilePopover.userHardSkills || [],
                    }}
                    companyValues={company.cultureValues}
                    onViewFullProfile={() => {
                        onViewUser(employeeProfilePopover.user.id);
                        setEmployeeProfilePopover(null);
                    }}
                    onProposeJobRotation={allHiringPositions.length > 0 ? () => {
                        // Open comparison modal to see job rotation options
                        setSelectedUserForComparison(employeeProfilePopover.user);
                        setEmployeeProfilePopover(null);
                    } : undefined}
                />
            )}
            {showExportModal && (
                <OrgChartExportModal
                    company={company}
                    users={users}
                    onClose={() => setShowExportModal(false)}
                />
            )}
            {/* Role Creation Modal */}
            {showRoleCreationModal && (
                <RoleCreationModal
                    companyId={company.id}
                    orgNodes={[company.structure]}
                    companyMembers={users}
                    onClose={() => {
                        setShowRoleCreationModal(false);
                        setRoleCreationNodeId(null);
                    }}
                    onSave={handleCreateRole}
                    defaultOrgNodeId={roleCreationNodeId || undefined}
                />
            )}
            {/* Role Detail Modal */}
            {selectedRole && (
                <RoleDetailModal
                    role={selectedRole}
                    onClose={() => setSelectedRole(null)}
                    onEdit={() => {
                        // Placeholder - edit handled via other modals
                    }}
                />
            )}
            {/* Unified Position Detail Modal */}
            {selectedUnifiedPosition && (
                <UnifiedDetailModal
                    isOpen={!!selectedUnifiedPosition}
                    position={selectedUnifiedPosition}
                    companyValues={company.cultureValues}
                    companyMembers={users}
                    onClose={() => setSelectedUnifiedPosition(null)}
                    onViewFullProfile={selectedUnifiedPosition.assignee ? () => {
                        if (selectedUnifiedPosition.assignee) {
                            onViewUser(selectedUnifiedPosition.assignee.id);
                        }
                        setSelectedUnifiedPosition(null);
                    } : undefined}
                    onSaveRole={async (roleId, updatedRole) => {
                        let actualRoleId = roleId;
                        // Auto-promote implicit roles silently
                        if (roleId.startsWith('implicit-')) {
                            const pos = selectedUnifiedPosition;
                            const createResult = await createRole({
                                companyId: company.id,
                                title: pos.role.title,
                                orgNodeId: pos.role.orgNodeId || undefined,
                            });
                            if (!createResult.success || !createResult.role) {
                                toast({
                                    title: "Errore",
                                    description: createResult.error || "Impossibile creare il ruolo",
                                    variant: "destructive",
                                });
                                return { success: false, error: createResult.error };
                            }
                            actualRoleId = createResult.role.id;
                        }
                        const result = await updateRole(actualRoleId, updatedRole);
                        if (result.success) {
                            toast({
                                title: "Ruolo aggiornato",
                                description: "Il ruolo è stato modificato con successo",
                            });
                            const refreshed = await fetchRoleWithAssignments(actualRoleId);
                            if (refreshed) {
                                setSelectedUnifiedPosition(prev => prev ? { ...prev, role: refreshed } : null);
                            }
                        } else {
                            toast({
                                title: "Errore",
                                description: result.error || "Impossibile aggiornare il ruolo",
                                variant: "destructive",
                            });
                        }
                        return result;
                    }}
                    onDeleteRole={!selectedUnifiedPosition.role.id.startsWith('implicit-') ? async (roleId) => {
                        const result = await deleteRole(roleId);
                        if (result.success) {
                            toast({
                                title: "Ruolo eliminato",
                                description: "Il ruolo è stato rimosso con successo",
                            });
                            setSelectedUnifiedPosition(null);
                        } else {
                            toast({
                                title: "Errore",
                                description: result.error || "Impossibile eliminare il ruolo",
                                variant: "destructive",
                            });
                        }
                        return result;
                    } : undefined}
                />
            )}
        </div>
    );
};