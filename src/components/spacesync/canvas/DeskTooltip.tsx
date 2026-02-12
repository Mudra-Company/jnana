import React from 'react';
import type { OfficeDesk } from '@/types/spacesync';

interface DeskTooltipProps {
  desk: OfficeDesk;
  roomX: number;
  roomY: number;
  deskSize: number;
  score?: { avgScore: number; pairCount: number };
}

export const DeskTooltip: React.FC<DeskTooltipProps> = ({ desk, roomX, roomY, deskSize, score }) => {
  const tooltipX = roomX + desk.x + deskSize / 2;
  const tooltipY = roomY + desk.y - 8;

  return (
    <g className="pointer-events-none">
      <rect
        x={tooltipX - 70}
        y={tooltipY - 42}
        width={140}
        height={score ? 42 : 32}
        rx={6}
        fill="hsl(var(--popover))"
        stroke="hsl(var(--border))"
        strokeWidth={1}
        opacity={0.95}
        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
      />
      <text
        x={tooltipX}
        y={tooltipY - 26}
        textAnchor="middle"
        style={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--foreground))' }}
      >
        {desk.assigneeName || desk.label}
      </text>
      {desk.assigneeJobTitle && (
        <text
          x={tooltipX}
          y={tooltipY - 14}
          textAnchor="middle"
          style={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
        >
          {desk.assigneeJobTitle}
        </text>
      )}
      {score && (
        <text
          x={tooltipX}
          y={tooltipY - 2}
          textAnchor="middle"
          style={{ fontSize: 9, fontWeight: 600, fill: score.avgScore >= 60 ? '#22c55e' : '#f59e0b' }}
        >
          Score: {score.avgScore}% ({score.pairCount} vicini)
        </text>
      )}
    </g>
  );
};
