import type { ViewState } from '../../types';
import type { UserRole } from '../hooks/useRouteGuard';

/**
 * Centralized declarative access policy.
 *
 * For every ViewState type, declares which roles may access it and whether
 * the route requires authentication. This replaces the ad-hoc inline
 * `view.type === 'X' && canAccess...` checks scattered across App.tsx.
 *
 * Phase 2 of the routing refactor: still purely additive — guards in
 * App.tsx will consult this map, but the existing render switch keeps
 * deciding what to render.
 */

export type Access =
  | { kind: 'public' }
  | { kind: 'guest' } // login/landing — visible only when NOT authenticated
  | { kind: 'auth'; roles?: UserRole[] };

type ViewType = ViewState['type'];

export const ACCESS_POLICY: Record<ViewType, Access> = {
  // Public / bootstrap
  LANDING: { kind: 'guest' },
  LOADING: { kind: 'public' },
  LOGIN: { kind: 'guest' },
  RESET_PASSWORD: { kind: 'public' },
  SEED_DATA: { kind: 'public' },
  INVITE_ACCEPT: { kind: 'public' },
  B2B_ONBOARDING: { kind: 'auth' },

  // Super admin only
  SUPER_ADMIN_DASHBOARD: { kind: 'auth', roles: ['super_admin'] },
  SUPER_ADMIN_JOBS: { kind: 'auth', roles: ['super_admin'] },
  SUPER_ADMIN_KARMA_TALENTS: { kind: 'auth', roles: ['super_admin'] },
  SUPER_ADMIN_KARMA_PROFILE: { kind: 'auth', roles: ['super_admin'] },
  SUPER_ADMIN_ANALYTICS: { kind: 'auth', roles: ['super_admin'] },
  SUPER_ADMIN_KARMA_AI_CONFIG: { kind: 'auth', roles: ['super_admin'] },
  SUPER_ADMIN_QUESTIONNAIRES: { kind: 'auth', roles: ['super_admin'] },
  SUPER_ADMIN_QUESTIONNAIRE_EDIT: { kind: 'auth', roles: ['super_admin'] },

  // Company admin (super_admin can also access via impersonation)
  ADMIN_DASHBOARD: { kind: 'auth', roles: ['super_admin', 'company_admin'] },
  ADMIN_ORG_CHART: { kind: 'auth', roles: ['super_admin', 'company_admin'] },
  ADMIN_IDENTITY_HUB: { kind: 'auth', roles: ['super_admin', 'company_admin'] },
  ADMIN_COMPANY_PROFILE: { kind: 'auth', roles: ['super_admin', 'company_admin'] },
  ADMIN_OPEN_POSITIONS: { kind: 'auth', roles: ['super_admin', 'company_admin'] },
  ADMIN_POSITION_MATCHING: { kind: 'auth', roles: ['super_admin', 'company_admin'] },
  ADMIN_USER_DETAIL: { kind: 'auth', roles: ['super_admin', 'company_admin'] },
  ADMIN_COMPLIANCE: { kind: 'auth', roles: ['super_admin', 'company_admin'] },
  ADMIN_SPACESYNC: { kind: 'auth', roles: ['super_admin', 'company_admin'] },

  // Company-side talent features
  COMPANY_TALENT_SEARCH: { kind: 'auth', roles: ['super_admin', 'company_admin'] },
  COMPANY_SUBSCRIPTION: { kind: 'auth', roles: ['super_admin', 'company_admin'] },
  COMPANY_CANDIDATE_VIEW: { kind: 'auth', roles: ['super_admin', 'company_admin'] },

  // Authenticated user (any role)
  USER_WELCOME: { kind: 'auth' },
  USER_TEST: { kind: 'auth' },
  USER_CHAT: { kind: 'auth' },
  USER_CLIMATE_TEST: { kind: 'auth' },
  USER_RESULT: { kind: 'auth' },

  // Karma platform (authenticated)
  KARMA_WELCOME: { kind: 'auth' },
  KARMA_CV_REVIEW: { kind: 'auth' },
  KARMA_POST_ONBOARDING: { kind: 'auth' },
  KARMA_ONBOARDING: { kind: 'auth' },
  KARMA_ONBOARDING_STEP: { kind: 'auth' },
  KARMA_DASHBOARD: { kind: 'auth' },
  KARMA_PROFILE_EDIT: { kind: 'auth' },
  KARMA_PROFILE_VIEW: { kind: 'auth', roles: ['super_admin', 'company_admin'] },
  KARMA_TEST_RIASEC: { kind: 'auth' },
  KARMA_TEST_CHAT: { kind: 'auth' },
  KARMA_RESULTS: { kind: 'auth' },

  // Demo flow — public so unauthenticated demo links work
  DEMO_USER_WELCOME: { kind: 'public' },
  DEMO_USER_TEST: { kind: 'public' },
  DEMO_USER_CHAT: { kind: 'public' },
  DEMO_USER_CLIMATE: { kind: 'public' },
  DEMO_USER_RESULT: { kind: 'public' },
};

/**
 * Returns true if the given role can access the given view type, taking
 * authentication into account. Unknown view types default to authenticated-only.
 */
export function canAccessView(
  viewType: ViewType,
  isAuthenticated: boolean,
  role: UserRole,
): boolean {
  const policy = ACCESS_POLICY[viewType] ?? { kind: 'auth' };
  switch (policy.kind) {
    case 'public':
      return true;
    case 'guest':
      return !isAuthenticated;
    case 'auth':
      if (!isAuthenticated) return false;
      if (!policy.roles || policy.roles.length === 0) return true;
      return policy.roles.includes(role);
  }
}
