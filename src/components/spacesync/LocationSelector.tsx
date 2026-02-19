import React, { useState, useMemo, useEffect } from 'react';
import { MapPin, Plus, Pencil, Trash2, Building, ChevronRight, Layers } from 'lucide-react';
import type { OfficeLocation } from '@/types/spacesync';

interface LocationSelectorProps {
  locations: OfficeLocation[];
  selectedLocationId?: string;
  onSelectLocation: (id: string) => void;
  onCreateLocation: (name: string, address?: string, buildingName?: string, floorNumber?: number) => void;
  onUpdateLocation: (id: string, updates: { name?: string; address?: string; buildingName?: string; floorNumber?: number }) => void;
  onDeleteLocation: (id: string) => void;
}

interface SedeGroup {
  key: string; // address or buildingName
  label: string;
  address: string;
  buildingName: string;
  floors: OfficeLocation[];
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  locations,
  selectedLocationId,
  onSelectLocation,
  onCreateLocation,
  onUpdateLocation,
  onDeleteLocation,
}) => {
  const [showCreateSede, setShowCreateSede] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', address: '', buildingName: '' });
  const [expandedSedi, setExpandedSedi] = useState<Set<string>>(new Set());

  // Group locations by address (sede)
  const sedi = useMemo<SedeGroup[]>(() => {
    const grouped = new Map<string, OfficeLocation[]>();
    for (const loc of locations) {
      const key = loc.address || loc.buildingName || loc.name;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(loc);
    }
    return Array.from(grouped.entries()).map(([key, floors]) => {
      floors.sort((a, b) => (a.floorNumber ?? 0) - (b.floorNumber ?? 0));
      const first = floors[0];
      return {
        key,
        label: first.buildingName || first.name.split(' - ')[0] || key,
        address: first.address || '',
        buildingName: first.buildingName || '',
        floors,
      };
    });
  }, [locations]);

  // Auto-expand sede containing selected location
  useEffect(() => {
    if (!selectedLocationId) return;
    for (const sede of sedi) {
      if (sede.floors.some(f => f.id === selectedLocationId)) {
        setExpandedSedi(prev => {
          const next = new Set(prev);
          next.add(sede.key);
          return next;
        });
      }
    }
  }, [selectedLocationId, sedi]);

  const toggleSede = (key: string) => {
    setExpandedSedi(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleCreateSede = () => {
    if (!formData.name.trim()) return;
    // Create sede with first floor (Piano Terra = 0)
    onCreateLocation(
      `${formData.name} - Piano Terra`,
      formData.address || formData.name,
      formData.name,
      0
    );
    setFormData({ name: '', address: '', buildingName: '' });
    setShowCreateSede(false);
  };

  const handleAddFloor = (sede: SedeGroup) => {
    const maxFloor = Math.max(...sede.floors.map(f => f.floorNumber ?? 0), -1);
    const newFloor = maxFloor + 1;
    const floorLabel = newFloor === 0 ? 'Piano Terra' : `Piano ${newFloor}`;
    onCreateLocation(
      `${sede.label} - ${floorLabel}`,
      sede.address,
      sede.buildingName || sede.label,
      newFloor
    );
  };

  const startEdit = (loc: OfficeLocation) => {
    setEditingId(loc.id);
    setFormData({
      name: loc.name,
      address: loc.address || '',
      buildingName: loc.buildingName || '',
    });
  };

  const handleUpdate = (id: string) => {
    onUpdateLocation(id, {
      name: formData.name || undefined,
      address: formData.address || undefined,
      buildingName: formData.buildingName || undefined,
    });
    setEditingId(null);
    setFormData({ name: '', address: '', buildingName: '' });
  };

  const getFloorLabel = (loc: OfficeLocation) => {
    if (loc.floorNumber === undefined || loc.floorNumber === null) return loc.name;
    if (loc.floorNumber === 0) return 'Piano Terra';
    return `Piano ${loc.floorNumber}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          <Building size={14} />
          Sedi e Piani
        </h3>
        <button
          onClick={() => setShowCreateSede(!showCreateSede)}
          className="text-xs font-medium text-jnana-sage hover:text-jnana-sageDark flex items-center gap-1 transition-colors"
        >
          <Plus size={14} />
          Nuova Sede
        </button>
      </div>

      {/* Create new sede form */}
      {showCreateSede && (
        <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 space-y-2">
          <input
            className="w-full px-3 py-1.5 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            placeholder="Nome sede (es. HQ, Filiale Milano)"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({ ...p, name: e.target.value }))}
          />
          <input
            className="w-full px-3 py-1.5 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            placeholder="Indirizzo"
            value={formData.address}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({ ...p, address: e.target.value }))}
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreateSede(false)} className="text-xs px-3 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              Annulla
            </button>
            <button onClick={handleCreateSede} className="text-xs px-3 py-1 rounded-md bg-jnana-sage text-white hover:bg-jnana-sageDark transition-colors">
              Crea Sede
            </button>
          </div>
        </div>
      )}

      {/* Sede hierarchy */}
      {sedi.map(sede => {
        const isExpanded = expandedSedi.has(sede.key);
        const hasSelected = sede.floors.some(f => f.id === selectedLocationId);

        return (
          <div key={sede.key} className="space-y-0.5">
            {/* Sede header */}
            <button
              onClick={() => toggleSede(sede.key)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                hasSelected ? 'bg-jnana-sage/5' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <ChevronRight size={14} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              <Building size={14} className={hasSelected ? 'text-jnana-sage' : 'text-gray-400'} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 dark:text-gray-100 truncate">{sede.label}</div>
                {sede.address && (
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{sede.address}</div>
                )}
              </div>
              <span className="text-[10px] text-gray-400 font-medium">{sede.floors.length} {sede.floors.length === 1 ? 'piano' : 'piani'}</span>
            </button>

            {/* Floors */}
            {isExpanded && (
              <div className="ml-4 border-l-2 border-gray-200 dark:border-gray-700 pl-2 space-y-0.5">
                {sede.floors.map(loc => (
                  <div key={loc.id}>
                    {editingId === loc.id ? (
                      <div className="p-2 rounded-lg border border-jnana-sage/30 bg-gray-50 dark:bg-gray-800 space-y-2">
                        <input
                          className="w-full px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                          value={formData.name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({ ...p, name: e.target.value }))}
                        />
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setEditingId(null)} className="text-xs px-2 py-1 text-gray-500 dark:text-gray-400">Annulla</button>
                          <button onClick={() => handleUpdate(loc.id)} className="text-xs px-2 py-1 bg-jnana-sage text-white rounded">Salva</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => onSelectLocation(loc.id)}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left text-sm transition-colors group ${
                          selectedLocationId === loc.id
                            ? 'bg-jnana-sage/10 text-jnana-sage border border-jnana-sage/20'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                        }`}
                      >
                        <Layers size={12} className={selectedLocationId === loc.id ? 'text-jnana-sage' : 'text-gray-400'} />
                        <span className="flex-1 truncate font-medium">{getFloorLabel(loc)}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); startEdit(loc); }}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                          >
                            <Pencil size={10} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteLocation(loc.id); }}
                            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </button>
                    )}
                  </div>
                ))}
                {/* Add floor button */}
                <button
                  onClick={() => handleAddFloor(sede)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-jnana-sage hover:bg-jnana-sage/5 transition-colors"
                >
                  <Plus size={12} />
                  <span>Aggiungi Piano</span>
                </button>
              </div>
            )}
          </div>
        );
      })}

      {locations.length === 0 && !showCreateSede && (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
          <MapPin size={24} className="mx-auto mb-2 opacity-40" />
          <p>Nessuna sede configurata.</p>
          <p className="text-xs mt-1">Aggiungi la prima sede per iniziare.</p>
        </div>
      )}
    </div>
  );
};
