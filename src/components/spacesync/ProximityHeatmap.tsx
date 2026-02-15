import React from 'react';
import { getProximityColorAlpha } from '@/utils/proximityEngine';
import type { OfficeRoom } from '@/types/spacesync';

interface ProximityHeatmapProps {
  deskScores: Map<string, { avgScore: number; pairCount: number }>;
  desks: Array<{ id: string; x: number; y: number; roomId: string; companyMemberId?: string }>;
  rooms: OfficeRoom[];
}

const DESK_SIZE = 32;
const GLOW_RADIUS = 60;

export const ProximityHeatmap: React.FC<ProximityHeatmapProps> = ({ deskScores, desks, rooms }) => {
  const roomMap = new Map(rooms.map(r => [r.id, r]));

  // Build list of assigned desks with scores and absolute positions
  const scoredDesks = desks
    .filter(d => d.companyMemberId && deskScores.has(d.id))
    .map(desk => {
      const room = roomMap.get(desk.roomId);
      if (!room) return null;
      const scoreData = deskScores.get(desk.id)!;
      return {
        id: desk.id,
        absX: room.x + desk.x + DESK_SIZE / 2,
        absY: room.y + desk.y + DESK_SIZE / 2,
        avgScore: scoreData.avgScore,
      };
    })
    .filter(Boolean) as Array<{ id: string; absX: number; absY: number; avgScore: number }>;

  // Build connection lines between nearby desks (within 250px)
  const connections: Array<{ x1: number; y1: number; x2: number; y2: number; score: number }> = [];
  for (let i = 0; i < scoredDesks.length; i++) {
    for (let j = i + 1; j < scoredDesks.length; j++) {
      const a = scoredDesks[i];
      const b = scoredDesks[j];
      const dist = Math.hypot(a.absX - b.absX, a.absY - b.absY);
      if (dist < 250) {
        const avgScore = Math.round((a.avgScore + b.avgScore) / 2);
        connections.push({ x1: a.absX, y1: a.absY, x2: b.absX, y2: b.absY, score: avgScore });
      }
    }
  }

  const getLineColor = (score: number) =>
    score >= 70 ? 'rgba(22,163,74,0.25)' : score >= 40 ? 'rgba(217,119,6,0.2)' : 'rgba(220,38,38,0.18)';

  return (
    <g className="proximity-heatmap">
      {/* Connection lines */}
      {connections.map((c, i) => (
        <line
          key={`conn-${i}`}
          x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
          stroke={getLineColor(c.score)}
          strokeWidth={2}
          className="pointer-events-none"
        />
      ))}
      {/* Glow circles */}
      {scoredDesks.map(desk => (
        <circle
          key={`heatmap-${desk.id}`}
          cx={desk.absX}
          cy={desk.absY}
          r={GLOW_RADIUS}
          fill={getProximityColorAlpha(desk.avgScore, 0.5)}
          className="pointer-events-none"
        />
      ))}
    </g>
  );
};
