import React, { useState } from 'react';
import { Users as UsersIcon, Briefcase, Folder, Search } from 'lucide-react';
import { Card } from '../../../components/Card';
import { EnhancedEmployeeTable } from './EnhancedEmployeeTable';
import { RolesByDepartment } from './RolesByDepartment';
import { DepartmentsOverview } from './DepartmentsOverview';
import type { CompanyRole, RoleAssignment } from '../../types/roles';
import type { User, ViewState } from '../../../types';

interface OrgNodeInfo { id: string; name: string; type: string }

interface LegacyHiringPosition {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  departmentId?: string;
  isHiring?: boolean;
}

interface OrgExplorerPanelProps {
  // People tab
  users: User[];
  currentUserId?: string;
  setView: (view: ViewState) => void;
  onPromote: (user: User) => void;
  onDemote: (user: User) => void;
  onRemove: (user: User) => void;
  onEdit: (user: User) => void;
  onSendInvite: (user: User) => void;
  sendingInviteId: string | null;
  adminCount: number;
  // Shared
  roles: CompanyRole[];
  assignments: RoleAssignment[];
  orgNodes: OrgNodeInfo[];
  roleOrgNodeMap: Map<string, string | null>;
  legacyHiringPositions?: LegacyHiringPosition[];
  // Roles tab
  onRoleClick: (roleId: string) => void;
}

type TabKey = 'people' | 'roles' | 'departments';

export const OrgExplorerPanel: React.FC<OrgExplorerPanelProps> = (props) => {
  const [tab, setTab] = useState<TabKey>('people');
  const [search, setSearch] = useState('');

  const tabs: { key: TabKey; label: string; icon: typeof UsersIcon; count: number }[] = [
    { key: 'people',      label: 'Persone',      icon: UsersIcon, count: props.users.length },
    { key: 'roles',       label: 'Ruoli',        icon: Briefcase, count: props.roles.length + (props.legacyHiringPositions?.length || 0) },
    { key: 'departments', label: 'Dipartimenti', icon: Folder,    count: props.orgNodes.length },
  ];

  return (
    <Card padding="none" className="overflow-hidden">
      {/* Header with tabs + global search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Esplora l'organizzazione</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Persone, ruoli e dipartimenti in un unico posto.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cerca…"
              className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-transparent outline-none w-44"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-3 pt-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/30">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-colors -mb-px border-b-2 ${
                isActive
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-gray-800'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon size={14} />
              {t.label}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                isActive
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}>{t.count}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div>
        {tab === 'people' && (
          <EnhancedEmployeeTable
            users={props.users}
            currentUserId={props.currentUserId}
            roleAssignments={props.assignments}
            orgNodes={props.orgNodes}
            roleOrgNodeMap={props.roleOrgNodeMap}
            setView={props.setView}
            onPromote={props.onPromote}
            onDemote={props.onDemote}
            onRemove={props.onRemove}
            onEdit={props.onEdit}
            onSendInvite={props.onSendInvite}
            sendingInviteId={props.sendingInviteId}
            adminCount={props.adminCount}
            embedded
            externalSearchTerm={search}
          />
        )}
        {tab === 'roles' && (
          <RolesByDepartment
            roles={props.roles}
            assignments={props.assignments}
            orgNodes={props.orgNodes}
            legacyHiringPositions={props.legacyHiringPositions}
            onRoleClick={props.onRoleClick}
            embedded
            externalSearchTerm={search}
          />
        )}
        {tab === 'departments' && (
          <DepartmentsOverview
            roles={props.roles}
            assignments={props.assignments}
            orgNodes={props.orgNodes}
            users={props.users}
            legacyHiringPositions={props.legacyHiringPositions}
            onDepartmentClick={() => props.setView({ type: 'ADMIN_ORG_CHART' })}
          />
        )}
      </div>
    </Card>
  );
};
