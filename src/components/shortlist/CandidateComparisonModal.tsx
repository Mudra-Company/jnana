import React, { useState } from 'react';
import { X, User, Briefcase, MapPin, Award, CheckCircle2, XCircle, Building2, Globe } from 'lucide-react';
import { Button } from '../../../components/Button';
import { CandidateRatingStars } from './CandidateRatingStars';
import { CandidateStatusBadge } from './CandidateStatusBadge';
import type { UnifiedCandidate, RiasecScore } from '../../types/shortlist';

// Simple cn utility for classnames
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
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-500';
  };

  const renderRiasecBar = (score: RiasecScore | undefined) => {
    if (!score) return <span className="text-muted-foreground text-sm">N/A</span>;
    
    const dimensions = ['R', 'I', 'A', 'S', 'E', 'C'] as const;
    const maxScore = Math.max(...Object.values(score));

    return (
      <div className="space-y-1">
        {dimensions.map(dim => (
          <div key={dim} className="flex items-center gap-2 text-xs">
            <span className="w-20 text-muted-foreground">{RIASEC_LABELS[dim]}</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary/70 rounded-full transition-all"
                style={{ width: `${maxScore > 0 ? (score[dim] / maxScore) * 100 : 0}%` }}
              />
            </div>
            <span className="w-6 text-right font-medium">{score[dim]}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderSkillComparison = (candidate: UnifiedCandidate) => {
    return (
      <div className="space-y-1">
        {requiredSkills.map(skill => {
          const hasSkill = candidate.matchedSkills.includes(skill);
          return (
            <div key={skill} className="flex items-center gap-2 text-sm">
              {hasSkill ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              )}
              <span className={hasSkill ? 'text-foreground' : 'text-muted-foreground'}>{skill}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderCandidateColumn = (candidate: UnifiedCandidate, index: number) => (
    <div className="flex-1 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-lg font-semibold text-primary">
          {candidate.avatarUrl ? (
            <img src={candidate.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            candidate.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{candidate.name}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {candidate.type === 'internal' ? (
              <><Building2 className="w-3 h-3" /> Interno</>
            ) : (
              <><Globe className="w-3 h-3" /> Karma Talents</>
            )}
          </div>
          <CandidateStatusBadge status={candidate.status} size="sm" className="mt-1" />
        </div>
      </div>

      {/* Match Score */}
      <div className="bg-muted/50 rounded-lg p-3 text-center">
        <div className={cn("text-3xl font-bold", getScoreColor(candidate.matchScore))}>
          {candidate.matchScore}%
        </div>
        <div className="text-xs text-muted-foreground">Match Score</div>
      </div>

      {/* Info Grid */}
      <div className="space-y-2 text-sm">
        {candidate.jobTitle && (
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-muted-foreground" />
            <span>{candidate.jobTitle}</span>
          </div>
        )}
        {candidate.location && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span>{candidate.location}</span>
          </div>
        )}
        {candidate.yearsExperience !== undefined && (
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-muted-foreground" />
            <span>{candidate.yearsExperience} anni esperienza</span>
          </div>
        )}
        {candidate.seniority && (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="capitalize">{candidate.seniority}</span>
            {candidate.seniorityMatch !== undefined && (
              candidate.seniorityMatch ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-amber-500" />
              )
            )}
          </div>
        )}
      </div>

      {/* RIASEC Profile */}
      <div className="border-t pt-3">
        <h4 className="text-sm font-medium mb-2">Profilo RIASEC</h4>
        {candidate.profileCode && (
          <div className="text-xs text-primary font-mono mb-2">{candidate.profileCode}</div>
        )}
        {renderRiasecBar(candidate.riasecScore)}
      </div>

      {/* Hard Skills */}
      <div className="border-t pt-3">
        <h4 className="text-sm font-medium mb-2">Hard Skills Richieste</h4>
        {renderSkillComparison(candidate)}
        <div className="mt-2 text-xs text-muted-foreground">
          {candidate.matchedSkills.length}/{requiredSkills.length} competenze
        </div>
      </div>

      {/* Soft Skills */}
      {candidate.softSkills && candidate.softSkills.length > 0 && (
        <div className="border-t pt-3">
          <h4 className="text-sm font-medium mb-2">Soft Skills</h4>
          <div className="flex flex-wrap gap-1">
            {candidate.softSkills.slice(0, 5).map((skill, i) => (
              <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Rating */}
      <div className="border-t pt-3">
        <h4 className="text-sm font-medium mb-2">Rating HR</h4>
        <CandidateRatingStars
          rating={candidate.rating}
          onChange={(r) => onUpdateRating(candidate.id, r)}
          size="lg"
        />
      </div>

      {/* Notes */}
      <div className="border-t pt-3">
        <h4 className="text-sm font-medium mb-2">Note HR</h4>
        <textarea
          value={localNotes[candidate.id]}
          onChange={(e) => setLocalNotes(prev => ({ ...prev, [candidate.id]: e.target.value }))}
          onBlur={() => handleNotesBlur(candidate.id)}
          placeholder="Aggiungi note su questo candidato..."
          className="w-full text-sm min-h-[80px] p-2 border rounded-md bg-background text-foreground"
        />
      </div>

      {/* Action Button */}
      <Button 
        onClick={() => onSelectCandidate(candidate.id)}
        className="w-full"
        variant={index === 0 ? "default" : "outline"}
      >
        Scegli {candidate.name.split(' ')[0]}
      </Button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div>
            <h2 className="text-lg font-semibold">Confronto Candidati</h2>
            <p className="text-sm text-muted-foreground">Posizione: {positionTitle}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex divide-x">
            {renderCandidateColumn(candidates[0], 0)}
            {renderCandidateColumn(candidates[1], 1)}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/30 flex justify-center">
          <Button variant="ghost" onClick={onClose}>
            Torna alla Shortlist
          </Button>
        </div>
      </div>
    </div>
  );
};
