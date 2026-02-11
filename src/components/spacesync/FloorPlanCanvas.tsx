import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MousePointer, Square, Monitor, Trash2, ZoomIn, ZoomOut, Thermometer } from 'lucide-react';
import { getProximityColor } from '@/utils/proximityEngine';
import type { OfficeRoom, OfficeDesk, CanvasMode, RoomType } from '@/types/spacesync';

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

export const FloorPlanCanvas: React.FC<FloorPlanCanvasProps> = ({
  rooms,
  desks,
  canvasWidth,
  canvasHeight,
  onCreateRoom,
  onUpdateRoom,
  onDeleteRoom,
  onCreateDesk,
  onUpdateDesk,
  onDeleteDesk,
  onSelectDesk,
  selectedRoomId,
  selectedDeskId,
  onSelectRoom,
  heatmapMode,
  onToggleHeatmap,
  heatmapOverlay,
  deskScores,
}) => {
  const [mode, setMode] = useState<CanvasMode>('select');
  const [zoom, setZoom] = useState(1);
  const [drawing, setDrawing] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const [draggingDesk, setDraggingDesk] = useState<{ deskId: string; offsetX: number; offsetY: number } | null>(null);
  const [deskCounter, setDeskCounter] = useState(1);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (desks.length > 0) {
      const maxNum = desks.reduce((max, d) => {
        const match = d.label.match(/D(\d+)/);
        return match ? Math.max(max, parseInt(match[1])) : max;
      }, 0);
      setDeskCounter(maxNum + 1);
    }
  }, [desks]);

  const getSVGPoint = useCallback((e: React.MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    };
  }, [zoom]);

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
        onCreateDesk(targetRoom.id, { label, x: pt.x - targetRoom.x - DESK_SIZE / 2, y: pt.y - targetRoom.y - DESK_SIZE / 2 });
        setDeskCounter(prev => prev + 1);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (drawing) {
      const pt = getSVGPoint(e);
      setDrawing(prev => prev ? { ...prev, currentX: pt.x, currentY: pt.y } : null);
    }
    if (draggingDesk) {
      const pt = getSVGPoint(e);
      const desk = desks.find(d => d.id === draggingDesk.deskId);
      if (!desk) return;
      const room = rooms.find(r => r.id === desk.roomId);
      if (!room) return;
      const newX = Math.max(0, Math.min(room.width - DESK_SIZE, pt.x - room.x - draggingDesk.offsetX));
      const newY = Math.max(0, Math.min(room.height - DESK_SIZE, pt.y - room.y - draggingDesk.offsetY));
      onUpdateDesk(desk.id, { x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    if (drawing) {
      const x = Math.min(drawing.startX, drawing.currentX);
      const y = Math.min(drawing.startY, drawing.currentY);
      const w = Math.abs(drawing.currentX - drawing.startX);
      const h = Math.abs(drawing.currentY - drawing.startY);
      if (w > 40 && h > 30) {
        onCreateRoom({ name: 'Nuova Stanza', x, y, width: w, height: h, roomType: 'office' });
      }
      setDrawing(null);
      setMode('select');
    }
    if (draggingDesk) {
      setDraggingDesk(null);
    }
  };

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

  return (
    <div className="flex flex-col gap-2">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-1.5 bg-muted/50 rounded-lg border border-border">
        <ToolButton active={mode === 'select'} onClick={() => setMode('select')} icon={<MousePointer size={16} />} label="Seleziona" />
        <ToolButton active={mode === 'draw-room'} onClick={() => setMode('draw-room')} icon={<Square size={16} />} label="Disegna Stanza" />
        <ToolButton active={mode === 'place-desk'} onClick={() => setMode('place-desk')} icon={<Monitor size={16} />} label="Posiziona Scrivania" />
        <div className="w-px h-6 bg-border mx-1" />
        <ToolButton onClick={() => setZoom(z => Math.min(2, z + 0.1))} icon={<ZoomIn size={16} />} label="Zoom +" />
        <ToolButton onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} icon={<ZoomOut size={16} />} label="Zoom -" />
        <span className="text-xs text-muted-foreground ml-1">{Math.round(zoom * 100)}%</span>

        {onToggleHeatmap && (
          <>
            <div className="w-px h-6 bg-border mx-1" />
            <ToolButton
              active={heatmapMode}
              onClick={onToggleHeatmap}
              icon={<Thermometer size={16} />}
              label="Heatmap"
            />
          </>
        )}

        {selectedRoomId && (
          <>
            <div className="w-px h-6 bg-border mx-1" />
            <button
              onClick={() => { onDeleteRoom(selectedRoomId); onSelectRoom(undefined); }}
              className="flex items-center gap-1 px-2 py-1 text-xs text-destructive hover:bg-destructive/10 rounded transition-colors"
            >
              <Trash2 size={14} />
              Elimina Stanza
            </button>
          </>
        )}
      </div>

      {/* Canvas */}
      <div className="overflow-auto rounded-lg border border-border bg-background" style={{ maxHeight: '60vh' }}>
        <svg
          ref={svgRef}
          width={canvasWidth * zoom}
          height={canvasHeight * zoom}
          viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
          className={`${mode === 'draw-room' ? 'cursor-crosshair' : mode === 'place-desk' ? 'cursor-cell' : 'cursor-default'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Grid */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="0.3" />
            </pattern>
          </defs>
          <rect width={canvasWidth} height={canvasHeight} fill="url(#grid)" />

          {/* Heatmap overlay */}
          {heatmapMode && heatmapOverlay}

          {/* Rooms */}
          {rooms.map(room => (
            <g key={room.id}>
              <rect
                x={room.x}
                y={room.y}
                width={room.width}
                height={room.height}
                fill={ROOM_COLORS[room.roomType] || room.color}
                stroke={selectedRoomId === room.id ? 'hsl(var(--primary))' : '#94a3b8'}
                strokeWidth={selectedRoomId === room.id ? 2.5 : 1}
                rx={4}
                className="transition-all cursor-pointer"
                onClick={(e) => { e.stopPropagation(); if (mode === 'select') onSelectRoom(room.id); }}
                opacity={0.7}
              />
              <text
                x={room.x + 8}
                y={room.y + 18}
                className="pointer-events-none select-none"
                style={{ fontSize: 11, fontWeight: 600, fill: '#475569' }}
              >
                {room.name}
              </text>
              <text
                x={room.x + 8}
                y={room.y + 30}
                className="pointer-events-none select-none"
                style={{ fontSize: 9, fill: '#94a3b8' }}
              >
                {ROOM_TYPE_LABELS[room.roomType]}
              </text>

              {/* Desks in this room */}
              {desks.filter(d => d.roomId === room.id).map(desk => (
                <g
                  key={desk.id}
                  transform={`translate(${room.x + desk.x}, ${room.y + desk.y})`}
                  onMouseDown={(e) => handleDeskMouseDown(e, desk)}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <rect
                    width={DESK_SIZE}
                    height={DESK_SIZE}
                    rx={4}
                    fill={heatmapMode && desk.companyMemberId && deskScores?.has(desk.id)
                      ? getProximityColor(deskScores.get(desk.id)!.avgScore)
                      : desk.companyMemberId ? '#3b82f6' : '#94a3b8'
                    }
                    opacity={selectedDeskId === desk.id ? 1 : 0.8}
                    stroke={selectedDeskId === desk.id ? 'hsl(var(--primary))' : 'transparent'}
                    strokeWidth={selectedDeskId === desk.id ? 2 : 0}
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
              ))}
            </g>
          ))}

          {/* Drawing preview */}
          {drawingRect && (
            <rect
              x={drawingRect.x}
              y={drawingRect.y}
              width={drawingRect.width}
              height={drawingRect.height}
              fill="hsl(var(--primary) / 0.15)"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              strokeDasharray="6 3"
              rx={4}
            />
          )}
        </svg>
      </div>
    </div>
  );
};

const ToolButton: React.FC<{ active?: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    title={label}
    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
      active
        ? 'bg-primary text-primary-foreground shadow-sm'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);
