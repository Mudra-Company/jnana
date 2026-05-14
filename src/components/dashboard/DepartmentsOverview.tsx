import React, { useMemo } from 'react';
import { Folder, Users, Briefcase } from 'lucide-react';
import type { CompanyRole, RoleAssignment } from '../../types/roles';
import type { User } from '../../../types';

interface OrgNodeInfo { id: string; name: string; type: string }

interface LegacyHiringPosition {
  id: string;
  jobTitle?: string;
  departmentId?: string;
}

interface DepartmentsOverviewProps {
  roles: CompanyRole[];
  assignments: RoleAssignment[];
  orgNodes: OrgNodeInfo[];
  users: User[];
  legacyHiringPositions?: LegacyHiringPosition[];
  onDepartmentClick?: (orgNodeId: string) => void;
}

interface Row {
  id: string;
  name: string;
  type: string;
  headcount: number;
  totalRoles: number;
  vacant: number;
  hiring: number;
  coverage: number; // %
}

export const DepartmentsOverview: React.FC<DepartmentsOverviewProps> = ({
  roles, assignments, orgNodes, users, legacyHiringPositions = [], onDepartmentClick,
}) => {
  const rows = useMemo<Row[]>(() => {
    const byNode = new Map<string, Row>();
    orgNodes.forEach(n => {
      byNode.set(n.id, { id: n.id, name: n.name, type: n.type, headcount: 0, totalRoles: 0, vacant: 0, hiring: 0, coverage: 0 });
    });

    // headcount from users.departmentId (excludes hiring placeholders)
    users.forEach(u => {
      if (!u.departmentId || u.isHiring) return;
      const row = byNode.get(u.departmentId);
      if (row) row.headcount++;
    });

    // Build map of role -> assignment (primary)
    const assignByRole = new Map<string, RoleAssignment>();
    assignments.forEach(a => {
      if (a.assignmentType === 'primary' || !assignByRole.has(a.roleId)) {
        assignByRole.set(a.roleId, a);
      }
    });

    roles.forEach(role => {
      const nodeId = role.orgNodeId;
      if (!nodeId) return;
      const row = byNode.get(nodeId);
      if (!row) return;
      row.totalRoles++;
      const a = assignByRole.get(role.id);
      const isVacant = role.status === 'vacant' || !a;
      if (isVacant) row.vacant++;
      if (role.isHiring) row.hiring++;
    });

    legacyHiringPositions.forEach(pos => {
      if (!pos.departmentId) return;
      const row = byNode.get(pos.departmentId);
      if (!row) return;
      row.totalRoles++;
      row.vacant++;
      row.hiring++;
    });

    byNode.forEach(row => {
      row.coverage = row.totalRoles === 0 ? 100 : Math.round(((row.totalRoles - row.vacant) / row.totalRoles) * 100);
    });

    return Array.from(byNode.values())
      .filter(r => r.headcount > 0 || r.totalRoles > 0)
      .sort((a, b) => b.headcount - a.headcount);
  }, [roles, assignments, orgNodes, users, legacyHiringPositions]);

  if (rows.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm">
        <Folder size={28} className="mx-auto mb-2 opacity-50" />
        Nessun dipartimento configurato.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
      {rows.map(r => {
        const coverageColor =
          r.coverage >= 90 ? 'bg-emerald-500'
          : r.coverage >= 70 ? 'bg-amber-500'
          : 'bg-red-500';
        return (
          <button
            key={r.id}
            onClick={() => onDepartmentClick?.(r.id)}
            disabled={!onDepartmentClick}
            className="text-left bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 disabled:cursor-default disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            <div className="flex items-start gap-2 mb-3">
              <Folder size={16} className="text-amber-500 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{r.name}</div>
                <div className="text-[10px] uppercase tracking-wider text-gray-400">{r.type}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div>
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-gray-500"><Users size={10} />Persone</div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{r.headcount}</div>
              </div>
              <div>
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-gray-500"><Briefcase size={10} />Ruoli</div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{r.totalRoles}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500">Aperti</div>
                <div className={`text-lg font-bold ${r.vacant > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>{r.vacant}</div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-[10px] font-semibold text-gray-500 mb-1">
                <span>Copertura ruoli</span>
                <span className="text-gray-700 dark:text-gray-300">{r.coverage}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full ${coverageColor}`} style={{ width: `${r.coverage}%` }} />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
