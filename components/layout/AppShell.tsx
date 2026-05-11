import React from 'react';
import { ViewState, CompanyProfile } from '../../types';
import { SupervisionBanner } from './SupervisionBanner';
import { GlobalBar } from './GlobalBar';
import { ContextBar } from './ContextBar';

type UserRole = 'super_admin' | 'company_admin' | 'user';

interface Props {
  onLogout: () => void;
  view: ViewState;
  onAdminHome: () => void;
  onOrgChart: () => void;
  onIdentityHub: () => void;
  onCompanyProfile: () => void;
  onCompliance?: () => void;
  onSpaceSync?: () => void;

  onSuperAdminHome: () => void;
  onJobDb: () => void;
  onKarmaTalents?: () => void;
  onKarmaAIConfig?: () => void;
  onAnalytics?: () => void;
  onQuestionnaires?: () => void;
  activeCompany?: CompanyProfile;
  isSuperAdminMode: boolean;
  onExitImpersonation: () => void;
  isDark: boolean;
  toggleTheme: () => void;
  onBack: () => void;
  canGoBack: boolean;
  userRole: UserRole;
  onMyProfile?: () => void;
  hasCompanyMembership?: boolean;
}

export const AppShell: React.FC<Props> = (p) => {
  const homeFn = p.isSuperAdminMode
    ? p.onSuperAdminHome
    : p.userRole === 'super_admin'
      ? p.onSuperAdminHome
      : p.onAdminHome;

  return (
    <>
      {p.isSuperAdminMode && p.activeCompany && (
        <SupervisionBanner companyName={p.activeCompany.name} onExit={p.onExitImpersonation} />
      )}
      <GlobalBar
        isSuperAdminMode={p.isSuperAdminMode}
        userRole={p.userRole}
        onHome={homeFn}
        isDark={p.isDark}
        toggleTheme={p.toggleTheme}
        onLogout={p.onLogout}
        onMyProfile={p.hasCompanyMembership ? p.onMyProfile : undefined}
        activeCompanyName={p.activeCompany?.name}
      />
      <ContextBar
        view={p.view}
        userRole={p.userRole}
        isSuperAdminMode={p.isSuperAdminMode}
        activeCompany={p.activeCompany}
        canGoBack={p.canGoBack}
        onBack={p.onBack}
        onAdminHome={p.onAdminHome}
        onOrgChart={p.onOrgChart}
        onIdentityHub={p.onIdentityHub}
        onCompanyProfile={p.onCompanyProfile}
        onCompliance={p.onCompliance}
        onSpaceSync={p.onSpaceSync}
        onSuperAdminHome={p.onSuperAdminHome}
        onJobDb={p.onJobDb}
        onKarmaTalents={p.onKarmaTalents}
        onKarmaAIConfig={p.onKarmaAIConfig}
        onAnalytics={p.onAnalytics}
        onQuestionnaires={p.onQuestionnaires}
      />
    </>
  );
};
