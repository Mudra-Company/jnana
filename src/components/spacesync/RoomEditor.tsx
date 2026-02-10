import React, { useState } from 'react';
import { Pencil } from 'lucide-react';
import type { OfficeRoom, RoomType } from '@/types/spacesync';

const ROOM_TYPES: { value: RoomType; label: string }[] = [
  { value: 'office', label: 'Ufficio' },
  { value: 'meeting', label: 'Sala Riunioni' },
  { value: 'common', label: 'Zona Comune' },
  { value: 'other', label: 'Altro' },
];

interface RoomEditorProps {
  room: OfficeRoom;
  onUpdate: (id: string, updates: Partial<OfficeRoom>) => void;
  onClose: () => void;
}

export const RoomEditor: React.FC<RoomEditorProps> = ({ room, onUpdate, onClose }) => {
  const [name, setName] = useState(room.name);
  const [roomType, setRoomType] = useState<RoomType>(room.roomType);

  const handleSave = () => {
    onUpdate(room.id, { name, roomType });
    onClose();
  };

  return (
    <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Pencil size={14} />
        Modifica Stanza
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Nome</label>
        <input
          className="w-full px-3 py-1.5 mt-1 text-sm rounded-md border border-border bg-background"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Tipo</label>
        <select
          className="w-full px-3 py-1.5 mt-1 text-sm rounded-md border border-border bg-background"
          value={roomType}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRoomType(e.target.value as RoomType)}
        >
          {ROOM_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="text-xs px-3 py-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors">
          Annulla
        </button>
        <button onClick={handleSave} className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          Salva
        </button>
      </div>
    </div>
  );
};
