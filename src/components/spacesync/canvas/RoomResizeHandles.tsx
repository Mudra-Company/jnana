import React from 'react';
import type { OfficeRoom, ResizeDirection } from '@/types/spacesync';

interface RoomResizeHandlesProps {
  room: OfficeRoom;
  onResizeStart: (e: React.MouseEvent, direction: ResizeDirection) => void;
}

const HANDLE_SIZE = 8;

const HANDLE_POSITIONS: { dir: ResizeDirection; getPos: (r: OfficeRoom) => { cx: number; cy: number }; cursor: string }[] = [
  { dir: 'nw', getPos: r => ({ cx: r.x, cy: r.y }), cursor: 'nwse-resize' },
  { dir: 'n', getPos: r => ({ cx: r.x + r.width / 2, cy: r.y }), cursor: 'ns-resize' },
  { dir: 'ne', getPos: r => ({ cx: r.x + r.width, cy: r.y }), cursor: 'nesw-resize' },
  { dir: 'e', getPos: r => ({ cx: r.x + r.width, cy: r.y + r.height / 2 }), cursor: 'ew-resize' },
  { dir: 'se', getPos: r => ({ cx: r.x + r.width, cy: r.y + r.height }), cursor: 'nwse-resize' },
  { dir: 's', getPos: r => ({ cx: r.x + r.width / 2, cy: r.y + r.height }), cursor: 'ns-resize' },
  { dir: 'sw', getPos: r => ({ cx: r.x, cy: r.y + r.height }), cursor: 'nesw-resize' },
  { dir: 'w', getPos: r => ({ cx: r.x, cy: r.y + r.height / 2 }), cursor: 'ew-resize' },
];

export const RoomResizeHandles: React.FC<RoomResizeHandlesProps> = ({ room, onResizeStart }) => {
  return (
    <g>
      {HANDLE_POSITIONS.map(({ dir, getPos, cursor }) => {
        const { cx, cy } = getPos(room);
        return (
          <rect
            key={dir}
            x={cx - HANDLE_SIZE / 2}
            y={cy - HANDLE_SIZE / 2}
            width={HANDLE_SIZE}
            height={HANDLE_SIZE}
            rx={2}
            fill="hsl(var(--primary))"
            stroke="white"
            strokeWidth={1.5}
            style={{ cursor }}
            className="transition-opacity hover:opacity-80"
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeStart(e, dir);
            }}
          />
        );
      })}
      {/* Show room dimensions */}
      <text
        x={room.x + room.width - 4}
        y={room.y + room.height - 4}
        textAnchor="end"
        className="pointer-events-none select-none"
        style={{ fontSize: 9, fill: 'hsl(var(--primary))', fontWeight: 600 }}
      >
        {Math.round(room.width)}×{Math.round(room.height)}
      </text>
    </g>
  );
};
