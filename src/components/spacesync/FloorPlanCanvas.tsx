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
const DRAG_THRESHOLD = 5;

function snap(val: number, shiftHeld: boolean): number {
  return shiftHeld ? val : Math.round(val / GRID_SIZE) * GRID_SIZE;
}

interface DraggingDeskState {
  deskId: string;
  deskRef: OfficeDesk;
  originRoomId: string;
  /** Offset from desk top-left to mouse, in absolute canvas coords */
  offsetX: number;
  offsetY: number;
  /** Mouse position at mousedown (for click vs drag detection) */
  startMouseX: number;
  startMouseY: number;
  /** Absolute position of desk on canvas during drag */
  absX: number;
  absY: number;
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
  const [draggingDesk, setDraggingDesk] = useState<DraggingDeskState | null>(null);
  const [hasDragged, setHasDragged] = useState(false);
  const [dragTargetRoomId, setDragTargetRoomId] = useState<string | null>(null);
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

  /** Find room containing a point */
  const findRoomAtPoint = useCallback((px: number, py: number): OfficeRoom | undefined => {
    // Check rooms in reverse order so topmost (last rendered) wins
    for (let i = rooms.length - 1; i >= 0; i--) {
      const r = rooms[i];
      if (px >= r.x && px <= r.x + r.width && py >= r.y && py <= r.y + r.height) {
        return r;
      }
    }
    return undefined;
  }, [rooms]);

  // --- MOUSE DOWN ---
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (mode === 'draw-room') {
      const pt = getSVGPoint(e);
      setDrawing({ startX: pt.x, startY: pt.y, currentX: pt.x, currentY: pt.y });
    } else if (mode === 'place-desk') {
      const pt = getSVGPoint(e);
      const targetRoom = findRoomAtPoint(pt.x, pt.y);
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
      const distX = Math.abs(pt.x - draggingDesk.startMouseX);
      const distY = Math.abs(pt.y - draggingDesk.startMouseY);
      if (distX > DRAG_THRESHOLD || distY > DRAG_THRESHOLD) setHasDragged(true);

      // Absolute position on canvas
      const newAbsX = pt.x - draggingDesk.offsetX;
      const newAbsY = pt.y - draggingDesk.offsetY;
      setDraggingDesk(prev => prev ? { ...prev, absX: newAbsX, absY: newAbsY } : null);

      // Detect which room the desk center is over
      const centerX = newAbsX + DESK_SIZE / 2;
      const centerY = newAbsY + DESK_SIZE / 2;
      const targetRoom = findRoomAtPoint(centerX, centerY);
      setDragTargetRoomId(targetRoom?.id ?? null);
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

    if (draggingDesk) {
      if (hasDragged) {
        const targetRoom = dragTargetRoomId ? rooms.find(r => r.id === dragTargetRoomId) : null;
        if (targetRoom) {
          // Calculate position relative to target room, snapped & clamped
          let relX = snap(draggingDesk.absX - targetRoom.x, shiftHeld);
          let relY = snap(draggingDesk.absY - targetRoom.y, shiftHeld);
          relX = Math.max(0, Math.min(targetRoom.width - DESK_SIZE, relX));
          relY = Math.max(0, Math.min(targetRoom.height - DESK_SIZE, relY));

          const roomChanged = targetRoom.id !== draggingDesk.originRoomId;
          if (roomChanged) {
            onUpdateDesk(draggingDesk.deskId, { x: relX, y: relY, roomId: targetRoom.id });
          } else {
            onUpdateDesk(draggingDesk.deskId, { x: relX, y: relY });
          }
        }
        // If outside all rooms → cancel (no DB update, desk stays where it was)
      } else {
        // Was a click → open modal
        onSelectDesk(draggingDesk.deskRef);
      }
      setDraggingDesk(null);
      setHasDragged(false);
      setDragTargetRoomId(null);
    }

    setResizingRoom(null);
    setDraggingRoom(null);
  };

  // --- ROOM CLICK (select or start drag) ---
  const handleRoomMouseDown = (e: React.MouseEvent, room: OfficeRoom) => {
    if (mode !== 'select') return;
    e.stopPropagation();
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
  const handleDeskMouseDown = (e: React.MouseEvent, desk: OfficeDesk, room: OfficeRoom) => {
    e.stopPropagation();
    if (mode === 'select') {
      const pt = getSVGPoint(e);
      // Absolute position of the desk on canvas
      const absX = room.x + desk.x;
      const absY = room.y + desk.y;
      setHasDragged(false);
      setDraggingDesk({
        deskId: desk.id,
        deskRef: desk,
        originRoomId: room.id,
        offsetX: pt.x - absX,
        offsetY: pt.y - absY,
        startMouseX: pt.x,
        startMouseY: pt.y,
        absX,
        absY,
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
  const isDeskBeingDragged = (deskId: string) => draggingDesk?.deskId === deskId && hasDragged;
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

      {/* Stats bar */}
      <div className="flex items-center gap-4 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs">
        <span className="text-gray-500">🏠 <strong className="text-gray-700">{rooms.length}</strong> stanze</span>
        <span className="text-gray-500">🪑 <strong className="text-gray-700">{desks.filter(d => d.companyMemberId).length}/{desks.length}</strong> assegnate</span>
        {desks.length > 0 && (
          <>
            <span className="text-gray-500">
              Occupazione: <strong className="text-gray-700">{Math.round((desks.filter(d => d.companyMemberId).length / desks.length) * 100)}%</strong>
            </span>
            {heatmapMode && deskScores && deskScores.size > 0 && (() => {
              const scores = Array.from(deskScores.values());
              const avg = Math.round(scores.reduce((s, v) => s + v.avgScore, 0) / scores.length);
              const color = avg >= 70 ? '#16a34a' : avg >= 40 ? '#d97706' : '#dc2626';
              return <span style={{ color }}>★ Score medio: <strong>{avg}%</strong></span>;
            })()}
          </>
        )}
      </div>

      <div className="overflow-auto rounded-xl border border-gray-200 bg-white shadow-inner" style={{ maxHeight: '60vh' }}>
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
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="0.3" opacity="0.5" />
            </pattern>
          </defs>
          <rect width={canvasWidth} height={canvasHeight} fill="url(#grid)" />

          {/* Heatmap overlay */}
          {heatmapMode && heatmapOverlay}

          {/* Rooms */}
          {rooms.map(room => {
            const isSelected = selectedRoomId === room.id;
            const isDragTarget = draggingDesk && hasDragged && dragTargetRoomId === room.id;
            return (
              <g key={room.id}>
                <rect
                  x={room.x}
                  y={room.y}
                  width={room.width}
                  height={room.height}
                  fill={ROOM_COLORS[room.roomType] || room.color}
                  stroke={isDragTarget ? '#22c55e' : isSelected ? '#4a7c59' : '#d1d5db'}
                  strokeWidth={isDragTarget ? 2.5 : isSelected ? 2.5 : 1}
                  rx={6}
                  className="transition-all"
                  style={{ cursor: mode === 'select' ? (draggingRoom?.roomId === room.id ? 'grabbing' : 'grab') : undefined }}
                  onMouseDown={(e) => handleRoomMouseDown(e, room)}
                  opacity={isDragTarget ? 0.9 : isSelected ? 0.85 : 0.65}
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

                {/* Desks (skip the one being dragged — it renders at canvas level) */}
                {desks.filter(d => d.roomId === room.id).map(desk => {
                  if (isDeskBeingDragged(desk.id)) {
                    // Render ghost in original position
                    return (
                      <g key={desk.id}>
                        <rect
                          x={room.x + desk.x}
                          y={room.y + desk.y}
                          width={DESK_SIZE}
                          height={DESK_SIZE}
                          rx={5}
                          fill="#94a3b8"
                          opacity={0.25}
                          strokeDasharray="3 2"
                          stroke="#94a3b8"
                          strokeWidth={1}
                        />
                      </g>
                    );
                  }

                  const isHovered = hoveredDeskId === desk.id;
                  const deskScore = deskScores?.get(desk.id);
                  return (
                    <g key={desk.id}>
                      <g
                        transform={`translate(${room.x + desk.x}, ${room.y + desk.y})`}
                        onMouseDown={(e) => handleDeskMouseDown(e, desk, room)}
                        onMouseEnter={() => setHoveredDeskId(desk.id)}
                        onMouseLeave={() => setHoveredDeskId(null)}
                        className="cursor-grab active:cursor-grabbing"
                      >
                        {(() => {
                          const deskScore = deskScores?.get(desk.id);
                          const hasScore = heatmapMode && desk.companyMemberId && deskScore;
                          const bgColor = hasScore
                            ? getProximityColor(deskScore!.avgScore)
                            : desk.companyMemberId ? '#4a7c59' : '#b0b8c4';
                          const borderColor = selectedDeskId === desk.id ? '#4a7c59'
                            : (deskScore && desk.companyMemberId)
                              ? (deskScore.avgScore >= 70 ? '#16a34a' : deskScore.avgScore >= 40 ? '#d97706' : '#dc2626')
                              : 'transparent';
                          const initials = desk.assigneeName
                            ? desk.assigneeName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
                            : '';
                          return (
                            <>
                              <rect
                                width={DESK_SIZE}
                                height={DESK_SIZE}
                                rx={6}
                                fill={bgColor}
                                opacity={selectedDeskId === desk.id ? 1 : 0.85}
                                stroke={borderColor}
                                strokeWidth={borderColor !== 'transparent' ? 2 : 0}
                              />
                              {desk.assigneeName ? (
                                <text
                                  x={DESK_SIZE / 2}
                                  y={hasScore ? DESK_SIZE / 2 - 2 : DESK_SIZE / 2 + 3}
                                  textAnchor="middle"
                                  className="pointer-events-none select-none"
                                  style={{ fontSize: 10, fontWeight: 700, fill: 'white' }}
                                >
                                  {initials}
                                </text>
                              ) : (
                                <text
                                  x={DESK_SIZE / 2}
                                  y={DESK_SIZE / 2 + 3}
                                  textAnchor="middle"
                                  className="pointer-events-none select-none"
                                  style={{ fontSize: 8, fontWeight: 600, fill: 'white' }}
                                >
                                  {desk.label}
                                </text>
                              )}
                              {hasScore && (
                                <text
                                  x={DESK_SIZE / 2}
                                  y={DESK_SIZE / 2 + 10}
                                  textAnchor="middle"
                                  className="pointer-events-none select-none"
                                  style={{ fontSize: 7, fontWeight: 700, fill: 'rgba(255,255,255,0.9)' }}
                                >
                                  {deskScore!.avgScore}%
                                </text>
                              )}
                            </>
                          );
                        })()}
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

          {/* Desk being dragged — rendered at canvas level for cross-room movement */}
          {draggingDesk && hasDragged && (
            <g
              transform={`translate(${draggingDesk.absX}, ${draggingDesk.absY})`}
              className="pointer-events-none"
            >
              <rect
                width={DESK_SIZE + 4}
                height={DESK_SIZE + 4}
                x={-2}
                y={-2}
                rx={7}
                fill="none"
                stroke={dragTargetRoomId ? '#22c55e' : '#ef4444'}
                strokeWidth={2}
                strokeDasharray="4 2"
                opacity={0.7}
              />
              <rect
                width={DESK_SIZE}
                height={DESK_SIZE}
                rx={5}
                fill={draggingDesk.deskRef.companyMemberId ? '#3b82f6' : '#94a3b8'}
                opacity={0.9}
                style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }}
              />
              <text
                x={DESK_SIZE / 2}
                y={DESK_SIZE / 2 - 2}
                textAnchor="middle"
                className="pointer-events-none select-none"
                style={{ fontSize: 8, fontWeight: 700, fill: 'white' }}
              >
                {draggingDesk.deskRef.label}
              </text>
              {draggingDesk.deskRef.assigneeName && (
                <text
                  x={DESK_SIZE / 2}
                  y={DESK_SIZE / 2 + 8}
                  textAnchor="middle"
                  className="pointer-events-none select-none"
                  style={{ fontSize: 6, fill: 'rgba(255,255,255,0.8)' }}
                >
                  {draggingDesk.deskRef.assigneeName.split(' ').map((n: string) => n[0]).join('')}
                </text>
              )}
              {/* "No drop" indicator when outside all rooms */}
              {!dragTargetRoomId && (
                <text
                  x={DESK_SIZE / 2}
                  y={DESK_SIZE + 14}
                  textAnchor="middle"
                  className="pointer-events-none select-none"
                  style={{ fontSize: 9, fontWeight: 600, fill: '#ef4444' }}
                >
                  ✕
                </text>
              )}
            </g>
          )}

          {/* Drawing preview */}
          {drawingRect && (
            <g>
              <rect
                x={drawingRect.x}
                y={drawingRect.y}
                width={drawingRect.width}
                height={drawingRect.height}
                fill="rgba(74,124,89,0.12)"
                stroke="#4a7c59"
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
                style={{ fontSize: 11, fontWeight: 600, fill: '#4a7c59' }}
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
