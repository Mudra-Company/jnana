import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useRouteGuard } from '../hooks/useRouteGuard';
import { Header } from '../../components/layout/Header';
import { ROUTES, buildRoute } from '../router/routes';
import { useCompanyContext } from '../contexts/CompanyContext';

interface MainLayoutProps {
  showHeader?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ showHeader = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, isSuperAdmin, membership } = useAuth();
  const { userRole } = useRouteGuard();
  const { activeCompany, clearCompanyContext } = useCompanyContext();

  const handleLogout = async () => {
    await signOut();
    navigate(ROUTES.HOME);
  };

  const handleExitImpersonation = () => {
    clearCompanyContext();
    navigate(ROUTES.SUPER_ADMIN);
  };

  // Determine if we can go back (simple heuristic: not on main dashboard routes)
  const mainRoutes = [ROUTES.HOME, ROUTES.ADMIN, ROUTES.SUPER_ADMIN, ROUTES.KARMA];
  const canGoBack = !mainRoutes.includes(location.pathname as typeof mainRoutes[number]);

  // Convert route to ViewState-like object for Header compatibility
  const getViewFromPath = () => {
    const path = location.pathname;
    if (path.startsWith('/super-admin')) return { type: 'SUPER_ADMIN_DASHBOARD' };
    if (path.startsWith('/admin')) return { type: 'ADMIN_DASHBOARD' };
    if (path.startsWith('/user')) return { type: 'USER_RESULT' };
    return { type: 'ADMIN_DASHBOARD' };
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 font-sans">
      {showHeader && user && (
        <Header
          onLogout={handleLogout}
          view={getViewFromPath() as any}
          onAdminHome={() => navigate(ROUTES.ADMIN)}
          onOrgChart={() => navigate(ROUTES.ADMIN_ORG_CHART)}
          onIdentityHub={() => navigate(ROUTES.ADMIN_IDENTITY_HUB)}
          onCompanyProfile={() => navigate(ROUTES.ADMIN_COMPANY_PROFILE)}
          onSuperAdminHome={() => navigate(ROUTES.SUPER_ADMIN)}
          onJobDb={() => navigate(ROUTES.SUPER_ADMIN_JOBS)}
          onKarmaTalents={() => navigate(ROUTES.SUPER_ADMIN_KARMA_TALENTS)}
          onAnalytics={() => navigate(ROUTES.SUPER_ADMIN_ANALYTICS)}
          onKarmaAIConfig={() => navigate(ROUTES.SUPER_ADMIN_KARMA_CONFIG)}
          activeCompany={activeCompany || undefined}
          isSuperAdminMode={isSuperAdmin}
          onExitImpersonation={handleExitImpersonation}
          isDark={false}
          toggleTheme={() => {}}
          onBack={() => navigate(-1)}
          canGoBack={canGoBack}
          userRole={userRole}
          onMyProfile={() => user && navigate(buildRoute.userResult(user.id))}
          hasCompanyMembership={!!membership}
        />
      )}
      <main className="animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
};
