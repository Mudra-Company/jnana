import React from 'react';
import { Users, ArrowRight, AlertTriangle, Sparkles, TrendingUp, Volume2, Activity } from 'lucide-react';
import type { DeskProximityPair } from '@/utils/proximityEngine';
import { getProximityColor } from '@/utils/proximityEngine';

interface ProximityReportProps {
  pairs: DeskProximityPair[];
  globalAverage: number;
}

export const ProximityReport: React.FC<ProximityReportProps> = ({ pairs, globalAverage }) => {
  if (pairs.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400">
        <Users size={32} className="mx-auto mb-2 opacity-30" />
        <p className="text-sm">Assegna almeno 2 scrivanie vicine per visualizzare il report di compatibilità.</p>
      </div>
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
      breakdown: p.proximityResult.breakdown,
    })))
    .slice(0, 5);

  // Detect friction pairs
  const frictionPairs = pairs.filter(p => p.proximityResult.breakdown.environmentalFriction >= 30);

  return (
    <div className="space-y-3">
      {/* Global Score — hero layout */}
      <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-l-4" style={{ borderLeftColor: getProximityColor(globalAverage) }}>
        <div
          className="text-3xl font-extrabold leading-none"
          style={{ color: getProximityColor(globalAverage) }}
        >
          {globalAverage}%
        </div>
        <div className="flex-1">
          <div className="text-[11px] font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1">
            <TrendingUp size={12} />
            Score Globale
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            {pairs.length} coppie · {excellent.length} eccellenti · {poor.length} critiche
          </div>
        </div>
      </div>

      {/* Environmental Friction Alerts */}
      {frictionPairs.length > 0 && (
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-orange-500 mb-1.5 flex items-center gap-1">
            <Volume2 size={11} />
            Frizioni Ambientali
          </h4>
          <div className="space-y-1">
            {frictionPairs.slice(0, 3).map((pair, i) => {
              const bd = pair.proximityResult.breakdown;
              const hasNoise = bd.environmentalFriction >= 35;
              return (
                <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/10 border-l-3 border-orange-400">
                  {hasNoise ? <Volume2 size={11} className="text-red-500 shrink-0" /> : <Activity size={11} className="text-amber-500 shrink-0" />}
                  <span className="text-[11px] font-medium text-gray-700 dark:text-gray-200">{pair.userA.firstName} {pair.userA.lastName[0]}.</span>
                  <ArrowRight size={10} className="text-gray-400" />
                  <span className="text-[11px] font-medium text-gray-700 dark:text-gray-200">{pair.userB.firstName} {pair.userB.lastName[0]}.</span>
                  <span className="ml-auto text-[10px] font-bold text-orange-600">{bd.environmentalFriction}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Critical pairs */}
      {poor.length > 0 && (
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-red-500 mb-1.5 flex items-center gap-1">
            <AlertTriangle size={11} />
            Coppie Critiche
          </h4>
          <div className="space-y-1">
            {poor.slice(0, 3).map((pair, i) => (
              <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/10 border-l-3 border-red-400">
                <span className="text-[11px] font-medium text-gray-700 dark:text-gray-200">{pair.userA.firstName} {pair.userA.lastName[0]}.</span>
                <ArrowRight size={10} className="text-gray-400" />
                <span className="text-[11px] font-medium text-gray-700 dark:text-gray-200">{pair.userB.firstName} {pair.userB.lastName[0]}.</span>
                <span
                  className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ color: getProximityColor(pair.proximityResult.score), backgroundColor: `${getProximityColor(pair.proximityResult.score)}15` }}
                >
                  {pair.proximityResult.score}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Excellent pairs */}
      {excellent.length > 0 && (
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-jnana-sage mb-1.5 flex items-center gap-1">
            <Sparkles size={11} />
            Posizionamenti Ottimali
          </h4>
          <div className="space-y-1">
            {excellent.slice(0, 3).map((pair, i) => (
              <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-jnana-sage/5 border-l-3 border-jnana-sage">
                <span className="text-[11px] font-medium text-gray-700 dark:text-gray-200">{pair.userA.firstName} {pair.userA.lastName[0]}.</span>
                <ArrowRight size={10} className="text-gray-400" />
                <span className="text-[11px] font-medium text-gray-700 dark:text-gray-200">{pair.userB.firstName} {pair.userB.lastName[0]}.</span>
                <span
                  className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ color: getProximityColor(pair.proximityResult.score), backgroundColor: `${getProximityColor(pair.proximityResult.score)}15` }}
                >
                  {pair.proximityResult.score}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      {topInsights.length > 0 && (
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
            💡 Insight
          </h4>
          <ul className="space-y-1">
            {topInsights.map((item, i) => (
              <li key={i} className="text-[11px] text-gray-500 flex gap-1.5">
                <span className="text-gray-700 dark:text-gray-200 font-medium shrink-0">{item.userA} ↔ {item.userB}:</span>
                <span>{item.insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};