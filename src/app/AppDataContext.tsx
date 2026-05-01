import React, { createContext, useContext } from 'react';
import type {
  ViewState,
  User,
  CompanyProfile,
  JobDatabase,
  RiasecScore,
  ChatMessage,
  ClimateData,
  OrgNode,
} from '../../types';
import type { UserRole } from '../hooks/useRouteGuard';

/**
 * Centralized app state + actions, extracted from AppContent in App.tsx.
 *
 * Phase 5 (anticipated) of the routing refactor: lifts the props/handlers
 * that every view consumes into a single context, so route components
 * (next step) can read them with `useAppData()` instead of receiving
 * dozens of props from a god-component.
 *
 * IMPORTANT: This context preserves the exact same shape and semantics as
 * the inline state in AppContent. We are NOT changing behavior — only
 * lifting it so the next refactor (route tree) is mechanical.
 */

export interface AppDataValue {
  // ===== Auth-derived =====
  user: any;
  profile: any;
  membership: any;
  isSuperAdmin: boolean;
  isCompanyAdmin: boolean;
  userRole: UserRole | null;
  canAccessAdminViews: boolean;
  canAccessSuperAdminViews: boolean;

  // ===== Routing =====
  view: ViewState;
  setView: (v: ViewState) => void;
  navigate: (v: ViewState) => void;
  goBack: () => void;
  viewHistory: ViewState[];

  // ===== Domain state =====
  currentUserData: User | null;
  setCurrentUserData: React.Dispatch<React.SetStateAction<User | null>>;
  companyUsers: User[];
  setCompanyUsers: React.Dispatch<React.SetStateAction<User[]>>;
  activeCompanyData: CompanyProfile | null;
  setActiveCompanyData: React.Dispatch<React.SetStateAction<CompanyProfile | null>>;
  companies: any[];
  legacyCompanies: CompanyProfile[];
  jobDb: JobDatabase;
  setJobDb: React.Dispatch<React.SetStateAction<JobDatabase>>;

  // ===== Theme =====
  isDark: boolean;
  toggleTheme: () => void;

  // ===== Super admin =====
  superAdminDataLoading: boolean;
  impersonatedCompanyId: string | null;
  loadCompanyData: (companyId: string) => Promise<void>;
  handleImpersonate: (companyId: string) => Promise<void>;
  handleExitImpersonation: () => void;
  handleCreateCompany: (data: any) => Promise<boolean>;

  // ===== Demo mode =====
  isDemoMode: boolean;
  demoUserData: User | null;
  handleStartDemoMode: () => void;
  handleExitDemoMode: () => void;
  handleDemoTestComplete: (score: RiasecScore) => Promise<void>;
  handleDemoKarmaComplete: (transcript: ChatMessage[]) => Promise<void>;
  handleDemoClimateComplete: (data: ClimateData) => void;

  // ===== User flow handlers =====
  handleLogout: () => Promise<void>;
  handleTestComplete: (score: RiasecScore) => Promise<void>;
  handleKarmaComplete: (transcript: ChatMessage[]) => Promise<void>;
  handleClimateComplete: (data: ClimateData) => Promise<void>;
  handleOrgChartUpdate: (root: OrgNode) => Promise<void>;
  handleCompanyUpdate: (company: CompanyProfile) => Promise<void>;
  handleGoToMyProfile: () => void;

  // ===== Misc =====
  pendingInviteData: { inviteId: string; companyId: string; companyName?: string } | null;
  cvParsedData: any;
  setCvParsedData: React.Dispatch<React.SetStateAction<any>>;
}

const AppDataContext = createContext<AppDataValue | null>(null);

export const AppDataProvider: React.FC<{
  value: AppDataValue;
  children: React.ReactNode;
}> = ({ value, children }) => (
  <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
);

/** Read the full app data context. Throws if used outside the provider. */
export function useAppData(): AppDataValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error('useAppData() must be used inside <AppDataProvider>');
  }
  return ctx;
}

/** Optional variant for components that may render outside the provider. */
export function useAppDataOptional(): AppDataValue | null {
  return useContext(AppDataContext);
}
