import React, { useEffect, useState, useMemo } from 'react';
import { ArrowLeft, User, Briefcase, MapPin, Award, CheckCircle, XCircle, AlertCircle, Search, Filter, Loader2, Shuffle, Building, ArrowRight, Users, TrendingDown, Plus, ListChecks, Eye, Lightbulb } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { useOpenPositions, OpenPosition } from '../../src/hooks/useOpenPositions';
import { useTalentSearch } from '../../src/hooks/useTalentSearch';

import { usePositionShortlist } from '../../src/hooks/usePositionShortlist';
import { CompanyProfile, SeniorityLevel, User as LegacyUser, RequiredProfile } from '../../types';
import { getMatchQuality } from '../../src/utils/matchingEngine';
import type { CandidateMatch } from '../../src/types/karma';
import type { ShortlistUser } from '../../src/types/shortlist';
import { ShortlistTab } from '../../src/components/shortlist/ShortlistTab';
import { MatchScorePopover, MatchBreakdown } from '../../src/components/shortlist/MatchScorePopover';
import { supabase } from '../../src/integrations/supabase/client';
import { useToast } from '../../src/hooks/use-toast';
import { GenerationBadge } from '../../src/components/GenerationBadge';
import { SynergyBadge } from '../../src/components/SynergyBadge';
import { analyzeSynergy, UserWithGeneration } from '../../services/generationService';

interface PositionMatchingViewProps {
  positionId: string;
  company: CompanyProfile;
  companyUsers: LegacyUser[];
  onBack: () => void;
  onViewCandidate: (userId: string) => void;
  onAssignInternal: (slotId: string, userId: string) => void;
}

const SENIORITY_LABELS: Record<SeniorityLevel, string> = {
  'Junior': 'Junior',
  'Mid': 'Mid-Level',
  'Senior': 'Senior',
  'Lead': 'Lead',
  'C-Level': 'C-Level',
};

const SENIORITY_LEVELS: Record<SeniorityLevel, number> = { 
  'Junior': 1, 'Mid': 2, 'Senior': 3, 'Lead': 4, 'C-Level': 5 
};

// Calculate match for internal candidates with seniority penalty
const calculateInternalMatch = (candidate: LegacyUser, required: RequiredProfile | undefined): { 
  score: number; 
  softMatches: string[]; 
  softGaps: string[]; 
  hardMatches: string[];
  hardGaps: string[];
  seniorityMatch: 'match' | 'above' | 'below';
  seniorityPenalty: number;
} => {
  if (!required) return { score: 100, softMatches: [], softGaps: [], hardMatches: [], hardGaps: [], seniorityMatch: 'match', seniorityPenalty: 0 };
  
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
  
  // Hard skills - we don't have user hard skills data, so all required are gaps
  const hardMatches: string[] = [];
  const hardGaps: string[] = required.hardSkills || [];
  
  // Seniority comparison with penalty system
  let seniorityMatch: 'match' | 'above' | 'below' = 'match';
  let seniorityScore = 100;
  let seniorityPenalty = 0;
  
  if (required.seniority && userSeniority) {
    const reqLevel = SENIORITY_LEVELS[required.seniority] || 0;
    const userLevel = SENIORITY_LEVELS[userSeniority] || 0;
    const levelDiff = userLevel - reqLevel;
    
    if (levelDiff === 0) {
      // Perfect match
      seniorityMatch = 'match';
      seniorityScore = 100;
    } else if (levelDiff > 0) {
      // Candidate is over-senior (e.g., C-Level for Junior)
      // Heavy penalty: 30% per level above
      seniorityPenalty = Math.min(levelDiff * 30, 100);
      seniorityScore = Math.max(0, 100 - seniorityPenalty);
      seniorityMatch = 'above';
    } else {
      // Candidate is under-senior
      // Light penalty: 15% per level below
      seniorityScore = Math.max(0, 100 + (levelDiff * 15));
      seniorityMatch = 'below';
    }
  }
  
  // Calculate overall score
  const softSkillsWeight = 0.5;
  const seniorityWeight = 0.5;
  
  const softSkillScore = (required.softSkills?.length || 0) > 0 
    ? (softMatches.length / required.softSkills.length) * 100 
    : 100;
  
  const finalScore = Math.round(
    (softSkillScore * softSkillsWeight) + (seniorityScore * seniorityWeight)
  );
  
  return { 
    score: Math.max(0, Math.min(finalScore, 100)), 
    softMatches, 
    softGaps, 
    hardMatches, 
    hardGaps, 
    seniorityMatch,
    seniorityPenalty
  };
};

const getScoreColor = (score: number) => {
  if (score >= 75) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-600';
};

const getMedalIcon = (index: number) => {
  if (index === 0) return <span className="text-yellow-500">🥇</span>;
  if (index === 1) return <span className="text-gray-400">🥈</span>;
  if (index === 2) return <span className="text-amber-600">🥉</span>;
  return <span className="text-gray-400">{index + 1}.</span>;
};

export const PositionMatchingView: React.FC<PositionMatchingViewProps> = ({
  positionId,
  company,
  companyUsers,
  onBack,
  onViewCandidate,
  onAssignInternal,
}) => {
  const { getPositionById } = useOpenPositions();
  const { candidates, isLoading: searchLoading, searchCandidates } = useTalentSearch();
  
  const { toast } = useToast();

  const [position, setPosition] = useState<OpenPosition | null>(null);
  const [positionLoading, setPositionLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyLooking, setShowOnlyLooking] = useState(true);
  const [activeTab, setActiveTab] = useState<'internal' | 'external' | 'shortlist'>('internal');
  const [nodeNames, setNodeNames] = useState<Record<string, string>>({});
  
  // Popover state for match breakdown
  const [selectedCandidatePopover, setSelectedCandidatePopover] = useState<{
    name: string;
    type: 'internal' | 'external';
    breakdown: MatchBreakdown;
    candidateData: typeof internalCandidates[0] | CandidateMatch;
  } | null>(null);

  // Shortlist hook - initialized after position is loaded
  const {
    candidates: shortlistCandidates,
    isLoading: shortlistLoading,
    addInternalCandidate,
    addExternalCandidate,
    removeCandidate,
    updateCandidate,
    buildUnifiedCandidates,
    isInShortlist
  } = usePositionShortlist(positionId, company.id);

  // Fetch node names for "Attualmente in:" display
  useEffect(() => {
    const fetchNodeNames = async () => {
      const { data } = await supabase
        .from('org_nodes')
        .select('id, name')
        .eq('company_id', company.id);
      
      const map: Record<string, string> = {};
      (data || []).forEach(n => { map[n.id] = n.name; });
      setNodeNames(map);
    };
    fetchNodeNames();
  }, [company.id]);

  // Load position details
  useEffect(() => {
    const loadPosition = async () => {
      setPositionLoading(true);
      const pos = await getPositionById(positionId);
      setPosition(pos);
      setPositionLoading(false);

      // Auto-search when position is loaded
      if (pos) {
        const requiredSkills = pos.requiredProfile?.hardSkills || [];
        const seniorityLevels = pos.requiredProfile?.seniority ? [pos.requiredProfile.seniority] : undefined;
        
        await searchCandidates(
          {
            lookingForWorkOnly: showOnlyLooking,
            seniorityLevels: seniorityLevels as SeniorityLevel[] | undefined,
            query: searchQuery || undefined,
          },
          undefined, // targetRiasec - could be derived from position in future
          requiredSkills
        );
      }
    };
    loadPosition();
  }, [positionId, getPositionById]);

  // Re-search when filters change
  const handleSearch = async () => {
    if (!position) return;
    
    const requiredSkills = position.requiredProfile?.hardSkills || [];
    const seniorityLevels = position.requiredProfile?.seniority ? [position.requiredProfile.seniority] : undefined;
    
    await searchCandidates(
      {
        lookingForWorkOnly: showOnlyLooking,
        seniorityLevels: seniorityLevels as SeniorityLevel[] | undefined,
        query: searchQuery || undefined,
      },
      undefined,
      requiredSkills
    );
  };

  const isLoading = positionLoading || searchLoading;

  // Internal candidates ranked by match score, filtered for over-senior
  const internalCandidates = useMemo(() => {
    if (!position) return [];
    
    const requiredLevel = SENIORITY_LEVELS[position.requiredProfile?.seniority as SeniorityLevel] || 0;
    
    return companyUsers
      .filter(u => {
        if (!u.firstName || !u.lastName || u.isHiring) return false;
        
        // Filter out candidates who are more than 1 level above required
        const userSeniority = u.karmaData?.seniorityAssessment as SeniorityLevel | undefined;
        if (userSeniority && requiredLevel > 0) {
          const userLevel = SENIORITY_LEVELS[userSeniority] || 0;
          const levelDiff = userLevel - requiredLevel;
          // Allow: same level, 1 below, or max 1 above
          if (levelDiff > 1) return false;
        }
        return true;
      })
      .map(candidate => ({
        user: candidate,
        matchData: calculateInternalMatch(candidate, position.requiredProfile as RequiredProfile),
        currentDepartment: candidate.departmentId ? (nodeNames[candidate.departmentId] || 'Caricamento...') : 'Non assegnato'
      }))
      .sort((a, b) => b.matchData.score - a.matchData.score)
      .slice(0, 10);
  }, [companyUsers, position, nodeNames]);

  // Filter external candidates by search query
  const filteredCandidates = useMemo(() => {
    if (!searchQuery) return candidates;
    const query = searchQuery.toLowerCase();
    return candidates.filter(c => {
      const name = `${c.profile.firstName || ''} ${c.profile.lastName || ''}`.toLowerCase();
      const headline = (c.profile.headline || '').toLowerCase();
      return name.includes(query) || headline.includes(query);
    });
  }, [candidates, searchQuery]);

  // Build unified candidates for shortlist display
  const unifiedShortlistCandidates = useMemo(() => {
    const internalUsersMap: ShortlistUser[] = companyUsers.map(u => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      avatarUrl: u.avatarUrl,
      jobTitle: u.jobTitle,
      seniority: u.karmaData?.seniorityAssessment,
      yearsExperience: u.yearsExperience,
      location: u.location,
      profileCode: u.profileCode,
      riasecScore: u.riasecScore,
      karmaData: u.karmaData
    }));
    return buildUnifiedCandidates(shortlistCandidates, internalUsersMap);
  }, [shortlistCandidates, companyUsers, buildUnifiedCandidates]);

  // Handler to add internal candidate to shortlist
  const handleAddInternalToShortlist = async (candidate: typeof internalCandidates[0]) => {
    const user: ShortlistUser = {
      id: candidate.user.id,
      firstName: candidate.user.firstName,
      lastName: candidate.user.lastName,
      email: candidate.user.email,
      avatarUrl: candidate.user.avatarUrl,
      jobTitle: candidate.user.jobTitle,
      seniority: candidate.user.karmaData?.seniorityAssessment,
      riasecScore: candidate.user.riasecScore,
      profileCode: candidate.user.profileCode,
      karmaData: candidate.user.karmaData
    };
    
    const success = await addInternalCandidate(user, {
      matchScore: candidate.matchData.score,
      skillsOverlap: candidate.matchData.softMatches,
      missingSkills: candidate.matchData.softGaps,
      seniorityMatch: candidate.matchData.seniorityMatch === 'match'
    });
    
    if (success) {
      toast({
        title: "Aggiunto alla shortlist",
        description: `${candidate.user.firstName} ${candidate.user.lastName} è stato aggiunto alla shortlist`
      });
    }
  };

  // Handler to add external candidate to shortlist
  const handleAddExternalToShortlist = async (match: CandidateMatch) => {
    const success = await addExternalCandidate(match);
    if (success) {
      toast({
        title: "Aggiunto alla shortlist",
        description: `${match.profile.firstName} ${match.profile.lastName} è stato aggiunto alla shortlist`
      });
    }
  };

  const handleOpenInternalPopover = (candidate: typeof internalCandidates[0]) => {
    setSelectedCandidatePopover({
      name: `${candidate.user.firstName} ${candidate.user.lastName}`,
      type: 'internal',
      breakdown: {
        totalScore: candidate.matchData.score,
        softSkillsMatched: candidate.matchData.softMatches,
        softSkillsMissing: candidate.matchData.softGaps,
        hardSkillsMatched: candidate.matchData.hardMatches,
        hardSkillsMissing: candidate.matchData.hardGaps,
        seniorityMatch: candidate.matchData.seniorityMatch,
        candidateSeniority: candidate.user.karmaData?.seniorityAssessment,
        requiredSeniority: position?.requiredProfile?.seniority as string | undefined,
        candidateProfileCode: candidate.user.profileCode,
      },
      candidateData: candidate,
    });
  };

  const handleOpenExternalPopover = (match: CandidateMatch) => {
    setSelectedCandidatePopover({
      name: `${match.profile.firstName || 'Utente'} ${match.profile.lastName || ''}`,
      type: 'external',
      breakdown: {
        totalScore: match.matchScore,
        riasecMatch: match.riasecMatch,
        skillsMatch: match.skillsMatch,
        hardSkillsMatched: match.skillsOverlap,
        hardSkillsMissing: match.missingSkills,
        seniorityMatch: match.seniorityMatch ? 'match' : 'below',
        candidateSeniority: match.profile.karmaData?.seniorityAssessment,
        requiredSeniority: position?.requiredProfile?.seniority as string | undefined,
        candidateProfileCode: match.profile.profileCode,
      },
      candidateData: match,
    });
  };

  // Get hiring manager for synergy calculation (if position has one)
  const hiringManager = useMemo((): UserWithGeneration | null => {
    // Try to find the manager associated with this position's org node
    if (!position?.nodeId) return null;
    const manager = companyUsers.find(u => u.departmentId === position.nodeId && u.isHiring);
    if (!manager) return null;
    return {
      birthDate: manager.birthDate,
      age: manager.age,
      hardSkills: manager.hardSkills?.map(s => ({ 
        name: typeof s === 'string' ? s : s.name,
        proficiencyLevel: typeof s === 'object' ? s.proficiencyLevel : undefined
      }))
    };
  }, [position, companyUsers]);

  const renderInternalCandidate = (candidate: typeof internalCandidates[0], index: number) => {
    const isOverSenior = candidate.matchData.seniorityMatch === 'above';
    
    // Calculate synergy with hiring manager
    const candidateForSynergy: UserWithGeneration = {
      birthDate: candidate.user.birthDate,
      age: candidate.user.age,
      hardSkills: candidate.user.hardSkills?.map(s => ({
        name: typeof s === 'string' ? s : s.name,
        proficiencyLevel: typeof s === 'object' ? s.proficiencyLevel : undefined
      }))
    };
    const synergyResult = hiringManager ? analyzeSynergy(candidateForSynergy, hiringManager) : null;
    
    return (
      <div 
        key={candidate.user.id}
        onClick={() => handleOpenInternalPopover(candidate)}
        className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-100 dark:border-purple-700 hover:shadow-md transition-all cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="text-lg">{getMedalIcon(index)}</div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-sm font-bold text-white">
            {candidate.user.firstName?.[0]}{candidate.user.lastName?.[0]}
          </div>
          <div>
            <div className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              {candidate.user.firstName} {candidate.user.lastName}
              <GenerationBadge birthDate={candidate.user.birthDate} age={candidate.user.age} size="xs" />
            </div>
            <div className="text-[10px] text-gray-500 flex items-center gap-2">
              <span>{candidate.user.karmaData?.seniorityAssessment || 'N/A'} - {candidate.user.jobTitle}</span>
              {isOverSenior && (
                <span className="flex items-center gap-0.5 text-orange-500">
                  <TrendingDown size={10} /> Seniority alta
                </span>
              )}
            </div>
            <div className="text-[9px] text-purple-500 dark:text-purple-400 flex items-center gap-1">
              <Building size={9}/> Attualmente in: {candidate.currentDepartment}
            </div>
            {synergyResult && synergyResult.type !== 'None' && (
              <div className="mt-1">
                <SynergyBadge synergyResult={synergyResult} size="xs" />
              </div>
            )}
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
          <div className="flex items-center gap-1">
            {!isInShortlist(candidate.user.id, 'internal') ? (
              <button 
                onClick={(e) => { e.stopPropagation(); handleAddInternalToShortlist(candidate); }}
                className="text-[10px] px-2.5 py-1.5 bg-slate-800 dark:bg-slate-700 text-white rounded-md hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors flex items-center gap-1 font-medium"
              >
                <Plus size={10}/> Shortlist
              </button>
            ) : (
              <span className="text-[10px] px-2 py-1 bg-green-100 text-green-700 rounded flex items-center gap-1">
                <CheckCircle size={10}/> In Shortlist
              </span>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); onAssignInternal(positionId, candidate.user.id); }}
              className="text-[10px] px-2 py-1 bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 rounded hover:bg-purple-200 dark:hover:bg-purple-700 transition-colors flex items-center gap-1"
            >
              <ArrowRight size={10}/> Assegna
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderExternalCandidate = (candidate: CandidateMatch, index: number) => {
    const { profile, matchScore, riasecMatch, skillsMatch, skillsOverlap, missingSkills, seniorityMatch } = candidate;
    const quality = getMatchQuality(matchScore);
    
    // Calculate synergy with hiring manager
    const candidateForSynergy: UserWithGeneration = {
      birthDate: profile.birthDate,
      age: profile.age,
      hardSkills: profile.hardSkills?.map(s => ({
        name: s.skill?.name || s.customSkillName || 'Unknown',
        proficiencyLevel: s.proficiencyLevel
      }))
    };
    const synergyResult = hiringManager ? analyzeSynergy(candidateForSynergy, hiringManager) : null;
    
    return (
      <Card 
        key={profile.id} 
        className="relative cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => handleOpenExternalPopover(candidate)}
      >

        <div className="flex flex-col md:flex-row md:items-start gap-4">
          {/* Avatar & Basic Info */}
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-bold">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span>{(profile.firstName?.[0] || 'U').toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-gray-900 dark:text-white truncate">
                  {profile.firstName || 'Utente'} {profile.lastName || ''}
                </h3>
                <GenerationBadge birthDate={profile.birthDate} age={profile.age} size="sm" />
                {profile.lookingForWork ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 font-medium">
                    <Briefcase size={10} />
                    In cerca
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-medium">
                    <Eye size={10} />
                    Passivo
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {profile.headline || profile.jobTitle || 'Professionista'}
              </p>
              {profile.location && (
                <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-1">
                  <MapPin size={12} />
                  {profile.location}
                </p>
              )}
              {synergyResult && synergyResult.type !== 'None' && (
                <div className="mt-1.5">
                  <SynergyBadge synergyResult={synergyResult} size="sm" showReason />
                </div>
              )}
            </div>
          </div>

          {/* Match Score */}
          <div className="flex flex-col items-center md:items-end gap-2">
            <div className={`px-3 py-1.5 rounded-full ${quality.bgColor}`}>
              <span className={`font-bold text-lg ${quality.color}`}>{matchScore}%</span>
            </div>
            <span className={`text-xs font-medium ${quality.color}`}>{quality.label}</span>
          </div>
        </div>

        {/* Match Breakdown */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">RIASEC</p>
              <p className="font-bold text-gray-900 dark:text-white">{riasecMatch}%</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Skills</p>
              <p className="font-bold text-gray-900 dark:text-white">{skillsMatch}%</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Seniority</p>
              <p className={`font-bold ${seniorityMatch ? 'text-green-600' : 'text-gray-400'}`}>
                {seniorityMatch ? '✓' : '-'}
              </p>
            </div>
          </div>

          {/* Skills Tags */}
          {(skillsOverlap.length > 0 || missingSkills.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {skillsOverlap.slice(0, 3).map((skill, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  <CheckCircle size={10} />
                  {skill}
                </span>
              ))}
              {missingSkills.slice(0, 2).map((skill, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                  <XCircle size={10} />
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex gap-2" onClick={(e) => e.stopPropagation()}>
          {!isInShortlist(profile.id, 'external') ? (
            <button 
              onClick={(e) => { e.stopPropagation(); handleAddExternalToShortlist(candidate); }}
              className="px-3 py-1.5 bg-slate-800 dark:bg-slate-700 text-white text-sm rounded-md hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors flex items-center gap-1 font-medium"
            >
              <Plus size={14}/> Shortlist
            </button>
          ) : (
            <span className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg flex items-center gap-1">
              <CheckCircle size={14}/> In Shortlist
            </span>
          )}
          <Button 
            fullWidth 
            variant="ghost"
            onClick={(e) => { e.stopPropagation(); onViewCandidate(profile.id); }}
          >
            Visualizza Profilo
          </Button>
        </div>
      </Card>
    );
  };

  if (isLoading && !position) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Caricamento posizione...</p>
      </div>
    );
  }

  if (!position) {
    return (
      <div className="p-8 text-center">
        <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Posizione non trovata</h2>
        <Button onClick={onBack}>Torna indietro</Button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="p-2">
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Candidati per: {position.jobTitle}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {position.departmentName ? `${position.departmentName} • ` : ''}
            {position.requiredProfile?.seniority || 'Qualsiasi seniority'}
          </p>
        </div>
      </div>

      {/* Position Requirements Summary */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
            <Briefcase size={24} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 dark:text-white mb-2">Requisiti della Posizione</h4>
            <div className="flex flex-wrap gap-2">
              {position.requiredProfile?.seniority && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                  {SENIORITY_LABELS[position.requiredProfile.seniority as SeniorityLevel]}
                </span>
              )}
              {(position.requiredProfile?.hardSkills || []).map((skill, i) => (
                <span key={i} className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                  {skill}
                </span>
              ))}
              {(position.requiredProfile?.hardSkills?.length || 0) === 0 && !position.requiredProfile?.seniority && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Nessun requisito specifico definito
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Tab Selector */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('internal')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'internal'
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Shuffle size={16} />
          Candidati Interni (Job Rotation)
          <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            {internalCandidates.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('external')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'external'
              ? 'border-green-500 text-green-600 dark:text-green-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Users size={16} />
          Candidati Esterni (Karma Talents)
          <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
            {filteredCandidates.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('shortlist')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'shortlist'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <ListChecks size={16} />
          Shortlist
          <span className={`px-2 py-0.5 rounded-full text-xs ${
            shortlistCandidates.length > 0 
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
              : 'bg-gray-100 text-gray-500'
          }`}>
            {shortlistCandidates.length}
          </span>
        </button>
      </div>

      {/* Internal Candidates Tab */}
      {activeTab === 'internal' && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-100 dark:border-purple-800">
            <div className="flex items-start gap-3">
              <Shuffle size={20} className="text-purple-600 dark:text-purple-400 mt-0.5" />
              <div>
                <h4 className="font-bold text-purple-800 dark:text-purple-200">Job Rotation</h4>
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  Dipendenti interni che potrebbero ricoprire questo ruolo. Considera una riassegnazione per valorizzare i talenti esistenti.
                </p>
              </div>
            </div>
          </Card>

          {internalCandidates.length > 0 ? (
            <div className="space-y-2">
              {internalCandidates.map((candidate, index) => renderInternalCandidate(candidate, index))}
            </div>
          ) : (
            <Card className="text-center py-8">
              <User size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Nessun candidato interno
              </h4>
              <p className="text-gray-500 dark:text-gray-400">
                Non ci sono dipendenti con un profilo compatibile per questa posizione.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* External Candidates Tab */}
      {activeTab === 'external' && (
        <div className="space-y-4">
          {/* Filters */}
          <Card>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cerca per nome o headline..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={showOnlyLooking}
                  onChange={(e) => setShowOnlyLooking(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Solo in cerca di lavoro
              </label>
              <Button onClick={handleSearch} disabled={searchLoading}>
                {searchLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Filter size={16} className="mr-2" />}
                Filtra
              </Button>
            </div>
          </Card>


          {/* Results */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white">
              {searchLoading ? 'Ricerca in corso...' : `${filteredCandidates.length} candidati esterni trovati`}
            </h3>

            {searchLoading && (
              <div className="text-center py-8">
                <Loader2 size={32} className="animate-spin text-green-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Ricerca candidati compatibili...</p>
              </div>
            )}

            {!searchLoading && filteredCandidates.length === 0 && (
              <Card className="text-center py-8">
                <User size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Nessun candidato trovato
                </h4>
                <p className="text-gray-500 dark:text-gray-400">
                  Prova a rimuovere alcuni filtri o modifica i requisiti della posizione.
                </p>
              </Card>
            )}

            {!searchLoading && filteredCandidates.map((candidate, index) => renderExternalCandidate(candidate, index))}
          </div>
        </div>
      )}

      {/* Shortlist Tab */}
      {activeTab === 'shortlist' && (
        <ShortlistTab
          candidates={unifiedShortlistCandidates}
          positionTitle={position.jobTitle}
          requiredSkills={position.requiredProfile?.hardSkills || []}
          targetRiasec={undefined}
          onRemoveCandidate={async (id) => {
            const success = await removeCandidate(id);
            if (success) {
              toast({ title: "Rimosso dalla shortlist" });
            }
          }}
          onUpdateCandidate={(id, updates) => updateCandidate(id, updates)}
          onViewProfile={(candidate) => {
            if (candidate.type === 'internal' && candidate.internalUserId) {
              // Could navigate to internal profile view
              console.log('View internal profile:', candidate.internalUserId);
            } else if (candidate.externalProfileId) {
              onViewCandidate(candidate.externalProfileId);
            }
          }}
          onSelectCandidate={(candidate) => {
            if (candidate.type === 'internal' && candidate.internalUserId) {
              onAssignInternal(positionId, candidate.internalUserId);
            } else {
              // For external candidates, could trigger invite flow
              toast({
                title: "Candidato selezionato",
                description: `${candidate.name} è stato selezionato per la posizione`
              });
            }
          }}
        />
      )}

      {/* Match Score Popover */}
      {selectedCandidatePopover && (
        <MatchScorePopover
          isOpen={true}
          onClose={() => setSelectedCandidatePopover(null)}
          candidateName={selectedCandidatePopover.name}
          candidateType={selectedCandidatePopover.type}
          breakdown={selectedCandidatePopover.breakdown}
          isInShortlist={
            selectedCandidatePopover.type === 'internal'
              ? isInShortlist((selectedCandidatePopover.candidateData as typeof internalCandidates[0]).user.id, 'internal')
              : isInShortlist((selectedCandidatePopover.candidateData as CandidateMatch).profile.id, 'external')
          }
          onAddToShortlist={() => {
            if (selectedCandidatePopover.type === 'internal') {
              handleAddInternalToShortlist(selectedCandidatePopover.candidateData as typeof internalCandidates[0]);
            } else {
              handleAddExternalToShortlist(selectedCandidatePopover.candidateData as CandidateMatch);
            }
          }}
          onViewProfile={() => {
            if (selectedCandidatePopover.type === 'internal') {
              onViewCandidate((selectedCandidatePopover.candidateData as typeof internalCandidates[0]).user.id);
            } else {
              onViewCandidate((selectedCandidatePopover.candidateData as CandidateMatch).profile.id);
            }
          }}
        />
      )}
    </div>
  );
};
