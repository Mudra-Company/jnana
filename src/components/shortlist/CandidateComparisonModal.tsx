import React, { useState } from 'react';
import { X, User, Briefcase, MapPin, Award, CheckCircle2, XCircle, Building2, Globe } from 'lucide-react';
import { Button } from '../../../components/Button';
import { CandidateRatingStars } from './CandidateRatingStars';
import { CandidateStatusBadge } from './CandidateStatusBadge';
import type { UnifiedCandidate, RiasecScore } from '../../types/shortlist';

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

interface CandidateComparisonModalProps {
  candidates: [UnifiedCandidate, UnifiedCandidate];
  positionTitle: string;
  requiredSkills: string[];
  targetRiasec?: RiasecScore;
  onClose: () => void;
  onSelectCandidate: (candidateId: string) => void;
  onUpdateRating: (candidateId: string, rating: number) => void;
  onUpdateNotes: (candidateId: string, notes: string) => void;
}

const RIASEC_LABELS: Record<string, string> = {
  R: 'Realistico',
  I: 'Investigativo',
  A: 'Artistico',
  S: 'Sociale',
  E: 'Intraprendente',
  C: 'Convenzionale'
};

export const CandidateComparisonModal: React.FC<CandidateComparisonModalProps> = ({
  candidates,
  positionTitle,
  requiredSkills,
  targetRiasec,
  onClose,
  onSelectCandidate,
  onUpdateRating,
  onUpdateNotes
}) => {
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({
    [candidates[0].id]: candidates[0].hrNotes || '',
    [candidates[1].id]: candidates[1].hrNotes || ''
  });

  const handleNotesBlur = (candidateId: string) => {
    onUpdateNotes(candidateId, localNotes[candidateId]);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-500 dark:text-red-400';
  };

  const renderRiasecBar = (score: RiasecScore | undefined) => {
    if (!score) return <span className="text-gray-400 dark:text-gray-500 text-sm">N/A</span>;

    const dimensions = ['R', 'I', 'A', 'S', 'E', 'C'] as const;
    const maxScore = Math.max(...Object.values(score));

    return (
      <div className="space-y-1.5">
        {dimensions.map(dim => (
          <div key={dim} className="flex items-center gap-2 text-xs">
            <span className="w-20 text-gray-600 dark:text-gray-300">{RIASEC_LABELS[dim]}</span>
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-jnana-sage rounded-full transition-all"
                style={{ width: `${maxScore > 0 ? (score[dim] / maxScore) * 100 : 0}%` }}
              />
            </div>
            <span className="w-6 text-right font-semibold text-jnana-text dark:text-gray-100">{score[dim]}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderSkillComparison = (candidate: UnifiedCandidate) => {
    if (requiredSkills.length === 0) {
      return <span className="text-xs text-gray-400 dark:text-gray-500">Nessuna skill richiesta</span>;
    }
    return (
      <div className="space-y-1">
        {requiredSkills.map(skill => {
          const hasSkill = candidate.matchedSkills.includes(skill);
          return (
            <div key={skill} className="flex items-center gap-2 text-sm">
              {hasSkill ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
              )}
              <span className={hasSkill ? 'text-jnana-text dark:text-gray-100' : 'text-gray-400 dark:text-gray-500 line-through'}>{skill}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderCandidateColumn = (candidate: UnifiedCandidate, index: number) => (
    <div className="flex-1 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-jnana-sage/20 to-jnana-sage/40 flex items-center justify-center text-lg font-semibold text-jnana-sage dark:text-jnana-powder flex-shrink-0">
          {candidate.avatarUrl ? (
            <img src={candidate.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            candidate.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-jnana-text dark:text-white truncate">{candidate.name}</h3>
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {candidate.type === 'internal' ? (
              <><Building2 className="w-3 h-3" /> Interno</>
            ) : (
              <><Globe className="w-3 h-3" /> Karma Talents</>
            )}
          </div>
          <CandidateStatusBadge status={candidate.status} size="sm" className="mt-1.5" />
        </div>
      </div>

      {/* Match Score */}
      <div className="bg-jnana-bg dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-center">
        <div className={cn("text-3xl font-bold", getScoreColor(candidate.matchScore))}>
          {candidate.matchScore}%
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">Match Score</div>
      </div>

      {/* Info Grid */}
      <div className="space-y-2 text-sm text-jnana-text dark:text-gray-200">
        {candidate.jobTitle && (
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <span>{candidate.jobTitle}</span>
          </div>
        )}
        {candidate.location && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <span>{candidate.location}</span>
          </div>
        )}
        {candidate.yearsExperience !== undefined && (
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <span>{candidate.yearsExperience} anni esperienza</span>
          </div>
        )}
        {candidate.seniority && (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <span className="capitalize">{candidate.seniority}</span>
            {candidate.seniorityMatch !== undefined && (
              candidate.seniorityMatch ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              )
            )}
          </div>
        )}
      </div>

      {/* RIASEC Profile */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <h4 className="text-sm font-semibold text-jnana-text dark:text-gray-100 mb-2">Profilo RIASEC</h4>
        {candidate.profileCode && (
          <div className="text-xs text-jnana-sage dark:text-jnana-powder font-mono mb-2">{candidate.profileCode}</div>
        )}
        {renderRiasecBar(candidate.riasecScore)}
      </div>

      {/* Hard Skills */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <h4 className="text-sm font-semibold text-jnana-text dark:text-gray-100 mb-2">Hard Skills Richieste</h4>
        {renderSkillComparison(candidate)}
        {requiredSkills.length > 0 && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {candidate.matchedSkills.length}/{requiredSkills.length} competenze
          </div>
        )}
      </div>

      {/* Soft Skills */}
      {candidate.softSkills && candidate.softSkills.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
          <h4 className="text-sm font-semibold text-jnana-text dark:text-gray-100 mb-2">Soft Skills</h4>
          <div className="flex flex-wrap gap-1">
            {candidate.softSkills.slice(0, 5).map((skill, i) => (
              <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs rounded-full">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Rating */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <h4 className="text-sm font-semibold text-jnana-text dark:text-gray-100 mb-2">Rating HR</h4>
        <CandidateRatingStars
          rating={candidate.rating}
          onChange={(r) => onUpdateRating(candidate.id, r)}
          size="lg"
        />
      </div>

      {/* Notes */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <h4 className="text-sm font-semibold text-jnana-text dark:text-gray-100 mb-2">Note HR</h4>
        <textarea
          value={localNotes[candidate.id]}
          onChange={(e) => setLocalNotes(prev => ({ ...prev, [candidate.id]: e.target.value }))}
          onBlur={() => handleNotesBlur(candidate.id)}
          placeholder="Aggiungi note su questo candidato..."
          className="w-full text-sm min-h-[80px] p-2 rounded-lg bg-white dark:bg-gray-900 text-jnana-text dark:text-gray-100 border border-gray-300 dark:border-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-jnana-sage focus:border-transparent outline-none resize-y"
        />
      </div>

      {/* Action Button */}
      <Button
        onClick={() => onSelectCandidate(candidate.id)}
        fullWidth
        variant={index === 0 ? 'primary' : 'outline'}
      >
        Scegli {candidate.name.split(' ')[0]}
      </Button>
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparison-modal-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-jnana-bg dark:bg-gray-900/40">
          <div>
            <h2 id="comparison-modal-title" className="text-lg font-bold text-jnana-text dark:text-white">Confronto Candidati</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Posizione: {positionTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-jnana-text dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
            aria-label="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
          <div className="flex flex-col md:flex-row">
            <div className="md:border-r border-b md:border-b-0 border-gray-200 dark:border-gray-700 flex-1">
              {renderCandidateColumn(candidates[0], 0)}
            </div>
            <div className="flex-1">
              {renderCandidateColumn(candidates[1], 1)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-jnana-bg dark:bg-gray-900/40 flex justify-center">
          <Button variant="ghost" onClick={onClose}>
            Torna alla Shortlist
          </Button>
        </div>
      </div>
    </div>
  );
};
