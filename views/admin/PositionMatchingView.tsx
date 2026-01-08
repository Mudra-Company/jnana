import React, { useEffect, useState, useMemo } from 'react';
import { ArrowLeft, User, Briefcase, MapPin, Award, CheckCircle, XCircle, AlertCircle, Search, Filter, Loader2 } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { useOpenPositions, OpenPosition } from '../../src/hooks/useOpenPositions';
import { useTalentSearch } from '../../src/hooks/useTalentSearch';
import { useSubscription } from '../../src/hooks/useSubscription';
import { CompanyProfile, SeniorityLevel } from '../../types';
import { getMatchQuality } from '../../src/utils/matchingEngine';
import type { CandidateMatch } from '../../src/types/karma';

interface PositionMatchingViewProps {
  positionId: string;
  company: CompanyProfile;
  onBack: () => void;
  onViewCandidate: (userId: string) => void;
}

const SENIORITY_LABELS: Record<SeniorityLevel, string> = {
  'Junior': 'Junior',
  'Mid': 'Mid-Level',
  'Senior': 'Senior',
  'Lead': 'Lead',
  'C-Level': 'C-Level',
};

export const PositionMatchingView: React.FC<PositionMatchingViewProps> = ({
  positionId,
  company,
  onBack,
  onViewCandidate,
}) => {
  const { getPositionById } = useOpenPositions();
  const { candidates, isLoading: searchLoading, searchCandidates } = useTalentSearch();
  const { hasActiveSubscription, canViewProfiles, remainingProfileViews } = useSubscription();

  const [position, setPosition] = useState<OpenPosition | null>(null);
  const [positionLoading, setPositionLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyLooking, setShowOnlyLooking] = useState(true);

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
  const hasSubscription = hasActiveSubscription();
  const canView = canViewProfiles();
  const viewsRemaining = remainingProfileViews();

  // Filter candidates by search query (client-side additional filter)
  const filteredCandidates = useMemo(() => {
    if (!searchQuery) return candidates;
    const query = searchQuery.toLowerCase();
    return candidates.filter(c => {
      const name = `${c.profile.firstName || ''} ${c.profile.lastName || ''}`.toLowerCase();
      const headline = (c.profile.headline || '').toLowerCase();
      return name.includes(query) || headline.includes(query);
    });
  }, [candidates, searchQuery]);

  const renderCandidateCard = (candidate: CandidateMatch, index: number) => {
    const { profile, matchScore, riasecMatch, skillsMatch, skillsOverlap, missingSkills, seniorityMatch } = candidate;
    const quality = getMatchQuality(matchScore);
    
    // Show blurred preview for first 3 if no subscription
    const isBlurred = !hasSubscription && index >= 3;
    
    return (
      <Card 
        key={profile.id} 
        className={`relative ${isBlurred ? 'overflow-hidden' : ''}`}
      >
        {isBlurred && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-center p-4">
              <AlertCircle size={32} className="text-purple-500 mx-auto mb-2" />
              <p className="font-medium text-gray-900 dark:text-white">Abbonamento richiesto</p>
              <p className="text-sm text-gray-500">Attiva Karma Talents per vedere tutti i candidati</p>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-start gap-4">
          {/* Avatar & Basic Info */}
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span>{(profile.firstName?.[0] || 'U').toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 dark:text-white truncate">
                {profile.firstName || 'Utente'} {profile.lastName || ''}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {profile.headline || profile.jobTitle || 'Professionista'}
              </p>
              {profile.location && (
                <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-1">
                  <MapPin size={12} />
                  {profile.location}
                </p>
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

        {/* Action */}
        {!isBlurred && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <Button 
              fullWidth 
              variant="ghost"
              onClick={() => onViewCandidate(profile.id)}
              disabled={!canView}
            >
              {canView ? 'Visualizza Profilo Completo' : 'Limite visualizzazioni raggiunto'}
            </Button>
          </div>
        )}
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

      {/* Subscription Status */}
      {!hasSubscription && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-4">
            <Award size={32} className="text-purple-500" />
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 dark:text-white">Attiva Karma Talents</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Sblocca accesso completo a tutti i candidati e funzionalità di matching avanzate.
              </p>
            </div>
            <Button>Scopri i Piani</Button>
          </div>
        </Card>
      )}

      {hasSubscription && viewsRemaining !== Infinity && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Visualizzazioni profili rimaste questo mese: <strong>{viewsRemaining}</strong>
        </div>
      )}

      {/* Results */}
      <div className="space-y-4">
        <h3 className="font-bold text-gray-900 dark:text-white">
          {searchLoading ? 'Ricerca in corso...' : `${filteredCandidates.length} candidati trovati`}
        </h3>

        {searchLoading && (
          <div className="text-center py-8">
            <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-4" />
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

        {!searchLoading && filteredCandidates.map((candidate, index) => renderCandidateCard(candidate, index))}
      </div>
    </div>
  );
};
