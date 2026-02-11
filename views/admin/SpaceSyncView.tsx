import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { MapPin } from 'lucide-react';
import { Card } from '../../components/Card';
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

  const selectedLocation = useMemo(() => locations.find(l => l.id === selectedLocationId), [locations, selectedLocationId]);
  const selectedRoom = useMemo(() => rooms.find(r => r.id === selectedRoomId), [rooms, selectedRoomId]);

  // Fetch locations on mount
  useEffect(() => { fetchLocations(company.id); }, [company.id, fetchLocations]);

  // Auto-select first location
  useEffect(() => {
    if (locations.length > 0 && !selectedLocationId) setSelectedLocationId(locations[0].id);
  }, [locations, selectedLocationId]);

  // Fetch rooms & desks when location changes
  useEffect(() => {
    if (selectedLocationId) { fetchRooms(selectedLocationId); fetchDesks(selectedLocationId); }
  }, [selectedLocationId, fetchRooms, fetchDesks]);

  // Load proximity data when desks change
  useEffect(() => { loadUserData(desks); }, [desks, loadUserData]);

  // Calculate proximity pairs
  const proximityPairs = useMemo(() => calculateAllPairs(desks, rooms), [desks, rooms, calculateAllPairs]);
  const deskScores = useMemo(() => getDeskScores(proximityPairs), [proximityPairs, getDeskScores]);
  const globalAverage = useMemo(() => {
    if (proximityPairs.length === 0) return 0;
    return Math.round(proximityPairs.reduce((sum, p) => sum + p.proximityResult.score, 0) / proximityPairs.length);
  }, [proximityPairs]);

  const assignedMemberIds = useMemo(() => desks.filter(d => d.companyMemberId).map(d => d.companyMemberId!), [desks]);

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

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MapPin className="text-amber-500" size={24} />
            SpaceSync
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ottimizza la disposizione spaziale del tuo team
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
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

          {selectedRoom && (
            <Card padding="sm">
              <RoomEditor
                room={selectedRoom}
                onUpdate={handleUpdateRoom}
                onClose={() => setSelectedRoomId(undefined)}
              />
            </Card>
          )}

          {/* Stats */}
          {selectedLocation && (
            <Card padding="sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                📊 Riepilogo
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stanze</span>
                  <span className="font-medium">{rooms.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Scrivanie</span>
                  <span className="font-medium">{desks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assegnate</span>
                  <span className="font-medium text-primary">{desks.filter(d => d.companyMemberId).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Libere</span>
                  <span className="font-medium text-amber-500">{desks.filter(d => !d.companyMemberId).length}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Proximity Report */}
          {heatmapMode && (
            <ProximityReport pairs={proximityPairs} globalAverage={globalAverage} />
          )}
        </div>

        {/* Main: Floor Plan Canvas */}
        <div className="col-span-12 lg:col-span-9">
          {selectedLocation ? (
            <Card padding="sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">{selectedLocation.name}</h3>
                {selectedLocation.address && (
                  <span className="text-xs text-muted-foreground">{selectedLocation.address}</span>
                )}
              </div>
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
              <div className="text-center py-16 text-muted-foreground">
                <MapPin size={48} className="mx-auto mb-4 opacity-30" />
                <h3 className="font-semibold text-lg mb-2">Inizia con SpaceSync</h3>
                <p className="text-sm max-w-md mx-auto">
                  Crea la prima sede per disegnare la planimetria del tuo ufficio
                  e posizionare le scrivanie del team.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Desk Assignment Modal */}
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
    </div>
  );
};
