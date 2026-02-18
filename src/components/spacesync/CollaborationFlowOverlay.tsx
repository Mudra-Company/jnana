import React, { useMemo, useState } from 'react';
import type { OfficeDesk, OfficeRoom } from '@/types/spacesync';
import type { ProximityUserData } from '@/utils/proximityEngine';

interface CollaborationFlowOverlayProps {
  desks: OfficeDesk[];
  rooms: OfficeRoom[];
  userDataMap: Map<string, ProximityUserData>;
}

interface FlowConnection {
  key: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  fromName: string;
  toName: string;
  pctAB: number;
  pctBA: number;
  affinityAB: number;
  affinityBA: number;
  bidirectional: boolean;
}

const DESK_SIZE = 32;
const ADJACENCY_THRESHOLD = 200;

function getAffinityColor(affinity: number): string {
  if (affinity >= 4) return '#22c55e';
  if (affinity >= 3) return '#64748b';
  return '#d97706';
}

function getStrokeWidth(pct: number): number {
  if (pct >= 30) return 3;
  if (pct >= 15) return 2;
  return 1.2;
}

export const CollaborationFlowOverlay: React.FC<CollaborationFlowOverlayProps> = ({ desks, rooms, userDataMap }) => {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const roomMap = useMemo(() => new Map(rooms.map(r => [r.id, r])), [rooms]);

  // Build memberId -> absolute position map
  const memberDeskMap = useMemo(() => {
    const map = new Map<string, { desk: OfficeDesk; absX: number; absY: number; userData: ProximityUserData }>();
    for (const desk of desks) {
      if (!desk.companyMemberId) continue;
      const room = roomMap.get(desk.roomId);
      if (!room) continue;
      const userData = userDataMap.get(desk.companyMemberId);
      if (!userData) continue;
      map.set(desk.companyMemberId, {
        desk,
        absX: room.x + desk.x + DESK_SIZE / 2,
        absY: room.y + desk.y + DESK_SIZE / 2,
        userData,
      });
    }
    return map;
  }, [desks, rooms, roomMap, userDataMap]);

  // Build connections
  const connections = useMemo(() => {
    const connMap = new Map<string, FlowConnection>();

    for (const [memberId, entry] of memberDeskMap) {
      const profile = entry.userData.collaborationProfile;
      if (!profile?.links) continue;

      for (const link of profile.links) {
        if (link.targetType === 'member') {
          const target = memberDeskMap.get(link.targetId);
          if (!target || link.targetId === memberId) continue;
          const key = [memberId, link.targetId].sort().join('::');
          const existing = connMap.get(key);
          if (existing) {
            // Add reverse direction
            if (existing.fromName === entry.userData.firstName + ' ' + entry.userData.lastName) {
              existing.pctAB = Math.max(existing.pctAB, link.collaborationPercentage);
              existing.affinityAB = Math.max(existing.affinityAB, link.personalAffinity);
            } else {
              existing.pctBA = Math.max(existing.pctBA, link.collaborationPercentage);
              existing.affinityBA = Math.max(existing.affinityBA, link.personalAffinity);
            }
            existing.bidirectional = true;
          } else {
            connMap.set(key, {
              key,
              fromX: entry.absX, fromY: entry.absY,
              toX: target.absX, toY: target.absY,
              fromName: `${entry.userData.firstName} ${entry.userData.lastName}`,
              toName: `${target.userData.firstName} ${target.userData.lastName}`,
              pctAB: link.collaborationPercentage,
              pctBA: 0,
              affinityAB: link.personalAffinity,
              affinityBA: 0,
              bidirectional: false,
            });
          }
        }
        if (link.targetType === 'team' && link.memberBreakdown) {
          for (const mb of link.memberBreakdown) {
            const target = memberDeskMap.get(mb.memberId);
            if (!target || mb.memberId === memberId) continue;
            const effectivePct = Math.round((link.collaborationPercentage * mb.percentage) / 100);
            if (effectivePct < 3) continue;
            const affinity = mb.affinity ?? link.personalAffinity;
            const key = [memberId, mb.memberId].sort().join('::');
            const existing = connMap.get(key);
            if (existing) {
              if (existing.fromName === `${entry.userData.firstName} ${entry.userData.lastName}`) {
                existing.pctAB = Math.max(existing.pctAB, effectivePct);
                existing.affinityAB = Math.max(existing.affinityAB, affinity);
              } else {
                existing.pctBA = Math.max(existing.pctBA, effectivePct);
                existing.affinityBA = Math.max(existing.affinityBA, affinity);
              }
              existing.bidirectional = true;
            } else {
              connMap.set(key, {
                key,
                fromX: entry.absX, fromY: entry.absY,
                toX: target.absX, toY: target.absY,
                fromName: `${entry.userData.firstName} ${entry.userData.lastName}`,
                toName: `${target.userData.firstName} ${target.userData.lastName}`,
                pctAB: effectivePct, pctBA: 0,
                affinityAB: affinity, affinityBA: 0,
                bidirectional: false,
              });
            }
          }
        }
      }
    }
    return Array.from(connMap.values());
  }, [memberDeskMap]);

  if (connections.length === 0) return null;

  return (
    <g className="collaboration-flow-overlay">
      <defs>
        <marker id="flow-arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#22c55e" />
        </marker>
        <marker id="flow-arrow-gray" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
        </marker>
        <marker id="flow-arrow-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#d97706" />
        </marker>
      </defs>

      {connections.map(conn => {
        const maxPct = Math.max(conn.pctAB, conn.pctBA);
        const maxAffinity = Math.max(conn.affinityAB, conn.affinityBA);
        const color = getAffinityColor(maxAffinity);
        const sw = getStrokeWidth(maxPct);
        const isHovered = hoveredKey === conn.key;
        const midX = (conn.fromX + conn.toX) / 2;
        const midY = (conn.fromY + conn.toY) / 2;
        const markerId = maxAffinity >= 4 ? 'flow-arrow-green' : maxAffinity >= 3 ? 'flow-arrow-gray' : 'flow-arrow-amber';

        // Offset line slightly to not overlap desks
        const dx = conn.toX - conn.fromX;
        const dy = conn.toY - conn.fromY;
        const dist = Math.hypot(dx, dy);
        const offsetPx = 18;
        const ux = dist > 0 ? dx / dist : 0;
        const uy = dist > 0 ? dy / dist : 0;

        return (
          <g key={conn.key}>
            {/* Hit area */}
            <line
              x1={conn.fromX + ux * offsetPx} y1={conn.fromY + uy * offsetPx}
              x2={conn.toX - ux * offsetPx} y2={conn.toY - uy * offsetPx}
              stroke="transparent" strokeWidth={12}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredKey(conn.key)}
              onMouseLeave={() => setHoveredKey(null)}
            />
            {/* Visible line */}
            <line
              x1={conn.fromX + ux * offsetPx} y1={conn.fromY + uy * offsetPx}
              x2={conn.toX - ux * offsetPx} y2={conn.toY - uy * offsetPx}
              stroke={color}
              strokeWidth={isHovered ? sw + 1.5 : sw}
              strokeOpacity={isHovered ? 1 : 0.7}
              markerEnd={conn.bidirectional ? undefined : `url(#${markerId})`}
              className="pointer-events-none transition-all"
            />
            {/* Label */}
            <text
              x={midX} y={midY - 6}
              textAnchor="middle"
              className="pointer-events-none select-none"
              style={{ fontSize: 9, fontWeight: 700, fill: color }}
            >
              {conn.bidirectional ? `${conn.pctAB}%↔${conn.pctBA}%` : `${maxPct}%`}
            </text>

            {/* Hover tooltip */}
            {isHovered && (
              <g>
                <rect
                  x={midX - 100} y={midY + 8}
                  width={200} height={conn.bidirectional ? 52 : 40}
                  rx={6} fill="white" stroke="#e2e8f0" strokeWidth={1}
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                />
                <text x={midX} y={midY + 24} textAnchor="middle" style={{ fontSize: 10, fontWeight: 700, fill: '#334155' }}>
                  {conn.fromName} → {conn.toName}
                </text>
                <text x={midX} y={midY + 38} textAnchor="middle" style={{ fontSize: 9, fill: '#64748b' }}>
                  Collab: {maxPct}% · Affinità: {'★'.repeat(maxAffinity)}{'☆'.repeat(5 - maxAffinity)}
                  {conn.bidirectional ? ' · Bidirezionale' : ''}
                </text>
                {conn.bidirectional && (
                  <text x={midX} y={midY + 52} textAnchor="middle" style={{ fontSize: 8, fill: '#94a3b8' }}>
                    {conn.fromName.split(' ')[0]}: {conn.pctAB}% · {conn.toName.split(' ')[0]}: {conn.pctBA}%
                  </text>
                )}
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};

// Export helper for the report
export function buildFlowConnections(
  desks: OfficeDesk[],
  rooms: OfficeRoom[],
  userDataMap: Map<string, ProximityUserData>,
): FlowConnection[] {
  const roomMap = new Map(rooms.map(r => [r.id, r]));
  const memberDeskMap = new Map<string, { absX: number; absY: number; userData: ProximityUserData }>();

  for (const desk of desks) {
    if (!desk.companyMemberId) continue;
    const room = roomMap.get(desk.roomId);
    if (!room) continue;
    const userData = userDataMap.get(desk.companyMemberId);
    if (!userData) continue;
    memberDeskMap.set(desk.companyMemberId, {
      absX: room.x + desk.x + DESK_SIZE / 2,
      absY: room.y + desk.y + DESK_SIZE / 2,
      userData,
    });
  }

  const connMap = new Map<string, FlowConnection>();

  for (const [memberId, entry] of memberDeskMap) {
    const profile = entry.userData.collaborationProfile;
    if (!profile?.links) continue;

    for (const link of profile.links) {
      const targets: Array<{ targetMemberId: string; pct: number; affinity: number }> = [];

      if (link.targetType === 'member') {
        targets.push({ targetMemberId: link.targetId, pct: link.collaborationPercentage, affinity: link.personalAffinity });
      }
      if (link.targetType === 'team' && link.memberBreakdown) {
        for (const mb of link.memberBreakdown) {
          const effectivePct = Math.round((link.collaborationPercentage * mb.percentage) / 100);
          if (effectivePct >= 3) {
            targets.push({ targetMemberId: mb.memberId, pct: effectivePct, affinity: mb.affinity ?? link.personalAffinity });
          }
        }
      }

      for (const t of targets) {
        const target = memberDeskMap.get(t.targetMemberId);
        if (!target || t.targetMemberId === memberId) continue;
        const key = [memberId, t.targetMemberId].sort().join('::');
        const existing = connMap.get(key);
        const myName = `${entry.userData.firstName} ${entry.userData.lastName}`;
        if (existing) {
          if (existing.fromName === myName) {
            existing.pctAB = Math.max(existing.pctAB, t.pct);
            existing.affinityAB = Math.max(existing.affinityAB, t.affinity);
          } else {
            existing.pctBA = Math.max(existing.pctBA, t.pct);
            existing.affinityBA = Math.max(existing.affinityBA, t.affinity);
          }
          existing.bidirectional = true;
        } else {
          connMap.set(key, {
            key,
            fromX: entry.absX, fromY: entry.absY,
            toX: target.absX, toY: target.absY,
            fromName: myName,
            toName: `${target.userData.firstName} ${target.userData.lastName}`,
            pctAB: t.pct, pctBA: 0,
            affinityAB: t.affinity, affinityBA: 0,
            bidirectional: false,
          });
        }
      }
    }
  }

  return Array.from(connMap.values());
}

export { ADJACENCY_THRESHOLD };
export type { FlowConnection };
