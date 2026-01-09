import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import { useCompanies } from './src/hooks/useCompanies';
import { useProfiles } from './src/hooks/useProfiles';
import { useTestResults } from './src/hooks/useTestResults';
import { useOrgNodes } from './src/hooks/useOrgNodes';
import { useRouteGuard, UserRole } from './src/hooks/useRouteGuard';
import { ViewState, RiasecScore, JobDatabase, OrgNode, ChatMessage, ClimateData, CompanyProfile, User, KarmaData } from './types';
import { calculateProfileCode } from './services/riasecService';
import { supabase } from './src/integrations/supabase/client';
import { loadJobDb, saveJobDb } from './services/storageService';
import { toast } from './src/hooks/use-toast';
import { Toaster } from './src/components/ui/toaster';

// Imported Views & Components
import { Header } from './components/layout/Header';
import { AuthView } from './src/views/auth/AuthView';
import { ResetPasswordView } from './src/views/auth/ResetPasswordView';
import { SuperAdminDashboard } from './views/superadmin/SuperAdminDashboard';
import { JobDatabaseEditor } from './views/superadmin/JobDatabaseEditor';
import { KarmaTalentsView } from './views/superadmin/KarmaTalentsView';
import { KarmaProfileDetailView } from './views/superadmin/KarmaProfileDetailView';
import { SuperAdminAnalyticsView } from './views/superadmin/SuperAdminAnalyticsView';
import KarmaAIConfigView from './views/superadmin/KarmaAIConfigView';
import { AdminDashboardView } from './views/admin/AdminDashboard';
import { OpenPositionsView } from './views/admin/OpenPositionsView';
import { PositionMatchingView } from './views/admin/PositionMatchingView';

import { CompanyOrgView } from './views/admin/CompanyOrgView';
import { AdminIdentityHub } from './views/admin/AdminIdentityHub';
import { AdminCompanyProfileView } from './views/admin/AdminCompanyProfileView';
import { UserWelcomeView } from './views/user/UserWelcomeView';
import { UserTestView } from './views/user/UserTestView';
import { ClimateTestView } from './views/user/ClimateTestView';
import { KarmaChatView } from './views/user/KarmaChatView';
import { UserResultView } from './views/user/UserResultView';
import SeedDataView from './src/views/admin/SeedDataView';
import { DemoBanner } from './src/components/DemoBanner';

// Karma Platform Views
import { KarmaOnboarding } from './views/karma/KarmaOnboarding';
import { KarmaDashboard } from './views/karma/KarmaDashboard';
import { KarmaProfileEdit } from './views/karma/KarmaProfileEdit';
import { KarmaResults } from './views/karma/KarmaResults';
import { KarmaTestRiasec } from './views/karma/KarmaTestRiasec';
import { KarmaTestChat } from './views/karma/KarmaTestChat';

// Landing Page
import { LandingPage } from './views/landing/LandingPage';

// Adapter to convert DB profile to legacy User type
const profileToLegacyUser = (
  profile: any, 
  membership?: any, 
  riasecResult?: any, 
  karmaSession?: any, 
  climateResponse?: any
): User => {
  return {
    id: profile.id,
    firstName: profile.first_name || '',
    lastName: profile.last_name || '',
    email: profile.email,
    gender: profile.gender as 'M' | 'F' | undefined,
    age: profile.age || undefined,
    companyId: membership?.company_id || '',
    jobTitle: membership?.job_title || profile.job_title || '',
    departmentId: membership?.department_id || '',
    status: membership?.status || 'pending',
    memberId: membership?.id || undefined,
    results: riasecResult ? {
      R: riasecResult.score_r,
      I: riasecResult.score_i,
      A: riasecResult.score_a,
      S: riasecResult.score_s,
      E: riasecResult.score_e,
      C: riasecResult.score_c,
    } : undefined,
    profileCode: riasecResult?.profile_code || undefined,
    submissionDate: riasecResult?.submitted_at?.split('T')[0] || undefined,
    karmaData: karmaSession ? {
      transcript: karmaSession.transcript || [],
      summary: karmaSession.summary || '',
      softSkills: karmaSession.soft_skills || [],
      primaryValues: karmaSession.primary_values || [],
      riskFactors: karmaSession.risk_factors || [],
      seniorityAssessment: karmaSession.seniority_assessment,
    } : undefined,
    climateData: climateResponse ? {
      rawScores: climateResponse.raw_scores || {},
      sectionAverages: climateResponse.section_averages || {},
      overallAverage: climateResponse.overall_average || 0,
      submissionDate: climateResponse.submitted_at?.split('T')[0],
    } : undefined,
  };
};

// Adapter for company
const companyToLegacy = (company: any, orgNodes?: any[]): CompanyProfile => {
  // Build tree structure from flat nodes
  const buildTree = (nodes: any[], parentId: string | null = null): OrgNode | null => {
    const children = nodes.filter(n => n.parent_node_id === parentId);
    if (children.length === 0 && parentId !== null) return null;
    
    const rootNode = nodes.find(n => n.parent_node_id === parentId && n.type === 'root');
    if (!rootNode && parentId === null) {
      // Create a default root if none exists
      return {
        id: company.id,
        name: company.name,
        type: 'root',
        isCulturalDriver: false,
        children: children.map(c => ({
          id: c.id,
          name: c.name,
          type: c.type,
          isCulturalDriver: c.is_cultural_driver || false,
          targetProfile: c.target_profile || undefined,
          children: [],
        })),
      };
    }
    
    const buildChildren = (pid: string): OrgNode[] => {
      return nodes
        .filter(n => n.parent_node_id === pid)
        .map(n => ({
          id: n.id,
          name: n.name,
          type: n.type,
          isCulturalDriver: n.is_cultural_driver || false,
          targetProfile: n.target_profile || undefined,
          children: buildChildren(n.id),
        }));
    };

    if (rootNode) {
      return {
        id: rootNode.id,
        name: rootNode.name,
        type: rootNode.type,
        isCulturalDriver: rootNode.is_cultural_driver || false,
        children: buildChildren(rootNode.id),
      };
    }

    return {
      id: company.id,
      name: company.name,
      type: 'root',
      isCulturalDriver: false,
      children: [],
    };
  };

  return {
    id: company.id,
    name: company.name,
    email: company.email || '',
    industry: company.industry || '',
    sizeRange: company.size_range || '',
    vatNumber: company.vat_number || '',
    logoUrl: company.logo_url || '',
    foundationYear: company.foundation_year || undefined,
    website: company.website || '',
    address: company.address || '',
    description: company.description || '',
    cultureValues: company.culture_values || [],
    structure: buildTree(orgNodes || [], null) || {
      id: company.id,
      name: company.name,
      type: 'root',
      isCulturalDriver: false,
      children: [],
    },
  };
};

// --- MAIN APP CONTENT ---
const AppContent: React.FC = () => {
  const { 
    user, 
    profile, 
    membership, 
    isLoading: authLoading, 
    isInitialized: authInitialized,
    isSuperAdmin, 
    isCompanyAdmin, 
    signOut 
  } = useAuth();
  const { companies, setCompanies, fetchCompanyWithStructure, createCompany, updateCompany } = useCompanies();
  const { profiles, fetchUserWithDetails } = useProfiles(membership?.company_id);
  const { saveRiasecResult, saveKarmaSession, saveClimateResponse, updateMemberStatus } = useTestResults();
  const { syncTreeToDatabase, fetchOrgNodes } = useOrgNodes();
  const { userRole, canAccessAdminViews, canAccessSuperAdminViews, canViewUser } = useRouteGuard();

  const [jobDb, setJobDb] = useState<JobDatabase>({});
  const [pendingInviteData, setPendingInviteData] = useState<{ inviteId: string; companyId: string; companyName?: string } | null>(null);
  const [view, setView] = useState<ViewState>(() => {
    // Check for reset password URL
    if (window.location.pathname === '/auth/reset-password') {
      return { type: 'RESET_PASSWORD' };
    }
    // Check for seed URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('seed') === 'true') {
      return { type: 'SEED_DATA' };
    }
    // Check for invite URL parameters
    const inviteId = urlParams.get('invite');
    const companyId = urlParams.get('company');
    if (inviteId && companyId) {
      // Store invite info for after signup
      localStorage.setItem('pendingInvite', JSON.stringify({ inviteId, companyId }));
      // Clean the URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return { type: 'AUTH' };
    }
    return { type: 'LOADING' }; // Start with LOADING, not LOGIN
  });

  // Check for pending invite and load company name
  useEffect(() => {
    const checkPendingInvite = async () => {
      const pendingInviteStr = localStorage.getItem('pendingInvite');
      if (pendingInviteStr) {
        try {
          const invite = JSON.parse(pendingInviteStr);
          const { data: company } = await supabase
            .from('companies')
            .select('name')
            .eq('id', invite.companyId)
            .maybeSingle();
          
          setPendingInviteData({
            ...invite,
            companyName: company?.name
          });
        } catch (err) {
          console.error('Error loading pending invite:', err);
        }
      } else {
        setPendingInviteData(null);
      }
    };
    
    checkPendingInvite();
  }, [view.type]);
  const [viewHistory, setViewHistory] = useState<ViewState[]>([]);
  const [isDark, setIsDark] = useState(false);
  const [impersonatedCompanyId, setImpersonatedCompanyId] = useState<string | null>(null);
  const [superAdminDataLoading, setSuperAdminDataLoading] = useState(false);
  
  const [activeCompanyData, setActiveCompanyData] = useState<CompanyProfile | null>(null);
  const [currentUserData, setCurrentUserData] = useState<User | null>(null);
  const [companyUsers, setCompanyUsers] = useState<User[]>([]);
  const [existingOrgNodeIds, setExistingOrgNodeIds] = useState<string[]>([]);
  
  // Demo Mode State
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoUserData, setDemoUserData] = useState<User | null>(null);
  
  // Refs to prevent duplicate loads
  const dataLoadedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  // Load job database from localStorage (still used for job suggestions)
  useEffect(() => {
    setJobDb(loadJobDb());
  }, []);

  // Handle auth state changes - wait for auth to be FULLY initialized
  useEffect(() => {
    console.log('[App] Auth state check - Loading:', authLoading, 'Initialized:', authInitialized, 'User:', !!user, 'Profile:', !!profile, 'IsSuperAdmin:', isSuperAdmin);
    
    // Wait for auth to be fully initialized - this is the ONLY gate
    if (!authInitialized) {
      console.log('[App] Auth not initialized yet, staying on LOADING');
      return;
    }
    
    // Auth is initialized - now decide what to show
    if (!user) {
      // No user = show landing page
      console.log('[App] No user after auth init, showing landing');
      setView({ type: 'LANDING' });
      setCurrentUserData(null);
      setActiveCompanyData(null);
      lastUserIdRef.current = null;
      dataLoadedRef.current = false;
      return;
    }
    
    // User exists - wait for profile too (it's loaded as part of auth init)
    if (!profile) {
      console.log('[App] User exists but no profile yet, waiting...');
      return;
    }
    
    // User and profile exist - load data if needed
    if (lastUserIdRef.current !== user.id || !dataLoadedRef.current) {
      console.log('[App] Loading user data for:', user.id);
      lastUserIdRef.current = user.id;
      dataLoadedRef.current = true;
      loadCurrentUserData();
    }
  }, [user?.id, profile?.id, authInitialized, isSuperAdmin]);

  // Route guard: redirect unauthorized users away from admin views
  useEffect(() => {
    if (!user || !authInitialized) return;
    
    const superAdminViews = ['SUPER_ADMIN_DASHBOARD', 'SUPER_ADMIN_JOBS', 'SUPER_ADMIN_KARMA_TALENTS', 'SUPER_ADMIN_KARMA_PROFILE'];
    const adminViews = ['ADMIN_DASHBOARD', 'ADMIN_ORG_CHART', 'ADMIN_IDENTITY_HUB', 'ADMIN_COMPANY_PROFILE'];
    
    // Regular users trying to access super admin views
    if (superAdminViews.includes(view.type) && !canAccessSuperAdminViews) {
      console.warn('[App] Unauthorized access attempt to super admin view');
      if (canAccessAdminViews && membership?.company_id) {
        setView({ type: 'ADMIN_DASHBOARD' });
      } else {
        setView({ type: 'USER_RESULT', userId: user.id });
      }
      return;
    }
    
    // Regular users trying to access admin views
    if (adminViews.includes(view.type) && !canAccessAdminViews) {
      console.warn('[App] Unauthorized access attempt to admin view');
      setView({ type: 'USER_RESULT', userId: user.id });
      return;
    }
  }, [view.type, user, authInitialized, canAccessSuperAdminViews, canAccessAdminViews, membership?.company_id]);

  const loadAllCompaniesForSuperAdmin = async () => {
    console.log('[App] Loading companies for Super Admin...');
    const { supabase } = await import('./src/integrations/supabase/client');
    
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('[App] Error loading companies for super admin:', error);
      return;
    }
    
    console.log('[App] Companies loaded:', data?.length || 0);
    if (data) {
      setCompanies(data);
    }
  };

  // Load all users for Super Admin dashboard
  const loadAllUsersForSuperAdmin = async () => {
    const { supabase } = await import('./src/integrations/supabase/client');
    
    // Query all company_members with their profiles
    const { data: members, error } = await supabase
      .from('company_members')
      .select(`
        *,
        profiles!company_members_user_id_fkey (*)
      `);
    
    if (error) {
      console.error('Error loading users for super admin:', error);
      return;
    }
    
    if (members) {
      const users = members
        .filter(m => m.profiles) // Only include members with profiles
        .map(m => profileToLegacyUser(
          m.profiles,
          m, // membership
          null, // riasecResult
          null, // karmaSession
          null  // climateResponse
        ));
      setCompanyUsers(users);
    }
  };

  const loadCurrentUserData = async () => {
    console.log('[App] loadCurrentUserData called - isSuperAdmin:', isSuperAdmin, 'isCompanyAdmin:', isCompanyAdmin);
    
    if (!user || !profile) {
      console.log('[App] No user or profile, aborting');
      return;
    }

    const userData = await fetchUserWithDetails(user.id);
    if (userData) {
      const legacyUser = profileToLegacyUser(
        userData,
        userData.membership,
        userData.riasecResult,
        userData.karmaSession,
        userData.climateResponse
      );
      setCurrentUserData(legacyUser);

      console.log('[App] Determining view - isSuperAdmin:', isSuperAdmin);
      
      // Read auth intent - determines which platform the user intended to access
      const authIntent = localStorage.getItem('auth_intent') as 'jnana' | 'karma' | null;
      console.log('[App] Auth intent:', authIntent);
      
      // Check if user has Karma data (independent of company membership)
      const hasKarmaData = userData.is_karma_profile || 
        userData.riasecResult || 
        userData.karmaSession;
      
      // Determine user contexts
      const hasJnanaContext = !!userData.membership?.company_id;
      const hasKarmaContext = hasKarmaData;
      
      console.log('[App] Contexts - JNANA:', hasJnanaContext, 'KARMA:', hasKarmaContext, 'Intent:', authIntent);

      // Route based on intent first, then fallback to role-based routing
      if (authIntent === 'karma' && hasKarmaContext) {
        // User explicitly logged in via KARMA portal
        console.log('[App] Routing to KARMA based on intent');
        localStorage.removeItem('auth_intent'); // Clear after use
        if (userData.first_name && userData.last_name) {
          setView({ type: 'KARMA_DASHBOARD' });
        } else {
          setView({ type: 'KARMA_ONBOARDING' });
        }
        return;
      }
      
      // Clear intent for JNANA or default routing
      localStorage.removeItem('auth_intent');
      
      // Standard role-based routing (JNANA context)
      if (isSuperAdmin) {
        console.log('[App] User is Super Admin, loading admin data...');
        setSuperAdminDataLoading(true);
        setView({ type: 'SUPER_ADMIN_DASHBOARD' });
        await loadAllCompaniesForSuperAdmin();
        await loadAllUsersForSuperAdmin();
        setSuperAdminDataLoading(false);
        console.log('[App] Super Admin data loaded');
      } else if (isCompanyAdmin && userData.membership?.company_id) {
        await loadCompanyData(userData.membership.company_id);
        setView({ type: 'ADMIN_DASHBOARD' });
      } else if (!userData.membership?.company_id) {
        // User without company = Karma user (public platform)
        if (userData.first_name && userData.last_name) {
          setView({ type: 'KARMA_DASHBOARD' });
        } else {
          setView({ type: 'KARMA_ONBOARDING' });
        }
      } else if (userData.membership?.status === 'completed') {
        setView({ type: 'USER_RESULT', userId: user.id });
      } else {
        setView({ type: 'USER_WELCOME', userId: user.id });
      }
    }
  };

  // Load all company users with full details (RIASEC, Karma, Climate) directly from DB
  // INCLUDES PLACEHOLDERS (slots without user_id)
  const loadCompanyUsersWithDetails = async (companyId: string): Promise<User[]> => {
    const { supabase } = await import('./src/integrations/supabase/client');
    
    // 1. Load ALL company_members (including placeholders without user_id)
    const { data: members, error: membersError } = await supabase
      .from('company_members')
      .select(`*, profiles:user_id (*)`)
      .eq('company_id', companyId);
    
    if (membersError || !members) {
      console.error('Error loading company members:', membersError);
      return [];
    }
    
    if (members.length === 0) {
      return [];
    }
    
    // Separate members with profiles from placeholders
    const membersWithProfiles = members.filter(m => m.user_id && m.profiles);
    const placeholders = members.filter(m => !m.user_id);
    
    // Get user IDs for test data loading (only real users)
    const userIds = membersWithProfiles.map(m => m.user_id).filter(Boolean);
    
    // 2. Load test results AND user_roles for real users only
    let riasecResults: any[] = [];
    let karmaSessions: any[] = [];
    let climateResponses: any[] = [];
    let userRolesData: any[] = [];
    
    if (userIds.length > 0) {
      const [riasec, karma, climate, roles] = await Promise.all([
        supabase.from('riasec_results').select('*').in('user_id', userIds),
        supabase.from('karma_sessions').select('*').in('user_id', userIds),
        supabase.from('climate_responses').select('*').in('user_id', userIds),
        supabase.from('user_roles').select('*').in('user_id', userIds)
      ]);
      riasecResults = riasec.data || [];
      karmaSessions = karma.data || [];
      climateResponses = climate.data || [];
      userRolesData = roles.data || [];
    }
    
    // 3. Transform real users
    const realUsers = membersWithProfiles.map(member => {
      const profile = member.profiles as any;
      const riasec = riasecResults.find(r => r.user_id === member.user_id);
      const karma = karmaSessions.find(k => k.user_id === member.user_id);
      const climate = climateResponses.find(c => c.user_id === member.user_id);
      
      // Check if user is a super_admin in user_roles table
      const isSuperAdmin = userRolesData.some(r => r.user_id === member.user_id && r.role === 'super_admin');
      
      const legacyUser = profileToLegacyUser(profile, member, riasec, karma, climate);
      // Override role if user is super_admin (takes precedence over company_member role)
      legacyUser.role = isSuperAdmin ? 'super_admin' : (member.role || 'user');
      legacyUser.memberId = member.id;
      return legacyUser;
    });
    
    // 4. Transform placeholder/hiring slots to User objects
    const placeholderUsers: User[] = placeholders.map(member => ({
      id: member.id, // Use member.id as user id for placeholders
      memberId: member.id,
      firstName: member.placeholder_first_name || '',
      lastName: member.placeholder_last_name || '',
      email: member.placeholder_email || '',
      companyId: member.company_id,
      departmentId: member.department_id || '',
      jobTitle: member.job_title || '',
      status: member.status || 'pending',
      isHiring: member.is_hiring || false,
      requiredProfile: member.required_profile ? {
        hardSkills: (member.required_profile as any).hardSkills || [],
        softSkills: (member.required_profile as any).softSkills || [],
        seniority: (member.required_profile as any).seniority || 'Mid'
      } : undefined,
      role: member.role || 'user'
    }));
    
    // 5. Combine and return all users
    return [...realUsers, ...placeholderUsers];
  };

  const loadCompanyData = async (companyId: string) => {
    const companyWithStructure = await fetchCompanyWithStructure(companyId);
    if (companyWithStructure) {
      setActiveCompanyData(companyToLegacy(companyWithStructure, companyWithStructure.structure));
      
      // Store existing org node IDs for sync comparison
      const { data: orgNodes } = await fetchOrgNodes(companyId);
      if (orgNodes) {
        setExistingOrgNodeIds(orgNodes.map(n => n.id));
      }
      
      // Load company users with ALL details (RIASEC, Karma, Climate) directly from DB
      const users = await loadCompanyUsersWithDetails(companyId);
      setCompanyUsers(users);
    }
  };

  // Navigation
  const navigate = (newView: ViewState) => {
    setViewHistory(prev => [...prev, view]);
    setView(newView);
  };

  const goBack = () => {
    // Se c'è cronologia, torna alla vista precedente
    if (viewHistory.length > 0) {
      const previousView = viewHistory[viewHistory.length - 1];
      setViewHistory(prev => prev.slice(0, -1));
      setView(previousView);
      return;
    }
    
    // Se non c'è cronologia ma siamo in modalità supervisione, 
    // torna al Super Admin Dashboard (equivale a "Esci impersonazione")
    if (isSuperAdmin && activeCompanyData) {
      setImpersonatedCompanyId(null);
      setActiveCompanyData(null);
      setView({ type: 'SUPER_ADMIN_DASHBOARD' });
    }
  };

  // Handler for admins to access their own user profile
  const handleGoToMyProfile = () => {
    if (!user || !currentUserData) return;
    
    // Navigate based on test completion - always show profile if RIASEC is done
    const hasRiasec = !!currentUserData.results;
    
    if (!hasRiasec) {
      // No RIASEC - start from beginning
      navigate({ type: 'USER_WELCOME', userId: user.id });
    } else {
      // Has RIASEC - show profile with results and CTAs for missing tests
      navigate({ type: 'USER_RESULT', userId: user.id });
    }
  };

  // Handlers
  const handleLogout = async () => {
    await signOut();
    setCurrentUserData(null);
    setActiveCompanyData(null);
    setCompanyUsers([]);
    setViewHistory([]);
    setImpersonatedCompanyId(null);
    setView({ type: 'LOGIN' });
  };

  const handleTestComplete = async (score: RiasecScore) => {
    if (!currentUserData || !user) return;
    
    const profileCode = calculateProfileCode(score);
    
    // Save to database
    await saveRiasecResult(
      user.id,
      membership?.company_id || null,
      score,
      profileCode
    );

    if (membership?.company_id) {
      await updateMemberStatus(user.id, membership.company_id, 'test_completed');
    }

    // Update local state
    const updatedUser: User = {
      ...currentUserData,
      status: 'test_completed',
      results: score,
      profileCode,
      submissionDate: new Date().toISOString().split('T')[0],
    };
    setCurrentUserData(updatedUser);

    // NEW FLOW: RIASEC -> Climate -> Karma
    navigate({ type: 'USER_CLIMATE_TEST', userId: user.id });
  };

  const handleKarmaComplete = async (transcript: ChatMessage[]) => {
    if (!currentUserData || !user) return;

    // Call edge function to analyze transcript
    let karmaDataPartial: any = {};
    try {
      const { data, error } = await supabase.functions.invoke('karma-analyze', {
        body: { transcript: transcript.map(m => ({ role: m.role, text: m.text })) }
      });
      
      if (error) {
        console.error('Karma analysis error:', error);
      } else {
        karmaDataPartial = data;
      }
    } catch (e) {
      console.error('Error calling karma-analyze:', e);
    }

    // Save to database
    await saveKarmaSession(
      user.id,
      membership?.company_id || null,
      transcript,
      {
        summary: karmaDataPartial.summary,
        softSkills: karmaDataPartial.softSkills,
        primaryValues: karmaDataPartial.primaryValues,
        riskFactors: karmaDataPartial.riskFactors,
        seniorityAssessment: karmaDataPartial.seniorityAssessment as any,
      }
    );

    if (membership?.company_id) {
      await updateMemberStatus(user.id, membership.company_id, 'completed');
    }

    // Update local state
    const updatedUser: User = {
      ...currentUserData,
      status: 'completed',
      karmaData: {
        transcript,
        ...karmaDataPartial,
      },
    };
    setCurrentUserData(updatedUser);

    navigate({ type: 'USER_RESULT', userId: user.id });
  };

  const handleClimateComplete = async (climateData: ClimateData) => {
    if (!user) return;

    // Save to database
    await saveClimateResponse(
      user.id,
      membership?.company_id || null,
      climateData
    );

    // Update local state
    if (currentUserData) {
      const updatedUser: User = {
        ...currentUserData,
        climateData,
      };
      setCurrentUserData(updatedUser);
    }

    // NEW FLOW: Climate -> Karma
    navigate({ type: 'USER_CHAT', userId: user.id });
  };

  const handleOrgChartUpdate = async (newRoot: OrgNode) => {
    if (!activeCompanyData) return;
    
    // Update local state immediately for responsiveness
    setActiveCompanyData({ ...activeCompanyData, structure: newRoot });
    
    // Persist to database
    const { success, newIdMap } = await syncTreeToDatabase(
      activeCompanyData.id,
      newRoot,
      existingOrgNodeIds
    );
    
    if (success) {
      console.log('[App] Org chart saved successfully');
      toast({
        title: "Modifiche salvate",
        description: "L'organigramma è stato aggiornato correttamente.",
      });
      
      // Update existing node IDs with any new ones
      const { data: updatedNodes } = await fetchOrgNodes(activeCompanyData.id);
      if (updatedNodes) {
        setExistingOrgNodeIds(updatedNodes.map(n => n.id));
      }
      
      // If new nodes were created, update the tree with real IDs
      if (Object.keys(newIdMap).length > 0) {
        const updateNodeIds = (node: OrgNode): OrgNode => ({
          ...node,
          id: newIdMap[node.id] || node.id,
          children: node.children.map(updateNodeIds),
        });
        setActiveCompanyData(prev => prev ? { 
          ...prev, 
          structure: updateNodeIds(newRoot) 
        } : null);
      }
    } else {
      console.error('[App] Failed to save org chart');
      toast({
        title: "Errore",
        description: "Impossibile salvare le modifiche all'organigramma.",
        variant: "destructive",
      });
    }
  };

  // Impersonation for Super Admin
  const handleImpersonate = async (companyId: string) => {
    setImpersonatedCompanyId(companyId);
    await loadCompanyData(companyId);
    setViewHistory([]);
    setView({ type: 'ADMIN_DASHBOARD' });
  };

  // Create new company (Super Admin)
  const handleCreateCompany = async (companyData: {
    name: string;
    email?: string;
    industry?: string;
    size_range?: string;
    vat_number?: string;
    website?: string;
  }): Promise<boolean> => {
    const fullCompanyData = {
      name: companyData.name,
      email: companyData.email || null,
      industry: companyData.industry || null,
      size_range: companyData.size_range || null,
      vat_number: companyData.vat_number || null,
      website: companyData.website || null,
      address: null,
      culture_values: [],
      description: null,
      foundation_year: null,
      logo_url: null,
    };
    
    const newCompany = await createCompany(fullCompanyData as any);
    if (newCompany) {
      // Create root org node for the company
      // Create root org node for the company
      // Note: Super admin does NOT become a company_member - they manage via RLS policies
      await supabase.from('org_nodes').insert({
        company_id: newCompany.id,
        name: companyData.name,
        type: 'root',
        sort_order: 0,
        is_cultural_driver: false
      });
      
      // Refresh companies list
      await loadAllCompaniesForSuperAdmin();
      return true;
    }
    return false;
  };

  // Handler for saving company profile updates to database
  const handleCompanyUpdate = async (updatedCompany: CompanyProfile) => {
    if (!activeCompanyData) return;
    
    // Convert CompanyProfile (camelCase) to database format (snake_case)
    const dbUpdates = {
      name: updatedCompany.name,
      email: updatedCompany.email || null,
      industry: updatedCompany.industry || null,
      size_range: updatedCompany.sizeRange || null,
      vat_number: updatedCompany.vatNumber || null,
      logo_url: updatedCompany.logoUrl || null,
      foundation_year: updatedCompany.foundationYear || null,
      website: updatedCompany.website || null,
      address: updatedCompany.address || null,
      description: updatedCompany.description || null,
      culture_values: updatedCompany.cultureValues || [],
    };
    
    const result = await updateCompany(activeCompanyData.id, dbUpdates);
    
    if (result) {
      // Update local state only on success
      setActiveCompanyData(updatedCompany);
      console.log('[App] Company profile saved successfully');
    } else {
      console.error('[App] Failed to save company profile');
    }
  };

  // ===== DEMO MODE HANDLERS =====
  
  const handleStartDemoMode = () => {
    // Create a fictitious demo user (not saved to DB)
    const demoUser: User = {
      id: 'demo_user_temp_' + Date.now(),
      firstName: 'Demo',
      lastName: 'User',
      email: 'demo@test.jnana.app',
      companyId: activeCompanyData?.id || 'demo_company',
      status: 'pending',
    };
    setDemoUserData(demoUser);
    setIsDemoMode(true);
    setView({ type: 'DEMO_USER_WELCOME' });
    
    toast({
      title: "Modalità Demo attivata",
      description: "Stai simulando il percorso di un nuovo utente. I dati NON vengono salvati.",
    });
  };

  const handleExitDemoMode = () => {
    setIsDemoMode(false);
    setDemoUserData(null);
    setView({ type: 'SUPER_ADMIN_DASHBOARD' });
    
    toast({
      title: "Demo terminata",
      description: "Sei tornato alla Console Super Admin.",
    });
  };

  // Demo: RIASEC test completion (local state only)
  const handleDemoTestComplete = async (score: RiasecScore) => {
    if (!demoUserData) return;
    
    const profileCode = calculateProfileCode(score);
    
    setDemoUserData(prev => prev ? {
      ...prev,
      results: score,
      profileCode,
      status: 'test_completed',
      submissionDate: new Date().toISOString().split('T')[0],
    } : null);
    
    // NEW FLOW: RIASEC -> Climate -> Karma
    setView({ type: 'DEMO_USER_CLIMATE' });
  };

  // Demo: Karma chat completion (calls AI analysis but doesn't persist)
  const handleDemoKarmaComplete = async (transcript: ChatMessage[]) => {
    if (!demoUserData) return;

    // Call AI analysis to see real results
    let karmaDataPartial: Partial<KarmaData> = {};
    try {
      const { data, error } = await supabase.functions.invoke('karma-analyze', {
        body: { transcript: transcript.map(m => ({ role: m.role, text: m.text })) }
      });
      
      if (!error && data) {
        karmaDataPartial = data;
      }
    } catch (e) {
      console.error('[Demo] Error calling karma-analyze:', e);
    }

    setDemoUserData(prev => prev ? {
      ...prev,
      status: 'completed',
      karmaData: {
        transcript,
        summary: karmaDataPartial.summary,
        softSkills: karmaDataPartial.softSkills,
        primaryValues: karmaDataPartial.primaryValues,
        riskFactors: karmaDataPartial.riskFactors,
        seniorityAssessment: karmaDataPartial.seniorityAssessment,
      },
    } : null);

    setView({ type: 'DEMO_USER_RESULT' });
  };

  // Demo: Climate test completion (local state only)
  const handleDemoClimateComplete = (climateData: ClimateData) => {
    setDemoUserData(prev => prev ? {
      ...prev,
      climateData,
    } : null);

    // NEW FLOW: Climate -> Karma
    setView({ type: 'DEMO_USER_CHAT' });
  };

  // Loading state - wait for auth to be fully initialized
  if (authLoading || !authInitialized || view.type === 'LOADING') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-jnana-bg dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-jnana-charcoal border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-jnana-text dark:text-gray-300">Caricamento...</p>
        </div>
      </div>
    );
  }

  // Convert companies to legacy format for SuperAdmin view
  const legacyCompanies = companies.map(c => companyToLegacy(c));

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen bg-white dark:bg-gray-900 text-jnana-text dark:text-gray-100 transition-colors duration-300 font-sans">
        {currentUserData && view.type !== 'LOGIN' && view.type !== 'LANDING' && view.type !== 'LOADING' && 
          !view.type.startsWith('KARMA_') && (
          <Header
            onLogout={handleLogout}
            view={view}
            onAdminHome={() => navigate({ type: 'ADMIN_DASHBOARD' })}
            onOrgChart={() => navigate({ type: 'ADMIN_ORG_CHART' })}
            onIdentityHub={() => navigate({ type: 'ADMIN_IDENTITY_HUB' })}
            onCompanyProfile={() => navigate({ type: 'ADMIN_COMPANY_PROFILE' })}
            onSuperAdminHome={() => navigate({ type: 'SUPER_ADMIN_DASHBOARD' })}
            onJobDb={() => navigate({ type: 'SUPER_ADMIN_JOBS' })}
            onKarmaTalents={() => navigate({ type: 'SUPER_ADMIN_KARMA_TALENTS' })}
            onAnalytics={() => navigate({ type: 'SUPER_ADMIN_ANALYTICS' })}
            activeCompany={activeCompanyData || undefined}
            isSuperAdminMode={isSuperAdmin}
            onExitImpersonation={() => {
              setImpersonatedCompanyId(null);
              setActiveCompanyData(null);
              setViewHistory([]);
              setView({ type: 'SUPER_ADMIN_DASHBOARD' });
            }}
            isDark={isDark}
            toggleTheme={() => setIsDark(!isDark)}
            onBack={goBack}
            canGoBack={viewHistory.length > 0 || (isSuperAdmin && !!activeCompanyData)}
            userRole={userRole}
            onMyProfile={handleGoToMyProfile}
            hasCompanyMembership={!!membership}
          />
        )}

        <main className="animate-fade-in">
          {view.type === 'LANDING' && !user && (
            <LandingPage 
              onLoginJnana={() => navigate({ type: 'LOGIN', authMode: 'jnana' } as ViewState)}
              onLoginKarma={() => navigate({ type: 'LOGIN', authMode: 'karma' } as ViewState)}
              pendingInvite={pendingInviteData}
            />
          )}
          
          {view.type === 'LOGIN' && !user && (
            <AuthView 
              onBackToLanding={() => setView({ type: 'LANDING' })}
              initialMode={pendingInviteData ? 'jnana' : ((view as any).authMode || 'select')}
            />
          )}
          
          {view.type === 'RESET_PASSWORD' && (
            <ResetPasswordView 
              onSuccess={() => {
                window.history.pushState({}, '', '/');
                setView({ type: 'LOADING' });
              }} 
            />
          )}
          
          {view.type === 'SEED_DATA' && <SeedDataView />}

          {/* SUPER ADMIN VIEWS - Only for super admins */}
          {view.type === 'SUPER_ADMIN_DASHBOARD' && superAdminDataLoading && canAccessSuperAdminViews && (
            <div className="p-8 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-jnana-text dark:text-gray-300">Caricamento aziende...</p>
            </div>
          )}

          {view.type === 'SUPER_ADMIN_DASHBOARD' && !superAdminDataLoading && canAccessSuperAdminViews && (
            <SuperAdminDashboard
              companies={legacyCompanies}
              users={companyUsers}
              onImpersonate={handleImpersonate}
              onCreateCompany={handleCreateCompany}
              onStartDemoMode={handleStartDemoMode}
            />
          )}

          {view.type === 'SUPER_ADMIN_KARMA_TALENTS' && canAccessSuperAdminViews && (
            <KarmaTalentsView
              onViewProfile={(userId) => navigate({ type: 'SUPER_ADMIN_KARMA_PROFILE', userId })}
            />
          )}

          {view.type === 'SUPER_ADMIN_KARMA_PROFILE' && canAccessSuperAdminViews && (
            <KarmaProfileDetailView
              userId={view.userId}
              onBack={() => navigate({ type: 'SUPER_ADMIN_KARMA_TALENTS' })}
            />
          )}

          {view.type === 'SUPER_ADMIN_JOBS' && canAccessSuperAdminViews && (
            <JobDatabaseEditor
              jobDb={jobDb}
              onUpdateJobDb={(newDb) => {
                setJobDb(newDb);
                saveJobDb(newDb);
              }}
            />
          )}

          {view.type === 'SUPER_ADMIN_ANALYTICS' && canAccessSuperAdminViews && (
            <SuperAdminAnalyticsView />
          )}

          {view.type === 'SUPER_ADMIN_KARMA_AI_CONFIG' && canAccessSuperAdminViews && (
            <KarmaAIConfigView onBack={() => navigate({ type: 'SUPER_ADMIN_DASHBOARD' })} />
          )}

          {/* ADMIN VIEWS - Only for company admins and super admins */}
          {view.type === 'ADMIN_DASHBOARD' && activeCompanyData && canAccessAdminViews && (
            <AdminDashboardView
              activeCompany={activeCompanyData}
              users={companyUsers}
              onUpdateUsers={(updatedUsers) => setCompanyUsers(updatedUsers)}
              setView={navigate}
              currentUserId={user?.id}
              onRefreshUsers={async () => {
                if (activeCompanyData) {
                  const users = await loadCompanyUsersWithDetails(activeCompanyData.id);
                  setCompanyUsers(users);
                }
              }}
            />
          )}

          {view.type === 'ADMIN_ORG_CHART' && activeCompanyData && canAccessAdminViews && (
            <CompanyOrgView
              company={activeCompanyData}
              users={companyUsers}
              onUpdateStructure={handleOrgChartUpdate}
              onUpdateUsers={(updatedUsers) => setCompanyUsers(updatedUsers)}
              onViewUser={(userId) => navigate({ type: 'USER_RESULT', userId })}
            />
          )}

          {view.type === 'ADMIN_IDENTITY_HUB' && activeCompanyData && canAccessAdminViews && (
            <AdminIdentityHub company={activeCompanyData} users={companyUsers} />
          )}

          {view.type === 'ADMIN_COMPANY_PROFILE' && activeCompanyData && canAccessAdminViews && (
            <AdminCompanyProfileView
              company={activeCompanyData}
              onUpdate={handleCompanyUpdate}
            />
          )}

          {view.type === 'ADMIN_OPEN_POSITIONS' && activeCompanyData && canAccessAdminViews && (
            <OpenPositionsView
              company={activeCompanyData}
              users={companyUsers}
              onBack={() => navigate({ type: 'ADMIN_DASHBOARD' })}
              onFindCandidates={(positionId) => navigate({ type: 'ADMIN_POSITION_MATCHING', positionId })}
              onEditPosition={() => navigate({ type: 'ADMIN_ORG_CHART' })}
            />
          )}

          {view.type === 'ADMIN_POSITION_MATCHING' && activeCompanyData && canAccessAdminViews && (
            <PositionMatchingView
              positionId={view.positionId}
              company={activeCompanyData}
              companyUsers={companyUsers}
              onBack={() => navigate({ type: 'ADMIN_OPEN_POSITIONS' })}
              onViewCandidate={(userId) => navigate({ type: 'KARMA_PROFILE_VIEW', userId })}
              onAssignInternal={async (slotId, userId) => {
                // Assign internal candidate to position
                const { assignUserToSlot } = await import('./src/hooks/useCompanyMembers').then(m => ({ assignUserToSlot: m.useCompanyMembers().assignUserToSlot }));
                // Find the slot member by position id
                const result = await supabase
                  .from('company_members')
                  .update({ user_id: userId, is_hiring: false })
                  .eq('id', slotId);
                
                if (result.error) {
                  toast({ title: 'Errore', description: 'Impossibile assegnare il candidato', variant: 'destructive' });
                } else {
                  toast({ title: 'Successo', description: 'Candidato assegnato con successo!' });
                  // Reload company data
                  loadCompanyData(activeCompanyData.id);
                }
              }}
            />
          )}


          {view.type === 'USER_WELCOME' && currentUserData && (
            <UserWelcomeView
              user={currentUserData}
              onStart={() => navigate({ type: 'USER_TEST', userId: currentUserData.id })}
            />
          )}

          {view.type === 'USER_TEST' && currentUserData && (
            <UserTestView user={currentUserData} onComplete={handleTestComplete} />
          )}

          {view.type === 'USER_CHAT' && currentUserData && (
            <KarmaChatView user={currentUserData} onComplete={handleKarmaComplete} />
          )}

          {view.type === 'USER_CLIMATE_TEST' && currentUserData && (
            <ClimateTestView user={currentUserData} onComplete={handleClimateComplete} />
          )}

          {view.type === 'USER_RESULT' && (() => {
            const targetUserId = view.userId;
            const isViewingOwnProfile = currentUserData?.id === targetUserId;
            const userToShow = isViewingOwnProfile 
              ? currentUserData 
              : companyUsers.find(u => u.id === targetUserId);
            
            if (!userToShow) return null;
            
            return (
              <UserResultView
                user={userToShow}
                jobDb={jobDb}
                onLogout={handleLogout}
                onStartClimate={() => navigate({ type: 'USER_CLIMATE_TEST', userId: targetUserId })}
                onStartKarma={() => navigate({ type: 'USER_CHAT', userId: targetUserId })}
                company={activeCompanyData || undefined}
                companyUsers={companyUsers}
                isReadOnly={!isViewingOwnProfile}
                onClose={() => navigate({ type: 'ADMIN_DASHBOARD' })}
              />
            );
          })()}

          {/* ===== KARMA PLATFORM VIEWS ===== */}
          {view.type === 'KARMA_ONBOARDING' && (
            <KarmaOnboarding
              onComplete={() => setView({ type: 'KARMA_DASHBOARD' })}
              onSkip={() => setView({ type: 'KARMA_DASHBOARD' })}
            />
          )}

          {view.type === 'KARMA_DASHBOARD' && (
            <KarmaDashboard
              onEditProfile={() => navigate({ type: 'KARMA_PROFILE_EDIT' })}
              onStartTest={() => navigate({ type: 'KARMA_TEST_RIASEC' })}
              onViewResults={() => navigate({ type: 'KARMA_RESULTS' })}
              onLogout={handleLogout}
              onGoHome={() => setView({ type: 'KARMA_DASHBOARD' })}
            />
          )}

          {view.type === 'KARMA_PROFILE_EDIT' && (
            <KarmaProfileEdit
              onBack={() => setView({ type: 'KARMA_DASHBOARD' })}
              onSave={() => setView({ type: 'KARMA_DASHBOARD' })}
            />
          )}

          {view.type === 'KARMA_RESULTS' && (
            <KarmaResults
              onBack={() => setView({ type: 'KARMA_DASHBOARD' })}
              onEditProfile={() => navigate({ type: 'KARMA_PROFILE_EDIT' })}
            />
          )}

          {view.type === 'KARMA_TEST_RIASEC' && (
            <KarmaTestRiasec
              onComplete={async (score) => {
                // Save RIASEC result to DB
                if (user) {
                  const profileCode = calculateProfileCode(score);
                  await saveRiasecResult(user.id, null, score, profileCode);
                  
                  // Update local state
                  setCurrentUserData(prev => prev ? {
                    ...prev,
                    results: score,
                    profileCode,
                    submissionDate: new Date().toISOString().split('T')[0],
                  } : null);
                }
                setView({ type: 'KARMA_TEST_CHAT' });
              }}
              onBack={() => setView({ type: 'KARMA_DASHBOARD' })}
            />
          )}

          {view.type === 'KARMA_TEST_CHAT' && currentUserData?.results && currentUserData?.profileCode && (
            <KarmaTestChat
              riasecScore={currentUserData.results}
              profileCode={currentUserData.profileCode}
              firstName={currentUserData.firstName || ''}
              onComplete={async (transcript) => {
                // Call AI analysis
                let karmaDataPartial: any = {};
                try {
                  const { data, error } = await supabase.functions.invoke('karma-analyze', {
                    body: { transcript: transcript.map(m => ({ role: m.role, text: m.text })) }
                  });
                  if (!error && data) karmaDataPartial = data;
                } catch (e) {
                  console.error('Error calling karma-analyze:', e);
                }

                // Save to database
                if (user) {
                  await saveKarmaSession(user.id, null, transcript, {
                    summary: karmaDataPartial.summary,
                    softSkills: karmaDataPartial.softSkills,
                    primaryValues: karmaDataPartial.primaryValues,
                    riskFactors: karmaDataPartial.riskFactors,
                    seniorityAssessment: karmaDataPartial.seniorityAssessment,
                  });
                }

                // Update local state
                setCurrentUserData(prev => prev ? {
                  ...prev,
                  karmaData: {
                    transcript,
                    ...karmaDataPartial,
                  },
                } : null);

                setView({ type: 'KARMA_RESULTS' });
              }}
              onBack={() => setView({ type: 'KARMA_DASHBOARD' })}
            />
          )}

          {view.type === 'KARMA_PROFILE_VIEW' && canAccessAdminViews && (
            <KarmaProfileDetailView
              userId={view.userId}
              onBack={goBack}
            />
          )}

          {/* ===== DEMO MODE VIEWS ===== */}
          {isDemoMode && demoUserData && (
            <>
              <DemoBanner onExit={handleExitDemoMode} />
              <div className="pt-14"> {/* Offset for fixed banner */}
                {view.type === 'DEMO_USER_WELCOME' && (
                  <UserWelcomeView
                    user={demoUserData}
                    onStart={() => setView({ type: 'DEMO_USER_TEST' })}
                  />
                )}

                {view.type === 'DEMO_USER_TEST' && (
                  <UserTestView
                    user={demoUserData}
                    onComplete={handleDemoTestComplete}
                  />
                )}

                {view.type === 'DEMO_USER_CHAT' && (
                  <KarmaChatView
                    user={demoUserData}
                    onComplete={handleDemoKarmaComplete}
                  />
                )}

                {view.type === 'DEMO_USER_CLIMATE' && (
                  <ClimateTestView
                    user={demoUserData}
                    onComplete={handleDemoClimateComplete}
                  />
                )}

                {view.type === 'DEMO_USER_RESULT' && (
                  <UserResultView
                    user={demoUserData}
                    jobDb={jobDb}
                    onLogout={handleExitDemoMode}
                    onStartClimate={() => setView({ type: 'DEMO_USER_CLIMATE' })}
                    company={activeCompanyData || undefined}
                    companyUsers={[]}
                  />
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

// --- APP WITH AUTH PROVIDER ---
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  );
};

export default App;
