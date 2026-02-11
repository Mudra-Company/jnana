import React, { useState, useCallback } from 'react';
import { Sparkles, ArrowLeftRight, Loader2, AlertTriangle, TrendingUp, Zap } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
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

const IMPROVEMENT_COLORS = {
  high: 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800/30',
  medium: 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-800/30',
  low: 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800/30',
};

const IMPROVEMENT_LABELS = { high: 'Alto Impatto', medium: 'Medio Impatto', low: 'Basso Impatto' };

export const OptimizationSuggestions: React.FC<OptimizationSuggestionsProps> = ({
  pairs,
  desks,
  rooms,
  globalAverage,
  userDataMap,
  onSimulateSwap,
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
    <Card padding="sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Sparkles size={14} className="text-amber-500" />
          Suggerimenti AI
        </h3>
        <Button
          variant="outline"
          onClick={fetchSuggestions}
          disabled={isLoading || pairs.length === 0}
          className="text-xs h-7 px-2"
        >
          {isLoading ? <Loader2 size={12} className="animate-spin mr-1" /> : <Zap size={12} className="mr-1" />}
          {isLoading ? 'Analisi...' : result ? 'Rigenera' : 'Analizza'}
        </Button>
      </div>

      {pairs.length === 0 && !result && (
        <p className="text-xs text-muted-foreground py-4 text-center">
          Assegna almeno 2 persone a scrivanie vicine per generare suggerimenti.
        </p>
      )}

      {error && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive mb-3">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          {/* Overall assessment */}
          <p className="text-xs text-muted-foreground italic border-l-2 border-amber-400 pl-2">
            {result.overallAssessment}
          </p>

          {/* Suggestions */}
          {result.suggestions.length === 0 ? (
            <div className="text-center py-4">
              <TrendingUp size={24} className="mx-auto text-green-500 mb-2" />
              <p className="text-xs text-muted-foreground">La disposizione attuale è già ottimale!</p>
            </div>
          ) : (
            result.suggestions.map((sug, i) => (
              <div
                key={i}
                className={`p-2.5 rounded-lg border ${IMPROVEMENT_COLORS[sug.expectedImprovement]}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <ArrowLeftRight size={12} />
                    <span>{sug.personA}</span>
                    <span className="text-muted-foreground">↔</span>
                    <span>{sug.personB}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase opacity-70">
                    {IMPROVEMENT_LABELS[sug.expectedImprovement]}
                  </span>
                </div>
                <p className="text-[11px] opacity-80 mb-2">{sug.reason}</p>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="opacity-60">{sug.deskA} ↔ {sug.deskB}</span>
                  <button
                    onClick={() => onSimulateSwap(sug.deskA, sug.deskB)}
                    className="ml-auto px-2 py-0.5 rounded bg-white/50 dark:bg-white/10 border border-current/20 hover:bg-white/80 dark:hover:bg-white/20 transition-colors font-medium"
                  >
                    Simula
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Card>
  );
};
