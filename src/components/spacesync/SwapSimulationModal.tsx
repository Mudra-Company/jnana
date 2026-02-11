import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeftRight, TrendingUp, TrendingDown, Minus, Users } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { calculateProximityScore, calculateDeskDistance, areDesksAdjacent, getProximityColor } from '@/utils/proximityEngine';
import type { ProximityUserData, DeskProximityPair } from '@/utils/proximityEngine';
import type { OfficeDesk, OfficeRoom } from '@/types/spacesync';

interface SwapSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  desks: OfficeDesk[];
  rooms: OfficeRoom[];
  userDataMap: Map<string, ProximityUserData>;
  currentPairs: DeskProximityPair[];
  currentGlobalAvg: number;
  onApplySwap: (deskIdA: string, deskIdB: string) => void;
}

export const SwapSimulationModal: React.FC<SwapSimulationModalProps> = ({
  isOpen,
  onClose,
  desks,
  rooms,
  userDataMap,
  currentPairs,
  currentGlobalAvg,
  onApplySwap,
}) => {
  const [selectedA, setSelectedA] = useState<string | null>(null);
  const [selectedB, setSelectedB] = useState<string | null>(null);

  const assignedDesks = useMemo(() =>
    desks.filter(d => d.companyMemberId && userDataMap.has(d.companyMemberId)),
    [desks, userDataMap]
  );

  // Simulate swap and recalculate scores
  const simulation = useMemo(() => {
    if (!selectedA || !selectedB) return null;

    const deskA = desks.find(d => d.id === selectedA);
    const deskB = desks.find(d => d.id === selectedB);
    if (!deskA?.companyMemberId || !deskB?.companyMemberId) return null;

    // Create swapped desk list
    const swappedDesks = desks.map(d => {
      if (d.id === selectedA) return { ...d, companyMemberId: deskB!.companyMemberId };
      if (d.id === selectedB) return { ...d, companyMemberId: deskA!.companyMemberId };
      return d;
    });

    const roomMap = new Map(rooms.map(r => [r.id, r]));
    const swappedAssigned = swappedDesks.filter(d => d.companyMemberId && userDataMap.has(d.companyMemberId));

    // Recalculate all pairs after swap
    const newPairs: DeskProximityPair[] = [];
    for (let i = 0; i < swappedAssigned.length; i++) {
      for (let j = i + 1; j < swappedAssigned.length; j++) {
        const dA = swappedAssigned[i];
        const dB = swappedAssigned[j];
        const roomA = roomMap.get(dA.roomId);
        const roomB = roomMap.get(dB.roomId);
        const distance = calculateDeskDistance(
          { x: dA.x, y: dA.y, roomId: dA.roomId },
          { x: dB.x, y: dB.y, roomId: dB.roomId },
          roomA ? { x: roomA.x, y: roomA.y } : undefined,
          roomB ? { x: roomB.x, y: roomB.y } : undefined,
        );
        if (!areDesksAdjacent(distance)) continue;
        const userA = userDataMap.get(dA.companyMemberId!);
        const userB = userDataMap.get(dB.companyMemberId!);
        if (!userA || !userB) continue;
        newPairs.push({
          deskA: { id: dA.id, label: dA.label, x: dA.x, y: dA.y, roomId: dA.roomId },
          deskB: { id: dB.id, label: dB.label, x: dB.x, y: dB.y, roomId: dB.roomId },
          userA, userB, distance,
          proximityResult: calculateProximityScore(userA, userB),
        });
      }
    }

    const newAvg = newPairs.length > 0
      ? Math.round(newPairs.reduce((s, p) => s + p.proximityResult.score, 0) / newPairs.length)
      : 0;

    return {
      newPairs,
      newAvg,
      delta: newAvg - currentGlobalAvg,
      userA: userDataMap.get(deskA.companyMemberId),
      userB: userDataMap.get(deskB.companyMemberId),
      deskA,
      deskB,
    };
  }, [selectedA, selectedB, desks, rooms, userDataMap, currentGlobalAvg]);

  if (!isOpen) return null;

  const DeltaIcon = simulation
    ? simulation.delta > 0 ? TrendingUp : simulation.delta < 0 ? TrendingDown : Minus
    : Minus;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-card rounded-xl shadow-2xl border border-border w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <ArrowLeftRight size={20} className="text-amber-500" />
              Simulazione Scambio
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-muted rounded-md"><X size={18} /></button>
          </div>

          <div className="p-4 space-y-4">
            {/* Person selector A */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Persona A</label>
              <select
                value={selectedA || ''}
                onChange={e => setSelectedA(e.target.value || null)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
              >
                <option value="">Seleziona scrivania...</option>
                {assignedDesks.filter(d => d.id !== selectedB).map(d => {
                  const user = userDataMap.get(d.companyMemberId!);
                  return (
                    <option key={d.id} value={d.id}>
                      {d.label} — {user ? `${user.firstName} ${user.lastName}` : d.assigneeName || 'N/A'}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Swap icon */}
            <div className="flex justify-center">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                <ArrowLeftRight size={20} className="text-amber-600" />
              </div>
            </div>

            {/* Person selector B */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Persona B</label>
              <select
                value={selectedB || ''}
                onChange={e => setSelectedB(e.target.value || null)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
              >
                <option value="">Seleziona scrivania...</option>
                {assignedDesks.filter(d => d.id !== selectedA).map(d => {
                  const user = userDataMap.get(d.companyMemberId!);
                  return (
                    <option key={d.id} value={d.id}>
                      {d.label} — {user ? `${user.firstName} ${user.lastName}` : d.assigneeName || 'N/A'}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Simulation Results */}
            {simulation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <Card padding="sm" className="bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Score Attuale</span>
                    <span className="text-lg font-bold" style={{ color: getProximityColor(currentGlobalAvg) }}>
                      {currentGlobalAvg}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-muted-foreground">Score Dopo Scambio</span>
                    <span className="text-lg font-bold" style={{ color: getProximityColor(simulation.newAvg) }}>
                      {simulation.newAvg}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                    <span className="text-sm font-medium text-foreground">Variazione</span>
                    <span className={`text-lg font-bold flex items-center gap-1 ${
                      simulation.delta > 0 ? 'text-green-500' : simulation.delta < 0 ? 'text-red-500' : 'text-muted-foreground'
                    }`}>
                      <DeltaIcon size={16} />
                      {simulation.delta > 0 ? '+' : ''}{simulation.delta}%
                    </span>
                  </div>
                </Card>

                {/* Swap details */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="flex items-center gap-1">
                    <Users size={12} />
                    <strong>{simulation.userA?.firstName} {simulation.userA?.lastName}</strong> → scrivania {simulation.deskB.label}
                  </p>
                  <p className="flex items-center gap-1">
                    <Users size={12} />
                    <strong>{simulation.userB?.firstName} {simulation.userB?.lastName}</strong> → scrivania {simulation.deskA.label}
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t border-border">
            <Button variant="outline" onClick={onClose}>Annulla</Button>
            <Button
              onClick={() => {
                if (selectedA && selectedB) {
                  onApplySwap(selectedA, selectedB);
                  onClose();
                }
              }}
              disabled={!simulation || simulation.delta < 0}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              Applica Scambio
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
