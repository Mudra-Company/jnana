import React, { useState, useCallback } from 'react';
import { Sparkles, ArrowLeftRight, Loader2, AlertTriangle, TrendingUp, Zap } from 'lucide-react';
import { Button } from '../../../components/Button';
import { supabase } from '@/integrations/supabase/client';
import type { DeskProximityPair } from '@/utils/proximityEngine';
import type { OfficeDesk } from '@/types/spacesync';
import type { ProximityUserData } from '@/utils/proximityEngine';

interface SwapSuggestion {
  personA: string;
  deskA: string;
  personB: string;
  deskB: string;
  reason: string;
  expectedImprovement: 'high' | 'medium' | 'low';
}

interface AIResult {
  overallAssessment: string;
  suggestions: SwapSuggestion[];
}

interface OptimizationSuggestionsProps {
  pairs: DeskProximityPair[];
  desks: OfficeDesk[];
  rooms: { id: string; name: string }[];
  globalAverage: number;
  userDataMap: Map<string, ProximityUserData>;
  onSimulateSwap: (deskLabelA: string, deskLabelB: string) => void;
}

const IMPROVEMENT_BORDER: Record<string, string> = {
  high: '#16a34a',
  medium: '#d97706',
  low: '#3b82f6',
};

const IMPROVEMENT_BG: Record<string, string> = {
  high: 'bg-green-50 dark:bg-green-900/10',
  medium: 'bg-amber-50 dark:bg-amber-900/10',
  low: 'bg-blue-50 dark:bg-blue-900/10',
};

const IMPROVEMENT_LABELS: Record<string, string> = { high: 'Alto Impatto', medium: 'Medio Impatto', low: 'Basso Impatto' };

export const OptimizationSuggestions: React.FC<OptimizationSuggestionsProps> = ({
  pairs, desks, rooms, globalAverage, userDataMap, onSimulateSwap,
}) => {
  const [result, setResult] = useState<AIResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const roomMap = new Map(rooms.map(r => [r.id, r.name]));

      const deskInfos = desks
        .filter(d => d.companyMemberId && userDataMap.has(d.companyMemberId))
        .map(d => {
          const user = userDataMap.get(d.companyMemberId!);
          return {
            id: d.id,
            label: d.label,
            roomName: roomMap.get(d.roomId) || 'Stanza',
            assigneeName: user ? `${user.firstName} ${user.lastName}` : d.assigneeName || 'N/A',
            memberId: d.companyMemberId!,
          };
        });

      const pairData = pairs.map(p => ({
        userA: `${p.userA.firstName} ${p.userA.lastName}`,
        userB: `${p.userB.firstName} ${p.userB.lastName}`,
        deskA: p.deskA.label,
        deskB: p.deskB.label,
        score: p.proximityResult.score,
        level: p.proximityResult.level,
        insights: p.proximityResult.insights,
        breakdown: p.proximityResult.breakdown,
      }));

      const { data, error: fnError } = await supabase.functions.invoke('spacesync-optimize', {
        body: { pairs: pairData, desks: deskInfos, globalAverage },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setResult(data as AIResult);
    } catch (err: any) {
      console.error('AI optimization error:', err);
      setError(err.message || 'Errore durante l\'analisi AI');
    } finally {
      setIsLoading(false);
    }
  }, [pairs, desks, rooms, globalAverage, userDataMap]);

  return (
    <div>
      {/* Analyze Button — prominent */}
      <div className="mb-3">
        <Button
          variant="primary"
          size="sm"
          onClick={fetchSuggestions}
          disabled={isLoading || pairs.length === 0}
          className="w-full gap-1.5"
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
          {isLoading ? 'Analisi in corso...' : result ? 'Rigenera Analisi' : 'Analizza Disposizione'}
        </Button>
      </div>

      {pairs.length === 0 && !result && (
        <p className="text-xs text-gray-400 py-4 text-center">
          Assegna almeno 2 persone a scrivanie vicine per generare suggerimenti.
        </p>
      )}

      {error && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 text-xs text-red-600 dark:text-red-400 mb-3">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          {/* AI Assessment */}
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-400">
            <div className="flex items-start gap-2">
              <Sparkles size={14} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-[11px] text-gray-600 dark:text-gray-300 italic leading-relaxed">
                {result.overallAssessment}
              </p>
            </div>
          </div>

          {/* Suggestions */}
          {result.suggestions.length === 0 ? (
            <div className="text-center py-4">
              <TrendingUp size={24} className="mx-auto text-green-500 mb-2" />
              <p className="text-xs text-gray-500">La disposizione attuale è già ottimale!</p>
            </div>
          ) : (
            result.suggestions.map((sug, i) => (
              <div
                key={i}
                className={`p-2.5 rounded-xl ${IMPROVEMENT_BG[sug.expectedImprovement]} border-l-4`}
                style={{ borderLeftColor: IMPROVEMENT_BORDER[sug.expectedImprovement] }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-700 dark:text-gray-200">
                    <ArrowLeftRight size={12} />
                    <span>{sug.personA}</span>
                    <span className="text-gray-400">↔</span>
                    <span>{sug.personB}</span>
                  </div>
                  <span
                    className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full"
                    style={{ color: IMPROVEMENT_BORDER[sug.expectedImprovement], backgroundColor: `${IMPROVEMENT_BORDER[sug.expectedImprovement]}15` }}
                  >
                    {IMPROVEMENT_LABELS[sug.expectedImprovement]}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mb-2">{sug.reason}</p>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-gray-400">{sug.deskA} ↔ {sug.deskB}</span>
                  <button
                    onClick={() => onSimulateSwap(sug.deskA, sug.deskB)}
                    className="ml-auto px-2.5 py-1 rounded-lg bg-jnana-sage/10 text-jnana-sage hover:bg-jnana-sage/20 transition-colors font-semibold text-[10px]"
                  >
                    Simula
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
