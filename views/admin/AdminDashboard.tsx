import React, { useState, useMemo } from 'react';
import { UserPlus, ArrowRight, Eye, Shield, User as UserIcon, MoreVertical, UserCog, UserMinus, Trash2, Loader2, Mail, Edit } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { CompanyProfile, User, ViewState } from '../../types';
import { calculateCultureAnalysis } from '../../services/riasecService';
import { useCompanyMembers } from '../../src/hooks/useCompanyMembers';
import { toast } from '../../src/hooks/use-toast';
import { supabase } from '../../src/integrations/supabase/client';
import { EditUserModal } from '../../src/components/admin/EditUserModal';

interface AdminDashboardProps {
  activeCompany: CompanyProfile;
  users: User[];
  onUpdateUsers: (users: User[]) => void;
  setView: (view: ViewState) => void;
  currentUserId?: string;
  onRefreshUsers?: () => Promise<void>;
}

// Confirm Modal Component
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, confirmLabel, confirmVariant = 'primary', onConfirm, onCancel }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md animate-scale-in">
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onCancel}>Annulla</Button>
          <Button 
            variant={confirmVariant === 'danger' ? 'ghost' : 'primary'} 
            onClick={onConfirm}
            className={confirmVariant === 'danger' ? '!bg-red-600 !text-white hover:!bg-red-700' : ''}
          >
            {confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export const AdminDashboardView: React.FC<AdminDashboardProps> = ({ 
  activeCompany, 
  users, 
  onUpdateUsers, 
  setView,
  currentUserId,
  onRefreshUsers
}) => {
  // Separate real employees from hiring positions
  const allCompanyRecords = users.filter(u => u.companyId === activeCompany.id);
  const companyUsers = allCompanyRecords.filter(u => !u.isHiring);
  const hiringPositions = allCompanyRecords.filter(u => u.isHiring);
  
  const completedCount = companyUsers.filter(u => u.status === 'completed').length;
  const adminCount = companyUsers.filter(u => u.role === 'admin').length;

  const { updateMemberRole, deleteCompanyMember } = useCompanyMembers();

  // --- INVITE MODAL ---
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  
  // --- ACTION MENU ---
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // --- CONFIRM MODALS ---
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'promote' | 'demote' | 'remove';
    user: User | null;
  }>({ isOpen: false, type: 'promote', user: null });

  // --- SEARCH ---
  const [searchTerm, setSearchTerm] = useState('');

  // --- EDIT USER MODAL ---
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // --- SENDING INVITE STATE ---
  const [sendingInviteId, setSendingInviteId] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return companyUsers;
    const term = searchTerm.toLowerCase();
    return companyUsers.filter(u => 
      u.firstName.toLowerCase().includes(term) ||
      u.lastName.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.jobTitle && u.jobTitle.toLowerCase().includes(term))
    );
  }, [companyUsers, searchTerm]);

  const handleInviteUser = async () => {
    if (!inviteName || !inviteEmail) return;
    
    setIsInviting(true);
    
    try {
      // 1. Create a placeholder company_member record
      const firstName = inviteName.split(' ')[0];
      const lastName = inviteName.split(' ').slice(1).join(' ') || '';
      
      const { data: memberData, error: memberError } = await supabase
        .from('company_members')
        .insert({
          company_id: activeCompany.id,
          placeholder_email: inviteEmail,
          placeholder_first_name: firstName,
          placeholder_last_name: lastName,
          job_title: inviteRole || null,
          status: 'pending',
          role: 'user',
        })
        .select()
        .single();

      if (memberError) {
        console.error('Error creating member:', memberError);
        toast({ title: 'Errore', description: 'Impossibile creare l\'invito', variant: 'destructive' });
        return;
      }

      // 2. Call edge function to send email
      const { data, error } = await supabase.functions.invoke('send-invite-email', {
        body: {
          employeeEmail: inviteEmail,
          employeeName: `${firstName} ${lastName}`,
          companyName: activeCompany.name,
          companyId: activeCompany.id,
          memberId: memberData.id,
        }
      });

      if (error) {
        console.error('Error sending invite email:', error);
        toast({ 
          title: 'Utente creato', 
          description: `${firstName} aggiunto ma l'email non è stata inviata. Contattalo manualmente.`,
        });
      } else {
        toast({ 
          title: 'Invito inviato! ✉️', 
          description: `Email di invito inviata a ${inviteEmail}` 
        });
      }

      // 3. Refresh users list
      if (onRefreshUsers) await onRefreshUsers();
      
      setShowInvite(false);
      setInviteName('');
      setInviteEmail('');
      setInviteRole('');
    } catch (err) {
      console.error('Invite error:', err);
      toast({ title: 'Errore', description: 'Si è verificato un errore durante l\'invito', variant: 'destructive' });
    } finally {
      setIsInviting(false);
    }
  };

  const handlePromoteToAdmin = async (user: User) => {
    if (!user.memberId) return;
    
    const result = await updateMemberRole(user.memberId, 'admin');
    if (result.success) {
      toast({ title: 'Successo', description: `${user.firstName} ${user.lastName} è ora Admin` });
      if (onRefreshUsers) await onRefreshUsers();
    } else {
      toast({ title: 'Errore', description: 'Impossibile aggiornare il ruolo', variant: 'destructive' });
    }
    setConfirmModal({ isOpen: false, type: 'promote', user: null });
    setOpenMenuId(null);
  };

  const handleDemoteToUser = async (user: User) => {
    if (!user.memberId) return;
    
    // Check if this is the last admin
    if (adminCount <= 1) {
      toast({ title: 'Errore', description: 'Non puoi declassare l\'ultimo admin', variant: 'destructive' });
      setConfirmModal({ isOpen: false, type: 'demote', user: null });
      return;
    }
    
    const result = await updateMemberRole(user.memberId, 'user');
    if (result.success) {
      toast({ title: 'Successo', description: `${user.firstName} ${user.lastName} è ora Utente` });
      if (onRefreshUsers) await onRefreshUsers();
    } else {
      toast({ title: 'Errore', description: 'Impossibile aggiornare il ruolo', variant: 'destructive' });
    }
    setConfirmModal({ isOpen: false, type: 'demote', user: null });
    setOpenMenuId(null);
  };

  const handleRemoveMember = async (user: User) => {
    if (!user.memberId) return;
    
    // Check if this is the last admin
    if (user.role === 'admin' && adminCount <= 1) {
      toast({ title: 'Errore', description: 'Non puoi rimuovere l\'ultimo admin', variant: 'destructive' });
      setConfirmModal({ isOpen: false, type: 'remove', user: null });
      return;
    }
    
    const result = await deleteCompanyMember(user.memberId);
    if (result.success) {
      toast({ title: 'Successo', description: `${user.firstName} ${user.lastName} rimosso dall'azienda` });
      if (onRefreshUsers) await onRefreshUsers();
    } else {
      toast({ title: 'Errore', description: 'Impossibile rimuovere l\'utente', variant: 'destructive' });
    }
    setConfirmModal({ isOpen: false, type: 'remove', user: null });
    setOpenMenuId(null);
  };

  const handleSendInvite = async (user: User) => {
    if (!user.memberId) {
      toast({ title: 'Errore', description: 'ID membro non trovato', variant: 'destructive' });
      return;
    }

    setOpenMenuId(null);
    setSendingInviteId(user.memberId);

    try {
      const { data, error } = await supabase.functions.invoke('send-invite-email', {
        body: {
          employeeEmail: user.email,
          employeeName: `${user.firstName} ${user.lastName}`.trim(),
          companyName: activeCompany.name,
          companyId: activeCompany.id,
          memberId: user.memberId,
        }
      });

      if (error) throw error;

      toast({ 
        title: 'Invito inviato! ✉️', 
        description: `Email di invito inviata a ${user.email}` 
      });

      if (onRefreshUsers) await onRefreshUsers();
    } catch (err) {
      console.error('Error sending invite:', err);
      toast({ 
        title: 'Errore', 
        description: 'Impossibile inviare l\'invito. Verifica la configurazione email.', 
        variant: 'destructive' 
      });
    } finally {
      setSendingInviteId(null);
    }
  };

  const handleOpenEditModal = (user: User) => {
    setOpenMenuId(null);
    setEditingUser(user);
  };

  const isCurrentUser = (userId: string) => currentUserId === userId;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 relative">

      {/* Confirm Modal */}
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={
          confirmModal.type === 'promote' ? 'Promuovi ad Admin' :
          confirmModal.type === 'demote' ? 'Declassa a Utente' :
          'Rimuovi dall\'Azienda'
        }
        message={
          confirmModal.type === 'promote' 
            ? `Vuoi promuovere ${confirmModal.user?.firstName} ${confirmModal.user?.lastName} ad Admin? Avrà accesso alla gestione aziendale.` 
            : confirmModal.type === 'demote'
            ? `Vuoi declassare ${confirmModal.user?.firstName} ${confirmModal.user?.lastName} a Utente normale?`
            : `Vuoi rimuovere ${confirmModal.user?.firstName} ${confirmModal.user?.lastName} dall'azienda? Questa azione non può essere annullata.`
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

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={!!editingUser}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSaved={async () => {
          if (onRefreshUsers) await onRefreshUsers();
        }}
      />

      {showInvite && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md animate-scale-in">
            <h3 className="text-lg font-bold mb-4">Invita Nuovo Utente</h3>
            <div className="space-y-3">
              <input
                className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Nome e Cognome"
                value={inviteName}
                onChange={e => setInviteName(e.target.value)}
              />
              <input
                className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Email Aziendale"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
              />
              <input
                className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Ruolo (Opzionale)"
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
              />
              <div className="flex gap-2 pt-2">
                <Button fullWidth onClick={handleInviteUser} disabled={isInviting || !inviteName || !inviteEmail}>
                  {isInviting ? <><Loader2 size={16} className="mr-2 animate-spin" />Invio in corso...</> : 'Invia Invito'}
                </Button>
                <Button variant="ghost" onClick={() => setShowInvite(false)} disabled={isInviting}>Annulla</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-brand font-bold text-gray-900 dark:text-gray-100 mb-2">Dashboard {activeCompany.name}</h1>
          <p className="text-gray-600">Panoramica dello stato del capitale umano.</p>
        </div>
        <Button onClick={() => setShowInvite(true)}><UserPlus size={18} className="mr-2"/> Invita Utenti</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="flex flex-col justify-between">
          <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Totale Dipendenti</span>
          <span className="text-3xl font-bold text-gray-800 dark:text-white mt-2">{companyUsers.length}</span>
        </Card>
        <Card className="flex flex-col justify-between">
          <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Test Completati</span>
          <span className="text-3xl font-bold text-jnana-sage mt-2">{completedCount}</span>
        </Card>
        <Card className="flex flex-col justify-between">
          <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Admin</span>
          <span className="text-3xl font-bold text-amber-500 mt-2">{adminCount}</span>
        </Card>
        <Card 
          className="flex flex-col justify-between bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-0 shadow-lg cursor-pointer hover:scale-[1.02] transition-transform" 
          onClick={() => setView({ type: 'TALENT_SEARCH' })}
        >
          <div className="flex justify-between items-start">
            <span className="text-blue-100 text-xs font-bold uppercase tracking-wider">Posizioni Aperte</span>
            <ArrowRight size={16} className="text-white"/>
          </div>
          <span className="text-3xl font-bold mt-2">{hiringPositions.length}</span>
        </Card>
        <Card className="flex flex-col justify-between bg-gradient-to-br from-purple-600 to-indigo-700 text-white border-0 shadow-lg cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => setView({ type: 'ADMIN_IDENTITY_HUB' })}>
          <div className="flex justify-between items-start">
            <span className="text-purple-100 text-xs font-bold uppercase tracking-wider">Culture Match</span>
            <ArrowRight size={16} className="text-white"/>
          </div>
          <span className="text-3xl font-bold mt-2">{calculateCultureAnalysis(activeCompany, users).matchScore}%</span>
        </Card>
      </div>

      {/* User Table */}
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Elenco Dipendenti</h3>
          <div className="flex gap-2">
            <input 
              placeholder="Cerca..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-jnana-sage dark:text-white" 
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 uppercase text-xs font-bold">
              <tr>
                <th className="px-4 py-3 rounded-l-lg w-12 text-center">Tipo</th>
                <th className="px-4 py-3">Utente</th>
                <th className="px-4 py-3">Posizione</th>
                <th className="px-4 py-3">Stato</th>
                <th className="px-4 py-3">Profilo</th>
                <th className="px-4 py-3 text-right rounded-r-lg w-20">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                  {/* Role Icon Column */}
                  <td className="px-4 py-3 text-center">
                    {u.role === 'admin' || u.role === 'super_admin' ? (
                      <Shield size={18} className="text-amber-500 mx-auto" title="Admin" />
                    ) : (
                      <UserIcon size={18} className="text-gray-400 mx-auto" title="Utente" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                        {u.firstName[0]}{u.lastName[0]}
                      </div>
                      <div>
                        <div className="font-bold text-gray-800 dark:text-gray-200">
                          {u.firstName} {u.lastName}
                          {isCurrentUser(u.id) && <span className="ml-2 text-xs text-gray-400">(tu)</span>}
                        </div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{u.jobTitle || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      u.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                      u.status === 'invited' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-gray-600 dark:text-gray-300">{u.profileCode || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600"
                        title="Azioni"
                      >
                        <MoreVertical size={16}/>
                      </button>
                      
                      {/* Dropdown Menu */}
                      {openMenuId === u.id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                          <button
                            onClick={() => {
                              setView({ type: 'USER_RESULT', userId: u.id });
                              setOpenMenuId(null);
                            }}
                            disabled={u.status !== 'completed'}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Eye size={14} /> Vedi Profilo
                          </button>
                          
                          {/* Invia/Reinvia Invito - solo per utenti pending/invited */}
                          {(u.status === 'pending' || u.status === 'invited') && (
                            <button
                              onClick={() => handleSendInvite(u)}
                              disabled={sendingInviteId === u.memberId}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-blue-600 disabled:opacity-50"
                            >
                              {sendingInviteId === u.memberId ? (
                                <><Loader2 size={14} className="animate-spin" /> Invio...</>
                              ) : (
                                <><Mail size={14} /> {u.status === 'pending' ? 'Invia Invito' : 'Reinvia Invito'}</>
                              )}
                            </button>
                          )}
                          
                          {/* Modifica Utente */}
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <Edit size={14} /> Modifica
                          </button>
                          
                          {!isCurrentUser(u.id) && u.role !== 'super_admin' && (
                            <>
                              {u.role === 'admin' ? (
                                <button
                                  onClick={() => setConfirmModal({ isOpen: true, type: 'demote', user: u })}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                  <UserMinus size={14} /> Declassa a Utente
                                </button>
                              ) : (
                                <button
                                  onClick={() => setConfirmModal({ isOpen: true, type: 'promote', user: u })}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                  <UserCog size={14} /> Promuovi ad Admin
                                </button>
                              )}
                              
                              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                              
                              <button
                                onClick={() => setConfirmModal({ isOpen: true, type: 'remove', user: u })}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                              >
                                <Trash2 size={14} /> Rimuovi dall'Azienda
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* Click outside to close menu */}
      {openMenuId && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setOpenMenuId(null)}
        />
      )}
    </div>
  );
};