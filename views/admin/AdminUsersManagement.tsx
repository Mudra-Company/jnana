import React, { useState, useMemo } from 'react';
import { Users, Shield, User as UserIcon, Search, MoreVertical, Eye, ShieldCheck, ShieldOff, Trash2, X } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { CompanyProfile, User, ViewState } from '../../types';
import { useCompanyMembers } from '../../src/hooks/useCompanyMembers';
import { toast } from '../../src/hooks/use-toast';

interface AdminUsersManagementProps {
  company: CompanyProfile;
  users: User[];
  currentUserId: string;
  onRefreshUsers: () => Promise<void>;
  setView: (view: ViewState) => void;
}

type RoleFilter = 'all' | 'admin' | 'user';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  confirmVariant = 'primary',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md animate-scale-in">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{title}</h3>
          <button onClick={onCancel} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-6 whitespace-pre-line">{message}</p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onCancel}>Annulla</Button>
          <Button 
            variant={confirmVariant === 'danger' ? 'primary' : 'primary'} 
            onClick={onConfirm}
            className={confirmVariant === 'danger' ? '!bg-red-600 hover:!bg-red-700' : ''}
          >
            {confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export const AdminUsersManagement: React.FC<AdminUsersManagementProps> = ({
  company,
  users,
  currentUserId,
  onRefreshUsers,
  setView
}) => {
  const { updateMemberRole, deleteCompanyMember, isLoading } = useCompanyMembers();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'promote' | 'demote' | 'remove';
    user: User | null;
  }>({ isOpen: false, type: 'promote', user: null });

  // Filter users for this company
  const companyUsers = useMemo(() => {
    return users.filter(u => u.companyId === company.id);
  }, [users, company.id]);

  // Calculate stats
  const stats = useMemo(() => {
    // We need to identify admins - for now we assume memberId contains role info
    // In a real implementation, we'd have role data in the user object
    const admins = companyUsers.filter(u => {
      // Check if user has admin role based on membership data
      // This is a simplified check - in production, you'd have explicit role data
      return false; // Will be enhanced when we have role data
    });
    return {
      total: companyUsers.length,
      admins: admins.length || 1, // At least 1 admin (current user if they're viewing this)
      users: companyUsers.length - (admins.length || 1)
    };
  }, [companyUsers]);

  // Filter and search users
  const filteredUsers = useMemo(() => {
    return companyUsers.filter(user => {
      // Search filter
      const searchMatch = searchTerm === '' || 
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Role filter - simplified for now
      const roleMatch = roleFilter === 'all'; // Will be enhanced with actual role data
      
      return searchMatch && roleMatch;
    });
  }, [companyUsers, searchTerm, roleFilter]);

  const handlePromoteToAdmin = async (user: User) => {
    if (!user.memberId) {
      toast({ title: 'Errore', description: 'ID membro non trovato', variant: 'destructive' });
      return;
    }

    const result = await updateMemberRole(user.memberId, 'admin');
    if (result.success) {
      toast({ title: 'Successo', description: `${user.firstName} ${user.lastName} è ora Admin` });
      await onRefreshUsers();
    } else {
      toast({ title: 'Errore', description: result.error, variant: 'destructive' });
    }
    setConfirmModal({ isOpen: false, type: 'promote', user: null });
    setOpenMenuId(null);
  };

  const handleDemoteToUser = async (user: User) => {
    if (!user.memberId) {
      toast({ title: 'Errore', description: 'ID membro non trovato', variant: 'destructive' });
      return;
    }

    const result = await updateMemberRole(user.memberId, 'user');
    if (result.success) {
      toast({ title: 'Successo', description: `${user.firstName} ${user.lastName} è ora Utente` });
      await onRefreshUsers();
    } else {
      toast({ title: 'Errore', description: result.error, variant: 'destructive' });
    }
    setConfirmModal({ isOpen: false, type: 'demote', user: null });
    setOpenMenuId(null);
  };

  const handleRemoveMember = async (user: User) => {
    if (!user.memberId) {
      toast({ title: 'Errore', description: 'ID membro non trovato', variant: 'destructive' });
      return;
    }

    const result = await deleteCompanyMember(user.memberId);
    if (result.success) {
      toast({ title: 'Successo', description: `${user.firstName} ${user.lastName} è stato rimosso` });
      await onRefreshUsers();
    } else {
      toast({ title: 'Errore', description: result.error, variant: 'destructive' });
    }
    setConfirmModal({ isOpen: false, type: 'remove', user: null });
    setOpenMenuId(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Attivo</span>;
      case 'invited':
        return <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Invitato</span>;
      case 'test_completed':
        return <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">Test OK</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">In Attesa</span>;
    }
  };

  const isCurrentUser = (userId: string) => userId === currentUserId;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={
          confirmModal.type === 'promote' ? 'Conferma Promozione' :
          confirmModal.type === 'demote' ? 'Conferma Declassamento' :
          '⚠️ Conferma Rimozione'
        }
        message={
          confirmModal.type === 'promote' 
            ? `Vuoi promuovere ${confirmModal.user?.firstName} ${confirmModal.user?.lastName} al ruolo di Admin?\n\nGli Admin possono:\n• Modificare l'organigramma\n• Invitare nuovi utenti\n• Gestire i membri del team`
            : confirmModal.type === 'demote'
            ? `Vuoi declassare ${confirmModal.user?.firstName} ${confirmModal.user?.lastName} a Utente normale?\n\nL'utente perderà i privilegi di amministrazione.`
            : `Vuoi rimuovere ${confirmModal.user?.firstName} ${confirmModal.user?.lastName} dall'azienda?\n\nQuesta azione:\n• Rimuove l'accesso all'azienda\n• I dati dei test rimangono nel sistema`
        }
        confirmLabel={
          confirmModal.type === 'promote' ? 'Promuovi' :
          confirmModal.type === 'demote' ? 'Declassa' :
          'Rimuovi'
        }
        confirmVariant={confirmModal.type === 'remove' ? 'danger' : 'primary'}
        onConfirm={() => {
          if (!confirmModal.user) return;
          if (confirmModal.type === 'promote') handlePromoteToAdmin(confirmModal.user);
          else if (confirmModal.type === 'demote') handleDemoteToUser(confirmModal.user);
          else handleRemoveMember(confirmModal.user);
        }}
        onCancel={() => setConfirmModal({ isOpen: false, type: 'promote', user: null })}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-brand font-bold text-gray-900 dark:text-gray-100 mb-2">
            Gestione Team
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestisci i ruoli e i membri di {company.name}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="flex flex-col justify-between">
          <div className="flex items-center gap-2 text-gray-500">
            <Users size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Totale Membri</span>
          </div>
          <span className="text-3xl font-bold text-gray-800 dark:text-white mt-2">{stats.total}</span>
        </Card>
        <Card className="flex flex-col justify-between">
          <div className="flex items-center gap-2 text-gray-500">
            <Shield size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Admin</span>
          </div>
          <span className="text-3xl font-bold text-amber-600 mt-2">{stats.admins}</span>
        </Card>
        <Card className="flex flex-col justify-between">
          <div className="flex items-center gap-2 text-gray-500">
            <UserIcon size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Utenti</span>
          </div>
          <span className="text-3xl font-bold text-jnana-sage mt-2">{stats.users}</span>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca per nome, email o posizione..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-jnana-sage dark:text-white"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
            className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-jnana-sage dark:text-white"
          >
            <option value="all">Tutti i ruoli</option>
            <option value="admin">Solo Admin</option>
            <option value="user">Solo Utenti</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 uppercase text-xs font-bold">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Utente</th>
                <th className="px-4 py-3">Ruolo</th>
                <th className="px-4 py-3">Stato</th>
                <th className="px-4 py-3">Posizione</th>
                <th className="px-4 py-3 text-right rounded-r-lg">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    {searchTerm ? 'Nessun membro trovato con questi criteri' : 'Nessun membro nel team'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-jnana-sage to-emerald-600 flex items-center justify-center text-sm font-bold text-white">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div>
                          <div className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            {user.firstName} {user.lastName}
                            {isCurrentUser(user.id) && (
                              <span className="text-xs text-gray-400 font-normal">(tu)</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {/* Role badge - simplified, will show actual role when data is available */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold uppercase bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                        <UserIcon size={12} />
                        Utente
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {user.jobTitle || '-'}
                    </td>
                    <td className="px-4 py-3 text-right relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                        disabled={isLoading}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        <MoreVertical size={18} />
                      </button>
                      
                      {/* Dropdown Menu */}
                      {openMenuId === user.id && (
                        <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20">
                          <button
                            onClick={() => {
                              setView({ type: 'USER_RESULT', userId: user.id });
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                          >
                            <Eye size={16} />
                            Vedi Profilo Completo
                          </button>
                          
                          {!isCurrentUser(user.id) && (
                            <>
                              <button
                                onClick={() => {
                                  setConfirmModal({ isOpen: true, type: 'promote', user });
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                              >
                                <ShieldCheck size={16} />
                                Promuovi ad Admin
                              </button>
                              
                              <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                              
                              <button
                                onClick={() => {
                                  setConfirmModal({ isOpen: true, type: 'remove', user });
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                              >
                                <Trash2 size={16} />
                                Rimuovi dall'Azienda
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Click outside to close menu */}
      {openMenuId && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setOpenMenuId(null)}
        />
      )}
    </div>
  );
};