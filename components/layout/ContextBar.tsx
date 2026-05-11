import React from 'react';
import {
  ArrowLeft, Database, Globe, Network, LayoutDashboard, Fingerprint, Settings,
  Building, Sparkles, BarChart3, Bot, ShieldCheck, MapPin,
} from 'lucide-react';
import { ViewState, CompanyProfile } from '../../types';

type UserRole = 'super_admin' | 'company_admin' | 'user';

interface Tab {
  key: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  accent?: string; // active accent color class (text + underline)
}

interface Props {
  view: ViewState;
  userRole: UserRole;
  isSuperAdminMode: boolean;
  activeCompany?: CompanyProfile;
  canGoBack: boolean;
  onBack: () => void;

  // admin nav
  onAdminHome: () => void;
  onOrgChart: () => void;
  onIdentityHub: () => void;
  onCompanyProfile: () => void;
  onCompliance?: () => void;
  onSpaceSync?: () => void;

  // super admin nav
  onSuperAdminHome: () => void;
  onJobDb: () => void;
  onKarmaTalents?: () => void;
  onKarmaAIConfig?: () => void;
  onAnalytics?: () => void;
  onQuestionnaires?: () => void;
}

const TabButton: React.FC<{ tab: Tab }> = ({ tab }) => {
  const accent = tab.accent || 'text-jnana-sage border-jnana-sage';
  return (
    <button
      onClick={tab.onClick}
      className={`relative inline-flex items-center gap-2 px-3 h-12 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
        tab.active
          ? `${accent}`
          : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-jnana-text dark:hover:text-gray-100'
      }`}
    >
      {tab.icon}
      {tab.label}
    </button>
  );
};

export const ContextBar: React.FC<Props> = (p) => {
  const { view, userRole, isSuperAdminMode, activeCompany, canGoBack, onBack } = p;

  const showSuperAdminNav = userRole === 'super_admin' && (view.type.startsWith('SUPER_ADMIN') || view.type === 'SUPER_ADMIN_KARMA_TALENTS');
  const showAdminNav = (userRole === 'super_admin' || userRole === 'company_admin') &&
    activeCompany &&
    (view.type.startsWith('ADMIN') || view.type === 'USER_RESULT');

  let tabs: Tab[] = [];
  let sectionLabel = '';

  if (showSuperAdminNav) {
    sectionLabel = 'Super Admin';
    const amber = 'text-amber-600 border-amber-600';
    const violet = 'text-violet-600 border-violet-600';
    const emerald = 'text-emerald-600 border-emerald-600';
    const blue = 'text-blue-600 border-blue-600';
    const teal = 'text-teal-600 border-teal-600';
    tabs = [
      { key: 'companies', label: 'Aziende', icon: <Globe size={16} />, active: view.type === 'SUPER_ADMIN_DASHBOARD', onClick: p.onSuperAdminHome, accent: amber },
      { key: 'jobs', label: 'DB Lavori', icon: <Database size={16} />, active: view.type === 'SUPER_ADMIN_JOBS', onClick: p.onJobDb, accent: amber },
      ...(p.onKarmaTalents ? [{ key: 'karma', label: 'Karma Talents', icon: <Sparkles size={16} />, active: view.type === 'SUPER_ADMIN_KARMA_TALENTS' || view.type === 'SUPER_ADMIN_KARMA_PROFILE', onClick: p.onKarmaTalents, accent: violet }] : []),
      ...(p.onKarmaAIConfig ? [{ key: 'karmaai', label: 'Karma AI', icon: <Bot size={16} />, active: view.type === 'SUPER_ADMIN_KARMA_AI_CONFIG', onClick: p.onKarmaAIConfig, accent: emerald }] : []),
      ...(p.onAnalytics ? [{ key: 'analytics', label: 'Analytics', icon: <BarChart3 size={16} />, active: view.type === 'SUPER_ADMIN_ANALYTICS', onClick: p.onAnalytics, accent: blue }] : []),
      ...(p.onQuestionnaires ? [{ key: 'q', label: 'Questionari', icon: <Settings size={16} />, active: view.type === 'SUPER_ADMIN_QUESTIONNAIRES' || view.type === 'SUPER_ADMIN_QUESTIONNAIRE_EDIT', onClick: p.onQuestionnaires, accent: teal }] : []),
    ];
  } else if (showAdminNav) {
    sectionLabel = 'Admin Console';
    const sage = 'text-jnana-sage border-jnana-sage';
    const rose = 'text-rose-600 border-rose-600';
    const emerald = 'text-emerald-600 border-emerald-600';
    tabs = [
      { key: 'org', label: 'Organigramma', icon: <Network size={16} />, active: view.type === 'ADMIN_ORG_CHART', onClick: p.onOrgChart, accent: sage },
      { key: 'dash', label: 'Dashboard', icon: <LayoutDashboard size={16} />, active: view.type === 'ADMIN_DASHBOARD', onClick: p.onAdminHome, accent: sage },
      { key: 'id', label: 'Identity Hub', icon: <Fingerprint size={16} />, active: view.type === 'ADMIN_IDENTITY_HUB', onClick: p.onIdentityHub, accent: sage },
      { key: 'co', label: 'Azienda', icon: <Settings size={16} />, active: view.type === 'ADMIN_COMPANY_PROFILE', onClick: p.onCompanyProfile, accent: sage },
      ...(p.onSpaceSync ? [{ key: 'ss', label: 'SpaceSync', icon: <MapPin size={16} />, active: view.type === 'ADMIN_SPACESYNC', onClick: p.onSpaceSync, accent: rose }] : []),
      ...(p.onCompliance ? [{ key: 'cm', label: 'Compliance', icon: <ShieldCheck size={16} />, active: view.type === 'ADMIN_COMPLIANCE', onClick: p.onCompliance, accent: emerald }] : []),
    ];
  }

  // If no tabs and no back arrow, hide the bar entirely.
  if (tabs.length === 0 && !canGoBack) return null;

  return (
    <div className="bg-white dark:bg-gray-900 sticky top-14 z-40 border-b border-gray-200 dark:border-gray-800">
      <div className="px-6 lg:px-10 flex items-center gap-2 h-12">
        {canGoBack && (
          <button
            onClick={onBack}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors mr-1"
            title="Torna indietro"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        {sectionLabel && (
          <span className="hidden lg:inline text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-bold mr-2 border-r border-gray-200 dark:border-gray-700 pr-3">
            {sectionLabel}
          </span>
        )}
        <div className="flex items-center gap-1 overflow-x-auto flex-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map(t => <TabButton key={t.key} tab={t} />)}
        </div>
        {showAdminNav && activeCompany && (
          <div className={`hidden md:inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border ${
            isSuperAdminMode
              ? 'border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800'
              : 'border-gray-200 bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
          }`}>
            <Building size={13} />
            <span className="truncate max-w-[160px]">{activeCompany.name}</span>
          </div>
        )}
      </div>
    </div>
  );
};
