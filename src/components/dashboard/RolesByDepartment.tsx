import React, { useMemo, useState } from 'react';
import { ChevronRight, Briefcase, Folder, Search } from 'lucide-react';
import { Card } from '../../../components/Card';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../ui/collapsible';
import { RoleStatusBadge } from '../roles/RoleStatusBadge';
import type { CompanyRole, RoleAssignment } from '../../types/roles';

interface OrgNodeInfo {
  id: string;
  name: string;
  type: string;
}

interface DepartmentSection {
  nodeId: string;
  nodeName: string;
  totalRoles: number;
  assignedCount: number;
  vacantCount: number;
  hiringCount: number;
  roles: {
    role: CompanyRole;
    assigneeName: string | null;
    isVacant: boolean;
  }[];
}

interface RolesByDepartmentProps {
  roles: CompanyRole[];
  assignments: RoleAssignment[];
  orgNodes: OrgNodeInfo[];
  onRoleClick?: (roleId: string) => void;
}

export const RolesByDepartment: React.FC<RolesByDepartmentProps> = ({
  roles,
  assignments,
  orgNodes,
  onRoleClick,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Build a map of role -> primary assignment
  const assignmentMap = useMemo(() => {
    const map = new Map<string, RoleAssignment>();
    assignments.forEach(a => {
      // Keep primary assignments, or first one if no primary
      if (a.assignmentType === 'primary' || !map.has(a.roleId)) {
        map.set(a.roleId, a);
      }
    });
    return map;
  }, [assignments]);

  // Build org node map
  const orgNodeMap = useMemo(() => {
    const map = new Map<string, OrgNodeInfo>();
    orgNodes.forEach(n => map.set(n.id, n));
    return map;
  }, [orgNodes]);

  // Group roles by department
  const sections = useMemo(() => {
    const grouped = new Map<string, DepartmentSection>();

    const filteredRoles = searchTerm
      ? roles.filter(r =>
          r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (r.code && r.code.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      : roles;

    filteredRoles.forEach(role => {
      const nodeId = role.orgNodeId || 'unassigned';
      const node = role.orgNodeId ? orgNodeMap.get(role.orgNodeId) : null;
      const nodeName = node?.name || 'Non assegnato a dipartimento';

      if (!grouped.has(nodeId)) {
        grouped.set(nodeId, {
          nodeId,
          nodeName,
          totalRoles: 0,
          assignedCount: 0,
          vacantCount: 0,
          hiringCount: 0,
          roles: [],
        });
      }

      const section = grouped.get(nodeId)!;
      section.totalRoles++;

      const assignment = assignmentMap.get(role.id);
      const isVacant = role.status === 'vacant' || !assignment;
      const assigneeName = assignment?.user
        ? `${assignment.user.firstName} ${assignment.user.lastName}`
        : null;

      if (isVacant) section.vacantCount++;
      else section.assignedCount++;
      if (role.isHiring) section.hiringCount++;

      section.roles.push({ role, assigneeName, isVacant });
    });

    // Sort: departments with issues first, then alphabetically
    return Array.from(grouped.values()).sort((a, b) => {
      if (a.vacantCount !== b.vacantCount) return b.vacantCount - a.vacantCount;
      return a.nodeName.localeCompare(b.nodeName);
    });
  }, [roles, assignmentMap, orgNodeMap, searchTerm]);

  if (roles.length === 0) {
    return (
      <Card padding="sm">
        <div className="text-center py-8 text-gray-400">
          <Briefcase size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nessun ruolo creato. Inizia dall'organigramma.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="none">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Folder size={16} className="text-amber-500" />
          Ruoli per Dipartimento
          <span className="text-xs font-normal text-gray-400">({roles.length} totali)</span>
        </h3>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Cerca ruolo..."
            className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-transparent outline-none w-40"
          />
        </div>
      </div>

      {/* Accordion sections */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {sections.map(section => (
          <Collapsible key={section.nodeId} defaultOpen={section.vacantCount > 0 || section.hiringCount > 0}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <div className="flex items-center gap-2">
                  <ChevronRight size={14} className="text-gray-400 transition-transform [[data-state=open]>&]:rotate-90" />
                  <Folder size={14} className="text-amber-500" />
                  <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                    {section.nodeName}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-gray-400">{section.totalRoles} ruoli</span>
                  <span className="text-green-600 dark:text-green-400">{section.assignedCount} assegnati</span>
                  {section.vacantCount > 0 && (
                    <span className="text-red-600 dark:text-red-400">{section.vacantCount} vacanti</span>
                  )}
                  {section.hiringCount > 0 && (
                    <span className="text-blue-600 dark:text-blue-400">{section.hiringCount} hiring</span>
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="bg-gray-50/50 dark:bg-gray-800/30">
                {section.roles.map(({ role, assigneeName, isVacant }) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between px-6 py-2.5 border-t border-gray-100 dark:border-gray-700/50 cursor-pointer hover:bg-white dark:hover:bg-gray-700/40 transition-colors group"
                    onClick={() => onRoleClick?.(role.id)}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Briefcase size={14} className="text-gray-400 shrink-0 group-hover:text-amber-500 transition-colors" />
                      <span className="font-medium text-sm text-gray-700 dark:text-gray-300 truncate">
                        {role.title}
                      </span>
                      {role.code && (
                        <span className="text-[10px] text-gray-400 font-mono shrink-0">{role.code}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {assigneeName ? (
                        <span className="text-xs text-gray-600 dark:text-gray-400">{assigneeName}</span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">—</span>
                      )}
                      <RoleStatusBadge status={role.status} isHiring={role.isHiring} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </Card>
  );
};
