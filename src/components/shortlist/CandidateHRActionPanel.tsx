import React, { useEffect, useState } from 'react';
import { ArrowLeft, Save, Trash2, AlertCircle } from 'lucide-react';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { usePositionShortlist } from '../../hooks/usePositionShortlist';
import { CandidateStatusBadge, CandidateStatusSelect } from './CandidateStatusBadge';
import { CandidateRatingStars } from './CandidateRatingStars';
import type { CandidateStatus } from '../../types/shortlist';

interface Props {
  positionId: string;
  companyId: string;
  candidateUserId: string;
  onBackToPosition: () => void;
}

export const CandidateHRActionPanel: React.FC<Props> = ({
  positionId, companyId, candidateUserId, onBackToPosition,
}) => {
  const { candidates, isLoading, updateCandidate, removeCandidate } =
    usePositionShortlist(positionId, companyId);

  const candidate = candidates.find(
    c => c.internalUserId === candidateUserId || c.externalProfileId === candidateUserId
  );

  const [notes, setNotes] = useState(candidate?.hrNotes || '');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    setNotes(candidate?.hrNotes || '');
  }, [candidate?.id, candidate?.hrNotes]);

  if (isLoading) {
    return (
      <Card className="p-4 mb-6">
        <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
      </Card>
    );
  }

  if (!candidate) {
    return (
      <Card className="p-4 mb-6 border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800/40">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">
              Questo candidato non è ancora nella shortlist della posizione.
            </span>
          </div>
          <Button variant="outline" onClick={onBackToPosition}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna al matching
          </Button>
        </div>
      </Card>
    );
  }

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    await updateCandidate(candidate.id, { hrNotes: notes });
    setSavingNotes(false);
  };

  const handleStatusChange = (status: CandidateStatus) => {
    updateCandidate(candidate.id, { status });
  };

  const handleRatingChange = (rating: number) => {
    updateCandidate(candidate.id, { rating });
  };

  const handleReject = () => {
    updateCandidate(candidate.id, { status: 'rejected' });
  };

  const handleRemove = async () => {
    if (!confirm('Rimuovere il candidato dalla shortlist?')) return;
    const ok = await removeCandidate(candidate.id);
    if (ok) onBackToPosition();
  };

  return (
    <Card className="p-5 mb-6 border-jnana-sage/30 bg-jnana-bg/40 dark:bg-jnana-charcoal/20">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-wide text-jnana-text/60 dark:text-gray-400">
            Stato in shortlist
          </span>
          <CandidateStatusBadge status={candidate.status} />
        </div>
        <Button variant="outline" onClick={onBackToPosition}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna alla posizione
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-jnana-text/70 dark:text-gray-400 mb-1.5">
            Cambia stato
          </label>
          <CandidateStatusSelect status={candidate.status} onChange={handleStatusChange} />
        </div>
        <div>
          <label className="block text-xs font-medium text-jnana-text/70 dark:text-gray-400 mb-1.5">
            Rating HR
          </label>
          <CandidateRatingStars rating={candidate.rating || 0} onChange={handleRatingChange} size="lg" />
        </div>
        <div className="flex items-end gap-2 justify-end">
          {candidate.status !== 'rejected' && (
            <Button variant="outline" onClick={handleReject}>
              Scarta
            </Button>
          )}
          <Button variant="outline" onClick={handleRemove}>
            <Trash2 className="w-4 h-4 mr-2" />
            Rimuovi
          </Button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-jnana-text/70 dark:text-gray-400 mb-1.5">
          Note HR
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleSaveNotes}
          rows={3}
          placeholder="Annota impressioni, prossimi step, feedback colloquio…"
          className="w-full text-sm rounded-md border border-input bg-white dark:bg-gray-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-jnana-sage/30"
        />
        <div className="flex items-center justify-end mt-2 gap-2">
          {savingNotes && <span className="text-xs text-jnana-text/50">Salvataggio…</span>}
          <Button variant="ghost" onClick={handleSaveNotes} disabled={savingNotes || notes === (candidate.hrNotes || '')}>
            <Save className="w-4 h-4 mr-2" />
            Salva note
          </Button>
        </div>
      </div>
    </Card>
  );
};
