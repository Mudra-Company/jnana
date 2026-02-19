import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { MapPin, ChevronDown, BarChart3, Sparkles, LayoutGrid, DoorOpen, Monitor, Users, Star, ArrowLeftRight, GitBranch } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
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
import { CollaborationFlowOverlay, buildFlowConnections } from '../../src/components/spacesync/CollaborationFlowOverlay';
import { CollaborationFlowReport } from '../../src/components/spacesync/CollaborationFlowReport';
import type { CompanyProfile, User } from '../../types';
import type { OfficeDesk, OfficeRoom, ExternalFlowArrow, GlobalDeskEntry } from '../../src/types/spacesync';

interface SpaceSyncViewProps {
  company: CompanyProfile;
  companyUsers: User[];
}

/* ─── SVG Occupancy Gauge ─── */
const OccupancyGauge: React.FC<{ pct: number }> = ({ pct }) => {
  const r = 28;
  const stroke = 5;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = pct > 80 ? '#4a7c59' : pct > 50 ? '#d97706' : '#94a3b8';
  return (
    <svg width={72} height={72} viewBox="0 0 72 72">
      <circle cx={36} cy={36} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      <circle
        cx={36} cy={36} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 36 36)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x={36} y={33} textAnchor="middle" style={{ fontSize: 16, fontWeight: 800, fill: color }}>{pct}%</text>
      <text x={36} y={46} textAnchor="middle" style={{ fontSize: 8, fontWeight: 500, fill: '#94a3b8' }}>occupaz.</text>
    </svg>
  );
};

export const SpaceSyncView: React.FC<SpaceSyncViewProps> = ({ company, companyUsers }) => {
  const { locations, isLoading: locLoading, fetchLocations, createLocation, updateLocation, deleteLocation } = useOfficeLocations();
  const { rooms, fetchRooms, createRoom, updateRoom, deleteRoom } = useOfficeRooms();
  const { desks, fetchDesks, fetchAllDesks, createDesk, updateDesk, deleteDesk } = useOfficeDesks();
  const { userDataMap, isLoading: proximityLoading, loadUserData, calculateAllPairs, getDeskScores } = useProximityScoring();

  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>();
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>();
  const [selectedDesk, setSelectedDesk] = useState<OfficeDesk | null>(null);
  const [heatmapMode, setHeatmapMode] = useState(true);
  const [flowMode, setFlowMode] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  const [roomPreviewOverrides, setRoomPreviewOverrides] = useState<Partial<OfficeRoom> | null>(null);
  const [allDesksGlobal, setAllDesksGlobal] = useState<GlobalDeskEntry[]>([]);

  const selectedLocation = useMemo(() => locations.find(l => l.id === selectedLocationId), [locations, selectedLocationId]);
  const selectedRoom = useMemo(() => rooms.find(r => r.id === selectedRoomId), [rooms, selectedRoomId]);

  const displayRooms = useMemo(() => {
    if (!roomPreviewOverrides || !selectedRoomId) return rooms;
    return rooms.map(r => r.id === selectedRoomId ? { ...r, ...roomPreviewOverrides } : r);
  }, [rooms, roomPreviewOverrides, selectedRoomId]);

  useEffect(() => { fetchLocations(company.id); }, [company.id, fetchLocations]);
  useEffect(() => {
    if (locations.length > 0 && !selectedLocationId) setSelectedLocationId(locations[0].id);
  }, [locations, selectedLocationId]);
  useEffect(() => {
    if (selectedLocationId) { fetchRooms(selectedLocationId); fetchDesks(selectedLocationId); }
  }, [selectedLocationId, fetchRooms, fetchDesks]);
  useEffect(() => { loadUserData(desks); }, [desks, loadUserData]);

  // Load all desks globally for cross-location flows
  useEffect(() => {
    if (company.id && flowMode) {
      fetchAllDesks(company.id).then(setAllDesksGlobal);
    }
  }, [company.id, flowMode, fetchAllDesks]);

  const proximityPairs = useMemo(() => calculateAllPairs(desks, rooms), [desks, rooms, calculateAllPairs]);
  const deskScores = useMemo(() => getDeskScores(proximityPairs), [proximityPairs, getDeskScores]);
  const globalAverage = useMemo(() => {
    if (proximityPairs.length === 0) return 0;
    return Math.round(proximityPairs.reduce((sum, p) => sum + p.proximityResult.score, 0) / proximityPairs.length);
  }, [proximityPairs]);

  const assignedMemberIds = useMemo(() => desks.filter(d => d.companyMemberId).map(d => d.companyMemberId!), [desks]);
  const assignedCount = useMemo(() => desks.filter(d => d.companyMemberId).length, [desks]);
  const occupancyPct = desks.length > 0 ? Math.round((assignedCount / desks.length) * 100) : 0;

  // Flow connections (internal)
  const flowConnections = useMemo(() => buildFlowConnections(desks, rooms, userDataMap), [desks, rooms, userDataMap]);
  
  // External flow arrows (cross-location)
  const externalArrows = useMemo<ExternalFlowArrow[]>(() => {
    if (!flowMode || !selectedLocation || allDesksGlobal.length === 0) return [];
    
    const currentMemberIds = new Set(desks.filter(d => d.companyMemberId).map(d => d.companyMemberId!));
    const globalMemberMap = new Map(allDesksGlobal.map(d => [d.memberId, d]));
    const roomMap = new Map(rooms.map(r => [r.id, r]));
    const DESK_SIZE = 32;
    const arrows: ExternalFlowArrow[] = [];
    const seen = new Set<string>();

    for (const desk of desks) {
      if (!desk.companyMemberId) continue;
      const userData = userDataMap.get(desk.companyMemberId);
      if (!userData?.collaborationProfile?.links) continue;

      const room = roomMap.get(desk.roomId);
      if (!room) continue;
      const fromAbsX = room.x + desk.x + DESK_SIZE / 2;
      const fromAbsY = room.y + desk.y + DESK_SIZE / 2;
      const fromName = `${userData.firstName} ${userData.lastName}`;

      for (const link of userData.collaborationProfile.links) {
        const targets: Array<{ memberId: string; pct: number; affinity: number }> = [];

        if (link.targetType === 'member' && !currentMemberIds.has(link.targetId)) {
          targets.push({ memberId: link.targetId, pct: link.collaborationPercentage, affinity: link.personalAffinity });
        }
        if (link.targetType === 'team' && link.memberBreakdown) {
          for (const mb of link.memberBreakdown) {
            if (!currentMemberIds.has(mb.memberId)) {
              const effectivePct = Math.round((link.collaborationPercentage * mb.percentage) / 100);
              if (effectivePct >= 3) {
                targets.push({ memberId: mb.memberId, pct: effectivePct, affinity: mb.affinity ?? link.personalAffinity });
              }
            }
          }
        }

        for (const t of targets) {
          const targetGlobal = globalMemberMap.get(t.memberId);
          if (!targetGlobal) continue;
          
          const key = [desk.companyMemberId, t.memberId].sort().join('::ext');
          if (seen.has(key)) continue;
          seen.add(key);

          const sameBuilding = Boolean(
            selectedLocation.address &&
            targetGlobal.locationAddress &&
            selectedLocation.address === targetGlobal.locationAddress
          );

          arrows.push({
            key,
            fromDeskAbsX: fromAbsX,
            fromDeskAbsY: fromAbsY,
            fromMemberName: fromName,
            targetMemberName: targetGlobal.memberName,
            targetLocationName: targetGlobal.locationName,
            targetFloorNumber: targetGlobal.floorNumber,
            sameBuilding,
            percentage: t.pct,
            affinity: t.affinity,
          });
        }
      }
    }

    return arrows.sort((a, b) => b.percentage - a.percentage);
  }, [flowMode, selectedLocation, allDesksGlobal, desks, userDataMap, rooms]);

  const flowMissingCount = useMemo(() => {
    const deskMemberIds = new Set(desks.filter(d => d.companyMemberId).map(d => d.companyMemberId!));
    const globalMemberIds = new Set(allDesksGlobal.map(d => d.memberId));
    let missing = 0;
    for (const [, ud] of userDataMap) {
      if (!ud.collaborationProfile?.links) continue;
      for (const link of ud.collaborationProfile.links) {
        if (link.targetType === 'member' && !deskMemberIds.has(link.targetId) && !globalMemberIds.has(link.targetId)) missing++;
        if (link.targetType === 'team' && link.memberBreakdown) {
          for (const mb of link.memberBreakdown) {
            if (!deskMemberIds.has(mb.memberId) && !globalMemberIds.has(mb.memberId)) missing++;
          }
        }
      }
    }
    return missing;
  }, [desks, userDataMap, allDesksGlobal]);

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

  const scoreColor = globalAverage >= 70 ? '#16a34a' : globalAverage >= 40 ? '#d97706' : '#dc2626';

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* ═══ HERO HEADER ═══ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-jnana-sage to-jnana-sage/80 p-5 text-white shadow-lg">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
              <MapPin size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                SpaceSync
                {selectedLocation && (
                  <span className="text-sm font-medium opacity-80">— {selectedLocation.name}</span>
                )}
              </h1>
              <p className="text-xs text-white/70 mt-0.5">Ottimizza la disposizione spaziale del tuo team</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedLocation && (
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-[11px] font-semibold">
                  <DoorOpen size={12} /> {rooms.length} stanze
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-[11px] font-semibold">
                  <Monitor size={12} /> {assignedCount}/{desks.length}
                </span>
                {heatmapMode && proximityPairs.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-[11px] font-bold">
                    <Star size={12} /> {globalAverage}%
                  </span>
                )}
              </div>
            )}
            {heatmapMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSimulation(true)}
                className="!text-white !bg-white/15 hover:!bg-white/25 !border-0 !rounded-lg gap-1.5"
              >
                <ArrowLeftRight size={14} />
                Simula Scambio
              </Button>
            )}
          </div>
        </div>
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -right-5 -bottom-12 w-28 h-28 rounded-full bg-white/5" />
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* === SIDEBAR === */}
        <div className="col-span-12 lg:col-span-3 space-y-3">
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
                deskCount={selectedRoomDeskCount}
                onUpdate={(id, updates) => { handleUpdateRoom(id, updates); setRoomPreviewOverrides(null); }}
                onClose={() => { setSelectedRoomId(undefined); setRoomPreviewOverrides(null); }}
                onPreview={setRoomPreviewOverrides}
              />
            </Card>
          )}

          {/* ═══ MINI DASHBOARD ═══ */}
          {selectedLocation && (
            <Card padding="sm">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                <LayoutGrid size={12} className="text-jnana-sage" />
                Dashboard
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-3 text-center">
                  <DoorOpen size={18} className="mx-auto text-blue-500 mb-1" />
                  <div className="text-xl font-extrabold text-gray-800 dark:text-gray-100">{rooms.length}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide">Stanze</div>
                </div>
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-3 text-center">
                  <Monitor size={18} className="mx-auto text-emerald-500 mb-1" />
                  <div className="text-xl font-extrabold text-gray-800 dark:text-gray-100">{assignedCount}<span className="text-sm font-normal text-gray-400">/{desks.length}</span></div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide">Scrivanie</div>
                </div>
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-2 flex items-center justify-center">
                  {desks.length > 0 ? <OccupancyGauge pct={occupancyPct} /> : (
                    <div className="text-center py-2">
                      <div className="text-lg font-bold text-gray-300">—</div>
                      <div className="text-[10px] text-gray-400">Nessuna scrivania</div>
                    </div>
                  )}
                </div>
                <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-3 text-center">
                  <Star size={18} className="mx-auto text-amber-500 mb-1" />
                  {heatmapMode && proximityPairs.length > 0 ? (
                    <>
                      <div className="text-xl font-extrabold" style={{ color: scoreColor }}>{globalAverage}%</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wide">Score Medio</div>
                    </>
                  ) : (
                    <>
                      <div className="text-lg font-bold text-gray-300">—</div>
                      <div className="text-[10px] text-gray-400">Attiva heatmap</div>
                    </>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Proximity Report */}
          {heatmapMode && proximityPairs.length > 0 && (
            <Collapsible defaultOpen>
              <Card padding="sm">
                <CollapsibleTrigger className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <BarChart3 size={12} className="text-jnana-sage" />
                    Report Prossimità
                  </span>
                  <ChevronDown size={14} className="transition-transform data-[state=open]:rotate-180 text-gray-400" />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <ProximityReport pairs={proximityPairs} globalAverage={globalAverage} userDataMap={userDataMap} />
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Flow Report */}
          {flowMode && (flowConnections.length > 0 || externalArrows.length > 0) && (
            <Collapsible defaultOpen>
              <Card padding="sm">
                <CollapsibleTrigger className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <GitBranch size={12} className="text-jnana-sage" />
                    Report Flussi
                  </span>
                  <ChevronDown size={14} className="transition-transform data-[state=open]:rotate-180 text-gray-400" />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <CollaborationFlowReport connections={flowConnections} missingCount={flowMissingCount} externalArrows={externalArrows} />
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* AI Suggestions */}
          {heatmapMode && proximityPairs.length > 0 && (
            <Collapsible defaultOpen>
              <Card padding="sm">
                <CollapsibleTrigger className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={12} className="text-amber-500" />
                    Suggerimenti AI
                  </span>
                  <ChevronDown size={14} className="transition-transform data-[state=open]:rotate-180 text-gray-400" />
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
                rooms={displayRooms}
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
                onToggleHeatmap={() => { setHeatmapMode(prev => !prev); if (!heatmapMode) setFlowMode(false); }}
                heatmapOverlay={
                  <ProximityHeatmap deskScores={deskScores} desks={desks} rooms={rooms} />
                }
                flowMode={flowMode}
                onToggleFlow={() => { setFlowMode(prev => !prev); if (!flowMode) setHeatmapMode(false); }}
                flowOverlay={
                  <CollaborationFlowOverlay
                    desks={desks}
                    rooms={rooms}
                    userDataMap={userDataMap}
                    canvasWidth={selectedLocation.canvasWidth}
                    canvasHeight={selectedLocation.canvasHeight}
                    externalArrows={externalArrows}
                  />
                }
                deskScores={deskScores}
              />
            </Card>
          ) : (
            <Card padding="lg">
              <div className="text-center py-20 text-gray-400">
                <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-jnana-sage/5 flex items-center justify-center">
                  <MapPin size={36} className="text-jnana-sage/30" />
                </div>
                <h3 className="font-bold text-xl mb-2 text-gray-700 dark:text-gray-200">Inizia con SpaceSync</h3>
                <p className="text-sm max-w-md mx-auto leading-relaxed text-gray-500">
                  Crea la prima sede per disegnare la planimetria del tuo ufficio
                  e posizionare le scrivanie del team.
                </p>
                <p className="text-xs mt-4 text-gray-400">
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
