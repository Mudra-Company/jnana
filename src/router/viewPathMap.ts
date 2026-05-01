import type { ViewState } from '../../types';

/**
 * Bidirectional mapping between ViewState (legacy) and URL paths.
 *
 * Strategy: keep ViewState as source of truth for the existing 1500-line
 * App.tsx render switch, but mirror it to the URL so users get real,
 * shareable, bookmarkable links + browser back/forward.
 *
 * Phase 1 of the routing refactor: add URLs WITHOUT touching view code.
 */

export type ViewType = ViewState['type'];

/** Static one-to-one routes. */
const STATIC_PATHS: Partial<Record<ViewType, string>> = {
  LANDING: '/',
  LOADING: '/',
  LOGIN: '/login',
  RESET_PASSWORD: '/auth/reset-password',
  SEED_DATA: '/seed',

  SUPER_ADMIN_DASHBOARD: '/superadmin',
  SUPER_ADMIN_JOBS: '/superadmin/jobs',
  SUPER_ADMIN_KARMA_TALENTS: '/superadmin/karma',
  SUPER_ADMIN_ANALYTICS: '/superadmin/analytics',
  SUPER_ADMIN_KARMA_AI_CONFIG: '/superadmin/karma-ai',
  SUPER_ADMIN_QUESTIONNAIRES: '/superadmin/questionnaires',

  ADMIN_DASHBOARD: '/admin',
  ADMIN_ORG_CHART: '/admin/org',
  ADMIN_IDENTITY_HUB: '/admin/identity',
  ADMIN_COMPANY_PROFILE: '/admin/company',
  ADMIN_OPEN_POSITIONS: '/admin/positions',
  ADMIN_COMPLIANCE: '/admin/compliance',
  ADMIN_SPACESYNC: '/admin/spacesync',

  KARMA_WELCOME: '/karma/welcome',
  KARMA_CV_REVIEW: '/karma/cv-review',
  KARMA_POST_ONBOARDING: '/karma/post-onboarding',
  KARMA_ONBOARDING: '/karma/onboarding',
  KARMA_DASHBOARD: '/karma',
  KARMA_PROFILE_EDIT: '/karma/profile',
  KARMA_TEST_RIASEC: '/karma/test/riasec',
  KARMA_TEST_CHAT: '/karma/test/chat',
  KARMA_RESULTS: '/karma/results',

  COMPANY_TALENT_SEARCH: '/company/talent',
  COMPANY_SUBSCRIPTION: '/company/subscription',

  DEMO_USER_WELCOME: '/demo/welcome',
  DEMO_USER_TEST: '/demo/test',
  DEMO_USER_CHAT: '/demo/chat',
  DEMO_USER_CLIMATE: '/demo/climate',
  DEMO_USER_RESULT: '/demo/result',
};

/**
 * Convert a ViewState to a URL path.
 * Parameterized views (those carrying ids) are encoded into the path.
 */
export function viewToPath(view: ViewState): string {
  const v: any = view;
  switch (v.type) {
    case 'SUPER_ADMIN_KARMA_PROFILE':
      return `/superadmin/karma/${v.userId}`;
    case 'SUPER_ADMIN_QUESTIONNAIRE_EDIT':
      return `/superadmin/questionnaires/${v.questionnaireId}`;
    case 'ADMIN_USER_DETAIL':
      return `/admin/users/${v.userId}`;
    case 'ADMIN_POSITION_MATCHING': {
      const tab = v.initialTab ? `?tab=${v.initialTab}` : '';
      return `/admin/positions/${v.positionId}${tab}`;
    }
    case 'USER_WELCOME':
      return `/test/welcome/${v.userId}`;
    case 'USER_TEST':
      return `/test/riasec/${v.userId}`;
    case 'USER_CHAT':
      return `/test/chat/${v.userId}`;
    case 'USER_CLIMATE_TEST':
      return `/test/climate/${v.userId}`;
    case 'USER_RESULT':
      return `/me/${v.userId}`;
    case 'KARMA_PROFILE_VIEW':
      return `/karma/profile/${v.userId}`;
    case 'KARMA_ONBOARDING_STEP':
      return `/karma/onboarding/${v.step}`;
    case 'COMPANY_CANDIDATE_VIEW':
      return `/company/candidate/${v.userId}`;
    case 'LOGIN':
      // Preserve authMode in query for landing → login navigation.
      return v.authMode ? `/login?mode=${v.authMode}` : '/login';
    default:
      return STATIC_PATHS[v.type as ViewType] ?? '/';
  }
}

/**
 * Parse a URL path back into a ViewState. Returns null when no match
 * (the existing redirect logic in App.tsx handles the fallback).
 */
export function pathToView(pathname: string, search = ''): ViewState | null {
  // Static map first (fast path)
  for (const [type, path] of Object.entries(STATIC_PATHS)) {
    if (path === pathname) {
      if (type === 'LOGIN') {
        const params = new URLSearchParams(search);
        const mode = params.get('mode');
        if (mode === 'jnana' || mode === 'karma') {
          return { type: 'LOGIN', authMode: mode } as ViewState;
        }
      }
      return { type } as ViewState;
    }
  }

  // Parameterized routes
  const parts = pathname.split('/').filter(Boolean);

  if (parts[0] === 'superadmin' && parts[1] === 'karma' && parts[2]) {
    return { type: 'SUPER_ADMIN_KARMA_PROFILE', userId: parts[2] } as ViewState;
  }
  if (parts[0] === 'superadmin' && parts[1] === 'questionnaires' && parts[2]) {
    return { type: 'SUPER_ADMIN_QUESTIONNAIRE_EDIT', questionnaireId: parts[2] } as ViewState;
  }
  if (parts[0] === 'admin' && parts[1] === 'users' && parts[2]) {
    return { type: 'ADMIN_USER_DETAIL', userId: parts[2] } as ViewState;
  }
  if (parts[0] === 'admin' && parts[1] === 'positions' && parts[2]) {
    const params = new URLSearchParams(search);
    const tab = params.get('tab');
    const view: any = { type: 'ADMIN_POSITION_MATCHING', positionId: parts[2] };
    if (tab === 'internal' || tab === 'external' || tab === 'shortlist') {
      view.initialTab = tab;
    }
    return view as ViewState;
  }
  if (parts[0] === 'test' && parts[2]) {
    const map: Record<string, string> = {
      welcome: 'USER_WELCOME',
      riasec: 'USER_TEST',
      chat: 'USER_CHAT',
      climate: 'USER_CLIMATE_TEST',
    };
    const t = map[parts[1]];
    if (t) return { type: t, userId: parts[2] } as ViewState;
  }
  if (parts[0] === 'me' && parts[1]) {
    return { type: 'USER_RESULT', userId: parts[1] } as ViewState;
  }
  if (parts[0] === 'karma' && parts[1] === 'profile' && parts[2]) {
    return { type: 'KARMA_PROFILE_VIEW', userId: parts[2] } as ViewState;
  }
  if (parts[0] === 'karma' && parts[1] === 'onboarding' && parts[2]) {
    return { type: 'KARMA_ONBOARDING_STEP', step: Number(parts[2]) } as ViewState;
  }
  if (parts[0] === 'company' && parts[1] === 'candidate' && parts[2]) {
    return { type: 'COMPANY_CANDIDATE_VIEW', userId: parts[2] } as ViewState;
  }

  return null;
}
