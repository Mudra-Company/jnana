import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { MapPin, ChevronDown, BarChart3, Sparkles, LayoutGrid } from 'lucide-react';
import { Card } from '../../components/Card';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../../src/components/ui/collapsible';
import { useOfficeLocations } from '../../src/hooks/useOfficeLocations';
import { useOfficeRooms } from '../../src/hooks/useOfficeRooms';
import { useOfficeDesks } from '../../src/hooks/useOfficeDesks';
import { useProximityScoring } from '../../src/hooks/useProximityScoring';
import { LocationSelector } from '../../src/components/spacesync/LocationSelector';
import { FloorPlanCanvas } from '../../src/components/spacesync/FloorPlanCanvas';
import { DeskAssignmentModal } from '../../src/components/spacesync/DeskAssignmentModal';
import { RoomEditor } from '../../src/components/spacesync/RoomEditor';
import { ProximityHeatmap } from '../../src/components/spacesync/ProximityHeatmap';
import { ProximityReport } from '../../src/components/spacesync/ProximityReport';
import { SwapSimulationModal } from '../../src/components/spacesync/SwapSimulationModal';
import { OptimizationSuggestions } from '../../src/components/spacesync/OptimizationSuggestions';
import type { CompanyProfile, User } from '../../types';
import type { OfficeDesk, OfficeRoom } from '../../src/types/spacesync';

interface SpaceSyncViewProps {
  company: CompanyProfile;
  companyUsers: User[];
}

export const SpaceSyncView: React.FC<SpaceSyncViewProps> = ({ company, companyUsers }) => {
  const { locations, isLoading: locLoading, fetchLocations, createLocation, updateLocation, deleteLocation } = useOfficeLocations();
  const { rooms, fetchRooms, createRoom, updateRoom, deleteRoom } = useOfficeRooms();
  const { desks, fetchDesks, createDesk, updateDesk, deleteDesk } = useOfficeDesks();
  const { userDataMap, isLoading: proximityLoading, loadUserData, calculateAllPairs, getDeskScores } = useProximityScoring();

  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>();
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>();
  const [selectedDesk, setSelectedDesk] = useState<OfficeDesk | null>(null);
  const [heatmapMode, setHeatmapMode] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);

  const selectedLocation = useMemo(() => locations.find(l => l.id === selectedLocationId), [locations, selectedLocationId]);
  const selectedRoom = useMemo(() => rooms.find(r => r.id === selectedRoomId), [rooms, selectedRoomId]);

  useEffect(() => { fetchLocations(company.id); }, [company.id, fetchLocations]);
  useEffect(() => {
    if (locations.length > 0 && !selectedLocationId) setSelectedLocationId(locations[0].id);
  }, [locations, selectedLocationId]);
  useEffect(() => {
    if (selectedLocationId) { fetchRooms(selectedLocationId); fetchDesks(selectedLocationId); }
  }, [selectedLocationId, fetchRooms, fetchDesks]);
  useEffect(() => { loadUserData(desks); }, [desks, loadUserData]);

  const proximityPairs = useMemo(() => calculateAllPairs(desks, rooms), [desks, rooms, calculateAllPairs]);
  const deskScores = useMemo(() => getDeskScores(proximityPairs), [proximityPairs, getDeskScores]);
  const globalAverage = useMemo(() => {
    if (proximityPairs.length === 0) return 0;
    return Math.round(proximityPairs.reduce((sum, p) => sum + p.proximityResult.score, 0) / proximityPairs.length);
  }, [proximityPairs]);

  const assignedMemberIds = useMemo(() => desks.filter(d => d.companyMemberId).map(d => d.companyMemberId!), [desks]);
  const assignedCount = useMemo(() => desks.filter(d => d.companyMemberId).length, [desks]);
  const occupancyPct = desks.length > 0 ? Math.round((assignedCount / desks.length) * 100) : 0;
  const selectedRoomDeskCount = useMemo(() =>
    selectedRoom ? desks.filter(d => d.roomId === selectedRoom.id).length : 0
  , [selectedRoom, desks]);

  // --- Handlers ---
  const handleCreateLocation = async (name: string, address?: string, buildingName?: string, floorNumber?: number) => {
    const result = await createLocation(company.id, name, address, buildingName, floorNumber);
    if (result) setSelectedLocationId(result.id);
  };

  const handleCreateRoom = async (room: { name: string; x: number; y: number; width: number; height: number; roomType: string }) => {
    if (!selectedLocationId) return;
    await createRoom(selectedLocationId, room as any);
  };

  const handleUpdateRoom = async (id: string, updates: Partial<OfficeRoom>) => {
    if (!selectedLocationId) return;
    await updateRoom(id, updates, selectedLocationId);
  };

  const handleDeleteRoom = async (id: string) => {
    if (!selectedLocationId) return;
    await deleteRoom(id, selectedLocationId);
    if (selectedRoomId === id) setSelectedRoomId(undefined);
  };

  const handleCreateDesk = async (roomId: string, desk: { label: string; x: number; y: number }) => {
    if (!selectedLocationId) return;
    await createDesk(roomId, desk, selectedLocationId);
  };

  const handleUpdateDesk = async (id: string, updates: Partial<OfficeDesk>) => {
    if (!selectedLocationId) return;
    await updateDesk(id, updates as any, selectedLocationId);
  };

  const handleDeleteDesk = async (id: string) => {
    if (!selectedLocationId) return;
    await deleteDesk(id, selectedLocationId);
    setSelectedDesk(null);
  };

  const handleAssignDesk = async (deskId: string, memberId: string | null) => {
    if (!selectedLocationId) return;
    await updateDesk(deskId, { companyMemberId: memberId || undefined } as any, selectedLocationId);
    setSelectedDesk(null);
  };

  const handleUpdateDeskLabel = async (deskId: string, label: string) => {
    if (!selectedLocationId) return;
    await updateDesk(deskId, { label } as any, selectedLocationId);
  };

  const handleApplySwap = async (deskIdA: string, deskIdB: string) => {
    if (!selectedLocationId) return;
    const deskA = desks.find(d => d.id === deskIdA);
    const deskB = desks.find(d => d.id === deskIdB);
    if (!deskA || !deskB) return;
    await updateDesk(deskIdA, { companyMemberId: deskB.companyMemberId || undefined } as any, selectedLocationId);
    await updateDesk(deskIdB, { companyMemberId: deskA.companyMemberId || undefined } as any, selectedLocationId);
  };

  const handleSimulateFromLabel = useCallback((labelA: string, labelB: string) => {
    setShowSimulation(true);
  }, []);

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 rounded-xl">
              <MapPin className="text-primary" size={22} />
            </div>
            SpaceSync
          </h1>
          <p className="text-sm text-muted-foreground mt-1 ml-12">
            Ottimizza la disposizione spaziale del tuo team
          </p>
        </div>
        {heatmapMode && (
          <button
            onClick={() => setShowSimulation(true)}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1.5"
          >
            🔄 Simula Scambio
          </button>
        )}
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* === SIDEBAR === */}
        <div className="col-span-12 lg:col-span-3 space-y-3">
          {/* Header with location info */}
          {selectedLocation && (
            <div className="px-1">
              <h2 className="text-sm font-bold text-foreground">{selectedLocation.name}</h2>
              {selectedLocation.address && (
                <p className="text-[11px] text-muted-foreground">{selectedLocation.address}</p>
              )}
            </div>
          )}

          {/* Locations */}
          <Card padding="sm">
            <LocationSelector
              locations={locations}
              selectedLocationId={selectedLocationId}
              onSelectLocation={setSelectedLocationId}
              onCreateLocation={handleCreateLocation}
              onUpdateLocation={(id, updates) => updateLocation(id, updates, company.id)}
              onDeleteLocation={(id) => deleteLocation(id, company.id)}
            />
          </Card>

          {/* Room Editor - Collapsible */}
          {selectedRoom && (
            <Card padding="sm">
              <RoomEditor
                room={selectedRoom}
                deskCount={selectedRoomDeskCount}
                onUpdate={handleUpdateRoom}
                onClose={() => setSelectedRoomId(undefined)}
              />
            </Card>
          )}

          {/* Stats with progress bar */}
          {selectedLocation && (
            <Card padding="sm">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <LayoutGrid size={12} />
                Riepilogo
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stanze</span>
                  <span className="font-semibold">{rooms.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Scrivanie</span>
                  <span className="font-semibold">{desks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assegnate</span>
                  <span className="font-semibold text-primary">{assignedCount}</span>
                </div>
              </div>
              {/* Occupancy bar */}
              {desks.length > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Tasso occupazione</span>
                    <span className="font-bold text-foreground">{occupancyPct}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${occupancyPct}%`,
                        background: occupancyPct > 80 ? 'hsl(var(--primary))' : occupancyPct > 50 ? '#f59e0b' : '#94a3b8',
                      }}
                    />
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Proximity Report - Collapsible */}
          {heatmapMode && proximityPairs.length > 0 && (
            <Collapsible defaultOpen>
              <Card padding="sm">
                <CollapsibleTrigger className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <BarChart3 size={12} />
                    Report Prossimità
                  </span>
                  <ChevronDown size={14} className="transition-transform data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <ProximityReport pairs={proximityPairs} globalAverage={globalAverage} />
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* AI Suggestions - Collapsible */}
          {heatmapMode && proximityPairs.length > 0 && (
            <Collapsible defaultOpen>
              <Card padding="sm">
                <CollapsibleTrigger className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={12} className="text-amber-500" />
                    Suggerimenti AI
                  </span>
                  <ChevronDown size={14} className="transition-transform data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <OptimizationSuggestions
                    pairs={proximityPairs}
                    desks={desks}
                    rooms={rooms.map(r => ({ id: r.id, name: r.name }))}
                    globalAverage={globalAverage}
                    userDataMap={userDataMap}
                    onSimulateSwap={handleSimulateFromLabel}
                  />
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}
        </div>

        {/* === MAIN CANVAS === */}
        <div className="col-span-12 lg:col-span-9">
          {selectedLocation ? (
            <Card padding="sm">
              <FloorPlanCanvas
                rooms={rooms}
                desks={desks}
                canvasWidth={selectedLocation.canvasWidth}
                canvasHeight={selectedLocation.canvasHeight}
                onCreateRoom={handleCreateRoom}
                onUpdateRoom={handleUpdateRoom}
                onDeleteRoom={handleDeleteRoom}
                onCreateDesk={handleCreateDesk}
                onUpdateDesk={handleUpdateDesk}
                onDeleteDesk={handleDeleteDesk}
                onSelectDesk={setSelectedDesk}
                selectedRoomId={selectedRoomId}
                selectedDeskId={selectedDesk?.id}
                onSelectRoom={setSelectedRoomId}
                heatmapMode={heatmapMode}
                onToggleHeatmap={() => setHeatmapMode(prev => !prev)}
                heatmapOverlay={
                  <ProximityHeatmap deskScores={deskScores} desks={desks} rooms={rooms} />
                }
                deskScores={deskScores}
              />
            </Card>
          ) : (
            <Card padding="lg">
              <div className="text-center py-20 text-muted-foreground">
                <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-primary/5 flex items-center justify-center">
                  <MapPin size={36} className="text-primary/30" />
                </div>
                <h3 className="font-bold text-xl mb-2 text-foreground">Inizia con SpaceSync</h3>
                <p className="text-sm max-w-md mx-auto leading-relaxed">
                  Crea la prima sede per disegnare la planimetria del tuo ufficio
                  e posizionare le scrivanie del team.
                </p>
                <p className="text-xs mt-4 text-muted-foreground/60">
                  Usa il pannello a sinistra per aggiungere una nuova sede →
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedDesk && (
        <DeskAssignmentModal
          desk={selectedDesk}
          companyUsers={companyUsers}
          assignedMemberIds={assignedMemberIds}
          onAssign={handleAssignDesk}
          onDelete={handleDeleteDesk}
          onClose={() => setSelectedDesk(null)}
          onUpdateLabel={handleUpdateDeskLabel}
        />
      )}

      {showSimulation && (
        <SwapSimulationModal
          isOpen={showSimulation}
          onClose={() => setShowSimulation(false)}
          desks={desks}
          rooms={rooms}
          userDataMap={userDataMap}
          currentPairs={proximityPairs}
          currentGlobalAvg={globalAverage}
          onApplySwap={handleApplySwap}
        />
      )}
    </div>
  );
};
