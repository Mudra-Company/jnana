import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useRouteGuard } from '../../hooks/useRouteGuard';
import { ROUTES } from '../routes';

interface RequireSuperAdminProps {
  children: React.ReactNode;
}

export const RequireSuperAdmin: React.FC<RequireSuperAdminProps> = ({ children }) => {
  const { user, isLoading, isInitialized } = useAuth();
  const { canAccessSuperAdminViews, canAccessAdminViews } = useRouteGuard();

  // Show loading while auth is initializing
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to={ROUTES.AUTH} replace />;
  }

  // Redirect based on role
  if (!canAccessSuperAdminViews) {
    if (canAccessAdminViews) {
      return <Navigate to={ROUTES.ADMIN} replace />;
    }
    return <Navigate to={ROUTES.KARMA} replace />;
  }

  return <>{children}</>;
};
