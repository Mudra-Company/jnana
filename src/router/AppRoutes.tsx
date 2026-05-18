import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAppData } from '../app/AppDataContext';
import { supabase } from '../integrations/supabase/client';
import { calculateProfileCode } from '../../services/riasecService';
import { useTestResults } from '../hooks/useTestResults';
import { saveJobDb } from '../../services/storageService';
import type { ViewState, ChatMessage, RiasecScore } from '../../types';
import { toast } from '../hooks/use-toast';

// ============================================================================
// EAGER imports — needed for first paint of unauthenticated users.
// LandingPage + AuthView are the entry points; keeping them in the main bundle
// avoids a Suspense flash on the most common landing route.
// ============================================================================
import { LandingPage } from '../../views/landing/LandingPage';
import { AuthView } from '../views/auth/AuthView';
import { DemoBanner } from '../components/DemoBanner';

// ============================================================================
// LAZY imports — split each route into its own chunk so the initial bundle
// only loads what the user actually needs. Each chunk is fetched on-demand
// the first time its route is visited and then cached by the browser.
// ============================================================================
const ResetPasswordView = lazy(() =>
  import('../views/auth/ResetPasswordView').then(m => ({ default: m.ResetPasswordView }))
);
const SeedDataView = lazy(() => import('../views/admin/SeedDataView'));

// Super admin chunks
const SuperAdminDashboard = lazy(() =>
  import('../../views/superadmin/SuperAdminDashboard').then(m => ({ default: m.SuperAdminDashboard }))
);
const JobDatabaseEditor = lazy(() =>
  import('../../views/superadmin/JobDatabaseEditor').then(m => ({ default: m.JobDatabaseEditor }))
);
const KarmaTalentsView = lazy(() =>
  import('../../views/superadmin/KarmaTalentsView').then(m => ({ default: m.KarmaTalentsView }))
);
const KarmaProfileDetailView = lazy(() =>
  import('../../views/superadmin/KarmaProfileDetailView').then(m => ({ default: m.KarmaProfileDetailView }))
);
const SuperAdminAnalyticsView = lazy(() =>
  import('../../views/superadmin/SuperAdminAnalyticsView').then(m => ({ default: m.SuperAdminAnalyticsView }))
);
const KarmaAIConfigView = lazy(() => import('../../views/superadmin/KarmaAIConfigView'));
const QuestionnaireListView = lazy(() =>
  import('../../views/superadmin/QuestionnaireListView').then(m => ({ default: m.QuestionnaireListView }))
);
const QuestionnaireEditorView = lazy(() =>
  import('../../views/superadmin/QuestionnaireEditorView').then(m => ({ default: m.QuestionnaireEditorView }))
);

// Admin chunks
const AdminDashboardView = lazy(() =>
  import('../../views/admin/AdminDashboard').then(m => ({ default: m.AdminDashboardView }))
);
const OpenPositionsView = lazy(() =>
  import('../../views/admin/OpenPositionsView').then(m => ({ default: m.OpenPositionsView }))
);
const PositionMatchingView = lazy(() =>
  import('../../views/admin/PositionMatchingView').then(m => ({ default: m.PositionMatchingView }))
);
const ComplianceDashboardView = lazy(() =>
  import('../../views/admin/ComplianceDashboardView').then(m => ({ default: m.ComplianceDashboardView }))
);
const SpaceSyncView = lazy(() =>
  import('../../views/admin/SpaceSyncView').then(m => ({ default: m.SpaceSyncView }))
);
const CompanyOrgView = lazy(() =>
  import('../../views/admin/CompanyOrgView').then(m => ({ default: m.CompanyOrgView }))
);
const AdminIdentityHub = lazy(() =>
  import('../../views/admin/AdminIdentityHub').then(m => ({ default: m.AdminIdentityHub }))
);
const AdminCompanyProfileView = lazy(() =>
  import('../../views/admin/AdminCompanyProfileView').then(m => ({ default: m.AdminCompanyProfileView }))
);

// User flow chunks
const UserWelcomeView = lazy(() =>
  import('../../views/user/UserWelcomeView').then(m => ({ default: m.UserWelcomeView }))
);
const UserTestView = lazy(() =>
  import('../../views/user/UserTestView').then(m => ({ default: m.UserTestView }))
);
const ClimateTestView = lazy(() =>
  import('../../views/user/ClimateTestView').then(m => ({ default: m.ClimateTestView }))
);
const KarmaChatView = lazy(() =>
  import('../../views/user/KarmaChatView').then(m => ({ default: m.KarmaChatView }))
);
const UserResultView = lazy(() =>
  import('../../views/user/UserResultView').then(m => ({ default: m.UserResultView }))
);

// Karma platform chunks
const KarmaOnboarding = lazy(() =>
  import('../../views/karma/KarmaOnboarding').then(m => ({ default: m.KarmaOnboarding }))
);
const KarmaDashboard = lazy(() =>
  import('../../views/karma/KarmaDashboard').then(m => ({ default: m.KarmaDashboard }))
);
const KarmaProfileEdit = lazy(() =>
  import('../../views/karma/KarmaProfileEdit').then(m => ({ default: m.KarmaProfileEdit }))
);
const KarmaResults = lazy(() =>
  import('../../views/karma/KarmaResults').then(m => ({ default: m.KarmaResults }))
);
const KarmaTestRiasec = lazy(() =>
  import('../../views/karma/KarmaTestRiasec').then(m => ({ default: m.KarmaTestRiasec }))
);
const KarmaTestChat = lazy(() =>
  import('../../views/karma/KarmaTestChat').then(m => ({ default: m.KarmaTestChat }))
);
const KarmaWelcome = lazy(() =>
  import('../../views/karma/KarmaWelcome').then(m => ({ default: m.KarmaWelcome }))
);
const CVReviewScreen = lazy(() =>
  import('../../views/karma/CVReviewScreen').then(m => ({ default: m.CVReviewScreen }))
);
const PostOnboardingPromo = lazy(() =>
  import('../../views/karma/PostOnboardingPromo').then(m => ({ default: m.PostOnboardingPromo }))
);
const InviteAcceptView = lazy(() =>
  import('../views/auth/InviteAcceptView').then(m => ({ default: m.InviteAcceptView }))
);
const B2BOnboardingFlow = lazy(() =>
  import('../../views/onboarding/B2BOnboardingFlow').then(m => ({ default: m.B2BOnboardingFlow }))
);
const SimulatorB2CView = lazy(() =>
  import('../../views/simulator/SimulatorB2CView').then(m => ({ default: m.SimulatorB2CView }))
);
const SimulatorB2BView = lazy(() =>
  import('../../views/simulator/SimulatorB2BView').then(m => ({ default: m.SimulatorB2BView }))
);

/**
 * Declarative route tree replacing the mega switch in App.tsx.
 *
 * Each route reads state via useAppData() and renders null when the
 * required data isn't ready (matches the previous conditional renders).
 *
 * Auth/role gating is applied per-route via guard fragments rather than
 * a giant inline `&&` chain.
 */

// ===== Helpers =====

function NotReady() {
  return null;
}

// ===== LANDING / AUTH =====

function LandingRoute() {
  const { user, pendingInviteData, navigate } = useAppData();
  if (user) return <NotReady />;
  return (
    <LandingPage
      onLoginJnana={() => navigate({ type: 'LOGIN', authMode: 'jnana' } as ViewState)}
      onLoginKarma={() => navigate({ type: 'LOGIN', authMode: 'karma' } as ViewState)}
      pendingInvite={pendingInviteData}
    />
  );
}

function LoginRoute() {
  const { user, pendingInviteData, setView } = useAppData();
  const [searchParams] = useSearchParams();
  if (user) return <NotReady />;
  const mode = searchParams.get('mode');
  const initialMode: 'jnana' | 'karma' | 'select' =
    pendingInviteData ? 'jnana' : (mode === 'jnana' || mode === 'karma' ? mode : 'select');
  return (
    <AuthView
      onBackToLanding={() => setView({ type: 'LANDING' })}
      initialMode={initialMode}
    />
  );
}

function ResetPasswordRoute() {
  const { setView } = useAppData();
  return (
    <ResetPasswordView
      onSuccess={() => {
        window.history.pushState({}, '', '/');
        setView({ type: 'LOADING' });
      }}
    />
  );
}

// ===== SUPER ADMIN =====

function SuperAdminDashboardRoute() {
  const {
    canAccessSuperAdminViews, superAdminDataLoading,
    legacyCompanies, companyUsers,
    handleImpersonate, handleCreateCompany, handleStartDemoMode,
  } = useAppData();
  if (!canAccessSuperAdminViews) return <NotReady />;
  if (superAdminDataLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-jnana-text dark:text-gray-300">Caricamento aziende...</p>
      </div>
    );
  }
  return (
    <SuperAdminDashboard
      companies={legacyCompanies}
      users={companyUsers}
      onImpersonate={handleImpersonate}
      onCreateCompany={handleCreateCompany}
      onStartDemoMode={handleStartDemoMode}
    />
  );
}

function SuperAdminKarmaTalentsRoute() {
  const { canAccessSuperAdminViews, navigate } = useAppData();
  if (!canAccessSuperAdminViews) return <NotReady />;
  return (
    <KarmaTalentsView
      onViewProfile={(userId) => navigate({ type: 'SUPER_ADMIN_KARMA_PROFILE', userId })}
    />
  );
}

function SuperAdminKarmaProfileRoute() {
  const { canAccessSuperAdminViews, navigate } = useAppData();
  const { userId } = useParams();
  if (!canAccessSuperAdminViews || !userId) return <NotReady />;
  return (
    <KarmaProfileDetailView
      userId={userId}
      onBack={() => navigate({ type: 'SUPER_ADMIN_KARMA_TALENTS' })}
    />
  );
}

function SuperAdminJobsRoute() {
  const { canAccessSuperAdminViews, jobDb, setJobDb } = useAppData();
  if (!canAccessSuperAdminViews) return <NotReady />;
  return (
    <JobDatabaseEditor
      jobDb={jobDb}
      onUpdateJobDb={(newDb) => {
        setJobDb(newDb);
        saveJobDb(newDb);
      }}
    />
  );
}

function SuperAdminAnalyticsRoute() {
  const { canAccessSuperAdminViews } = useAppData();
  if (!canAccessSuperAdminViews) return <NotReady />;
  return <SuperAdminAnalyticsView />;
}

function SuperAdminKarmaAIConfigRoute() {
  const { canAccessSuperAdminViews, navigate } = useAppData();
  if (!canAccessSuperAdminViews) return <NotReady />;
  return <KarmaAIConfigView onBack={() => navigate({ type: 'SUPER_ADMIN_DASHBOARD' })} />;
}

function SuperAdminQuestionnairesRoute() {
  const { canAccessSuperAdminViews, navigate } = useAppData();
  if (!canAccessSuperAdminViews) return <NotReady />;
  return (
    <QuestionnaireListView
      onBack={() => navigate({ type: 'SUPER_ADMIN_DASHBOARD' })}
      onEdit={(id) => navigate({ type: 'SUPER_ADMIN_QUESTIONNAIRE_EDIT', questionnaireId: id })}
    />
  );
}

function SuperAdminQuestionnaireEditRoute() {
  const { canAccessSuperAdminViews, navigate } = useAppData();
  const { id } = useParams();
  if (!canAccessSuperAdminViews || !id) return <NotReady />;
  return (
    <QuestionnaireEditorView
      questionnaireId={id}
      onBack={() => navigate({ type: 'SUPER_ADMIN_QUESTIONNAIRES' })}
    />
  );
}

// ===== ADMIN =====

function AdminDashboardRoute() {
  const {
    activeCompanyData, canAccessAdminViews, companyUsers, setCompanyUsers,
    user, navigate,
  } = useAppData();
  if (!activeCompanyData || !canAccessAdminViews) return <NotReady />;
  return (
    <AdminDashboardView
      activeCompany={activeCompanyData}
      users={companyUsers}
      onUpdateUsers={(updatedUsers) => setCompanyUsers(updatedUsers)}
      setView={navigate}
      currentUserId={user?.id}
      onRefreshUsers={async () => {
        const { loadCompanyUsersWithDetails } = await import('../app/dataLoaders');
        const users = await loadCompanyUsersWithDetails(activeCompanyData.id);
        setCompanyUsers(users);
      }}
    />
  );
}

function AdminOrgChartRoute() {
  const {
    activeCompanyData, canAccessAdminViews, companyUsers, setCompanyUsers,
    handleOrgChartUpdate, navigate,
  } = useAppData();
  if (!activeCompanyData || !canAccessAdminViews) return <NotReady />;
  return (
    <CompanyOrgView
      company={activeCompanyData}
      users={companyUsers}
      onUpdateStructure={handleOrgChartUpdate}
      onUpdateUsers={(updatedUsers) => setCompanyUsers(updatedUsers)}
      onViewUser={(userId) => navigate({ type: 'USER_RESULT', userId })}
      onViewExternalCandidate={(userId) => navigate({ type: 'KARMA_PROFILE_VIEW', userId })}
      onOpenPositionMatching={(positionId, initialTab) =>
        navigate({ type: 'ADMIN_POSITION_MATCHING', positionId, initialTab })}
    />
  );
}

function AdminIdentityHubRoute() {
  const { activeCompanyData, canAccessAdminViews, companyUsers } = useAppData();
  if (!activeCompanyData || !canAccessAdminViews) return <NotReady />;
  return <AdminIdentityHub company={activeCompanyData} users={companyUsers} />;
}

function AdminCompanyProfileRoute() {
  const { activeCompanyData, canAccessAdminViews, handleCompanyUpdate } = useAppData();
  if (!activeCompanyData || !canAccessAdminViews) return <NotReady />;
  return <AdminCompanyProfileView company={activeCompanyData} onUpdate={handleCompanyUpdate} />;
}

function AdminOpenPositionsRoute() {
  const { activeCompanyData, canAccessAdminViews, companyUsers, navigate } = useAppData();
  if (!activeCompanyData || !canAccessAdminViews) return <NotReady />;
  return (
    <OpenPositionsView
      company={activeCompanyData}
      users={companyUsers}
      onBack={() => navigate({ type: 'ADMIN_DASHBOARD' })}
      onFindCandidates={(positionId) => navigate({ type: 'ADMIN_POSITION_MATCHING', positionId })}
      onEditPosition={() => navigate({ type: 'ADMIN_ORG_CHART' })}
    />
  );
}

function AdminPositionMatchingRoute() {
  const {
    activeCompanyData, canAccessAdminViews, companyUsers, navigate, loadCompanyData,
  } = useAppData();
  const { positionId } = useParams();
  const [searchParams] = useSearchParams();
  if (!activeCompanyData || !canAccessAdminViews || !positionId) return <NotReady />;
  // initialTab read from ?tab= but PositionMatchingView doesn't accept it yet — kept in URL only.
  void searchParams;
  return (
    <PositionMatchingView
      positionId={positionId}
      company={activeCompanyData}
      companyUsers={companyUsers}
      onBack={() => navigate({ type: 'ADMIN_OPEN_POSITIONS' })}
      onViewCandidate={(userId) => navigate({ type: 'KARMA_PROFILE_VIEW', userId, fromPositionId: positionId })}
      onAssignInternal={async (slotId, userId) => {
        const { data: roleRow } = await supabase
          .from('company_roles')
          .select('id, company_id')
          .eq('id', slotId)
          .maybeSingle();
        let opError: { message: string } | null = null;
        if (roleRow) {
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
  );
}

function AdminComplianceRoute() {
  const { activeCompanyData, canAccessAdminViews } = useAppData();
  if (!activeCompanyData || !canAccessAdminViews) return <NotReady />;
  return (
    <ComplianceDashboardView
      companyId={activeCompanyData.id}
      companyName={activeCompanyData.name}
    />
  );
}

function AdminSpaceSyncRoute() {
  const { activeCompanyData, canAccessAdminViews, companyUsers } = useAppData();
  if (!activeCompanyData || !canAccessAdminViews) return <NotReady />;
  return <SpaceSyncView company={activeCompanyData} companyUsers={companyUsers} />;
}

// ===== USER FLOW =====

function UserWelcomeRoute() {
  const { currentUserData, navigate } = useAppData();
  if (!currentUserData) return <NotReady />;
  return (
    <UserWelcomeView
      user={currentUserData}
      onStart={() => navigate({ type: 'USER_TEST', userId: currentUserData.id })}
    />
  );
}

function UserTestRoute() {
  const { currentUserData, handleTestComplete } = useAppData();
  if (!currentUserData) return <NotReady />;
  return <UserTestView user={currentUserData} onComplete={handleTestComplete} />;
}

function UserChatRoute() {
  const { currentUserData, handleKarmaComplete, activeCompanyData, companyUsers } = useAppData();
  if (!currentUserData) return <NotReady />;
  return (
    <KarmaChatView
      user={currentUserData}
      onComplete={handleKarmaComplete}
      orgStructure={activeCompanyData?.structure}
      allUsers={companyUsers}
    />
  );
}

function UserClimateTestRoute() {
  const { currentUserData, handleClimateComplete } = useAppData();
  if (!currentUserData) return <NotReady />;
  return <ClimateTestView user={currentUserData} onComplete={handleClimateComplete} />;
}

function UserResultRoute() {
  const {
    currentUserData, companyUsers, jobDb, activeCompanyData,
    handleLogout, navigate,
  } = useAppData();
  const { userId } = useParams();
  if (!userId) return <NotReady />;
  const isViewingOwnProfile = currentUserData?.id === userId;
  const userToShow = isViewingOwnProfile
    ? currentUserData
    : companyUsers.find(u => u.id === userId);
  if (!userToShow) return <NotReady />;
  return (
    <UserResultView
      user={userToShow}
      jobDb={jobDb}
      onLogout={handleLogout}
      onStartClimate={() => navigate({ type: 'USER_CLIMATE_TEST', userId })}
      onStartKarma={() => navigate({ type: 'USER_CHAT', userId })}
      company={activeCompanyData || undefined}
      companyUsers={companyUsers}
      isReadOnly={!isViewingOwnProfile}
      onClose={() => navigate({ type: 'ADMIN_DASHBOARD' })}
    />
  );
}

// ===== KARMA PLATFORM =====

function KarmaWelcomeRoute() {
  const { profile, setView, setCvParsedData } = useAppData();
  return (
    <KarmaWelcome
      userName={profile?.first_name || undefined}
      onChooseCV={() => {}}
      onChooseManual={() => setView({ type: 'KARMA_ONBOARDING' })}
      onCVParsed={(data) => {
        setCvParsedData(data);
        setView({ type: 'KARMA_CV_REVIEW' });
      }}
    />
  );
}

function KarmaCVReviewRoute() {
  const { cvParsedData, setCvParsedData, setView, user } = useAppData();
  if (!cvParsedData) return <NotReady />;
  return (
    <CVReviewScreen
      parsedData={cvParsedData}
      onConfirm={async (selectedData) => {
        const userId = user?.id;
        if (!userId) return;
        if (selectedData.profileData) {
          await supabase.from('profiles').update({
            first_name: selectedData.profileData.firstName,
            last_name: selectedData.profileData.lastName,
            headline: selectedData.profileData.headline,
            bio: selectedData.profileData.bio,
            location: selectedData.profileData.location,
            years_experience: selectedData.profileData.yearsExperience,
            is_karma_profile: true,
            wants_karma_visibility: true,
            profile_visibility: 'subscribers_only',
          }).eq('id', userId);
        }
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
        if (selectedData.certifications.length > 0) {
          const certRows = selectedData.certifications.map(cert => ({
            user_id: userId,
            name: cert.name,
          }));
          await supabase.from('user_certifications').insert(certRows);
        }
        if (selectedData.languages.length > 0) {
          const langRows = selectedData.languages.map(lang => ({
            user_id: userId,
            language: lang.language,
            proficiency: lang.proficiency || 'professional',
          }));
          await supabase.from('user_languages').insert(langRows);
        }
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
  );
}

function KarmaPostOnboardingRoute() {
  const { setView } = useAppData();
  return (
    <PostOnboardingPromo
      onStartRiasec={() => setView({ type: 'KARMA_TEST_RIASEC' })}
      onSkip={() => setView({ type: 'KARMA_DASHBOARD' })}
    />
  );
}

function KarmaOnboardingRoute() {
  const { setView } = useAppData();
  return (
    <KarmaOnboarding
      onComplete={() => setView({ type: 'KARMA_POST_ONBOARDING' })}
      onSkip={() => setView({ type: 'KARMA_DASHBOARD' })}
    />
  );
}

function KarmaDashboardRoute() {
  const { handleLogout, navigate, setView } = useAppData();
  return (
    <KarmaDashboard
      onEditProfile={() => navigate({ type: 'KARMA_PROFILE_EDIT' })}
      onStartTest={() => navigate({ type: 'KARMA_TEST_RIASEC' })}
      onViewResults={() => navigate({ type: 'KARMA_RESULTS' })}
      onLogout={handleLogout}
      onGoHome={() => setView({ type: 'KARMA_DASHBOARD' })}
    />
  );
}

function KarmaProfileEditRoute() {
  const { setView } = useAppData();
  return (
    <KarmaProfileEdit
      onBack={() => setView({ type: 'KARMA_DASHBOARD' })}
      onSave={() => setView({ type: 'KARMA_DASHBOARD' })}
    />
  );
}

function KarmaResultsRoute() {
  const { setView, navigate } = useAppData();
  return (
    <KarmaResults
      onBack={() => setView({ type: 'KARMA_DASHBOARD' })}
      onEditProfile={() => navigate({ type: 'KARMA_PROFILE_EDIT' })}
    />
  );
}

function KarmaTestRiasecRoute() {
  const { user, setCurrentUserData, setView } = useAppData();
  const { saveRiasecResult } = useTestResults();
  return (
    <KarmaTestRiasec
      onComplete={async (score: RiasecScore) => {
        if (user) {
          const profileCode = calculateProfileCode(score);
          await saveRiasecResult(user.id, null, score, profileCode);
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
  );
}

function KarmaTestChatRoute() {
  const { user, currentUserData, setCurrentUserData, setView } = useAppData();
  const { saveKarmaSession } = useTestResults();
  if (!currentUserData?.results || !currentUserData?.profileCode) return <NotReady />;
  return (
    <KarmaTestChat
      riasecScore={currentUserData.results}
      profileCode={currentUserData.profileCode}
      firstName={currentUserData.firstName || ''}
      userId={user?.id}
      onComplete={async (transcript: ChatMessage[]) => {
        let karmaDataPartial: any = {};
        try {
          const { data, error } = await supabase.functions.invoke('karma-analyze', {
            body: { transcript: transcript.map(m => ({ role: m.role, text: m.text })), botType: 'karma_talents', scenario: 'discovery', userId: user?.id }
          });
          if (!error && data) karmaDataPartial = data;
        } catch (e) {
          console.error('Error calling karma-analyze:', e);
        }
        if (user) {
          await saveKarmaSession(user.id, null, transcript, {
            summary: karmaDataPartial.summary,
            softSkills: karmaDataPartial.softSkills,
            primaryValues: karmaDataPartial.primaryValues,
            riskFactors: karmaDataPartial.riskFactors,
            seniorityAssessment: karmaDataPartial.seniorityAssessment,
            scenario: 'discovery',
            skillAssessments: karmaDataPartial.skillAssessments,
            softSkillAssessments: karmaDataPartial.softSkillAssessments,
            cultureFit: karmaDataPartial.cultureFit,
            managerFitSignals: karmaDataPartial.managerFitSignals,
            growthAreas: karmaDataPartial.growthAreas,
            careerAspirations: karmaDataPartial.careerAspirations,
            alerts: karmaDataPartial.alerts,
            confidenceOverall: karmaDataPartial.confidenceOverall,
          });
        }
        setCurrentUserData(prev => prev ? {
          ...prev,
          karmaData: { transcript, ...karmaDataPartial },
        } : null);
        setView({ type: 'KARMA_RESULTS' });
      }}
      onBack={() => setView({ type: 'KARMA_DASHBOARD' })}
    />
  );
}

function KarmaProfileViewRoute() {
  const { canAccessAdminViews, goBack } = useAppData();
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const fromPositionId = searchParams.get('position') || undefined;
  if (!canAccessAdminViews || !userId) return <NotReady />;
  return <KarmaProfileDetailView userId={userId} onBack={goBack} fromPositionId={fromPositionId} />;
}

// ===== DEMO MODE =====

function DemoBannerWrapper({ children }: { children: React.ReactNode }) {
  const { isDemoMode, demoUserData, handleExitDemoMode } = useAppData();
  if (!isDemoMode || !demoUserData) return <NotReady />;
  return (
    <>
      <DemoBanner onExit={handleExitDemoMode} />
      <div className="pt-14">{children}</div>
    </>
  );
}

function DemoUserWelcomeRoute() {
  const { demoUserData, setView } = useAppData();
  return (
    <DemoBannerWrapper>
      {demoUserData && (
        <UserWelcomeView
          user={demoUserData}
          onStart={() => setView({ type: 'DEMO_USER_TEST' })}
        />
      )}
    </DemoBannerWrapper>
  );
}

function DemoUserTestRoute() {
  const { demoUserData, handleDemoTestComplete } = useAppData();
  return (
    <DemoBannerWrapper>
      {demoUserData && (
        <UserTestView user={demoUserData} onComplete={handleDemoTestComplete} />
      )}
    </DemoBannerWrapper>
  );
}

function DemoUserChatRoute() {
  const { demoUserData, handleDemoKarmaComplete, activeCompanyData, companyUsers } = useAppData();
  return (
    <DemoBannerWrapper>
      {demoUserData && (
        <KarmaChatView
          user={demoUserData}
          onComplete={handleDemoKarmaComplete}
          orgStructure={activeCompanyData?.structure}
          allUsers={companyUsers}
        />
      )}
    </DemoBannerWrapper>
  );
}

function DemoUserClimateRoute() {
  const { demoUserData, handleDemoClimateComplete } = useAppData();
  return (
    <DemoBannerWrapper>
      {demoUserData && (
        <ClimateTestView user={demoUserData} onComplete={handleDemoClimateComplete} />
      )}
    </DemoBannerWrapper>
  );
}

function DemoUserResultRoute() {
  const { demoUserData, jobDb, activeCompanyData, handleExitDemoMode, setView } = useAppData();
  return (
    <DemoBannerWrapper>
      {demoUserData && (
        <UserResultView
          user={demoUserData}
          jobDb={jobDb}
          onLogout={handleExitDemoMode}
          onStartClimate={() => setView({ type: 'DEMO_USER_CLIMATE' })}
          company={activeCompanyData || undefined}
          companyUsers={[]}
        />
      )}
    </DemoBannerWrapper>
  );
}

// ===== SEED =====

function SeedDataRoute() {
  return <SeedDataView />;
}

// ===== INVITE / B2B ONBOARDING =====

function InviteAcceptRoute() {
  const { setView } = useAppData();
  return <InviteAcceptView onProceedToSignup={() => setView({ type: 'LOGIN', authMode: 'jnana' } as ViewState)} />;
}

function B2BOnboardingRoute() {
  const { user, navigate, setView } = useAppData();
  if (!user) return <NotReady />;
  return (
    <B2BOnboardingFlow
      onStartRiasec={() => navigate({ type: 'USER_TEST', userId: user.id })}
      onSkip={() => setView({ type: 'USER_RESULT', userId: user.id })}
    />
  );
}

// ===== SIMULATOR (super admin only) =====

function SimulatorB2CRoute() {
  const { canAccessSuperAdminViews } = useAppData();
  if (!canAccessSuperAdminViews) return <NotReady />;
  return <SimulatorB2CView />;
}

function SimulatorB2BRoute() {
  const { canAccessSuperAdminViews } = useAppData();
  if (!canAccessSuperAdminViews) return <NotReady />;
  return <SimulatorB2BView />;
}

// ===== ROOT TREE =====

/** Suspense fallback shown while a lazy chunk loads. Same look as the global LOADING screen. */
      onStartRiasec={() => navigate({ type: 'USER_TEST', userId: user.id })}
      onSkip={() => setView({ type: 'USER_RESULT', userId: user.id })}
    />
  );
}

// ===== ROOT TREE =====

/** Suspense fallback shown while a lazy chunk loads. Same look as the global LOADING screen. */
function RouteLoadingFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-jnana-charcoal border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-jnana-text dark:text-gray-300 text-sm">Caricamento…</p>
      </div>
    </div>
  );
}

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
    <Routes>
      {/* Public / auth */}
      <Route path="/" element={<LandingRoute />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/auth/reset-password" element={<ResetPasswordRoute />} />
      <Route path="/seed" element={<SeedDataRoute />} />
      <Route path="/invite/accept" element={<InviteAcceptRoute />} />
      <Route path="/onboarding/b2b" element={<B2BOnboardingRoute />} />

      {/* Super admin */}
      <Route path="/superadmin" element={<SuperAdminDashboardRoute />} />
      <Route path="/superadmin/jobs" element={<SuperAdminJobsRoute />} />
      <Route path="/superadmin/karma" element={<SuperAdminKarmaTalentsRoute />} />
      <Route path="/superadmin/karma/:userId" element={<SuperAdminKarmaProfileRoute />} />
      <Route path="/superadmin/analytics" element={<SuperAdminAnalyticsRoute />} />
      <Route path="/superadmin/karma-ai" element={<SuperAdminKarmaAIConfigRoute />} />
      <Route path="/superadmin/questionnaires" element={<SuperAdminQuestionnairesRoute />} />
      <Route path="/superadmin/questionnaires/:id" element={<SuperAdminQuestionnaireEditRoute />} />

      {/* Admin (company) */}
      <Route path="/admin" element={<AdminDashboardRoute />} />
      <Route path="/admin/org" element={<AdminOrgChartRoute />} />
      <Route path="/admin/identity" element={<AdminIdentityHubRoute />} />
      <Route path="/admin/company" element={<AdminCompanyProfileRoute />} />
      <Route path="/admin/positions" element={<AdminOpenPositionsRoute />} />
      <Route path="/admin/positions/:positionId" element={<AdminPositionMatchingRoute />} />
      <Route path="/admin/compliance" element={<AdminComplianceRoute />} />
      <Route path="/admin/spacesync" element={<AdminSpaceSyncRoute />} />

      {/* User flow */}
      <Route path="/test/welcome/:userId" element={<UserWelcomeRoute />} />
      <Route path="/test/riasec/:userId" element={<UserTestRoute />} />
      <Route path="/test/chat/:userId" element={<UserChatRoute />} />
      <Route path="/test/climate/:userId" element={<UserClimateTestRoute />} />
      <Route path="/me/:userId" element={<UserResultRoute />} />

      {/* Karma platform */}
      <Route path="/karma" element={<KarmaDashboardRoute />} />
      <Route path="/karma/welcome" element={<KarmaWelcomeRoute />} />
      <Route path="/karma/cv-review" element={<KarmaCVReviewRoute />} />
      <Route path="/karma/post-onboarding" element={<KarmaPostOnboardingRoute />} />
      <Route path="/karma/onboarding" element={<KarmaOnboardingRoute />} />
      <Route path="/karma/profile" element={<KarmaProfileEditRoute />} />
      <Route path="/karma/profile/:userId" element={<KarmaProfileViewRoute />} />
      <Route path="/karma/results" element={<KarmaResultsRoute />} />
      <Route path="/karma/test/riasec" element={<KarmaTestRiasecRoute />} />
      <Route path="/karma/test/chat" element={<KarmaTestChatRoute />} />

      {/* Demo */}
      <Route path="/demo/welcome" element={<DemoUserWelcomeRoute />} />
      <Route path="/demo/test" element={<DemoUserTestRoute />} />
      <Route path="/demo/chat" element={<DemoUserChatRoute />} />
      <Route path="/demo/climate" element={<DemoUserClimateRoute />} />
      <Route path="/demo/result" element={<DemoUserResultRoute />} />

      {/* Onboarding Simulator (super admin only) */}
      <Route path="/simulate/b2c" element={<SimulatorB2CRoute />} />
      <Route path="/simulate/b2b" element={<SimulatorB2BRoute />} />
    </Routes>
    </Suspense>
  );
};
