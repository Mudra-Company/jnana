import React, { useState, useEffect, useMemo } from 'react';
import { ViewState, User, RiasecScore, JobDatabase, CompanyProfile, OrgNode, ChatMessage, ClimateData } from './types';
import { calculateProfileCode, analyzeKarmaTranscript } from './services/riasecService';
import { loadUsers, loadCompanies, loadJobDb, saveUsers, saveCompanies, saveJobDb } from './services/storageService';

// Imported Views & Components
import { Header } from './components/layout/Header';
import { LoginView } from './views/auth/LoginView';
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

// --- APP COMPONENT ---

const App: React.FC = () => {
  // --- STATE ---
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [jobDb, setJobDb] = useState<JobDatabase>({});
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>({ type: 'LOGIN' });
  const [viewHistory, setViewHistory] = useState<ViewState[]>([]); // History stack
  const [isDark, setIsDark] = useState(false);
  
  // Super Admin impersonation logic
  const [isSuperAdminMode, setIsSuperAdminMode] = useState(false);
  const [impersonatedCompanyId, setImpersonatedCompanyId] = useState<string | null>(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    // Load data from localStorage or mocks
    setUsers(loadUsers());
    setCompanies(loadCompanies());
    setJobDb(loadJobDb());
    
    // Default is Light Mode. We removed the auto-detection of system preference.
  }, []);

  // Persist data when changed
  useEffect(() => { if (users.length > 0) saveUsers(users); }, [users]);
  useEffect(() => { if (companies.length > 0) saveCompanies(companies); }, [companies]);
  useEffect(() => { if (Object.keys(jobDb).length > 0) saveJobDb(jobDb); }, [jobDb]);

  // --- NAVIGATION ---

  const navigate = (newView: ViewState) => {
    // Prevent pushing duplicate views if we navigate to the exact same place (optional optimization)
    // For now, keep it simple.
    setViewHistory(prev => [...prev, view]);
    setView(newView);
  };

  const goBack = () => {
    if (viewHistory.length === 0) return;
    const previousView = viewHistory[viewHistory.length - 1];
    setViewHistory(prev => prev.slice(0, -1));
    setView(previousView);
  };

  // --- ACTIONS ---

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setViewHistory([]); // Clear history on login
    if (user.email === 'admin@acme.com' || user.email.includes('admin')) { // Simple check for demo
        setView({ type: 'ADMIN_DASHBOARD' });
    } else if (user.status === 'completed') {
        setView({ type: 'USER_RESULT', userId: user.id });
    } else {
        setView({ type: 'USER_WELCOME', userId: user.id });
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsSuperAdminMode(false);
    setImpersonatedCompanyId(null);
    setViewHistory([]); // Clear history
    setView({ type: 'LOGIN' });
  };

  const activeCompany = useMemo(() => {
    const compId = isSuperAdminMode && impersonatedCompanyId ? impersonatedCompanyId : currentUser?.companyId;
    return companies.find(c => c.id === compId);
  }, [currentUser, companies, isSuperAdminMode, impersonatedCompanyId]);

  const handleOrgChartUpdate = (newRoot: OrgNode) => {
      if (!activeCompany) return;
      const updatedCompany = { ...activeCompany, structure: newRoot };
      setCompanies(prev => prev.map(c => c.id === activeCompany.id ? updatedCompany : c));
  };

  const handleTestComplete = (score: RiasecScore) => {
      if (!currentUser) return;
      const profileCode = calculateProfileCode(score);
      
      const updatedUser: User = {
          ...currentUser,
          status: 'test_completed', // Intermediate status, goes to Karma Chat next
          results: score,
          profileCode,
          submissionDate: new Date().toISOString().split('T')[0]
      };
      
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
      setCurrentUser(updatedUser);
      navigate({ type: 'USER_CHAT', userId: updatedUser.id }); // Go to Room 2
  };

  const handleKarmaComplete = async (transcript: ChatMessage[]) => {
      if (!currentUser) return;
      
      // Analyze transcript
      const karmaDataPartial = await analyzeKarmaTranscript(transcript);
      
      const updatedUser: User = {
          ...currentUser,
          status: 'completed',
          karmaData: {
              transcript: transcript,
              ...karmaDataPartial
          }
      };
      
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
      setCurrentUser(updatedUser);
      navigate({ type: 'USER_RESULT', userId: updatedUser.id });
  };

  const handleClimateComplete = (climateData: ClimateData) => {
      // Determine which user is being updated based on the current view context
      // This supports Admin impersonation/editing as well as User self-testing
      let targetUserId = currentUser?.id;
      if (view.type === 'USER_CLIMATE_TEST' && view.userId) {
          targetUserId = view.userId;
      }

      if (!targetUserId) return;

      const targetUser = users.find(u => u.id === targetUserId);
      if (!targetUser) return;

      const updatedUser: User = {
          ...targetUser,
          climateData: climateData
      };

      setUsers(prev => prev.map(u => u.id === targetUserId ? updatedUser : u));
      
      // If the currently logged-in user is the one taking the test, update local state
      if (currentUser?.id === targetUserId) {
          setCurrentUser(updatedUser);
      }

      navigate({ type: 'USER_RESULT', userId: targetUserId });
  };

  // Helper to get target user company data for the result view
  const getTargetUserContext = (userId: string) => {
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) return {};
      const company = companies.find(c => c.id === targetUser.companyId);
      const companyUsers = users.filter(u => u.companyId === targetUser.companyId);
      return { company, companyUsers };
  }

  return (
    <div className={isDark ? 'dark' : ''}>
       <div className="min-h-screen bg-white dark:bg-gray-900 text-jnana-text dark:text-gray-100 transition-colors duration-300 font-sans">
          {currentUser && (
              <Header 
                  onLogout={handleLogout} 
                  view={view}
                  onAdminHome={() => navigate({ type: 'ADMIN_DASHBOARD' })}
                  onOrgChart={() => navigate({ type: 'ADMIN_ORG_CHART' })}
                  onIdentityHub={() => navigate({ type: 'ADMIN_IDENTITY_HUB' })}
                  onCompanyProfile={() => navigate({ type: 'ADMIN_COMPANY_PROFILE' })}
                  onSuperAdminHome={() => navigate({ type: 'SUPER_ADMIN_DASHBOARD' })}
                  onJobDb={() => navigate({ type: 'SUPER_ADMIN_JOBS' })}
                  activeCompany={activeCompany}
                  isSuperAdminMode={isSuperAdminMode}
                  onExitImpersonation={() => { 
                      setIsSuperAdminMode(true); 
                      setImpersonatedCompanyId(null); 
                      setViewHistory([]); // Reset history when exiting impersonation
                      setView({ type: 'SUPER_ADMIN_DASHBOARD' }); 
                  }}
                  isDark={isDark}
                  toggleTheme={() => setIsDark(!isDark)}
                  onBack={goBack}
                  canGoBack={viewHistory.length > 0}
              />
          )}
          
          <main className="animate-fade-in">
             {view.type === 'LOGIN' && (
               <LoginView 
                 users={users} 
                 onLogin={handleLogin} 
                 onAdminLogin={() => { 
                   setIsSuperAdminMode(true); 
                   setViewHistory([]);
                   setView({ type: 'SUPER_ADMIN_DASHBOARD' }); 
                   setCurrentUser({ id: 'sa', firstName: 'Super', lastName: 'Admin', email: 'root@jnana.com', companyId: '', status: 'completed' }); 
                 }}
               />
             )}
             
             {view.type === 'SUPER_ADMIN_DASHBOARD' && (
               <SuperAdminDashboard 
                 companies={companies} 
                 users={users} 
                 onImpersonate={(id) => { 
                     setImpersonatedCompanyId(id); 
                     setViewHistory([]); // Clear history when entering new tenant
                     setView({ type: 'ADMIN_DASHBOARD' }); 
                 }}
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
             
             {view.type === 'ADMIN_DASHBOARD' && activeCompany && (
                 <AdminDashboardView 
                    activeCompany={activeCompany} 
                    users={users} 
                    onUpdateUsers={(updatedUsers) => {
                        setUsers(updatedUsers);
                        saveUsers(updatedUsers);
                    }}
                    setView={navigate}
                 />
             )}
             
             {view.type === 'ADMIN_ORG_CHART' && activeCompany && (
                 <CompanyOrgView 
                    company={activeCompany} 
                    users={users} 
                    onUpdateStructure={handleOrgChartUpdate}
                    onUpdateUsers={(updatedUsers) => {
                        setUsers(updatedUsers);
                        saveUsers(updatedUsers);
                    }}
                    onViewUser={(userId) => navigate({ type: 'USER_RESULT', userId })}
                 />
             )}
             
             {view.type === 'ADMIN_IDENTITY_HUB' && activeCompany && (
               <AdminIdentityHub company={activeCompany} users={users} />
             )}
             
             {view.type === 'ADMIN_COMPANY_PROFILE' && activeCompany && (
                 <AdminCompanyProfileView 
                    company={activeCompany} 
                    onUpdate={(updatedCompany) => {
                        const newCompanies = companies.map(c => c.id === updatedCompany.id ? updatedCompany : c);
                        setCompanies(newCompanies);
                        saveCompanies(newCompanies);
                    }} 
                 />
             )}
             
             {view.type === 'USER_WELCOME' && currentUser && (
                 <UserWelcomeView user={currentUser} onStart={() => navigate({ type: 'USER_TEST', userId: currentUser.id })} />
             )}
             {view.type === 'USER_TEST' && currentUser && (
                 <UserTestView user={currentUser} onComplete={handleTestComplete} />
             )}
             {view.type === 'USER_CHAT' && currentUser && (
                 <KarmaChatView user={currentUser} onComplete={handleKarmaComplete} />
             )}
             {view.type === 'USER_CLIMATE_TEST' && (
                 <ClimateTestView 
                    user={currentUser?.id === (view as any).userId ? currentUser : users.find(u => u.id === (view as any).userId)!} 
                    onComplete={handleClimateComplete} 
                 />
             )}
             {view.type === 'USER_RESULT' && (currentUser || (view.userId && users.find(u => u.id === view.userId))) && (
                 <UserResultView 
                    user={currentUser?.id === view.userId ? currentUser : users.find(u => u.id === view.userId)!} 
                    jobDb={jobDb} 
                    onLogout={handleLogout} 
                    onStartClimate={() => navigate({ type: 'USER_CLIMATE_TEST', userId: (currentUser?.id === view.userId ? currentUser?.id : view.userId) })}
                    {...getTargetUserContext((currentUser?.id === view.userId ? currentUser?.id : view.userId)!)}
                 />
             )}
          </main>
       </div>
    </div>
  );
};

export default App;