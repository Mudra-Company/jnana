import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from './routes';

// Guards
import { RequireAuth } from './guards/RequireAuth';
import { RequireAdmin } from './guards/RequireAdmin';
import { RequireSuperAdmin } from './guards/RequireSuperAdmin';

// Layouts
import { MainLayout } from '../layouts/MainLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { KarmaLayout } from '../layouts/KarmaLayout';

// Loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
      <p className="text-muted-foreground">Caricamento...</p>
    </div>
  </div>
);

// Lazy loaded views - Landing & Auth
const LandingPage = lazy(() => import('../../views/landing/LandingPage').then(m => ({ default: m.LandingPage })));
const AuthView = lazy(() => import('../views/auth/AuthView').then(m => ({ default: m.AuthView })));
const ResetPasswordView = lazy(() => import('../views/auth/ResetPasswordView').then(m => ({ default: m.ResetPasswordView })));

// Lazy loaded views - Super Admin
const SuperAdminDashboard = lazy(() => import('../../views/superadmin/SuperAdminDashboard').then(m => ({ default: m.SuperAdminDashboard })));
const JobDatabaseEditor = lazy(() => import('../../views/superadmin/JobDatabaseEditor').then(m => ({ default: m.JobDatabaseEditor })));
const KarmaTalentsView = lazy(() => import('../../views/superadmin/KarmaTalentsView').then(m => ({ default: m.KarmaTalentsView })));
const KarmaProfileDetailView = lazy(() => import('../../views/superadmin/KarmaProfileDetailView').then(m => ({ default: m.KarmaProfileDetailView })));
const SuperAdminAnalyticsView = lazy(() => import('../../views/superadmin/SuperAdminAnalyticsView').then(m => ({ default: m.SuperAdminAnalyticsView })));
const KarmaAIConfigView = lazy(() => import('../../views/superadmin/KarmaAIConfigView'));

// Lazy loaded views - Admin
const AdminDashboardView = lazy(() => import('../../views/admin/AdminDashboard').then(m => ({ default: m.AdminDashboardView })));
const CompanyOrgView = lazy(() => import('../../views/admin/CompanyOrgView').then(m => ({ default: m.CompanyOrgView })));
const AdminIdentityHub = lazy(() => import('../../views/admin/AdminIdentityHub').then(m => ({ default: m.AdminIdentityHub })));
const AdminCompanyProfileView = lazy(() => import('../../views/admin/AdminCompanyProfileView').then(m => ({ default: m.AdminCompanyProfileView })));
const OpenPositionsView = lazy(() => import('../../views/admin/OpenPositionsView').then(m => ({ default: m.OpenPositionsView })));
const PositionMatchingView = lazy(() => import('../../views/admin/PositionMatchingView').then(m => ({ default: m.PositionMatchingView })));
const SeedDataView = lazy(() => import('../views/admin/SeedDataView'));

// Lazy loaded views - User
const UserWelcomeView = lazy(() => import('../../views/user/UserWelcomeView').then(m => ({ default: m.UserWelcomeView })));
const UserTestView = lazy(() => import('../../views/user/UserTestView').then(m => ({ default: m.UserTestView })));
const ClimateTestView = lazy(() => import('../../views/user/ClimateTestView').then(m => ({ default: m.ClimateTestView })));
const KarmaChatView = lazy(() => import('../../views/user/KarmaChatView').then(m => ({ default: m.KarmaChatView })));
const UserResultView = lazy(() => import('../../views/user/UserResultView').then(m => ({ default: m.UserResultView })));

// Lazy loaded views - Karma Platform
const KarmaOnboarding = lazy(() => import('../../views/karma/KarmaOnboarding').then(m => ({ default: m.KarmaOnboarding })));
const KarmaDashboard = lazy(() => import('../../views/karma/KarmaDashboard').then(m => ({ default: m.KarmaDashboard })));
const KarmaProfileEdit = lazy(() => import('../../views/karma/KarmaProfileEdit').then(m => ({ default: m.KarmaProfileEdit })));
const KarmaResults = lazy(() => import('../../views/karma/KarmaResults').then(m => ({ default: m.KarmaResults })));
const KarmaTestRiasec = lazy(() => import('../../views/karma/KarmaTestRiasec').then(m => ({ default: m.KarmaTestRiasec })));
const KarmaTestChat = lazy(() => import('../../views/karma/KarmaTestChat').then(m => ({ default: m.KarmaTestChat })));

// Suspense wrapper for lazy components
const withSuspense = (Component: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

// Export the router configuration
export const router = createBrowserRouter([
  // Public routes
  {
    path: ROUTES.HOME,
    element: withSuspense(LandingPage),
  },
  
  // Auth routes
  {
    element: <AuthLayout />,
    children: [
      {
        path: ROUTES.AUTH,
        element: withSuspense(AuthView),
      },
      {
        path: ROUTES.AUTH_LOGIN,
        element: withSuspense(AuthView),
      },
      {
        path: ROUTES.AUTH_RESET_PASSWORD,
        element: withSuspense(ResetPasswordView),
      },
    ],
  },

  // Super Admin routes
  {
    element: (
      <RequireSuperAdmin>
        <MainLayout />
      </RequireSuperAdmin>
    ),
    children: [
      {
        path: ROUTES.SUPER_ADMIN,
        element: withSuspense(SuperAdminDashboard),
      },
      {
        path: ROUTES.SUPER_ADMIN_JOBS,
        element: withSuspense(JobDatabaseEditor),
      },
      {
        path: ROUTES.SUPER_ADMIN_KARMA_TALENTS,
        element: withSuspense(KarmaTalentsView),
      },
      {
        path: ROUTES.SUPER_ADMIN_KARMA_PROFILE,
        element: withSuspense(KarmaProfileDetailView),
      },
      {
        path: ROUTES.SUPER_ADMIN_ANALYTICS,
        element: withSuspense(SuperAdminAnalyticsView),
      },
      {
        path: ROUTES.SUPER_ADMIN_KARMA_CONFIG,
        element: withSuspense(KarmaAIConfigView),
      },
    ],
  },

  // Admin routes
  {
    element: (
      <RequireAdmin>
        <MainLayout />
      </RequireAdmin>
    ),
    children: [
      {
        path: ROUTES.ADMIN,
        element: withSuspense(AdminDashboardView),
      },
      {
        path: ROUTES.ADMIN_ORG_CHART,
        element: withSuspense(CompanyOrgView),
      },
      {
        path: ROUTES.ADMIN_IDENTITY_HUB,
        element: withSuspense(AdminIdentityHub),
      },
      {
        path: ROUTES.ADMIN_COMPANY_PROFILE,
        element: withSuspense(AdminCompanyProfileView),
      },
      {
        path: ROUTES.ADMIN_OPEN_POSITIONS,
        element: withSuspense(OpenPositionsView),
      },
      {
        path: ROUTES.ADMIN_POSITION_MATCHING,
        element: withSuspense(PositionMatchingView),
      },
    ],
  },

  // User routes (Jnana employee)
  {
    element: (
      <RequireAuth>
        <MainLayout />
      </RequireAuth>
    ),
    children: [
      {
        path: ROUTES.USER_WELCOME,
        element: withSuspense(UserWelcomeView),
      },
      {
        path: ROUTES.USER_TEST,
        element: withSuspense(UserTestView),
      },
      {
        path: ROUTES.USER_CLIMATE,
        element: withSuspense(ClimateTestView),
      },
      {
        path: ROUTES.USER_CHAT,
        element: withSuspense(KarmaChatView),
      },
      {
        path: ROUTES.USER_RESULT,
        element: withSuspense(UserResultView),
      },
    ],
  },

  // Karma Platform routes (B2C)
  {
    element: (
      <RequireAuth>
        <KarmaLayout />
      </RequireAuth>
    ),
    children: [
      {
        path: ROUTES.KARMA,
        element: withSuspense(KarmaDashboard),
      },
      {
        path: ROUTES.KARMA_ONBOARDING,
        element: withSuspense(KarmaOnboarding),
      },
      {
        path: ROUTES.KARMA_PROFILE_EDIT,
        element: withSuspense(KarmaProfileEdit),
      },
      {
        path: ROUTES.KARMA_TEST_RIASEC,
        element: withSuspense(KarmaTestRiasec),
      },
      {
        path: ROUTES.KARMA_TEST_CHAT,
        element: withSuspense(KarmaTestChat),
      },
      {
        path: ROUTES.KARMA_RESULTS,
        element: withSuspense(KarmaResults),
      },
    ],
  },

  // Seed data route (development)
  {
    path: ROUTES.SEED_DATA,
    element: withSuspense(SeedDataView),
  },

  // Catch-all redirect
  {
    path: '*',
    element: <Navigate to={ROUTES.HOME} replace />,
  },
]);
