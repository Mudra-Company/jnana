import React, { useState, useMemo } from 'react';
import { 
  Shield, User as UserIcon, MoreVertical, Eye, Mail, Edit, 
  UserCog, UserMinus, Trash2, Loader2, Search
} from 'lucide-react';
import { Card } from '../../../components/Card';
import type { User, ViewState } from '../../../types';
import type { RoleAssignment } from '../../types/roles';

interface OrgNodeInfo {
  id: string;
  name: string;
}

interface EnhancedEmployeeTableProps {
  users: User[];
  currentUserId?: string;
  roleAssignments: RoleAssignment[];
  orgNodes: OrgNodeInfo[];
  roleOrgNodeMap: Map<string, string | null>; // roleId -> orgNodeId
  setView: (view: ViewState) => void;
  onPromote: (user: User) => void;
  onDemote: (user: User) => void;
  onRemove: (user: User) => void;
  onEdit: (user: User) => void;
  onSendInvite: (user: User) => void;
  sendingInviteId: string | null;
  adminCount: number;
}

export const EnhancedEmployeeTable: React.FC<EnhancedEmployeeTableProps> = ({
  users,
  currentUserId,
  roleAssignments,
  orgNodes,
  roleOrgNodeMap,
  setView,
  onPromote,
  onDemote,
  onRemove,
  onEdit,
  onSendInvite,
  sendingInviteId,
  adminCount,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Build user -> assignment map
  const userAssignmentMap = useMemo(() => {
    const map = new Map<string, RoleAssignment>();
    roleAssignments.forEach(a => {
      if (a.userId && a.assignmentType === 'primary') {
        map.set(a.userId, a);
      }
    });
    return map;
  }, [roleAssignments]);

  // Build orgNode map
  const orgNodeMap = useMemo(() => {
    const map = new Map<string, string>();
    orgNodes.forEach(n => map.set(n.id, n.name));
    return map;
  }, [orgNodes]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(u =>
      u.firstName.toLowerCase().includes(term) ||
      u.lastName.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.jobTitle && u.jobTitle.toLowerCase().includes(term))
    );
  }, [users, searchTerm]);

  const isCurrentUser = (userId: string) => currentUserId === userId;

  const getRoleInfo = (userId: string) => {
    const assignment = userAssignmentMap.get(userId);
    if (!assignment?.role) return { roleName: null, departmentName: null };
    
    const roleTitle = assignment.role.title || null;
    const orgNodeId = roleOrgNodeMap.get(assignment.roleId);
    const deptName = orgNodeId ? orgNodeMap.get(orgNodeId) || null : null;
    
    return { roleName: roleTitle, departmentName: deptName };
  };

  return (
    <Card padding="none">
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
          👥 Elenco Dipendenti
          <span className="text-xs font-normal text-gray-400 ml-2">({users.length})</span>
        </h3>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Cerca..."
            className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-transparent outline-none w-40"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th className="px-4 py-2.5 w-10 text-center">Tipo</th>
              <th className="px-4 py-2.5">Dipendente</th>
              <th className="px-4 py-2.5">Ruolo Assegnato</th>
              <th className="px-4 py-2.5">Dipartimento</th>
              <th className="px-4 py-2.5">Stato</th>
              <th className="px-4 py-2.5">RIASEC</th>
              <th className="px-4 py-2.5 text-right w-16">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredUsers.map(u => {
              const { roleName, departmentName } = getRoleInfo(u.id);
              return (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                  <td className="px-4 py-2.5 text-center">
                    {u.role === 'admin' || u.role === 'super_admin' ? (
                      <Shield size={14} className="text-amber-500 mx-auto" />
                    ) : (
                      <UserIcon size={14} className="text-gray-400 mx-auto" />
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300 shrink-0">
                        {u.firstName[0]}{u.lastName[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-gray-800 dark:text-gray-200 truncate">
                          {u.firstName} {u.lastName}
                          {isCurrentUser(u.id) && <span className="ml-1 text-[10px] text-gray-400">(tu)</span>}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-600 dark:text-gray-400">
                    {roleName || u.jobTitle || <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-600 dark:text-gray-400">
                    {departmentName || <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      (u.status === 'completed' || u.status === 'test_completed')
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : u.status === 'invited'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {u.status === 'test_completed' ? 'completato' : u.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono font-bold text-xs text-gray-600 dark:text-gray-300">
                    {u.profileCode || '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600"
                      >
                        <MoreVertical size={14} />
                      </button>

                      {openMenuId === u.id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                          <button
                            onClick={() => { setView({ type: 'USER_RESULT', userId: u.id }); setOpenMenuId(null); }}
                            disabled={u.status !== 'completed' && u.status !== 'test_completed'}
                            className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Eye size={12} /> Vedi Profilo
                          </button>

                          {(u.status === 'pending' || u.status === 'invited') && (
                            <button
                              onClick={() => { onSendInvite(u); setOpenMenuId(null); }}
                              disabled={sendingInviteId === u.memberId}
                              className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-blue-600 disabled:opacity-50"
                            >
                              {sendingInviteId === u.memberId ? (
                                <><Loader2 size={12} className="animate-spin" /> Invio...</>
                              ) : (
                                <><Mail size={12} /> {u.status === 'pending' ? 'Invia Invito' : 'Reinvia Invito'}</>
                              )}
                            </button>
                          )}

                          <button
                            onClick={() => { onEdit(u); setOpenMenuId(null); }}
                            className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <Edit size={12} /> Modifica
                          </button>

                          {!isCurrentUser(u.id) && u.role !== 'super_admin' && (
                            <>
                              {u.role === 'admin' ? (
                                <button
                                  onClick={() => { onDemote(u); setOpenMenuId(null); }}
                                  className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                  <UserMinus size={12} /> Declassa a Utente
                                </button>
                              ) : (
                                <button
                                  onClick={() => { onPromote(u); setOpenMenuId(null); }}
                                  className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                  <UserCog size={12} /> Promuovi ad Admin
                                </button>
                              )}
                              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                              <button
                                onClick={() => { onRemove(u); setOpenMenuId(null); }}
                                className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                              >
                                <Trash2 size={12} /> Rimuovi dall'Azienda
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                  Nessun dipendente trovato.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Click outside to close menu */}
      {openMenuId && (
        <div className="fixed inset-0 z-0" onClick={() => setOpenMenuId(null)} />
      )}
    </Card>
  );
};
