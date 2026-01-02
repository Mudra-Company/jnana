import { useAuth } from './useAuth';

export type UserRole = 'super_admin' | 'company_admin' | 'user';

export const useRouteGuard = () => {
  const { user, isSuperAdmin, isCompanyAdmin, membership } = useAuth();

  // Determine the user's effective role
  const getUserRole = (): UserRole => {
    if (isSuperAdmin) return 'super_admin';
    if (isCompanyAdmin) return 'company_admin';
    return 'user';
  };

  return {
    // The user's effective role
    userRole: getUserRole(),

    // Super Admin: access to everything
    canAccessSuperAdminViews: isSuperAdmin,

    // Company Admin: dashboard, org chart, identity hub, company profile, user details
    canAccessAdminViews: isSuperAdmin || isCompanyAdmin,

    // User: only their own profile/tests
    canAccessUserViews: !!user,

    // Company data access - null for super admins (can access all)
    authorizedCompanyId: isSuperAdmin ? null : membership?.company_id,

    // Validate if user can see specific user's data
    canViewUser: (targetUserId: string): boolean => {
      if (isSuperAdmin) return true;
      if (isCompanyAdmin) return true; // RLS will handle company filtering
      return user?.id === targetUserId;
    },

    // Check if user can modify company data
    canModifyCompany: (companyId?: string): boolean => {
      if (isSuperAdmin) return true;
      if (isCompanyAdmin && membership?.company_id === companyId) return true;
      return false;
    },
  };
};
