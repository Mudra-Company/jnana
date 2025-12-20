import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import { useCompanies } from './src/hooks/useCompanies';
import { useProfiles } from './src/hooks/useProfiles';
import { useTestResults } from './src/hooks/useTestResults';
import { ViewState, RiasecScore, JobDatabase, OrgNode, ChatMessage, ClimateData, CompanyProfile, User } from './types';
import { calculateProfileCode } from './services/riasecService';
import { supabase } from './src/integrations/supabase/client';
import { loadJobDb, saveJobDb } from './services/storageService';

// Imported Views & Components
import { Header } from './components/layout/Header';
import { AuthView } from './src/views/auth/AuthView';
import { SuperAdminDashboard } from './views/superadmin/SuperAdminDashboard';
import { JobDatabaseEditor } from './views/superadmin/JobDatabaseEditor';
import { AdminDashboardView } from './views/admin/AdminDashboard';
import { CompanyOrgView } from './views/admin/CompanyOrgView';
import { AdminIdentityHub } from './views/admin/AdminIdentityHub';
import { AdminCompanyProfileView } from './views/admin/AdminCompanyProfileView';
import { UserWelcomeView } from './views/user/UserWelcomeView';
import { UserTestView } from './views/user/UserTestView';
import { ClimateTestView } from './views/user/ClimateTestView';
import { KarmaChatView } from './views/user/KarmaChatView';
import { UserResultView } from './views/user/UserResultView';
import SeedDataView from './src/views/admin/SeedDataView';

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
    jobTitle: profile.job_title || '',
    departmentId: membership?.department_id || '',
    status: membership?.status || 'pending',
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
  const { user, profile, membership, isLoading: authLoading, isSuperAdmin, isCompanyAdmin, signOut } = useAuth();
  const { companies, setCompanies, fetchCompanyWithStructure } = useCompanies();
  const { profiles, fetchUserWithDetails } = useProfiles(membership?.company_id);
  const { saveRiasecResult, saveKarmaSession, saveClimateResponse, updateMemberStatus } = useTestResults();

  const [jobDb, setJobDb] = useState<JobDatabase>({});
  const [view, setView] = useState<ViewState>(() => {
    // Check for seed URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('seed') === 'true') {
      return { type: 'SEED_DATA' };
    }
    return { type: 'LOGIN' };
  });
  const [viewHistory, setViewHistory] = useState<ViewState[]>([]);
  const [isDark, setIsDark] = useState(false);
  const [impersonatedCompanyId, setImpersonatedCompanyId] = useState<string | null>(null);
  
  const [activeCompanyData, setActiveCompanyData] = useState<CompanyProfile | null>(null);
  const [currentUserData, setCurrentUserData] = useState<User | null>(null);
  const [companyUsers, setCompanyUsers] = useState<User[]>([]);

  // Load job database from localStorage (still used for job suggestions)
  useEffect(() => {
    setJobDb(loadJobDb());
  }, []);

  // Handle auth state changes
  useEffect(() => {
    if (!authLoading) {
      if (user && profile) {
        // User is logged in
        loadCurrentUserData();
      } else {
        // Not logged in
        setView({ type: 'LOGIN' });
        setCurrentUserData(null);
        setActiveCompanyData(null);
      }
    }
  }, [user, profile, authLoading]);

  // Load all companies for Super Admin dashboard (after authentication)
  const loadAllCompaniesForSuperAdmin = async () => {
    const { supabase } = await import('./src/integrations/supabase/client');
    
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error loading companies for super admin:', error);
      return;
    }
    
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
    if (!user || !profile) return;

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

      // Determine initial view
      if (isSuperAdmin) {
        await loadAllCompaniesForSuperAdmin(); // Load companies AFTER auth
        await loadAllUsersForSuperAdmin(); // Load all users for dashboard
        setView({ type: 'SUPER_ADMIN_DASHBOARD' });
      } else if (isCompanyAdmin && userData.membership?.company_id) {
        await loadCompanyData(userData.membership.company_id);
        setView({ type: 'ADMIN_DASHBOARD' });
      } else if (userData.membership?.status === 'completed') {
        setView({ type: 'USER_RESULT', userId: user.id });
      } else {
        setView({ type: 'USER_WELCOME', userId: user.id });
      }
    }
  };

  // Load all company users with full details (RIASEC, Karma, Climate) directly from DB
  const loadCompanyUsersWithDetails = async (companyId: string): Promise<User[]> => {
    const { supabase } = await import('./src/integrations/supabase/client');
    
    // 1. Load company_members with profiles
    const { data: members, error: membersError } = await supabase
      .from('company_members')
      .select(`
        *,
        profiles:user_id (*)
      `)
      .eq('company_id', companyId);
    
    if (membersError || !members || members.length === 0) {
      console.error('Error loading company members:', membersError);
      return [];
    }
    
    const userIds = members.map(m => m.user_id);
    
    // 2. Load RIASEC results for all users
    const { data: riasecResults } = await supabase
      .from('riasec_results')
      .select('*')
      .in('user_id', userIds);
    
    // 3. Load Karma sessions for all users
    const { data: karmaSessions } = await supabase
      .from('karma_sessions')
      .select('*')
      .in('user_id', userIds);
    
    // 4. Load Climate responses for all users
    const { data: climateResponses } = await supabase
      .from('climate_responses')
      .select('*')
      .in('user_id', userIds);
    
    // 5. Transform to legacy User format
    return members
      .filter(m => m.profiles)
      .map(member => {
        const profile = member.profiles as any;
        const riasec = riasecResults?.find(r => r.user_id === member.user_id);
        const karma = karmaSessions?.find(k => k.user_id === member.user_id);
        const climate = climateResponses?.find(c => c.user_id === member.user_id);
        
        return profileToLegacyUser(profile, member, riasec, karma, climate);
      });
  };

  const loadCompanyData = async (companyId: string) => {
    const companyWithStructure = await fetchCompanyWithStructure(companyId);
    if (companyWithStructure) {
      setActiveCompanyData(companyToLegacy(companyWithStructure, companyWithStructure.structure));
      
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
    if (viewHistory.length === 0) return;
    const previousView = viewHistory[viewHistory.length - 1];
    setViewHistory(prev => prev.slice(0, -1));
    setView(previousView);
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

    navigate({ type: 'USER_CHAT', userId: user.id });
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

    navigate({ type: 'USER_RESULT', userId: user.id });
  };

  const handleOrgChartUpdate = (newRoot: OrgNode) => {
    if (!activeCompanyData) return;
    setActiveCompanyData({ ...activeCompanyData, structure: newRoot });
  };

  // Impersonation for Super Admin
  const handleImpersonate = async (companyId: string) => {
    setImpersonatedCompanyId(companyId);
    await loadCompanyData(companyId);
    setViewHistory([]);
    setView({ type: 'ADMIN_DASHBOARD' });
  };

  // Loading state
  if (authLoading) {
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
        {currentUserData && view.type !== 'LOGIN' && (
          <Header
            onLogout={handleLogout}
            view={view}
            onAdminHome={() => navigate({ type: 'ADMIN_DASHBOARD' })}
            onOrgChart={() => navigate({ type: 'ADMIN_ORG_CHART' })}
            onIdentityHub={() => navigate({ type: 'ADMIN_IDENTITY_HUB' })}
            onCompanyProfile={() => navigate({ type: 'ADMIN_COMPANY_PROFILE' })}
            onSuperAdminHome={() => navigate({ type: 'SUPER_ADMIN_DASHBOARD' })}
            onJobDb={() => navigate({ type: 'SUPER_ADMIN_JOBS' })}
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
            canGoBack={viewHistory.length > 0}
          />
        )}

        <main className="animate-fade-in">
          {view.type === 'LOGIN' && <AuthView />}
          
          {view.type === 'SEED_DATA' && <SeedDataView />}

          {view.type === 'SUPER_ADMIN_DASHBOARD' && (
            <SuperAdminDashboard
              companies={legacyCompanies}
              users={companyUsers}
              onImpersonate={handleImpersonate}
            />
          )}

          {view.type === 'SUPER_ADMIN_JOBS' && (
            <JobDatabaseEditor
              jobDb={jobDb}
              onUpdateJobDb={(newDb) => {
                setJobDb(newDb);
                saveJobDb(newDb);
              }}
            />
          )}

          {view.type === 'ADMIN_DASHBOARD' && activeCompanyData && (
            <AdminDashboardView
              activeCompany={activeCompanyData}
              users={companyUsers}
              onUpdateUsers={(updatedUsers) => setCompanyUsers(updatedUsers)}
              setView={navigate}
            />
          )}

          {view.type === 'ADMIN_ORG_CHART' && activeCompanyData && (
            <CompanyOrgView
              company={activeCompanyData}
              users={companyUsers}
              onUpdateStructure={handleOrgChartUpdate}
              onUpdateUsers={(updatedUsers) => setCompanyUsers(updatedUsers)}
              onViewUser={(userId) => navigate({ type: 'USER_RESULT', userId })}
            />
          )}

          {view.type === 'ADMIN_IDENTITY_HUB' && activeCompanyData && (
            <AdminIdentityHub company={activeCompanyData} users={companyUsers} />
          )}

          {view.type === 'ADMIN_COMPANY_PROFILE' && activeCompanyData && (
            <AdminCompanyProfileView
              company={activeCompanyData}
              onUpdate={(updatedCompany) => setActiveCompanyData(updatedCompany)}
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

          {view.type === 'USER_RESULT' && currentUserData && (
            <UserResultView
              user={currentUserData}
              jobDb={jobDb}
              onLogout={handleLogout}
              onStartClimate={() => navigate({ type: 'USER_CLIMATE_TEST', userId: currentUserData.id })}
              company={activeCompanyData || undefined}
              companyUsers={companyUsers}
            />
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
    </AuthProvider>
  );
};

export default App;
