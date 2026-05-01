import { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRouteGuard, UserRole } from '../hooks/useRouteGuard';
import { canAccessView } from './accessPolicy';
import type { ViewState } from '../../types';

/**
 * Declarative route guards — Phase 2 of routing refactor.
 *
 * These wrappers replace inline `&& canAccessAdminViews` chains with
 * composable, self-documenting components. They are the foundation
 * for the future <Routes> tree (Phase 3) but can already be used
 * to wrap individual view branches in App.tsx.
 *
 * All guards render `fallback` (default: null) when the check fails,
 * so they NEVER force a navigation by themselves — App.tsx remains
 * in control of redirects via setView. This keeps Phase 2 strictly
 * additive and reversible.
 */

interface GuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/** Allow only authenticated users. */
export function RequireAuth({ children, fallback = null }: GuardProps) {
  const { user, isInitialized } = useAuth();
  if (!isInitialized) return null;
  if (!user) return <>{fallback}</>;
  return <>{children}</>;
}

/** Allow only unauthenticated users (login, landing). */
export function RequireGuest({ children, fallback = null }: GuardProps) {
  const { user, isInitialized } = useAuth();
  if (!isInitialized) return null;
  if (user) return <>{fallback}</>;
  return <>{children}</>;
}

/** Allow super_admin OR company_admin. */
export function RequireAdmin({ children, fallback = null }: GuardProps) {
  const { canAccessAdminViews } = useRouteGuard();
  if (!canAccessAdminViews) return <>{fallback}</>;
  return <>{children}</>;
}

/** Allow only super_admin. */
export function RequireSuperAdmin({ children, fallback = null }: GuardProps) {
  const { canAccessSuperAdminViews } = useRouteGuard();
  if (!canAccessSuperAdminViews) return <>{fallback}</>;
  return <>{children}</>;
}

/** Allow a specific set of roles. */
interface RequireRoleProps extends GuardProps {
  roles: UserRole[];
}
export function RequireRole({ children, roles, fallback = null }: RequireRoleProps) {
  const { userRole } = useRouteGuard();
  if (!roles.includes(userRole)) return <>{fallback}</>;
  return <>{children}</>;
}

/**
 * Generic, policy-driven guard — checks ACCESS_POLICY for the given view type.
 * Useful when wrapping arbitrary view branches without hard-coding the role.
 */
interface RequireViewAccessProps extends GuardProps {
  viewType: ViewState['type'];
}
export function RequireViewAccess({ viewType, children, fallback = null }: RequireViewAccessProps) {
  const { user, isInitialized } = useAuth();
  const { userRole } = useRouteGuard();
  if (!isInitialized) return null;
  const allowed = canAccessView(viewType, !!user, userRole);
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
