import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Users, 
  Briefcase, 
  MapPin, 
  Star,
  ChevronDown,
  ChevronUp,
  X,
  Target,
  Brain,
  Clock,
  Sparkles,
  Eye,
  Lock,
  ArrowLeft
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { useAuth } from '../../src/hooks/useAuth';
import { useTalentSearch } from '../../src/hooks/useTalentSearch';

import { useHardSkillsCatalog } from '../../src/hooks/useHardSkillsCatalog';
import { calculateMatchScore, getMatchQuality, MatchResult } from '../../src/utils/matchingEngine';
import type { TalentSearchFilters, WorkType, CandidateMatch } from '../../src/types/karma';
import type { RiasecScore, SeniorityLevel } from '../../types';

interface TalentSearchViewProps {
  onViewProfile?: (userId: string) => void;
  onBack?: () => void;
  targetRiasec?: RiasecScore;
  requiredSkills?: string[];
}

const RIASEC_DIMENSIONS = [
  { code: 'R', label: 'Realistico', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  { code: 'I', label: 'Investigativo', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { code: 'A', label: 'Artistico', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  { code: 'S', label: 'Sociale', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  { code: 'E', label: 'Intraprendente', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  { code: 'C', label: 'Convenzionale', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
];

const WORK_TYPES: { value: WorkType; label: string }[] = [
  { value: 'remote', label: 'Remoto' },
  { value: 'hybrid', label: 'Ibrido' },
  { value: 'onsite', label: 'In sede' },
  { value: 'any', label: 'Qualsiasi' },
];

const SENIORITY_LEVELS: { value: SeniorityLevel; label: string }[] = [
  { value: 'Junior', label: 'Junior' },
  { value: 'Mid', label: 'Mid-Level' },
  { value: 'Senior', label: 'Senior' },
  { value: 'Lead', label: 'Lead' },
  { value: 'C-Level', label: 'C-Level' },
];

export const TalentSearchView: React.FC<TalentSearchViewProps> = ({ 
  onViewProfile, 
  onBack,
  targetRiasec,
  requiredSkills: initialRequiredSkills 
}) => {
  const { membership } = useAuth();
  const { candidates, isLoading, searchCandidates } = useTalentSearch();
  
  const { skills: skillsCatalog } = useHardSkillsCatalog();
  
  const [filters, setFilters] = useState<TalentSearchFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [requiredSkills, setRequiredSkills] = useState<string[]>(initialRequiredSkills || []);
  const [matchResults, setMatchResults] = useState<Map<string, MatchResult>>(new Map());

  // Calculate match scores when candidates change
  useEffect(() => {
    if (!candidates.length) return;
    
    const newResults = new Map<string, MatchResult>();
    
    candidates.forEach(candidate => {
      const candidateSkills = candidate.profile.hardSkills?.map(s => 
        s.skill?.name || s.customSkillName || ''
      ).filter(Boolean) || [];
      
      const result = calculateMatchScore(
        {
          riasecScore: candidate.profile.riasecScore,
          skills: candidateSkills,
          seniorityLevel: candidate.profile.karmaData?.seniorityAssessment,
          workType: candidate.profile.preferredWorkType,
          yearsExperience: candidate.profile.yearsExperience,
        },
        {
          riasecScore: targetRiasec,
          requiredSkills,
          seniorityLevels: filters.seniorityLevels,
          workTypes: filters.workTypes,
          minExperience: filters.minExperience,
          maxExperience: filters.maxExperience,
        }
      );
      
      newResults.set(candidate.profile.id, result);
    });
    
    setMatchResults(newResults);
  }, [candidates, targetRiasec, requiredSkills, filters]);

  // Initial search on mount
  useEffect(() => {
    if (membership?.company_id) {
      searchCandidates(filters, targetRiasec, requiredSkills);
    }
  }, [membership?.company_id]);

  const handleSearch = () => {
    const newFilters = { ...filters, query: searchQuery || undefined };
    setFilters(newFilters);
    searchCandidates(newFilters, targetRiasec, requiredSkills);
  };

  const handleFilterChange = (key: keyof TalentSearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    searchCandidates(newFilters, targetRiasec, requiredSkills);
  };

  const toggleArrayFilter = (key: 'riasecCodes' | 'workTypes' | 'seniorityLevels' | 'skills', value: string) => {
    const currentArray = (filters[key] || []) as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(v => v !== value)
      : [...currentArray, value];
    handleFilterChange(key, newArray.length > 0 ? newArray : undefined);
  };

  const addRequiredSkill = (skillName: string) => {
    if (!requiredSkills.includes(skillName)) {
      const newSkills = [...requiredSkills, skillName];
      setRequiredSkills(newSkills);
      searchCandidates(filters, targetRiasec, newSkills);
    }
    setSkillSearchQuery('');
    setShowSkillDropdown(false);
  };

  const removeRequiredSkill = (skillName: string) => {
    const newSkills = requiredSkills.filter(s => s !== skillName);
    setRequiredSkills(newSkills);
    searchCandidates(filters, targetRiasec, newSkills);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setRequiredSkills([]);
    searchCandidates({}, targetRiasec, []);
  };

  // Filter skills for dropdown
  const filteredSkills = skillSearchQuery
    ? skillsCatalog.filter(s => 
        s.name.toLowerCase().includes(skillSearchQuery.toLowerCase()) &&
        !requiredSkills.includes(s.name)
      ).slice(0, 10)
    : [];

  // Sort candidates by calculated match score
  const sortedCandidates = [...candidates].sort((a, b) => {
    const scoreA = matchResults.get(a.profile.id)?.totalScore || 0;
    const scoreB = matchResults.get(b.profile.id)?.totalScore || 0;
    return scoreB - scoreA;
  });


  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
              <Sparkles className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-3xl font-brand font-bold text-gray-800 dark:text-white">
                Ricerca Talenti
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Trova i candidati ideali con il nostro algoritmo di matching
              </p>
            </div>
          </div>
        </div>
        
      </div>

      {/* Search & Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Cerca per nome, headline o competenze..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
          <Button onClick={handleSearch} className="bg-violet-600 hover:bg-violet-700 text-white">
            <Search className="w-4 h-4 mr-2" />
            Cerca
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'border-violet-500 text-violet-600' : ''}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtri
            {showFilters ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </Button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-6">
            {/* Required Skills */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Star className="w-4 h-4" />
                Competenze Richieste
              </p>
              <div className="relative">
                <input
                  type="text"
                  value={skillSearchQuery}
                  onChange={(e) => {
                    setSkillSearchQuery(e.target.value);
                    setShowSkillDropdown(true);
                  }}
                  onFocus={() => setShowSkillDropdown(true)}
                  placeholder="Cerca skill..."
                  className="w-full md:w-80 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
                {showSkillDropdown && filteredSkills.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full md:w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredSkills.map(skill => (
                      <button
                        key={skill.id}
                        onClick={() => addRequiredSkill(skill.name)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-white"
                      >
                        {skill.name}
                        {skill.category && (
                          <span className="ml-2 text-xs text-gray-500">({skill.category})</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {requiredSkills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {requiredSkills.map(skill => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm rounded"
                    >
                      {skill}
                      <button onClick={() => removeRequiredSkill(skill)} className="hover:text-violet-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Basic Filters */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.lookingForWorkOnly || false}
                  onChange={(e) => handleFilterChange('lookingForWorkOnly', e.target.checked || undefined)}
                  className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Solo in cerca di lavoro</span>
              </label>
            </div>

            {/* RIASEC Filter */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Profilo RIASEC
              </p>
              <div className="flex flex-wrap gap-2">
                {RIASEC_DIMENSIONS.map(dim => (
                  <button
                    key={dim.code}
                    onClick={() => toggleArrayFilter('riasecCodes', dim.code)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filters.riasecCodes?.includes(dim.code)
                        ? 'ring-2 ring-violet-500 ring-offset-2 ' + dim.color
                        : dim.color + ' opacity-60 hover:opacity-100'
                    }`}
                  >
                    {dim.code} - {dim.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Seniority Filter */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Seniority
              </p>
              <div className="flex flex-wrap gap-2">
                {SENIORITY_LEVELS.map(level => (
                  <button
                    key={level.value}
                    onClick={() => toggleArrayFilter('seniorityLevels', level.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      filters.seniorityLevels?.includes(level.value)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Work Type Filter */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Tipo di Lavoro
              </p>
              <div className="flex flex-wrap gap-2">
                {WORK_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => toggleArrayFilter('workTypes', type.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      filters.workTypes?.includes(type.value)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience Filter */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Anni di Esperienza
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="50"
                  placeholder="Min"
                  value={filters.minExperience ?? ''}
                  onChange={(e) => handleFilterChange('minExperience', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-20 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  min="0"
                  max="50"
                  placeholder="Max"
                  value={filters.maxExperience ?? ''}
                  onChange={(e) => handleFilterChange('maxExperience', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-20 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">anni</span>
              </div>
            </div>

            {/* Clear Filters */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={clearFilters} className="text-red-600 border-red-200 hover:bg-red-50">
                <X className="w-4 h-4 mr-2" />
                Resetta Filtri
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
        </div>
      ) : sortedCandidates.length === 0 ? (
        <Card className="p-12 text-center">
          <Users size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Nessun candidato trovato con i filtri selezionati.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {sortedCandidates.length} candidat{sortedCandidates.length === 1 ? 'o' : 'i'} trovat{sortedCandidates.length === 1 ? 'o' : 'i'}
          </p>
          
          {sortedCandidates.map(candidate => {
            const match = matchResults.get(candidate.profile.id);
            const quality = match ? getMatchQuality(match.totalScore) : null;
            
            return (
              <Card 
                key={candidate.profile.id} 
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => onViewProfile?.(candidate.profile.id)}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold overflow-hidden flex-shrink-0">
                    {candidate.profile.avatarUrl ? (
                      <img 
                        src={candidate.profile.avatarUrl} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      `${candidate.profile.firstName?.[0] || ''}${candidate.profile.lastName?.[0] || ''}`
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                          {candidate.profile.firstName} {candidate.profile.lastName}
                        </h3>
                        {candidate.profile.headline && (
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {candidate.profile.headline}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                          {candidate.profile.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {candidate.profile.location}
                            </span>
                          )}
                          {candidate.profile.yearsExperience !== undefined && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-4 h-4" />
                              {candidate.profile.yearsExperience} anni exp.
                            </span>
                          )}
                          {candidate.profile.karmaData?.seniorityAssessment && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">
                              <Brain className="w-3 h-3" />
                              {candidate.profile.karmaData.seniorityAssessment}
                            </span>
                          )}
                          {candidate.profile.profileCode && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-mono">
                              {candidate.profile.profileCode}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Match Score */}
                      {match && quality && (
                        <div className="text-right flex-shrink-0">
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${quality.bgColor}`}>
                            <Target className={`w-4 h-4 ${quality.color}`} />
                            <span className={`text-xl font-bold ${quality.color}`}>
                              {match.totalScore}%
                            </span>
                          </div>
                          <p className={`text-sm mt-1 ${quality.color}`}>
                            {quality.label}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Skills */}
                    {candidate.profile.hardSkills && candidate.profile.hardSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {candidate.profile.hardSkills.slice(0, 5).map(skill => {
                          const skillName = skill.skill?.name || skill.customSkillName || '';
                          const isMatching = match?.matchingSkills.includes(skillName);
                          return (
                            <span
                              key={skill.id}
                              className={`px-2 py-0.5 text-xs rounded ${
                                isMatching 
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 ring-1 ring-green-300' 
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                              }`}
                            >
                              {skillName}
                            </span>
                          );
                        })}
                        {candidate.profile.hardSkills.length > 5 && (
                          <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">
                            +{candidate.profile.hardSkills.length - 5} altre
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Match Breakdown */}
                    {match && (
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                        <span>RIASEC: {match.riasecScore}%</span>
                        <span>Skills: {match.skillsScore}%</span>
                        {match.seniorityMatch && (
                          <span className="text-green-600 dark:text-green-400">✓ Seniority</span>
                        )}
                        {match.workTypeMatch && (
                          <span className="text-green-600 dark:text-green-400">✓ Work Type</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* View Button */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewProfile?.(candidate.profile.id);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Visualizza
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
