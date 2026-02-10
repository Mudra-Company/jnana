import React, { useState } from 'react';
import { MapPin, Plus, Pencil, Trash2, Building } from 'lucide-react';
import type { OfficeLocation } from '@/types/spacesync';

interface LocationSelectorProps {
  locations: OfficeLocation[];
  selectedLocationId?: string;
  onSelectLocation: (id: string) => void;
  onCreateLocation: (name: string, address?: string, buildingName?: string, floorNumber?: number) => void;
  onUpdateLocation: (id: string, updates: { name?: string; address?: string; buildingName?: string; floorNumber?: number }) => void;
  onDeleteLocation: (id: string) => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  locations,
  selectedLocationId,
  onSelectLocation,
  onCreateLocation,
  onUpdateLocation,
  onDeleteLocation,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', address: '', buildingName: '', floorNumber: '' });

  const handleCreate = () => {
    if (!formData.name.trim()) return;
    onCreateLocation(
      formData.name,
      formData.address || undefined,
      formData.buildingName || undefined,
      formData.floorNumber ? parseInt(formData.floorNumber) : undefined
    );
    setFormData({ name: '', address: '', buildingName: '', floorNumber: '' });
    setShowCreateForm(false);
  };

  const handleUpdate = (id: string) => {
    onUpdateLocation(id, {
      name: formData.name || undefined,
      address: formData.address || undefined,
      buildingName: formData.buildingName || undefined,
      floorNumber: formData.floorNumber ? parseInt(formData.floorNumber) : undefined,
    });
    setEditingId(null);
    setFormData({ name: '', address: '', buildingName: '', floorNumber: '' });
  };

  const startEdit = (loc: OfficeLocation) => {
    setEditingId(loc.id);
    setFormData({
      name: loc.name,
      address: loc.address || '',
      buildingName: loc.buildingName || '',
      floorNumber: loc.floorNumber?.toString() || '',
    });
  };

  const grouped = locations.reduce<Record<string, OfficeLocation[]>>((acc, loc) => {
    const key = loc.buildingName || loc.address || 'Sede principale';
    if (!acc[key]) acc[key] = [];
    acc[key].push(loc);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Building size={14} />
          Sedi e Piani
        </h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
        >
          <Plus size={14} />
          Nuova Sede
        </button>
      </div>

      {showCreateForm && (
        <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
          <input
            className="w-full px-3 py-1.5 text-sm rounded-md border border-border bg-background"
            placeholder="Nome (es. Piano 2)"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({ ...p, name: e.target.value }))}
          />
          <input
            className="w-full px-3 py-1.5 text-sm rounded-md border border-border bg-background"
            placeholder="Indirizzo (opzionale)"
            value={formData.address}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({ ...p, address: e.target.value }))}
          />
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-1.5 text-sm rounded-md border border-border bg-background"
              placeholder="Edificio (opzionale)"
              value={formData.buildingName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({ ...p, buildingName: e.target.value }))}
            />
            <input
              className="w-20 px-3 py-1.5 text-sm rounded-md border border-border bg-background"
              placeholder="Piano"
              type="number"
              value={formData.floorNumber}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({ ...p, floorNumber: e.target.value }))}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreateForm(false)} className="text-xs px-3 py-1 rounded-md text-muted-foreground hover:bg-muted transition-colors">
              Annulla
            </button>
            <button onClick={handleCreate} className="text-xs px-3 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              Crea
            </button>
          </div>
        </div>
      )}

      {Object.entries(grouped).map(([group, locs]) => (
        <div key={group} className="space-y-1">
          {Object.keys(grouped).length > 1 && (
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-1 pt-1">
              {group}
            </div>
          )}
          {locs.map(loc => (
            <div key={loc.id}>
              {editingId === loc.id ? (
                <div className="p-2 rounded-lg border border-primary/30 bg-muted/30 space-y-2">
                  <input
                    className="w-full px-2 py-1 text-sm rounded border border-border bg-background"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({ ...p, name: e.target.value }))}
                  />
                  <input
                    className="w-full px-2 py-1 text-sm rounded border border-border bg-background"
                    placeholder="Indirizzo"
                    value={formData.address}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({ ...p, address: e.target.value }))}
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingId(null)} className="text-xs px-2 py-1 text-muted-foreground">Annulla</button>
                    <button onClick={() => handleUpdate(loc.id)} className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded">Salva</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => onSelectLocation(loc.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors group ${
                    selectedLocationId === loc.id 
                      ? 'bg-primary/10 text-primary border border-primary/20' 
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  <MapPin size={14} className={selectedLocationId === loc.id ? 'text-primary' : 'text-muted-foreground'} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{loc.name}</div>
                    {loc.address && <div className="text-[10px] text-muted-foreground truncate">{loc.address}</div>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); startEdit(loc); }}
                      className="p-1 rounded hover:bg-muted-foreground/10"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteLocation(loc.id); }}
                      className="p-1 rounded hover:bg-destructive/10 text-destructive"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </button>
              )}
            </div>
          ))}
        </div>
      ))}

      {locations.length === 0 && !showCreateForm && (
        <div className="text-center py-6 text-muted-foreground text-sm">
          <MapPin size={24} className="mx-auto mb-2 opacity-40" />
          <p>Nessuna sede configurata.</p>
          <p className="text-xs mt-1">Aggiungi la prima sede per iniziare.</p>
        </div>
      )}
    </div>
  );
};
