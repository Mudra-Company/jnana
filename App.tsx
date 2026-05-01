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
import { useViewRouter } from './src/router/useViewRouter';
import { pathToView } from './src/router/viewPathMap';
import { AppDataProvider, type AppDataValue } from './src/app/AppDataContext';

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
import { QuestionnaireListView } from './views/superadmin/QuestionnaireListView';
import { QuestionnaireEditorView } from './views/superadmin/QuestionnaireEditorView';
import { AdminDashboardView } from './views/admin/AdminDashboard';
import { OpenPositionsView } from './views/admin/OpenPositionsView';
import { PositionMatchingView } from './views/admin/PositionMatchingView';
import { ComplianceDashboardView } from './views/admin/ComplianceDashboardView';
import { SpaceSyncView } from './views/admin/SpaceSyncView';

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
import { KarmaWelcome } from './views/karma/KarmaWelcome';
import { CVReviewScreen } from './views/karma/CVReviewScreen';
import { PostOnboardingPromo } from './views/karma/PostOnboardingPromo';
import type { CVParsedData } from './src/components/karma/CVImportBanner';

// Landing Page
import { LandingPage } from './views/landing/LandingPage';

// Adapters extracted to src/app/adapters.ts (Phase 3 of routing refactor)
import { profileToLegacyUser, companyToLegacy } from './src/app/adapters';
// Pure data loaders extracted to src/app/dataLoaders.ts (Phase 3 / Step 2)
import {
  loadAllCompanies,
  loadAllUsersForSuperAdmin as fetchAllUsersForSuperAdmin,
  loadCompanyUsersWithDetails as fetchCompanyUsersWithDetails,
} from './src/app/dataLoaders';

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
      return { type: 'LOGIN' };
    }
    // Try to recover the view from the current URL (deep link / refresh).
    // If no match → LOADING (auth bootstrap will pick the right destination).
    const fromUrl = pathToView(window.location.pathname, window.location.search);
    if (fromUrl) return fromUrl;
    return { type: 'LOADING' }; // Start with LOADING, not LOGIN
  });

  // Mirror view ↔ URL (real router URLs, back/forward, deep links, refresh).
  useViewRouter(view, setView);

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
  
  // CV Onboarding State
  const [cvParsedData, setCvParsedData] = useState<CVParsedData | null>(null);
  
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
    const data = await loadAllCompanies();
    if (data.length > 0) setCompanies(data);
  };

  // Load all users for Super Admin dashboard
  const loadAllUsersForSuperAdmin = async () => {
    const users = await fetchAllUsersForSuperAdmin();
    setCompanyUsers(users);
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
      if (authIntent === 'karma') {
        // User explicitly logged in via KARMA portal
        console.log('[App] Routing to KARMA based on intent');
        localStorage.removeItem('auth_intent'); // Clear after use
        if (userData.is_karma_profile) {
          // User has completed onboarding
          setView({ type: 'KARMA_DASHBOARD' });
        } else {
          // NEW: Show welcome screen for new Karma users
          setView({ type: 'KARMA_WELCOME' });
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
        if (userData.is_karma_profile) {
          // User has completed onboarding
          setView({ type: 'KARMA_DASHBOARD' });
        } else {
          // NEW: Show welcome screen for new Karma users
          setView({ type: 'KARMA_WELCOME' });
        }
      } else if (userData.membership?.status === 'completed') {
        setView({ type: 'USER_RESULT', userId: user.id });
      } else {
        setView({ type: 'USER_WELCOME', userId: user.id });
      }
    }
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
      const users = await fetchCompanyUsersWithDetails(companyId);
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

  // Build the context value exposing all state + handlers to descendants.
  // This anticipates Phase 5: future route components will read via useAppData()
  // instead of receiving everything as props from this god-component.
  const appDataValue: AppDataValue = {
    user, profile, membership,
    isSuperAdmin, isCompanyAdmin, userRole,
    canAccessAdminViews, canAccessSuperAdminViews,
    view, setView, navigate, goBack, viewHistory,
    currentUserData, setCurrentUserData,
    companyUsers, setCompanyUsers,
    activeCompanyData, setActiveCompanyData,
    companies, legacyCompanies,
    jobDb, setJobDb,
    isDark, toggleTheme: () => setIsDark(d => !d),
    superAdminDataLoading, impersonatedCompanyId,
    loadCompanyData, handleImpersonate,
    handleExitImpersonation: () => {
      setImpersonatedCompanyId(null);
      setActiveCompanyData(null);
      setViewHistory([]);
      setView({ type: 'SUPER_ADMIN_DASHBOARD' });
    },
    handleCreateCompany,
    isDemoMode, demoUserData,
    handleStartDemoMode, handleExitDemoMode,
    handleDemoTestComplete, handleDemoKarmaComplete, handleDemoClimateComplete,
    handleLogout, handleTestComplete, handleKarmaComplete,
    handleClimateComplete, handleOrgChartUpdate, handleCompanyUpdate,
    handleGoToMyProfile,
    pendingInviteData,
    cvParsedData, setCvParsedData,
  };

  return (
    <AppDataProvider value={appDataValue}><div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen bg-white dark:bg-gray-900 text-jnana-text dark:text-gray-100 transition-colors duration-300 font-sans">
        {currentUserData && view.type !== 'LOGIN' && view.type !== 'LANDING' && 
          !view.type.startsWith('KARMA_') && (
          <Header
            onLogout={handleLogout}
            view={view}
            onAdminHome={() => navigate({ type: 'ADMIN_DASHBOARD' })}
            onOrgChart={() => navigate({ type: 'ADMIN_ORG_CHART' })}
            onIdentityHub={() => navigate({ type: 'ADMIN_IDENTITY_HUB' })}
            onCompanyProfile={() => navigate({ type: 'ADMIN_COMPANY_PROFILE' })}
            onCompliance={() => navigate({ type: 'ADMIN_COMPLIANCE' })}
            onSpaceSync={() => navigate({ type: 'ADMIN_SPACESYNC' })}
            onSuperAdminHome={() => navigate({ type: 'SUPER_ADMIN_DASHBOARD' })}
            onJobDb={() => navigate({ type: 'SUPER_ADMIN_JOBS' })}
            onKarmaTalents={() => navigate({ type: 'SUPER_ADMIN_KARMA_TALENTS' })}
            onAnalytics={() => navigate({ type: 'SUPER_ADMIN_ANALYTICS' })}
            onKarmaAIConfig={() => navigate({ type: 'SUPER_ADMIN_KARMA_AI_CONFIG' })}
            onQuestionnaires={() => navigate({ type: 'SUPER_ADMIN_QUESTIONNAIRES' })}
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

          {view.type === 'SUPER_ADMIN_QUESTIONNAIRES' && canAccessSuperAdminViews && (
            <QuestionnaireListView
              onBack={() => navigate({ type: 'SUPER_ADMIN_DASHBOARD' })}
              onEdit={(id) => navigate({ type: 'SUPER_ADMIN_QUESTIONNAIRE_EDIT', questionnaireId: id })}
            />
          )}

          {view.type === 'SUPER_ADMIN_QUESTIONNAIRE_EDIT' && canAccessSuperAdminViews && (
            <QuestionnaireEditorView
              questionnaireId={view.questionnaireId}
              onBack={() => navigate({ type: 'SUPER_ADMIN_QUESTIONNAIRES' })}
            />
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
                  const users = await fetchCompanyUsersWithDetails(activeCompanyData.id);
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
              onViewExternalCandidate={(userId) => navigate({ type: 'KARMA_PROFILE_VIEW', userId })}
              onOpenPositionMatching={(positionId, initialTab) => navigate({ type: 'ADMIN_POSITION_MATCHING', positionId, initialTab })}
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
                // The slotId can refer either to a modern company_roles row or a legacy
                // company_members row. Detect which and assign accordingly.
                const { data: roleRow } = await supabase
                  .from('company_roles')
                  .select('id, company_id')
                  .eq('id', slotId)
                  .maybeSingle();

                let opError: { message: string } | null = null;

                if (roleRow) {
                  // Modern path: resolve user → company_member, then create assignment + clear is_hiring
                  const { data: memberRow, error: memberLookupErr } = await supabase
                    .from('company_members')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('company_id', (roleRow as any).company_id)
                    .maybeSingle();

                  if (memberLookupErr || !memberRow) {
                    opError = { message: memberLookupErr?.message || 'Membro azienda non trovato' };
                  } else {
                    const { error: assignErr } = await supabase
                      .from('company_role_assignments')
                      .insert({
                        role_id: slotId,
                        company_member_id: (memberRow as any).id,
                        user_id: userId,
                        assignment_type: 'primary' as const,
                      });
                    if (assignErr) {
                      opError = { message: assignErr.message };
                    } else {
                      const { error: updErr } = await supabase
                        .from('company_roles')
                        .update({ is_hiring: false, status: 'active' })
                        .eq('id', slotId);
                      if (updErr) opError = { message: updErr.message };
                    }
                  }
                } else {
                  // Legacy path: company_members slot
                  const { error } = await supabase
                    .from('company_members')
                    .update({ user_id: userId, is_hiring: false })
                    .eq('id', slotId);
                  if (error) opError = { message: error.message };
                }

                if (opError) {
                  toast({ title: 'Errore', description: opError.message || 'Impossibile assegnare il candidato', variant: 'destructive' });
                } else {
                  toast({ title: 'Successo', description: 'Candidato assegnato con successo!' });
                  loadCompanyData(activeCompanyData.id);
                }
              }}
            />
          )}

          {view.type === 'ADMIN_COMPLIANCE' && activeCompanyData && canAccessAdminViews && (
            <ComplianceDashboardView
              companyId={activeCompanyData.id}
              companyName={activeCompanyData.name}
            />
          )}

          {view.type === 'ADMIN_SPACESYNC' && activeCompanyData && canAccessAdminViews && (
            <SpaceSyncView
              company={activeCompanyData}
              companyUsers={companyUsers}
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
            <KarmaChatView 
              user={currentUserData} 
              onComplete={handleKarmaComplete}
              orgStructure={activeCompanyData?.structure}
              allUsers={companyUsers}
            />
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
          
          {/* NEW: Welcome Screen for new Karma users */}
          {view.type === 'KARMA_WELCOME' && (
            <KarmaWelcome
              userName={profile?.first_name || undefined}
              onChooseCV={() => {}}
              onChooseManual={() => setView({ type: 'KARMA_ONBOARDING' })}
              onCVParsed={(data) => {
                setCvParsedData(data);
                setView({ type: 'KARMA_CV_REVIEW' });
              }}
            />
          )}

          {/* NEW: CV Review Screen */}
          {view.type === 'KARMA_CV_REVIEW' && cvParsedData && (
            <CVReviewScreen
              parsedData={cvParsedData}
              onConfirm={async (selectedData) => {
                // Import selected data using useKarmaProfile
                const { supabase } = await import('./src/integrations/supabase/client');
                const userId = user?.id;
                if (!userId) return;
                
                // Update profile data
                if (selectedData.profileData) {
                  await supabase.from('profiles').update({
                    first_name: selectedData.profileData.firstName,
                    last_name: selectedData.profileData.lastName,
                    headline: selectedData.profileData.headline,
                    bio: selectedData.profileData.bio,
                    location: selectedData.profileData.location,
                    years_experience: selectedData.profileData.yearsExperience,
                    is_karma_profile: true,
                    wants_karma_visibility: true, // Default ON
                    profile_visibility: 'subscribers_only',
                  }).eq('id', userId);
                }
                
                // Import experiences
                if (selectedData.experiences.length > 0) {
                  const expRows = selectedData.experiences.map((exp, idx) => ({
                    user_id: userId,
                    company: exp.company,
                    role: exp.role,
                    start_date: exp.startDate,
                    end_date: exp.endDate,
                    is_current: exp.isCurrent,
                    description: exp.description,
                    sort_order: idx,
                  }));
                  await supabase.from('user_experiences').insert(expRows);
                }
                
                // Import education
                if (selectedData.education.length > 0) {
                  const eduRows = selectedData.education.map((edu, idx) => ({
                    user_id: userId,
                    institution: edu.institution,
                    degree: edu.degree,
                    field_of_study: edu.fieldOfStudy,
                    end_year: edu.endYear,
                    sort_order: idx,
                  }));
                  await supabase.from('user_education').insert(eduRows);
                }
                
                // Import certifications
                if (selectedData.certifications.length > 0) {
                  const certRows = selectedData.certifications.map(cert => ({
                    user_id: userId,
                    name: cert.name,
                  }));
                  await supabase.from('user_certifications').insert(certRows);
                }
                
                // Import languages
                if (selectedData.languages.length > 0) {
                  const langRows = selectedData.languages.map(lang => ({
                    user_id: userId,
                    language: lang.language,
                    proficiency: lang.proficiency || 'professional',
                  }));
                  await supabase.from('user_languages').insert(langRows);
                }
                
                // Import skills
                if (selectedData.skills.length > 0) {
                  const skillRows = selectedData.skills.map(skill => ({
                    user_id: userId,
                    custom_skill_name: skill,
                    proficiency_level: 3,
                  }));
                  await supabase.from('user_hard_skills').insert(skillRows);
                }
                
                setCvParsedData(null);
                setView({ type: 'KARMA_POST_ONBOARDING' });
              }}
              onBack={() => {
                setCvParsedData(null);
                setView({ type: 'KARMA_WELCOME' });
              }}
            />
          )}

          {/* NEW: Post-Onboarding Promo Screen */}
          {view.type === 'KARMA_POST_ONBOARDING' && (
            <PostOnboardingPromo
              onStartRiasec={() => setView({ type: 'KARMA_TEST_RIASEC' })}
              onSkip={() => setView({ type: 'KARMA_DASHBOARD' })}
            />
          )}

          {view.type === 'KARMA_ONBOARDING' && (
            <KarmaOnboarding
              onComplete={() => setView({ type: 'KARMA_POST_ONBOARDING' })}
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

                {view.type === 'DEMO_USER_CHAT' && demoUserData && (
                  <KarmaChatView
                    user={demoUserData}
                    onComplete={handleDemoKarmaComplete}
                    orgStructure={activeCompanyData?.structure}
                    allUsers={companyUsers}
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
    </AppDataProvider>
  );
};

// --- APP WITH AUTH PROVIDER ---
// AuthProvider is now mounted in index.tsx so Vite Fast Refresh keeps the
// provider and consumers in sync when src/hooks/useAuth.tsx is hot-updated.
const App: React.FC = () => {
  return (
    <>
      <AppContent />
      <Toaster />
    </>
  );
};

export default App;

