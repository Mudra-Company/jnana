import React, { useState, useMemo } from 'react';
import { Tree, TreeNode } from 'react-organizational-chart';
import { 
  X, 
  Crown, 
  Target, 
  Plus, 
  Edit2, 
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
  Trash2
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { OrgNode, CompanyProfile, User, RequiredProfile, SeniorityLevel } from '../../types';
import { SOFT_SKILLS_OPTIONS } from '../../constants';
import { calculateUserCompatibility } from '../../services/riasecService';
import { InviteToSlotModal } from '../../src/components/InviteToSlotModal';
import { useCompanyMembers } from '../../src/hooks/useCompanyMembers';
import { toast } from '../../src/hooks/use-toast';
import { OrgNodeCard, findNodeManager } from './OrgNodeCard';

const SENIORITY_OPTIONS: SeniorityLevel[] = ['Junior', 'Mid', 'Senior', 'Lead', 'C-Level'];
const SENIORITY_LEVELS: Record<SeniorityLevel, number> = { 'Junior': 1, 'Mid': 2, 'Senior': 3, 'Lead': 4, 'C-Level': 5 };

// --- CANDIDATE MATCH CALCULATION ---
const calculateCandidateMatch = (candidate: User, required: RequiredProfile | undefined): { 
  score: number; 
  softMatches: string[]; 
  softGaps: string[]; 
  seniorityMatch: 'match' | 'above' | 'below';
} => {
  if (!required) return { score: 100, softMatches: [], softGaps: [], seniorityMatch: 'match' };
  
  const userSoftSkills = candidate.karmaData?.softSkills || [];
  const userSeniority = candidate.karmaData?.seniorityAssessment;
  
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
  
  // Seniority comparison
  let seniorityMatch: 'match' | 'above' | 'below' = 'match';
  if (required.seniority && userSeniority) {
    const reqLevel = SENIORITY_LEVELS[required.seniority] || 0;
    const userLevel = SENIORITY_LEVELS[userSeniority] || 0;
    if (userLevel > reqLevel) seniorityMatch = 'above';
    else if (userLevel < reqLevel) seniorityMatch = 'below';
  }
  
  // Calculate overall score
  const totalRequired = (required.softSkills?.length || 0) + (required.hardSkills?.length || 0) + (required.seniority ? 1 : 0);
  const matches = softMatches.length + (seniorityMatch !== 'below' ? 1 : 0);
  const score = totalRequired > 0 ? Math.round((matches / totalRequired) * 100) : 100;
  
  return { score: Math.min(score, 100), softMatches, softGaps, seniorityMatch };
};

// --- ROLE COMPARISON MODAL ---
interface RoleComparisonModalProps {
  user: User;
  allUsers: User[];
  orgStructure: OrgNode;
  onClose: () => void;
  onViewFullProfile: () => void;
  onAssignUser: (slotUserId: string, selectedUserId: string) => void;
  onInviteToSlot: (slotUser: User) => void;
  onRemoveFromSlot: (user: User) => void;
}

const calculateMatchScore = (user: User): { score: number; hardMatches: string[]; hardGaps: string[]; softMatches: string[]; softGaps: string[]; bonusSkills: string[]; seniorityMatch: 'match' | 'above' | 'below' } => {
  const required = user.requiredProfile;
  const userSoftSkills = user.karmaData?.softSkills || [];
  const userSeniority = user.karmaData?.seniorityAssessment;
  
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
  
  // Seniority comparison
  let seniorityMatch: 'match' | 'above' | 'below' = 'match';
  if (required?.seniority && userSeniority) {
    const reqLevel = SENIORITY_LEVELS[required.seniority] || 0;
    const userLevel = SENIORITY_LEVELS[userSeniority] || 0;
    if (userLevel > reqLevel) seniorityMatch = 'above';
    else if (userLevel < reqLevel) seniorityMatch = 'below';
  }
  
  // Calculate overall score
  const totalRequired = (required?.softSkills?.length || 0) + (required?.hardSkills?.length || 0) + (required?.seniority ? 1 : 0);
  const matches = softMatches.length + (seniorityMatch !== 'below' ? 1 : 0);
  const score = totalRequired > 0 ? Math.round((matches / totalRequired) * 100) : 100;
  
  return { score: Math.min(score, 100), hardMatches, hardGaps, softMatches, softGaps, bonusSkills, seniorityMatch };
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
  onClose, 
  onViewFullProfile, 
  onAssignUser,
  onInviteToSlot,
  onRemoveFromSlot
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAssignSection, setShowAssignSection] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  
  const match = useMemo(() => calculateMatchScore(user), [user]);
  const required = user.requiredProfile;
  
  // Check if this is an empty slot or hiring position
  const isEmptySlot = !user.firstName && !user.lastName;
  const isHiringSlot = user.isHiring === true;
  const needsAssignment = isEmptySlot || isHiringSlot;
  
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
  
  // Internal candidates ranked by match score (for hiring slots)
  const internalCandidates = useMemo(() => {
    if (!isHiringSlot) return [];
    
    return allUsers
      .filter(u => u.id !== user.id && !u.isHiring && u.firstName && u.lastName)
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
            <label className="block text-sm font-bold text-purple-700 dark:text-purple-300 mb-3 flex items-center gap-2">
              <Shuffle size={16}/> Candidati Interni (Job Rotation)
            </label>
            <p className="text-xs text-purple-600 dark:text-purple-400 mb-3">
              Migliori match interni per questo ruolo:
            </p>
            
            <div className="space-y-2">
              {internalCandidates.map((candidate, index) => (
                <div 
                  key={candidate.user.id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-100 dark:border-purple-700 hover:shadow-md transition-all"
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
                    <div className="flex gap-1 mt-1">
                      <button 
                        onClick={() => onAssignUser(user.id, candidate.user.id)}
                        className="text-[10px] px-2 py-1 bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 rounded hover:bg-purple-200 dark:hover:bg-purple-700 transition-colors flex items-center gap-1"
                      >
                        <ArrowRight size={10}/> Assegna
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
        
        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
          {!isEmptySlot && !isHiringSlot && (
            <>
              <Button fullWidth onClick={onViewFullProfile} className="flex items-center justify-center gap-2">
                <ExternalLink size={16}/> Vai al Profilo Completo
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setShowRemoveConfirm(true)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-1"
              >
                <Trash2 size={16}/> Rimuovi
              </Button>
            </>
          )}
          <Button variant="ghost" onClick={onClose}>Chiudi</Button>
        </div>
      </Card>
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
    onInviteUser: (nodeId: string) => void,
    onSelectUserForComparison: (user: User) => void,
    companyValues?: string[],
    parentManager?: User
): React.ReactNode => {
    if (!node.children || node.children.length === 0) return null;

    // Find current node's manager to pass to children
    const nodeUsers = users.filter(u => u.departmentId === node.id);
    const currentManager = findNodeManager(nodeUsers, node);

    return node.children.map(child => {
        const childNodeUsers = users.filter(u => u.departmentId === child.id);
        const childManager = findNodeManager(childNodeUsers, child);

        return (
            <React.Fragment key={child.id}>
                <TreeNode
                    label={
                        <div className="inline-block">
                            <OrgNodeCard
                                node={child}
                                users={users}
                                onAddNode={onAddNode}
                                onEditNode={onEditNode}
                                onInviteUser={onInviteUser}
                                onSelectUserForComparison={onSelectUserForComparison}
                                companyValues={companyValues}
                                parentManager={currentManager}
                            />
                        </div>
                    }
                >
                    {renderOrgTreeChildren(
                        child,
                        users,
                        onAddNode,
                        onEditNode,
                        onInviteUser,
                        onSelectUserForComparison,
                        companyValues,
                        childManager
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
}> = ({ company, users, onUpdateStructure, onUpdateUsers, onViewUser }) => {
    const [editingNode, setEditingNode] = useState<OrgNode | null>(null);
    const [inviteNodeId, setInviteNodeId] = useState<string | null>(null);
    const [inviteName, setInviteName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('');
    const [selectedUserForComparison, setSelectedUserForComparison] = useState<User | null>(null);
    
    // State for InviteToSlotModal (simplified invite for existing slots)
    const [inviteToSlotUser, setInviteToSlotUser] = useState<User | null>(null);
    
    // Required Profile state for new member
    const [inviteHardSkills, setInviteHardSkills] = useState<string[]>([]);
    const [inviteSoftSkills, setInviteSoftSkills] = useState<string[]>([]);
    const [inviteSeniority, setInviteSeniority] = useState<SeniorityLevel>('Mid');
    const [newHardSkill, setNewHardSkill] = useState('');
    const [newSoftSkill, setNewSoftSkill] = useState('');
    const [isHiring, setIsHiring] = useState(false);
    
    // Use the company members hook for DB persistence
    const { createCompanyMember, assignUserToSlot, deleteCompanyMember, isLoading: isSaving } = useCompanyMembers();

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

    const handleInviteUser = async () => {
        // Job Title is the ONLY required field
        if (!inviteRole || !inviteNodeId) {
            return;
        }
        
        // Save to database
        const result = await createCompanyMember({
            companyId: company.id,
            departmentId: inviteNodeId,
            jobTitle: inviteRole,
            firstName: inviteName ? inviteName.split(' ')[0] : undefined,
            lastName: inviteName ? inviteName.split(' ').slice(1).join(' ') : undefined,
            email: inviteEmail || undefined,
            isHiring: isHiring,
            requiredProfile: {
                hardSkills: inviteHardSkills,
                softSkills: inviteSoftSkills,
                seniority: inviteSeniority
            }
        });
        
        if (result.success) {
            // Create local user object for UI
            const newUser: User = {
                id: result.memberId || `u_${Date.now()}`,
                firstName: inviteName ? inviteName.split(' ')[0] : '',
                lastName: inviteName ? inviteName.split(' ').slice(1).join(' ') : '',
                email: inviteEmail || '',
                companyId: company.id,
                status: isHiring ? 'pending' : (inviteEmail ? 'invited' : 'pending'),
                jobTitle: inviteRole,
                departmentId: inviteNodeId,
                isHiring: isHiring,
                requiredProfile: {
                    hardSkills: inviteHardSkills,
                    softSkills: inviteSoftSkills,
                    seniority: inviteSeniority
                }
            };
            const updatedUsers = [...users, newUser];
            onUpdateUsers(updatedUsers);
            
            toast({
                title: isHiring ? "Posizione creata" : "Invito inviato",
                description: isHiring 
                    ? `Posizione "${inviteRole}" creata con successo` 
                    : inviteName 
                        ? `${inviteName} è stato invitato per la posizione ${inviteRole}`
                        : `Posizione "${inviteRole}" aggiunta all'organigramma`,
            });
        } else {
            toast({
                title: "Errore",
                description: result.error || "Impossibile completare l'operazione",
                variant: "destructive",
            });
        }
        
        // Reset form
        setInviteNodeId(null);
        setInviteName('');
        setInviteEmail('');
        setInviteRole('');
        setInviteHardSkills([]);
        setInviteSoftSkills([]);
        setInviteSeniority('Mid');
        setNewHardSkill('');
        setNewSoftSkill('');
        setIsHiring(false);
    };
    
    const addInviteHardSkill = () => {
        if (newHardSkill && !inviteHardSkills.includes(newHardSkill)) {
            setInviteHardSkills([...inviteHardSkills, newHardSkill]);
            setNewHardSkill('');
        }
    };
    
    const addInviteSoftSkill = () => {
        if (newSoftSkill && !inviteSoftSkills.includes(newSoftSkill)) {
            setInviteSoftSkills([...inviteSoftSkills, newSoftSkill]);
            setNewSoftSkill('');
        }
    };

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
            {inviteNodeId && (
                <div className="fixed inset-0 bg-black/50 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
                    <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold dark:text-gray-100">Aggiungi Ruolo/Persona al Nodo</h3>
                            <button onClick={() => setInviteNodeId(null)}><X className="text-gray-400 hover:text-red-500" /></button>
                        </div>
                        <div className="space-y-4">
                            {/* Basic Info - Job Title is REQUIRED, others optional */}
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                                        Ruolo/Job Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        required
                                        className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="Es. Marketing Manager, Senior Developer..."
                                        value={inviteRole}
                                        onChange={e => setInviteRole(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                                        Nome e Cognome <span className="text-gray-400 text-[10px]">(opzionale)</span>
                                    </label>
                                    <input
                                        className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="Se conosci già chi occuperà questo ruolo"
                                        value={inviteName}
                                        onChange={e => setInviteName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                                        Email Aziendale <span className="text-gray-400 text-[10px]">(opzionale)</span>
                                    </label>
                                    <input
                                        className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="Per inviare l'invito ai test"
                                        value={inviteEmail}
                                        onChange={e => setInviteEmail(e.target.value)}
                                    />
                                </div>
                                
                                {/* Hiring Checkbox */}
                                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                                    <input 
                                        type="checkbox" 
                                        id="isHiring"
                                        checked={isHiring}
                                        onChange={e => setIsHiring(e.target.checked)}
                                        className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                                    />
                                    <label htmlFor="isHiring" className="text-sm font-bold text-green-800 dark:text-green-200 cursor-pointer select-none flex items-center gap-2">
                                        <Search size={16}/> Posizione in Hiring (aperta)
                                    </label>
                                </div>
                            </div>

                            {/* Required Profile Section */}
                            <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                                <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                    <Target size={16}/> Profilo Richiesto per questo Ruolo
                                </h4>
                                
                                {/* Seniority */}
                                <div className="mb-4">
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Seniority</label>
                                    <select
                                        className="w-full p-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={inviteSeniority}
                                        onChange={e => setInviteSeniority(e.target.value as SeniorityLevel)}
                                    >
                                        {SENIORITY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>

                                {/* Hard Skills */}
                                <div className="mb-4">
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Hard Skills Richieste</label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            className="flex-1 p-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            placeholder="Es. Python, Excel, SQL..."
                                            value={newHardSkill}
                                            onChange={e => setNewHardSkill(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addInviteHardSkill())}
                                        />
                                        <button type="button" onClick={addInviteHardSkill} className="px-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                                            <Plus size={16}/>
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {inviteHardSkills.map(skill => (
                                            <span key={skill} className="px-2 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded text-xs border border-blue-100 dark:border-blue-800 flex items-center gap-1">
                                                {skill}
                                                <button type="button" onClick={() => setInviteHardSkills(inviteHardSkills.filter(s => s !== skill))}>
                                                    <X size={12}/>
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Soft Skills */}
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Soft Skills Richieste</label>
                                    <div className="flex gap-2 mb-2">
                                        <select
                                            className="flex-1 p-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            value={newSoftSkill}
                                            onChange={e => setNewSoftSkill(e.target.value)}
                                        >
                                            <option value="">Seleziona skill...</option>
                                            {SOFT_SKILLS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        <button type="button" onClick={addInviteSoftSkill} className="px-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                                            <Plus size={16}/>
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {inviteSoftSkills.map(skill => (
                                            <span key={skill} className="px-2 py-1 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded text-xs border border-purple-100 dark:border-purple-800 flex items-center gap-1">
                                                {skill}
                                                <button type="button" onClick={() => setInviteSoftSkills(inviteSoftSkills.filter(s => s !== skill))}>
                                                    <X size={12}/>
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <Button fullWidth onClick={handleInviteUser}>Conferma</Button>
                                <Button variant="ghost" onClick={() => setInviteNodeId(null)}>Annulla</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            <div className="mb-8 text-center">
                 <h2 className="text-3xl font-brand font-bold dark:text-gray-100">Organigramma Aziendale</h2>
                 <p className="text-gray-500">Struttura gerarchica e funzionale di {company.name}</p>
                 <div className="flex justify-center gap-6 mt-4 text-xs font-bold text-gray-500">
                     <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Clima Critico (&lt;3)</div>
                     <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-400"></div> Clima Neutro (3-4)</div>
                     <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Clima Ottimo (&gt;4)</div>
                     <div className="w-px h-4 bg-gray-300 mx-2"></div>
                     <div className="flex items-center gap-1 text-blue-500"><Building size={12}/> Fit Culturale</div>
                     <div className="flex items-center gap-1 text-green-600"><Handshake size={12}/> Fit Manager (Liv. Superiore)</div>
                 </div>
            </div>
            <div className="pb-20 overflow-x-auto">
                <div className="w-fit mx-auto">
                    <Tree
                        lineWidth="2px"
                        lineColor="rgb(209, 213, 219)"
                        lineBorderRadius="8px"
                        lineHeight="32px"
                        nodePadding="16px"
                        label={
                            <div className="inline-block">
                                <OrgNodeCard
                                    node={company.structure}
                                    users={users}
                                    onAddNode={handleAddNode}
                                    onEditNode={setEditingNode}
                                    onInviteUser={(nodeId) => setInviteNodeId(nodeId)}
                                    onSelectUserForComparison={setSelectedUserForComparison}
                                    companyValues={company.cultureValues}
                                    parentManager={undefined}
                                />
                            </div>
                        }
                    >
                        {renderOrgTreeChildren(company.structure, users, handleAddNode, setEditingNode, setInviteNodeId, setSelectedUserForComparison, company.cultureValues)}
                    </Tree>
                </div>
            </div>
            {selectedUserForComparison && (
                <RoleComparisonModal
                    user={selectedUserForComparison}
                    allUsers={users}
                    orgStructure={company.structure}
                    onClose={() => setSelectedUserForComparison(null)}
                    onViewFullProfile={() => {
                        onViewUser(selectedUserForComparison.id);
                        setSelectedUserForComparison(null);
                    }}
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
        </div>
    );
};