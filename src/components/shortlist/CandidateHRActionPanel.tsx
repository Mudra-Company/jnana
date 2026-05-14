import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Save, Trash2, UserPlus, Sparkles } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { usePositionShortlist } from '../../hooks/usePositionShortlist';
import { useOpenPositions } from '../../hooks/useOpenPositions';
import { CandidateStatusBadge, CandidateStatusSelect } from './CandidateStatusBadge';
import { CandidateRatingStars } from './CandidateRatingStars';
import { calculateMatchScore, getMatchQuality } from '../../utils/matchingEngine';
import type { CandidateStatus, CandidateType, StoredMatchDetails } from '../../types/shortlist';
import type { KarmaProfile } from '../../types/karma';
import type { SeniorityLevel } from '../../../types';

interface Props {
  positionId: string;
  companyId: string;
  candidateUserId: string;
  profile: KarmaProfile;
  onBackToPosition: () => void;
}

export const CandidateHRActionPanel: React.FC<Props> = ({
  positionId, companyId, candidateUserId, profile, onBackToPosition,
}) => {
  const { candidates, isLoading, updateCandidate, removeCandidate, addCandidate } =
    usePositionShortlist(positionId, companyId);
  const { getPositionById } = useOpenPositions();

  // Position requirements (loaded once)
  const [requiredHardSkills, setRequiredHardSkills] = useState<string[]>([]);
  const [requiredSeniority, setRequiredSeniority] = useState<SeniorityLevel | undefined>(undefined);
  const [positionLoading, setPositionLoading] = useState(true);

  // Internal vs external detection
  const [candidateType, setCandidateType] = useState<CandidateType | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPositionLoading(true);
      const [pos, memberRow] = await Promise.all([
        getPositionById(positionId),
        supabase.from('company_members')
          .select('id')
          .eq('user_id', candidateUserId)
          .eq('company_id', companyId)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      setRequiredHardSkills(pos?.requiredProfile?.hardSkills || []);
      setRequiredSeniority(pos?.requiredProfile?.seniority as SeniorityLevel | undefined);
      setCandidateType(memberRow.data ? 'internal' : 'external');
      setPositionLoading(false);
    })();
    return () => { cancelled = true; };
  }, [positionId, companyId, candidateUserId, getPositionById]);

  // Existing candidate (already in shortlist)
  const existing = candidates.find(
    c => c.internalUserId === candidateUserId || c.externalProfileId === candidateUserId
  );

  // Compute match
  const candidateSkills = useMemo(
    () => (profile.hardSkills || [])
      .map(s => s.skill?.name || s.customSkillName || '')
      .filter(Boolean),
    [profile.hardSkills]
  );

  const matchResult = useMemo(() => {
    return calculateMatchScore(
      {
        riasecScore: profile.riasecScore,
        skills: candidateSkills,
        seniorityLevel: undefined,
        yearsExperience: profile.yearsExperience,
      },
      {
        requiredSkills: requiredHardSkills,
        seniorityLevels: requiredSeniority ? [requiredSeniority] : undefined,
      }
    );
  }, [profile, candidateSkills, requiredHardSkills, requiredSeniority]);

  // Local editable state — works in both draft (pre-add) and live (post-add) modes
  const [status, setStatus] = useState<CandidateStatus>('shortlisted');
  const [rating, setRating] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Sync local state from existing candidate when loaded
  useEffect(() => {
    if (existing) {
      setStatus(existing.status);
      setRating(existing.rating || 0);
      setNotes(existing.hrNotes || '');
    }
  }, [existing?.id]);

  if (isLoading || positionLoading || !candidateType) {
    return (
      <Card className="p-4 mb-6">
        <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
      </Card>
    );
  }

  const inShortlist = !!existing;
  const quality = getMatchQuality(matchResult.totalScore);

  const buildMatchDetails = (): StoredMatchDetails => ({
    riasecMatch: matchResult.riasecScore,
    skillsMatch: matchResult.skillsScore,
    skillsOverlap: matchResult.matchingSkills,
    missingSkills: matchResult.missingSkills,
    seniorityMatch: matchResult.seniorityMatch,
    riasecScore: profile.riasecScore,
    profileCode: profile.profileCode,
  });

  // === LIVE handlers (existing candidate) ===
  const liveStatusChange = (s: CandidateStatus) => {
    setStatus(s);
    if (existing) updateCandidate(existing.id, { status: s });
  };
  const liveRatingChange = (r: number) => {
    setRating(r);
    if (existing) updateCandidate(existing.id, { rating: r });
  };
  const liveSaveNotes = async () => {
    if (!existing || notes === (existing.hrNotes || '')) return;
    setSavingNotes(true);
    await updateCandidate(existing.id, { hrNotes: notes });
    setSavingNotes(false);
  };
  const handleReject = () => liveStatusChange('rejected');
  const handleRemove = async () => {
    if (!existing) return;
    if (!confirm('Rimuovere il candidato dalla shortlist?')) return;
    await removeCandidate(existing.id);
  };

  // === DRAFT handlers (not yet in shortlist) ===
  const handleAdd = async () => {
    setIsAdding(true);
    const result = await addCandidate({
      type: candidateType,
      userId: candidateUserId,
      matchScore: matchResult.totalScore,
      matchDetails: buildMatchDetails(),
      initialStatus: status,
      initialRating: rating || undefined,
      initialNotes: notes || undefined,
    });
    setIsAdding(false);
    if (!result) {
      alert('Impossibile aggiungere il candidato.');
    }
  };

  return (
    <Card className="p-5 mb-6 border-jnana-sage/30 bg-jnana-bg/40 dark:bg-jnana-charcoal/20">
      {/* Top row: status / match score / back */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          {inShortlist ? (
            <>
              <span className="text-xs uppercase tracking-wide text-jnana-text/60 dark:text-gray-400">
                Stato shortlist
              </span>
              <CandidateStatusBadge status={status} />
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              <Sparkles size={12} /> Non ancora in shortlist
            </span>
          )}
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${quality.bgColor} ${quality.color}`}>
            Match {matchResult.totalScore}% · {quality.label}
          </span>
          <span className="text-xs text-jnana-text/50 dark:text-gray-500">
            {candidateType === 'internal' ? 'Candidato interno' : 'Candidato esterno'}
          </span>
        </div>
        <Button variant="outline" onClick={onBackToPosition}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna alla posizione
        </Button>
      </div>

      {/* Controls grid — same layout in both modes */}
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-jnana-text/70 dark:text-gray-400 mb-1.5">
            Stato candidato
          </label>
          <CandidateStatusSelect
            status={status}
            onChange={inShortlist ? liveStatusChange : setStatus}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-jnana-text/70 dark:text-gray-400 mb-1.5">
            Rating HR
          </label>
          <CandidateRatingStars
            rating={rating}
            onChange={inShortlist ? liveRatingChange : setRating}
            size="lg"
          />
        </div>
        <div className="flex items-end gap-2 justify-end flex-wrap">
          {inShortlist ? (
            <>
              {status !== 'rejected' && (
                <Button variant="outline" onClick={handleReject}>
                  Scarta
                </Button>
              )}
              <Button variant="outline" onClick={handleRemove}>
                <Trash2 className="w-4 h-4 mr-2" />
                Rimuovi
              </Button>
            </>
          ) : (
            <Button onClick={handleAdd} disabled={isAdding}>
              <UserPlus className="w-4 h-4 mr-2" />
              {isAdding ? 'Aggiungo…' : 'Aggiungi alla shortlist'}
            </Button>
          )}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium text-jnana-text/70 dark:text-gray-400 mb-1.5">
          Note HR
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={inShortlist ? liveSaveNotes : undefined}
          rows={3}
          placeholder={inShortlist
            ? 'Annota impressioni, prossimi step, feedback colloquio…'
            : 'Annota qui le tue impressioni: verranno salvate quando aggiungi il candidato alla shortlist.'}
          className="w-full text-sm rounded-md border border-input bg-white dark:bg-gray-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-jnana-sage/30"
        />
        {inShortlist && (
          <div className="flex items-center justify-end mt-2 gap-2">
            {savingNotes && <span className="text-xs text-jnana-text/50">Salvataggio…</span>}
            <Button
              variant="ghost"
              onClick={liveSaveNotes}
              disabled={savingNotes || notes === (existing?.hrNotes || '')}
            >
              <Save className="w-4 h-4 mr-2" />
              Salva note
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
