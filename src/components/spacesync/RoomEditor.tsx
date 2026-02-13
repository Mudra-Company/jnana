import React, { useState, useEffect } from 'react';
import { Pencil, Maximize2 } from 'lucide-react';
import type { OfficeRoom, RoomType } from '@/types/spacesync';

const ROOM_TYPES: { value: RoomType; label: string }[] = [
  { value: 'office', label: 'Ufficio' },
  { value: 'meeting', label: 'Sala Riunioni' },
  { value: 'common', label: 'Zona Comune' },
  { value: 'other', label: 'Altro' },
];

const ROOM_COLORS_OPTIONS = [
  '#dbeafe', '#fef3c7', '#d1fae5', '#f3e8ff', '#fee2e2', '#e0e7ff', '#fce7f3', '#ccfbf1',
];

interface RoomEditorProps {
  room: OfficeRoom;
  deskCount?: number;
  onUpdate: (id: string, updates: Partial<OfficeRoom>) => void;
  onClose: () => void;
  onPreview?: (updates: Partial<OfficeRoom>) => void;
}

export const RoomEditor: React.FC<RoomEditorProps> = ({ room, deskCount = 0, onUpdate, onClose, onPreview }) => {
  const [name, setName] = useState(room.name);
  const [roomType, setRoomType] = useState<RoomType>(room.roomType);
  const [width, setWidth] = useState(Math.round(room.width));
  const [height, setHeight] = useState(Math.round(room.height));
  const [color, setColor] = useState(room.color);

  // Sync local state when room prop changes (e.g. from canvas resize/drag)
  useEffect(() => {
    setName(room.name);
    setRoomType(room.roomType);
    setWidth(Math.round(room.width));
    setHeight(Math.round(room.height));
    setColor(room.color);
  }, [room.id, room.width, room.height, room.x, room.y, room.name, room.roomType, room.color]);

  const emitPreview = (overrides: Partial<{ name: string; roomType: RoomType; width: number; height: number; color: string }>) => {
    onPreview?.({ name, roomType, width, height, color, ...overrides });
  };

  const handleSave = () => {
    onUpdate(room.id, { name, roomType, width, height, color });
    onClose();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-bold text-foreground">
        <Pencil size={14} className="text-primary" />
        Modifica Stanza
      </div>

      {/* Name */}
      <div>
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Nome</label>
        <input
          className="w-full px-3 py-1.5 mt-0.5 text-sm rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setName(e.target.value); emitPreview({ name: e.target.value }); }}
        />
      </div>

      {/* Type */}
      <div>
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tipo</label>
        <select
          className="w-full px-3 py-1.5 mt-0.5 text-sm rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
          value={roomType}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { const v = e.target.value as RoomType; setRoomType(v); emitPreview({ roomType: v }); }}
        >
          {ROOM_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Dimensions */}
      <div>
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <Maximize2 size={10} />
          Dimensioni (px)
        </label>
        <div className="flex gap-2 mt-0.5">
          <div className="flex-1">
            <input
              type="number"
              min={60}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
              value={width}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => { const v = parseInt(e.target.value) || 60; setWidth(v); emitPreview({ width: v }); }}
            />
            <span className="text-[9px] text-muted-foreground">Larghezza</span>
          </div>
          <span className="text-muted-foreground self-start mt-2">×</span>
          <div className="flex-1">
            <input
              type="number"
              min={60}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
              value={height}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => { const v = parseInt(e.target.value) || 60; setHeight(v); emitPreview({ height: v }); }}
            />
            <span className="text-[9px] text-muted-foreground">Altezza</span>
          </div>
        </div>
      </div>

      {/* Color */}
      <div>
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Colore</label>
        <div className="flex gap-1.5 mt-1">
          {ROOM_COLORS_OPTIONS.map(c => (
            <button
              key={c}
              onClick={() => { setColor(c); emitPreview({ color: c }); }}
              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                color === c ? 'border-primary scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Desk count */}
      <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
        <span>Scrivanie nella stanza</span>
        <span className="font-bold text-foreground">{deskCount}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-1">
        <button onClick={onClose} className="text-xs px-3 py-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
          Annulla
        </button>
        <button onClick={handleSave} className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
          Salva
        </button>
      </div>
    </div>
  );
};
