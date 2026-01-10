// Route path constants - single source of truth for all URL paths
export const ROUTES = {
  // Public
  HOME: '/',
  
  // Auth
  AUTH: '/auth',
  AUTH_LOGIN: '/auth/login',
  AUTH_RESET_PASSWORD: '/auth/reset-password',
  
  // Super Admin
  SUPER_ADMIN: '/super-admin',
  SUPER_ADMIN_JOBS: '/super-admin/jobs',
  SUPER_ADMIN_KARMA_TALENTS: '/super-admin/karma-talents',
  SUPER_ADMIN_KARMA_PROFILE: '/super-admin/karma-talents/:userId',
  SUPER_ADMIN_ANALYTICS: '/super-admin/analytics',
  SUPER_ADMIN_KARMA_CONFIG: '/super-admin/karma-config',
  
  // Admin (Company)
  ADMIN: '/admin',
  ADMIN_ORG_CHART: '/admin/org-chart',
  ADMIN_IDENTITY_HUB: '/admin/identity-hub',
  ADMIN_COMPANY_PROFILE: '/admin/company-profile',
  ADMIN_OPEN_POSITIONS: '/admin/positions',
  ADMIN_POSITION_MATCHING: '/admin/positions/:positionId/matching',
  
  // User (Jnana employee)
  USER_WELCOME: '/user/:userId/welcome',
  USER_TEST: '/user/:userId/test',
  USER_CLIMATE: '/user/:userId/climate',
  USER_CHAT: '/user/:userId/chat',
  USER_RESULT: '/user/:userId/result',
  
  // Karma Platform (B2C)
  KARMA: '/karma',
  KARMA_ONBOARDING: '/karma/onboarding',
  KARMA_PROFILE_EDIT: '/karma/profile/edit',
  KARMA_TEST_RIASEC: '/karma/test/riasec',
  KARMA_TEST_CHAT: '/karma/test/chat',
  KARMA_RESULTS: '/karma/results',
  
  // Demo mode
  DEMO: '/demo',
  DEMO_WELCOME: '/demo/welcome',
  DEMO_TEST: '/demo/test',
  DEMO_CLIMATE: '/demo/climate',
  DEMO_CHAT: '/demo/chat',
  DEMO_RESULT: '/demo/result',
  
  // Seed data (development)
  SEED_DATA: '/seed-data',
} as const;

// Helper to build dynamic routes
export const buildRoute = {
  superAdminKarmaProfile: (userId: string) => 
    ROUTES.SUPER_ADMIN_KARMA_PROFILE.replace(':userId', userId),
  adminPositionMatching: (positionId: string) => 
    ROUTES.ADMIN_POSITION_MATCHING.replace(':positionId', positionId),
  userWelcome: (userId: string) => 
    ROUTES.USER_WELCOME.replace(':userId', userId),
  userTest: (userId: string) => 
    ROUTES.USER_TEST.replace(':userId', userId),
  userClimate: (userId: string) => 
    ROUTES.USER_CLIMATE.replace(':userId', userId),
  userChat: (userId: string) => 
    ROUTES.USER_CHAT.replace(':userId', userId),
  userResult: (userId: string) => 
    ROUTES.USER_RESULT.replace(':userId', userId),
};
