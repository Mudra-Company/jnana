import React from 'react';
import { Users, ArrowRight, AlertTriangle, Sparkles, TrendingUp, Volume2, Activity, GitBranch } from 'lucide-react';
import type { DeskProximityPair, ProximityUserData } from '@/utils/proximityEngine';
import { getProximityColor } from '@/utils/proximityEngine';

interface ProximityReportProps {
  pairs: DeskProximityPair[];
  globalAverage: number;
  userDataMap?: Map<string, ProximityUserData>;
}

export const ProximityReport: React.FC<ProximityReportProps> = ({ pairs, globalAverage, userDataMap }) => {
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

      {/* Collaboration Detail for key pairs */}
      {userDataMap && (poor.length > 0 || excellent.length > 0) && (() => {
        const keyPairs = [...poor, ...excellent].slice(0, 5);
        const details = keyPairs.map(pair => {
          const collabFlow = pair.proximityResult.breakdown.collaborationFlow;
          // Find specific collaboration link info
          const profileA = pair.userA.collaborationProfile;
          const profileB = pair.userB.collaborationProfile;
          let collabPct = 0;
          let affinity = 0;
          let hasBidi = false;

          const findLink = (profile: typeof profileA, targetMemberId: string) => {
            if (!profile?.links) return null;
            for (const link of profile.links) {
              if (link.targetType === 'member' && link.targetId === targetMemberId)
                return { pct: link.collaborationPercentage, aff: link.personalAffinity };
              if (link.targetType === 'team' && link.memberBreakdown) {
                const mb = link.memberBreakdown.find(m => m.memberId === targetMemberId);
                if (mb) return { pct: Math.round((link.collaborationPercentage * mb.percentage) / 100), aff: mb.affinity ?? link.personalAffinity };
              }
            }
            return null;
          };

          const linkAB = findLink(profileA, pair.userB.memberId);
          const linkBA = findLink(profileB, pair.userA.memberId);
          if (linkAB) { collabPct = linkAB.pct; affinity = linkAB.aff; }
          if (linkBA) { collabPct = Math.max(collabPct, linkBA.pct); affinity = Math.max(affinity, linkBA.aff); hasBidi = !!linkAB; }

          if (collabPct === 0 && affinity === 0) return null;

          const score = pair.proximityResult.score;
          const mismatch = (collabPct >= 25 && score < 40) || (collabPct < 10 && score >= 75);

          return { pair, collabPct, affinity, hasBidi, collabFlow, mismatch, score };
        }).filter(Boolean) as Array<{ pair: DeskProximityPair; collabPct: number; affinity: number; hasBidi: boolean; collabFlow: number; mismatch: boolean; score: number }>;

        if (details.length === 0) return null;

        return (
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1">
              <GitBranch size={11} />
              Dettaglio Collaborazione
            </h4>
            <div className="space-y-1">
              {details.map((d, i) => (
                <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border-l-3" style={{ borderLeftColor: d.affinity >= 4 ? '#22c55e' : d.affinity >= 3 ? '#64748b' : '#d97706' }}>
                  <span className="text-[11px] font-medium text-gray-700 dark:text-gray-200">
                    {d.pair.userA.firstName} {d.pair.userA.lastName[0]}.
                  </span>
                  <ArrowRight size={10} className="text-gray-400" />
                  <span className="text-[11px] font-medium text-gray-700 dark:text-gray-200">
                    {d.pair.userB.firstName} {d.pair.userB.lastName[0]}.
                  </span>
                  <span className="ml-auto flex items-center gap-1">
                    <span className="text-[10px] font-bold text-jnana-sage">{d.collabPct}%</span>
                    <span className="text-[9px] text-amber-500">{'★'.repeat(d.affinity)}</span>
                    {d.hasBidi && <span className="text-[8px] px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 font-bold">↔</span>}
                    {d.mismatch && <span className="text-[8px] px-1 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 font-bold">⚠</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
};