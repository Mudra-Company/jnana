import React from 'react';
import { Users, ArrowRight, AlertTriangle, Sparkles, TrendingUp } from 'lucide-react';
import { Card } from '../../../components/Card';
import type { DeskProximityPair } from '@/utils/proximityEngine';
import { getProximityColor } from '@/utils/proximityEngine';

interface ProximityReportProps {
  pairs: DeskProximityPair[];
  globalAverage: number;
}

export const ProximityReport: React.FC<ProximityReportProps> = ({ pairs, globalAverage }) => {
  if (pairs.length === 0) {
    return (
      <Card padding="sm">
        <div className="text-center py-6 text-muted-foreground">
          <Users size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Assegna almeno 2 scrivanie vicine per visualizzare il report di compatibilità.</p>
        </div>
      </Card>
    );
  }

  const excellent = pairs.filter(p => p.proximityResult.level === 'excellent');
  const poor = pairs.filter(p => p.proximityResult.level === 'poor');
  const topInsights = pairs
    .flatMap(p => p.proximityResult.insights.map(i => ({
      insight: i,
      userA: `${p.userA.firstName} ${p.userA.lastName}`,
      userB: `${p.userB.firstName} ${p.userB.lastName}`,
      score: p.proximityResult.score,
    })))
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Global Score */}
      <Card padding="sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
              <TrendingUp size={14} />
              Score Globale di Compatibilità
            </h3>
            <p className="text-xs text-muted-foreground">
              Media di {pairs.length} coppie adiacenti
            </p>
          </div>
          <div className="text-right">
            <div
              className="text-3xl font-bold"
              style={{ color: getProximityColor(globalAverage) }}
            >
              {globalAverage}%
            </div>
            <div className="text-xs text-muted-foreground">
              {excellent.length} eccellenti · {poor.length} critiche
            </div>
          </div>
        </div>
      </Card>

      {/* Critical pairs */}
      {poor.length > 0 && (
        <Card padding="sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-destructive" />
            Coppie Critiche
          </h3>
          <div className="space-y-2">
            {poor.slice(0, 3).map((pair, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-destructive/5 border border-destructive/10">
                <span className="text-xs font-medium">{pair.userA.firstName} {pair.userA.lastName[0]}.</span>
                <ArrowRight size={12} className="text-muted-foreground" />
                <span className="text-xs font-medium">{pair.userB.firstName} {pair.userB.lastName[0]}.</span>
                <span
                  className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded"
                  style={{ color: getProximityColor(pair.proximityResult.score), backgroundColor: `${getProximityColor(pair.proximityResult.score)}15` }}
                >
                  {pair.proximityResult.score}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Top pairs */}
      {excellent.length > 0 && (
        <Card padding="sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <Sparkles size={14} className="text-primary" />
            Posizionamenti Ottimali
          </h3>
          <div className="space-y-2">
            {excellent.slice(0, 3).map((pair, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
                <span className="text-xs font-medium">{pair.userA.firstName} {pair.userA.lastName[0]}.</span>
                <ArrowRight size={12} className="text-muted-foreground" />
                <span className="text-xs font-medium">{pair.userB.firstName} {pair.userB.lastName[0]}.</span>
                <span
                  className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded"
                  style={{ color: getProximityColor(pair.proximityResult.score), backgroundColor: `${getProximityColor(pair.proximityResult.score)}15` }}
                >
                  {pair.proximityResult.score}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Insights */}
      {topInsights.length > 0 && (
        <Card padding="sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            💡 Insight
          </h3>
          <ul className="space-y-1.5">
            {topInsights.map((item, i) => (
              <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                <span className="text-foreground font-medium shrink-0">{item.userA} ↔ {item.userB}:</span>
                <span>{item.insight}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
};
