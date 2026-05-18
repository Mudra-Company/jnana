import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { CompanyProfile, User, ViewState } from '../../types';
import { calculateCultureAnalysis } from '../../services/riasecService';
import { useCompanyMembers } from '../../src/hooks/useCompanyMembers';
import { useCompanyRoles } from '../../src/hooks/useCompanyRoles';
import { useRoleAssignments } from '../../src/hooks/useRoleAssignments';
import { useOrgNodes } from '../../src/hooks/useOrgNodes';
import { useCompliance } from '../../src/hooks/useCompliance';
import { toast } from '../../src/hooks/use-toast';
import { supabase } from '../../src/integrations/supabase/client';
import { EditUserModal } from '../../src/components/admin/EditUserModal';
import { InvitePersonModal } from '../../src/components/admin/InvitePersonModal';
import { DashboardHeroKPI } from '../../src/components/dashboard/DashboardHeroKPI';
import { TodaysFocusPanel } from '../../src/components/dashboard/TodaysFocusPanel';
import { QuickModulesPanel } from '../../src/components/dashboard/QuickModulesPanel';
import { OrgExplorerPanel } from '../../src/components/dashboard/OrgExplorerPanel';
import type { CompanyRole } from '../../src/types/roles';

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
  
  // Legacy hiring positions from company_members (not yet in company_roles)
  const legacyHiringPositions = useMemo(() => 
    allCompanyRecords.filter(u => u.isHiring === true),
    [allCompanyRecords]
  );
  
  const completedCount = companyUsers.filter(u => u.status === 'completed' || u.status === 'test_completed').length;
  const completionRate = companyUsers.length > 0 ? Math.round((completedCount / companyUsers.length) * 100) : 0;
  const adminCount = companyUsers.filter(u => u.role === 'admin').length;

  const { updateMemberRole, deleteCompanyMember } = useCompanyMembers();
  
  // --- ROLES & ASSIGNMENTS DATA ---
  const { roles, fetchRoles } = useCompanyRoles();
  const { assignments, fetchAssignmentsByRole } = useRoleAssignments();
  const { fetchOrgNodes } = useOrgNodes();
  const { items: complianceItems, riskScore } = useCompliance(activeCompany.id);

  const [orgNodes, setOrgNodes] = useState<{ id: string; name: string; type: string }[]>([]);
  const [allAssignments, setAllAssignments] = useState<typeof assignments>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Use refs to avoid stale closures while keeping effect stable
  const fetchRolesRef = useRef(fetchRoles);
  const fetchOrgNodesRef = useRef(fetchOrgNodes);
  const fetchAssignmentsByRoleRef = useRef(fetchAssignmentsByRole);
  fetchRolesRef.current = fetchRoles;
  fetchOrgNodesRef.current = fetchOrgNodes;
  fetchAssignmentsByRoleRef.current = fetchAssignmentsByRole;

  // Fetch roles, assignments, and org nodes on mount (only when companyId changes)
  useEffect(() => {
    let cancelled = false;

    const loadDashboardData = async () => {
      setIsDataLoading(true);
      try {
        const [fetchedRoles, orgResult] = await Promise.all([
          fetchRolesRef.current(activeCompany.id),
          fetchOrgNodesRef.current(activeCompany.id),
        ]);

        if (cancelled) return;

        // Map org nodes
        const nodes = (orgResult.data || []).map(n => ({
          id: n.id,
          name: n.name,
          type: n.type,
        }));
        setOrgNodes(nodes);

        // Fetch all assignments for all roles
        const assignmentPromises = fetchedRoles.map(r => fetchAssignmentsByRoleRef.current(r.id));
        const allResults = await Promise.all(assignmentPromises);
        if (!cancelled) {
          setAllAssignments(allResults.flat());
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        if (!cancelled) {
          setIsDataLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => { cancelled = true; };
  }, [activeCompany.id]);

  // --- KPI CALCULATIONS ---
  const vacantRoles = useMemo(() => roles.filter(r => r.status === 'vacant'), [roles]);
  const hiringRoles = useMemo(() => roles.filter(r => r.isHiring), [roles]);
  const cultureScore = useMemo(() => calculateCultureAnalysis(activeCompany, users).matchScore, [activeCompany, users]);

  // Combined KPI values (new roles + legacy hiring positions)
  const totalRolesCount = roles.length + legacyHiringPositions.length;
  const vacantRolesCount = vacantRoles.length + legacyHiringPositions.length;
  const hiringRolesCount = hiringRoles.length + legacyHiringPositions.length;

  // Build roleId -> orgNodeId map
  const roleOrgNodeMap = useMemo(() => {
    const map = new Map<string, string | null>();
    roles.forEach(r => map.set(r.id, r.orgNodeId || null));
    return map;
  }, [roles]);

  // Pending test users
  const pendingTestUsers = useMemo(() => 
    companyUsers.filter(u => u.status === 'pending' || u.status === 'invited'),
    [companyUsers]
  );

  // Expiring compliance items
  const expiringCompliance = useMemo(() => 
    complianceItems.filter(i => {
      const d = i.daysUntilExpiry;
      return d !== null && d !== undefined && d <= 30;
    }),
    [complianceItems]
  );

  // --- INVITE MODAL ---
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  
  // --- CONFIRM MODALS ---
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'promote' | 'demote' | 'remove';
    user: User | null;
  }>({ isOpen: false, type: 'promote', user: null });

  // --- EDIT USER MODAL ---
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // --- SENDING INVITE STATE ---
  const [sendingInviteId, setSendingInviteId] = useState<string | null>(null);

  const handleInviteUser = async () => {
    if (!inviteName || !inviteEmail) return;
    
    setIsInviting(true);
    
    try {
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
        toast({ title: 'Errore', description: 'Impossibile creare l\'invito', variant: 'destructive' });
        return;
      }

      const { error } = await supabase.functions.invoke('send-invite-email', {
        body: {
          employeeEmail: inviteEmail,
          employeeName: `${firstName} ${lastName}`,
          companyName: activeCompany.name,
          companyId: activeCompany.id,
          memberId: memberData.id,
        }
      });

      if (error) {
        toast({ 
          title: 'Utente creato', 
          description: `${firstName} aggiunto ma l'email non è stata inviata.`,
        });
      } else {
        toast({ 
          title: 'Invito inviato! ✉️', 
          description: `Email di invito inviata a ${inviteEmail}` 
        });
      }

      if (onRefreshUsers) await onRefreshUsers();
      
      setShowInvite(false);
      setInviteName('');
      setInviteEmail('');
      setInviteRole('');
    } catch (err) {
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
  };

  const handleDemoteToUser = async (user: User) => {
    if (!user.memberId) return;
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
  };

  const handleRemoveMember = async (user: User) => {
    if (!user.memberId) return;
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
  };

  const handleSendInvite = async (user: User) => {
    if (!user.memberId) {
      toast({ title: 'Errore', description: 'ID membro non trovato', variant: 'destructive' });
      return;
    }
    setSendingInviteId(user.memberId);
    try {
      const { error } = await supabase.functions.invoke('send-invite-email', {
        body: {
          employeeEmail: user.email,
          employeeName: `${user.firstName} ${user.lastName}`.trim(),
          companyName: activeCompany.name,
          companyId: activeCompany.id,
          memberId: user.memberId,
        }
      });
      if (error) throw error;
      toast({ title: 'Invito inviato! ✉️', description: `Email di invito inviata a ${user.email}` });
      if (onRefreshUsers) await onRefreshUsers();
    } catch (err) {
      toast({ title: 'Errore', description: 'Impossibile inviare l\'invito.', variant: 'destructive' });
    } finally {
      setSendingInviteId(null);
    }
  };

  const handleRoleClick = (roleId: string) => {
    // Navigate to org chart and focus on the selected role
    setView({ type: 'ADMIN_ORG_CHART', focusRoleId: roleId });
  };

  // Greeting helper
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 5) return 'Buona notte';
    if (h < 13) return 'Buongiorno';
    if (h < 19) return 'Buon pomeriggio';
    return 'Buonasera';
  })();
  const todayLabel = new Date().toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 relative">

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
            ? `Vuoi promuovere ${confirmModal.user?.firstName} ${confirmModal.user?.lastName} ad Admin?` 
            : confirmModal.type === 'demote'
            ? `Vuoi declassare ${confirmModal.user?.firstName} ${confirmModal.user?.lastName} a Utente?`
            : `Vuoi rimuovere ${confirmModal.user?.firstName} ${confirmModal.user?.lastName} dall'azienda?`
        }
        confirmLabel={
          confirmModal.type === 'promote' ? 'Promuovi' :
          confirmModal.type === 'demote' ? 'Declassa' : 'Rimuovi'
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
        onSaved={async () => { if (onRefreshUsers) await onRefreshUsers(); }}
      />

      {/* Invite Modal (unified, signed-token flow) */}
      <InvitePersonModal
        isOpen={showInvite}
        companyId={activeCompany.id}
        companyName={activeCompany.name}
        onClose={() => setShowInvite(false)}
        onInvited={async () => { if (onRefreshUsers) await onRefreshUsers(); }}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-brand font-bold text-gray-900 dark:text-gray-100">
            {greeting}, ecco la tua {activeCompany.name}
          </h1>
          <p className="text-sm text-gray-500 mt-1 capitalize">{todayLabel}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setView({ type: 'ADMIN_ORG_CHART' })} variant="outline" size="sm">
            Organigramma
          </Button>
          <Button onClick={() => setShowInvite(true)} size="sm">
            <UserPlus size={16} className="mr-1.5" /> Invita
          </Button>
        </div>
      </div>

      {/* Hero KPI */}
      <DashboardHeroKPI
        headcount={companyUsers.length}
        openPositions={hiringRolesCount}
        openPositionsDetail={
          hiringRolesCount === 0
            ? (vacantRolesCount > 0 ? `${vacantRolesCount} vacanti senza hiring` : 'tutte coperte')
            : vacantRolesCount > hiringRolesCount
              ? `+${vacantRolesCount - hiringRolesCount} vacanti non in hiring`
              : 'in cerca di candidati'
        }
        complianceScore={riskScore.score}
        complianceExpiring={expiringCompliance.length}
        cultureScore={cultureScore}
        onClickHeadcount={() => setView({ type: 'ADMIN_IDENTITY_HUB' })}
        onClickOpenPositions={() => setView({ type: 'ADMIN_OPEN_POSITIONS' })}
        onClickCompliance={() => setView({ type: 'ADMIN_COMPLIANCE' })}
        onClickCulture={() => setView({ type: 'ADMIN_IDENTITY_HUB' })}
      />

      {/* Focus di oggi (full-width, primary attention area) */}
      <TodaysFocusPanel
        vacantRoles={vacantRoles}
        legacyHiringPositions={legacyHiringPositions}
        hiringRoles={hiringRoles}
        expiringCompliance={expiringCompliance}
        pendingTestUsers={pendingTestUsers}
        onNavigateToRole={handleRoleClick}
        onNavigateToCompliance={() => setView({ type: 'ADMIN_COMPLIANCE' })}
        onNavigateToOpenPositions={() => setView({ type: 'ADMIN_OPEN_POSITIONS' })}
      />

      {/* Quick modules */}
      <QuickModulesPanel
        setView={setView}
        onInviteUser={() => setShowInvite(true)}
        badges={{
          compliance: expiringCompliance.length,
          openPositions: hiringRolesCount,
          pendingPeople: pendingTestUsers.length,
        }}
      />

      {/* Org Explorer (people / roles / departments tabs) */}
      <OrgExplorerPanel
        users={companyUsers}
        currentUserId={currentUserId}
        setView={setView}
        onPromote={(u) => setConfirmModal({ isOpen: true, type: 'promote', user: u })}
        onDemote={(u) => setConfirmModal({ isOpen: true, type: 'demote', user: u })}
        onRemove={(u) => setConfirmModal({ isOpen: true, type: 'remove', user: u })}
        onEdit={(u) => setEditingUser(u)}
        onSendInvite={handleSendInvite}
        sendingInviteId={sendingInviteId}
        adminCount={adminCount}
        roles={roles}
        assignments={allAssignments}
        orgNodes={orgNodes}
        roleOrgNodeMap={roleOrgNodeMap}
        legacyHiringPositions={legacyHiringPositions}
        onRoleClick={handleRoleClick}
      />
    </div>
  );
};
