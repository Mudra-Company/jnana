import React, { useState, useMemo } from 'react';
import { Users, Building2, Globe, Trash2, Eye, GitCompare, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/Button';
import { CandidateRatingStars } from './CandidateRatingStars';
import { CandidateStatusBadge, CandidateStatusSelect } from './CandidateStatusBadge';
import { CandidateComparisonModal } from './CandidateComparisonModal';
import type { UnifiedCandidate, CandidateStatus, RiasecScore } from '../../types/shortlist';

// Simple cn utility for classnames
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

interface ShortlistTabProps {
  candidates: UnifiedCandidate[];
  positionTitle: string;
  requiredSkills: string[];
  targetRiasec?: RiasecScore;
  onRemoveCandidate: (candidateId: string) => void;
  onUpdateCandidate: (candidateId: string, updates: { status?: CandidateStatus; hrNotes?: string; rating?: number }) => void;
  onViewProfile: (candidate: UnifiedCandidate) => void;
  onSelectCandidate: (candidate: UnifiedCandidate) => void;
}

export const ShortlistTab: React.FC<ShortlistTabProps> = ({
  candidates,
  positionTitle,
  requiredSkills,
  targetRiasec,
  onRemoveCandidate,
  onUpdateCandidate,
  onViewProfile,
  onSelectCandidate
}) => {
  const [selectedForCompare, setSelectedForCompare] = useState<Set<string>>(new Set());
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null);

  const stats = useMemo(() => {
    const internal = candidates.filter(c => c.type === 'internal').length;
    const external = candidates.filter(c => c.type === 'external').length;
    const avgScore = candidates.length > 0 
      ? Math.round(candidates.reduce((sum, c) => sum + c.matchScore, 0) / candidates.length)
      : 0;
    return { internal, external, avgScore };
  }, [candidates]);

  const toggleCompareSelection = (id: string) => {
    setSelectedForCompare(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 2) {
        next.add(id);
      }
      return next;
    });
  };

  const canCompare = selectedForCompare.size === 2;
  const selectedCandidatesForCompare = candidates.filter(c => selectedForCompare.has(c.id));

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-amber-600 bg-amber-50';
    return 'text-red-500 bg-red-50';
  };

  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Users className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">Nessun candidato in shortlist</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Aggiungi candidati dalla tab "Candidati Interni" o "Candidati Esterni" cliccando sul pulsante "Aggiungi a Shortlist"
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Header */}
      <div className="flex items-center justify-between bg-muted/30 rounded-lg p-4">
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-500" />
            <span className="text-sm"><strong>{stats.internal}</strong> Interni</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-purple-500" />
            <span className="text-sm"><strong>{stats.external}</strong> Esterni</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-sm">Match medio: <strong>{stats.avgScore}%</strong></span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={!canCompare}
          onClick={() => setShowCompareModal(true)}
          className="gap-2"
        >
          <GitCompare className="w-4 h-4" />
          Confronta ({selectedForCompare.size}/2)
        </Button>
      </div>

      {/* Comparison Hint */}
      {selectedForCompare.size > 0 && selectedForCompare.size < 2 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-blue-50 text-blue-700 rounded-lg px-4 py-2">
          <AlertCircle className="w-4 h-4" />
          Seleziona un altro candidato per confrontare
        </div>
      )}

      {/* Candidates Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 w-8">
                <span className="sr-only">Seleziona</span>
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                Candidato
              </th>
              <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 w-24">
                Match
              </th>
              <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 w-32">
                Skills
              </th>
              <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 w-32">
                Stato
              </th>
              <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 w-24">
                Rating
              </th>
              <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 w-32">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {candidates.map((candidate) => (
              <React.Fragment key={candidate.id}>
                <tr className={cn(
                  "hover:bg-muted/30 transition-colors",
                  selectedForCompare.has(candidate.id) && "bg-primary/5"
                )}>
                  {/* Checkbox */}
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedForCompare.has(candidate.id)}
                      onChange={() => toggleCompareSelection(candidate.id)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </td>

                  {/* Candidate Info */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-sm font-semibold text-primary">
                        {candidate.avatarUrl ? (
                          <img src={candidate.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          candidate.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{candidate.name}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {candidate.type === 'internal' ? (
                            <><Building2 className="w-3 h-3" /> Interno</>
                          ) : (
                            <><Globe className="w-3 h-3" /> Karma Talents</>
                          )}
                          {candidate.jobTitle && <span className="text-muted-foreground/70">• {candidate.jobTitle}</span>}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Match Score */}
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      "inline-flex items-center justify-center w-12 h-8 rounded-md text-sm font-bold",
                      getScoreColor(candidate.matchScore)
                    )}>
                      {candidate.matchScore}%
                    </span>
                  </td>

                  {/* Skills */}
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm">
                      <span className="text-green-600 font-medium">{candidate.matchedSkills.length}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-muted-foreground">{requiredSkills.length}</span>
                    </span>
                    {candidate.missingSkills.length > 0 && (
                      <div className="text-xs text-red-500 mt-0.5">
                        -{candidate.missingSkills.length} mancanti
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 text-center">
                    <CandidateStatusSelect
                      status={candidate.status}
                      onChange={(status) => onUpdateCandidate(candidate.id, { status })}
                    />
                  </td>

                  {/* Rating */}
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <CandidateRatingStars
                        rating={candidate.rating}
                        onChange={(rating) => onUpdateCandidate(candidate.id, { rating })}
                        size="sm"
                      />
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedNotes(expandedNotes === candidate.id ? null : candidate.id)}
                        className="h-8 w-8 p-0"
                        title="Note"
                      >
                        <span className="text-xs">📝</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewProfile(candidate)}
                        className="h-8 w-8 p-0"
                        title="Visualizza profilo"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveCandidate(candidate.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Rimuovi dalla shortlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>

                {/* Expanded Notes Row */}
                {expandedNotes === candidate.id && (
                  <tr className="bg-muted/20">
                    <td colSpan={7} className="px-4 py-3">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Note HR</label>
                          <textarea
                            value={candidate.hrNotes || ''}
                            onChange={(e) => onUpdateCandidate(candidate.id, { hrNotes: e.target.value })}
                            placeholder="Aggiungi note su questo candidato..."
                            className="w-full text-sm min-h-[60px] p-2 border rounded-md"
                          />
                        </div>
                        <Button
                          onClick={() => onSelectCandidate(candidate)}
                          className="mt-5"
                        >
                          Seleziona per Posizione
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Comparison Modal */}
      {showCompareModal && canCompare && (
        <CandidateComparisonModal
          candidates={selectedCandidatesForCompare as [UnifiedCandidate, UnifiedCandidate]}
          positionTitle={positionTitle}
          requiredSkills={requiredSkills}
          targetRiasec={targetRiasec}
          onClose={() => setShowCompareModal(false)}
          onSelectCandidate={(id) => {
            const candidate = candidates.find(c => c.id === id);
            if (candidate) {
              onSelectCandidate(candidate);
            }
            setShowCompareModal(false);
          }}
          onUpdateRating={(id, rating) => onUpdateCandidate(id, { rating })}
          onUpdateNotes={(id, notes) => onUpdateCandidate(id, { hrNotes: notes })}
        />
      )}
    </div>
  );
};
