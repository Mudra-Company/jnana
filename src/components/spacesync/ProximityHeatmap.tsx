import React from 'react';
import { getProximityColorAlpha } from '@/utils/proximityEngine';
import type { OfficeRoom } from '@/types/spacesync';

interface ProximityHeatmapProps {
  deskScores: Map<string, { avgScore: number; pairCount: number }>;
  desks: Array<{ id: string; x: number; y: number; roomId: string; companyMemberId?: string }>;
  rooms: OfficeRoom[];
}

const DESK_SIZE = 32;
const GLOW_RADIUS = 40;

export const ProximityHeatmap: React.FC<ProximityHeatmapProps> = ({ deskScores, desks, rooms }) => {
  const roomMap = new Map(rooms.map(r => [r.id, r]));

  return (
    <g className="proximity-heatmap">
      {desks
        .filter(d => d.companyMemberId && deskScores.has(d.id))
        .map(desk => {
          const room = roomMap.get(desk.roomId);
          if (!room) return null;

          const scoreData = deskScores.get(desk.id)!;
          const absX = room.x + desk.x + DESK_SIZE / 2;
          const absY = room.y + desk.y + DESK_SIZE / 2;
          const color = getProximityColorAlpha(scoreData.avgScore, 0.35);

          return (
            <circle
              key={`heatmap-${desk.id}`}
              cx={absX}
              cy={absY}
              r={GLOW_RADIUS}
              fill={color}
              className="pointer-events-none"
            />
          );
        })}
    </g>
  );
};
