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
  const tooltipY = roomY + desk.y - 12;

  const hasScore = !!score;
  const hasJobTitle = !!desk.assigneeJobTitle;
  const lineHeight = 14;
  const padding = 10;
  const width = 170;
  
  let lines = 1; // name
  if (hasJobTitle) lines++;
  if (hasScore) lines++;
  const height = lines * lineHeight + padding * 2;

  const scoreColor = score
    ? score.avgScore >= 70 ? '#16a34a' : score.avgScore >= 40 ? '#d97706' : '#dc2626'
    : '#64748b';

  return (
    <g className="pointer-events-none">
      {/* Arrow */}
      <polygon
        points={`${tooltipX - 5},${tooltipY} ${tooltipX + 5},${tooltipY} ${tooltipX},${tooltipY + 6}`}
        fill="#ffffff"
        stroke="#d1d5db"
        strokeWidth={0.5}
      />
      {/* Background */}
      <rect
        x={tooltipX - width / 2}
        y={tooltipY - height}
        width={width}
        height={height}
        rx={8}
        fill="#ffffff"
        stroke="#d1d5db"
        strokeWidth={1}
        style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.12))' }}
      />
      {/* Name */}
      <text
        x={tooltipX}
        y={tooltipY - height + padding + 10}
        textAnchor="middle"
        style={{ fontSize: 11, fontWeight: 700, fill: '#1e293b' }}
      >
        {desk.assigneeName || desk.label}
      </text>
      {/* Job title */}
      {hasJobTitle && (
        <text
          x={tooltipX}
          y={tooltipY - height + padding + 10 + lineHeight}
          textAnchor="middle"
          style={{ fontSize: 9, fill: '#64748b' }}
        >
          {desk.assigneeJobTitle}
        </text>
      )}
      {/* Score */}
      {hasScore && (
        <text
          x={tooltipX}
          y={tooltipY - height + padding + 10 + lineHeight * (hasJobTitle ? 2 : 1)}
          textAnchor="middle"
          style={{ fontSize: 10, fontWeight: 600, fill: scoreColor }}
        >
          ★ {score!.avgScore}% · {score!.pairCount} vicini
        </text>
      )}
    </g>
  );
};
