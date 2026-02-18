import React from 'react';
import { GitBranch, ArrowRight, AlertTriangle, Star, Users } from 'lucide-react';
import type { FlowConnection } from './CollaborationFlowOverlay';

interface CollaborationFlowReportProps {
  connections: FlowConnection[];
  missingCount: number;
}

function getAffinityColor(a: number): string {
  if (a >= 4) return '#22c55e';
  if (a >= 3) return '#64748b';
  return '#d97706';
}

const DISTANCE_ALERT_THRESHOLD = 200;

export const CollaborationFlowReport: React.FC<CollaborationFlowReportProps> = ({ connections, missingCount }) => {
  if (connections.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400">
        <GitBranch size={32} className="mx-auto mb-2 opacity-30" />
        <p className="text-sm">Nessun flusso di collaborazione mappato sulle scrivanie del piano.</p>
      </div>
    );
  }

  const sorted = [...connections].sort((a, b) => Math.max(b.pctAB, b.pctBA) - Math.max(a.pctAB, a.pctBA));

  const avgPct = Math.round(sorted.reduce((s, c) => s + Math.max(c.pctAB, c.pctBA), 0) / sorted.length);
  const avgAffinity = sorted.length > 0
    ? (sorted.reduce((s, c) => s + Math.max(c.affinityAB, c.affinityBA), 0) / sorted.length).toFixed(1)
    : '0';
  const biCount = sorted.filter(c => c.bidirectional).length;

  // Distant collaborators alert
  const distantPairs = sorted.filter(c => {
    const dist = Math.hypot(c.fromX - c.toX, c.fromY - c.toY);
    return Math.max(c.pctAB, c.pctBA) >= 20 && dist > DISTANCE_ALERT_THRESHOLD;
  });

  return (
    <div className="space-y-3">
      {/* Global stats */}
      <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-l-4 border-jnana-sage">
        <div className="text-3xl font-extrabold leading-none text-jnana-sage">{connections.length}</div>
        <div className="flex-1">
          <div className="text-[11px] font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1">
            <GitBranch size={12} />
            Connessioni Attive
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            Media: {avgPct}% · Affinità: {avgAffinity}★ · {biCount} bidirezionali
            {missingCount > 0 && <span className="text-amber-500"> · {missingCount} mancanti</span>}
          </div>
        </div>
      </div>

      {/* Distant collaborators alert */}
      {distantPairs.length > 0 && (
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-orange-500 mb-1.5 flex items-center gap-1">
            <AlertTriangle size={11} />
            Collaboratori Distanti
          </h4>
          <div className="space-y-1">
            {distantPairs.slice(0, 4).map(c => {
              const maxPct = Math.max(c.pctAB, c.pctBA);
              return (
                <div key={c.key} className="px-2.5 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/10 border-l-3 border-orange-400 text-[11px]">
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {c.fromName.split(' ')[0]} {c.fromName.split(' ')[1]?.[0]}.
                  </span>
                  <span className="text-gray-400 mx-1">↔</span>
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {c.toName.split(' ')[0]} {c.toName.split(' ')[1]?.[0]}.
                  </span>
                  <span className="ml-1 font-bold text-orange-600">{maxPct}%</span>
                  <span className="text-gray-400 ml-1">— considerare riposizionamento</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Connection list */}
      <div>
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1">
          <Users size={11} />
          Connessioni per Intensità
        </h4>
        <div className="space-y-1">
          {sorted.slice(0, 8).map(c => {
            const maxPct = Math.max(c.pctAB, c.pctBA);
            const maxAff = Math.max(c.affinityAB, c.affinityBA);
            return (
              <div key={c.key} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border-l-3" style={{ borderLeftColor: getAffinityColor(maxAff) }}>
                <span className="text-[11px] font-medium text-gray-700 dark:text-gray-200">
                  {c.fromName.split(' ')[0]} {c.fromName.split(' ')[1]?.[0]}.
                </span>
                <ArrowRight size={10} className="text-gray-400" />
                <span className="text-[11px] font-medium text-gray-700 dark:text-gray-200">
                  {c.toName.split(' ')[0]} {c.toName.split(' ')[1]?.[0]}.
                </span>
                <span className="ml-auto flex items-center gap-1">
                  <span className="text-[10px] font-bold" style={{ color: getAffinityColor(maxAff) }}>{maxPct}%</span>
                  <span className="text-[9px] text-amber-500">{'★'.repeat(maxAff)}</span>
                  {c.bidirectional && (
                    <span className="text-[8px] px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 font-bold">↔</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
