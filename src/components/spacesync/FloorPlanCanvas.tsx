import React, { useState, useRef, useCallback, useEffect } from 'react';
import { getProximityColor } from '@/utils/proximityEngine';
import { CanvasToolbar } from './canvas/CanvasToolbar';
import { RoomResizeHandles } from './canvas/RoomResizeHandles';
import { DeskTooltip } from './canvas/DeskTooltip';
import type { OfficeRoom, OfficeDesk, CanvasMode, RoomType, ResizeDirection, ResizingRoom, DraggingRoom } from '@/types/spacesync';

interface FloorPlanCanvasProps {
  rooms: OfficeRoom[];
  desks: OfficeDesk[];
  canvasWidth: number;
  canvasHeight: number;
  onCreateRoom: (room: { name: string; x: number; y: number; width: number; height: number; roomType: RoomType }) => void;
  onUpdateRoom: (id: string, updates: Partial<OfficeRoom>) => void;
  onDeleteRoom: (id: string) => void;
  onCreateDesk: (roomId: string, desk: { label: string; x: number; y: number }) => void;
  onUpdateDesk: (id: string, updates: Partial<OfficeDesk>) => void;
  onDeleteDesk: (id: string) => void;
  onSelectDesk: (desk: OfficeDesk) => void;
  selectedRoomId?: string;
  selectedDeskId?: string;
  onSelectRoom: (id: string | undefined) => void;
  heatmapMode?: boolean;
  onToggleHeatmap?: () => void;
  heatmapOverlay?: React.ReactNode;
  deskScores?: Map<string, { avgScore: number; pairCount: number }>;
}

const ROOM_COLORS: Record<RoomType, string> = {
  office: '#dbeafe',
  meeting: '#fef3c7',
  common: '#d1fae5',
  other: '#f3e8ff',
};

const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  office: 'Ufficio',
  meeting: 'Sala Riunioni',
  common: 'Zona Comune',
  other: 'Altro',
};

const DESK_SIZE = 32;
const GRID_SIZE = 40;
const MIN_ROOM_SIZE = 60;

function snap(val: number, shiftHeld: boolean): number {
  return shiftHeld ? val : Math.round(val / GRID_SIZE) * GRID_SIZE;
}

export const FloorPlanCanvas: React.FC<FloorPlanCanvasProps> = ({
  rooms, desks, canvasWidth, canvasHeight,
  onCreateRoom, onUpdateRoom, onDeleteRoom,
  onCreateDesk, onUpdateDesk, onDeleteDesk, onSelectDesk,
  selectedRoomId, selectedDeskId, onSelectRoom,
  heatmapMode, onToggleHeatmap, heatmapOverlay, deskScores,
}) => {
  const [mode, setMode] = useState<CanvasMode>('select');
  const [zoom, setZoom] = useState(1);
  const [drawing, setDrawing] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const [draggingDesk, setDraggingDesk] = useState<{ deskId: string; offsetX: number; offsetY: number } | null>(null);
  const [resizingRoom, setResizingRoom] = useState<ResizingRoom | null>(null);
  const [draggingRoom, setDraggingRoom] = useState<DraggingRoom | null>(null);
  const [hoveredDeskId, setHoveredDeskId] = useState<string | null>(null);
  const [shiftHeld, setShiftHeld] = useState(false);
  const [deskCounter, setDeskCounter] = useState(1);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Desk counter init
  useEffect(() => {
    if (desks.length > 0) {
      const maxNum = desks.reduce((max, d) => {
        const match = d.label.match(/D(\d+)/);
        return match ? Math.max(max, parseInt(match[1])) : max;
      }, 0);
      setDeskCounter(maxNum + 1);
    }
  }, [desks]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftHeld(true);
      if (e.key === '1') setMode('select');
      if (e.key === '2') setMode('draw-room');
      if (e.key === '3') setMode('place-desk');
      if (e.key === 'Escape') { onSelectRoom(undefined); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !e.target) {
        if (selectedDeskId) { onDeleteDesk(selectedDeskId); }
        else if (selectedRoomId) { onDeleteRoom(selectedRoomId); onSelectRoom(undefined); }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftHeld(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [selectedRoomId, selectedDeskId, onDeleteDesk, onDeleteRoom, onSelectRoom]);

  const getSVGPoint = useCallback((e: React.MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    };
  }, [zoom]);

  // --- MOUSE DOWN ---
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (mode === 'draw-room') {
      const pt = getSVGPoint(e);
      setDrawing({ startX: pt.x, startY: pt.y, currentX: pt.x, currentY: pt.y });
    } else if (mode === 'place-desk') {
      const pt = getSVGPoint(e);
      const targetRoom = rooms.find(r =>
        pt.x >= r.x && pt.x <= r.x + r.width &&
        pt.y >= r.y && pt.y <= r.y + r.height
      );
      if (targetRoom) {
        const label = `D${deskCounter}`;
        onCreateDesk(targetRoom.id, {
          label,
          x: snap(pt.x - targetRoom.x - DESK_SIZE / 2, shiftHeld),
          y: snap(pt.y - targetRoom.y - DESK_SIZE / 2, shiftHeld),
        });
        setDeskCounter(prev => prev + 1);
      }
    }
  };

  // --- MOUSE MOVE ---
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const pt = getSVGPoint(e);

    if (drawing) {
      setDrawing(prev => prev ? { ...prev, currentX: pt.x, currentY: pt.y } : null);
    }

    if (draggingDesk) {
      const desk = desks.find(d => d.id === draggingDesk.deskId);
      if (!desk) return;
      const room = rooms.find(r => r.id === desk.roomId);
      if (!room) return;
      const newX = snap(Math.max(0, Math.min(room.width - DESK_SIZE, pt.x - room.x - draggingDesk.offsetX)), shiftHeld);
      const newY = snap(Math.max(0, Math.min(room.height - DESK_SIZE, pt.y - room.y - draggingDesk.offsetY)), shiftHeld);
      onUpdateDesk(desk.id, { x: newX, y: newY });
    }

    if (resizingRoom) {
      const { direction, startX, startY, originalRoom: orig } = resizingRoom;
      const dx = pt.x - startX;
      const dy = pt.y - startY;
      let { x, y, width, height } = orig;

      if (direction.includes('e')) width = snap(Math.max(MIN_ROOM_SIZE, orig.width + dx), shiftHeld);
      if (direction.includes('w')) { const newW = snap(Math.max(MIN_ROOM_SIZE, orig.width - dx), shiftHeld); x = orig.x + (orig.width - newW); width = newW; }
      if (direction.includes('s')) height = snap(Math.max(MIN_ROOM_SIZE, orig.height + dy), shiftHeld);
      if (direction.includes('n')) { const newH = snap(Math.max(MIN_ROOM_SIZE, orig.height - dy), shiftHeld); y = orig.y + (orig.height - newH); height = newH; }

      onUpdateRoom(resizingRoom.roomId, { x, y, width, height });
    }

    if (draggingRoom) {
      const dx = pt.x - draggingRoom.startX;
      const dy = pt.y - draggingRoom.startY;
      const newX = snap(draggingRoom.originalX + dx, shiftHeld);
      const newY = snap(draggingRoom.originalY + dy, shiftHeld);
      onUpdateRoom(draggingRoom.roomId, { x: Math.max(0, newX), y: Math.max(0, newY) });
    }
  };

  // --- MOUSE UP ---
  const handleMouseUp = () => {
    if (drawing) {
      const x = snap(Math.min(drawing.startX, drawing.currentX), shiftHeld);
      const y = snap(Math.min(drawing.startY, drawing.currentY), shiftHeld);
      const w = snap(Math.abs(drawing.currentX - drawing.startX), shiftHeld);
      const h = snap(Math.abs(drawing.currentY - drawing.startY), shiftHeld);
      if (w > 40 && h > 30) {
        onCreateRoom({ name: 'Nuova Stanza', x, y, width: w, height: h, roomType: 'office' });
      }
      setDrawing(null);
      setMode('select');
    }
    setDraggingDesk(null);
    setResizingRoom(null);
    setDraggingRoom(null);
  };

  // --- ROOM CLICK (select or start drag) ---
  const handleRoomMouseDown = (e: React.MouseEvent, room: OfficeRoom) => {
    e.stopPropagation();
    if (mode !== 'select') return;
    onSelectRoom(room.id);
    const pt = getSVGPoint(e);
    setDraggingRoom({
      roomId: room.id,
      startX: pt.x,
      startY: pt.y,
      originalX: room.x,
      originalY: room.y,
    });
  };

  // --- RESIZE START ---
  const handleResizeStart = (room: OfficeRoom) => (e: React.MouseEvent, direction: ResizeDirection) => {
    const pt = getSVGPoint(e);
    setResizingRoom({
      roomId: room.id,
      direction,
      startX: pt.x,
      startY: pt.y,
      originalRoom: { x: room.x, y: room.y, width: room.width, height: room.height },
    });
  };

  // --- DESK MOUSEDOWN ---
  const handleDeskMouseDown = (e: React.MouseEvent, desk: OfficeDesk) => {
    e.stopPropagation();
    if (mode === 'select') {
      onSelectDesk(desk);
      const room = rooms.find(r => r.id === desk.roomId);
      if (!room) return;
      const pt = getSVGPoint(e);
      setDraggingDesk({
        deskId: desk.id,
        offsetX: pt.x - room.x - desk.x,
        offsetY: pt.y - room.y - desk.y,
      });
    }
  };

  const drawingRect = drawing ? {
    x: Math.min(drawing.startX, drawing.currentX),
    y: Math.min(drawing.startY, drawing.currentY),
    width: Math.abs(drawing.currentX - drawing.startX),
    height: Math.abs(drawing.currentY - drawing.startY),
  } : null;

  const isInteracting = !!(draggingDesk || resizingRoom || draggingRoom);
  const cursorClass = mode === 'draw-room' ? 'cursor-crosshair' : mode === 'place-desk' ? 'cursor-cell' : resizingRoom ? '' : draggingRoom ? 'cursor-grabbing' : 'cursor-default';

  return (
    <div className="flex flex-col gap-2" ref={containerRef}>
      <CanvasToolbar
        mode={mode}
        setMode={setMode}
        zoom={zoom}
        setZoom={setZoom}
        heatmapMode={heatmapMode}
        onToggleHeatmap={onToggleHeatmap}
        selectedRoomId={selectedRoomId}
        selectedDeskId={selectedDeskId}
        onDeleteRoom={() => { if (selectedRoomId) { onDeleteRoom(selectedRoomId); onSelectRoom(undefined); } }}
        onDeleteDesk={() => { if (selectedDeskId) onDeleteDesk(selectedDeskId); }}
      />

      <div className="overflow-auto rounded-xl border border-border bg-background shadow-inner" style={{ maxHeight: '60vh' }}>
        <svg
          ref={svgRef}
          width={canvasWidth * zoom}
          height={canvasHeight * zoom}
          viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
          className={cursorClass}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Grid */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(var(--border))" strokeWidth="0.3" opacity="0.5" />
            </pattern>
          </defs>
          <rect width={canvasWidth} height={canvasHeight} fill="url(#grid)" />

          {/* Heatmap overlay */}
          {heatmapMode && heatmapOverlay}

          {/* Rooms */}
          {rooms.map(room => {
            const isSelected = selectedRoomId === room.id;
            return (
              <g key={room.id}>
                <rect
                  x={room.x}
                  y={room.y}
                  width={room.width}
                  height={room.height}
                  fill={ROOM_COLORS[room.roomType] || room.color}
                  stroke={isSelected ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
                  strokeWidth={isSelected ? 2.5 : 1}
                  rx={6}
                  className="transition-all"
                  style={{ cursor: mode === 'select' ? (draggingRoom?.roomId === room.id ? 'grabbing' : 'grab') : undefined }}
                  onMouseDown={(e) => handleRoomMouseDown(e, room)}
                  opacity={isSelected ? 0.85 : 0.65}
                />
                {/* Room label */}
                <text
                  x={room.x + 10}
                  y={room.y + 20}
                  className="pointer-events-none select-none"
                  style={{ fontSize: 12, fontWeight: 700, fill: '#334155' }}
                >
                  {room.name}
                </text>
                <text
                  x={room.x + 10}
                  y={room.y + 33}
                  className="pointer-events-none select-none"
                  style={{ fontSize: 9, fill: '#94a3b8' }}
                >
                  {ROOM_TYPE_LABELS[room.roomType]}
                </text>

                {/* Desks */}
                {desks.filter(d => d.roomId === room.id).map(desk => {
                  const isDragging = draggingDesk?.deskId === desk.id;
                  const isHovered = hoveredDeskId === desk.id;
                  const deskScore = deskScores?.get(desk.id);
                  return (
                    <g key={desk.id}>
                      <g
                        transform={`translate(${room.x + desk.x}, ${room.y + desk.y})`}
                        onMouseDown={(e) => handleDeskMouseDown(e, desk)}
                        onMouseEnter={() => setHoveredDeskId(desk.id)}
                        onMouseLeave={() => setHoveredDeskId(null)}
                        className="cursor-grab active:cursor-grabbing"
                      >
                        {/* Shadow when dragging */}
                        {isDragging && (
                          <rect
                            width={DESK_SIZE + 4}
                            height={DESK_SIZE + 4}
                            x={-2}
                            y={-2}
                            rx={6}
                            fill="none"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            strokeDasharray="4 2"
                            opacity={0.5}
                          />
                        )}
                        <rect
                          width={DESK_SIZE}
                          height={DESK_SIZE}
                          rx={5}
                          fill={heatmapMode && desk.companyMemberId && deskScores?.has(desk.id)
                            ? getProximityColor(deskScores.get(desk.id)!.avgScore)
                            : desk.companyMemberId ? '#3b82f6' : '#94a3b8'
                          }
                          opacity={selectedDeskId === desk.id ? 1 : isDragging ? 0.9 : 0.8}
                          stroke={selectedDeskId === desk.id ? 'hsl(var(--primary))' : 'transparent'}
                          strokeWidth={selectedDeskId === desk.id ? 2 : 0}
                          style={{ transition: isDragging ? 'none' : 'all 0.15s', transform: isDragging ? 'scale(1.08)' : undefined, transformOrigin: 'center' }}
                        />
                        <text
                          x={DESK_SIZE / 2}
                          y={DESK_SIZE / 2 - 2}
                          textAnchor="middle"
                          className="pointer-events-none select-none"
                          style={{ fontSize: 8, fontWeight: 700, fill: 'white' }}
                        >
                          {desk.label}
                        </text>
                        {desk.assigneeName && (
                          <text
                            x={DESK_SIZE / 2}
                            y={DESK_SIZE / 2 + 8}
                            textAnchor="middle"
                            className="pointer-events-none select-none"
                            style={{ fontSize: 6, fill: 'rgba(255,255,255,0.8)' }}
                          >
                            {desk.assigneeName.split(' ').map((n: string) => n[0]).join('')}
                          </text>
                        )}
                      </g>
                      {/* Tooltip on hover */}
                      {isHovered && !isInteracting && desk.companyMemberId && (
                        <DeskTooltip
                          desk={desk}
                          roomX={room.x}
                          roomY={room.y}
                          deskSize={DESK_SIZE}
                          score={deskScore}
                        />
                      )}
                    </g>
                  );
                })}

                {/* Resize handles */}
                {isSelected && mode === 'select' && !draggingRoom && (
                  <RoomResizeHandles room={room} onResizeStart={handleResizeStart(room)} />
                )}
              </g>
            );
          })}

          {/* Drawing preview */}
          {drawingRect && (
            <g>
              <rect
                x={drawingRect.x}
                y={drawingRect.y}
                width={drawingRect.width}
                height={drawingRect.height}
                fill="hsl(var(--primary) / 0.12)"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeDasharray="6 3"
                rx={6}
              />
              <text
                x={drawingRect.x + drawingRect.width / 2}
                y={drawingRect.y + drawingRect.height / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                className="pointer-events-none select-none"
                style={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--primary))' }}
              >
                {Math.round(drawingRect.width)}×{Math.round(drawingRect.height)}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
