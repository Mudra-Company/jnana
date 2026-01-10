import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useRouteGuard } from '../../hooks/useRouteGuard';
import { ROUTES } from '../routes';

interface RequireAdminProps {
  children: React.ReactNode;
}

export const RequireAdmin: React.FC<RequireAdminProps> = ({ children }) => {
  const { user, isLoading, isInitialized } = useAuth();
  const { canAccessAdminViews } = useRouteGuard();

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

  // Redirect to karma dashboard if not admin
  if (!canAccessAdminViews) {
    return <Navigate to={ROUTES.KARMA} replace />;
  }

  return <>{children}</>;
};
