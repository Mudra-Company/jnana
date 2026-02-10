import React, { useState, useMemo } from 'react';
import { X, Search, User as UserIcon, Trash2 } from 'lucide-react';
import type { OfficeDesk } from '@/types/spacesync';
import type { User } from '../../../types';

interface DeskAssignmentModalProps {
  desk: OfficeDesk;
  companyUsers: User[];
  assignedMemberIds: string[];
  onAssign: (deskId: string, memberId: string | null, roleId?: string | null) => void;
  onDelete: (deskId: string) => void;
  onClose: () => void;
  onUpdateLabel: (deskId: string, label: string) => void;
}

export const DeskAssignmentModal: React.FC<DeskAssignmentModalProps> = ({
  desk,
  companyUsers,
  assignedMemberIds,
  onAssign,
  onDelete,
  onClose,
  onUpdateLabel,
}) => {
  const [search, setSearch] = useState('');
  const [label, setLabel] = useState(desk.label);

  const availableUsers = useMemo(() => {
    return companyUsers.filter(u => {
      if (u.memberId && assignedMemberIds.includes(u.memberId) && u.memberId !== desk.companyMemberId) return false;
      const q = search.toLowerCase();
      if (q && !(`${u.firstName} ${u.lastName} ${u.jobTitle || ''}`).toLowerCase().includes(q)) return false;
      return true;
    });
  }, [companyUsers, search, assignedMemberIds, desk.companyMemberId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-background rounded-xl shadow-2xl border border-border w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Assegna Scrivania</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Etichetta</label>
            <div className="flex gap-2 mt-1">
              <input
                className="flex-1 px-3 py-1.5 text-sm rounded-md border border-border bg-background"
                value={label}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabel(e.target.value)}
                onBlur={() => { if (label !== desk.label) onUpdateLabel(desk.id, label); }}
              />
            </div>
          </div>

          {desk.assigneeName && (
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <UserIcon size={14} className="text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium">{desk.assigneeName}</div>
                  {desk.assigneeJobTitle && <div className="text-[10px] text-muted-foreground">{desk.assigneeJobTitle}</div>}
                </div>
              </div>
              <button
                onClick={() => onAssign(desk.id, null)}
                className="text-xs text-destructive hover:bg-destructive/10 px-2 py-1 rounded transition-colors"
              >
                Rimuovi
              </button>
            </div>
          )}

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-border bg-background"
              placeholder="Cerca persona..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            />
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1">
            {availableUsers.map(u => (
              <button
                key={u.memberId || u.id}
                onClick={() => onAssign(desk.id, u.memberId || null)}
                className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-left text-sm transition-colors ${
                  desk.companyMemberId === u.memberId ? 'bg-primary/10' : 'hover:bg-muted'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <UserIcon size={12} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{u.firstName} {u.lastName}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{u.jobTitle || 'Nessun ruolo'}</div>
                </div>
              </button>
            ))}
            {availableUsers.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-4">Nessun utente disponibile</p>
            )}
          </div>
        </div>

        <div className="flex justify-between p-4 border-t border-border">
          <button
            onClick={() => onDelete(desk.id)}
            className="flex items-center gap-1 text-xs text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-md transition-colors"
          >
            <Trash2 size={14} />
            Elimina Scrivania
          </button>
          <button
            onClick={onClose}
            className="text-xs px-4 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
