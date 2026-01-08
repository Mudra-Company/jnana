import React from 'react';
import { 
  Hexagon, 
  Database, 
  Globe, 
  Network, 
  LayoutDashboard, 
  Fingerprint, 
  Settings, 
  Building, 
  LogOut, 
  Sun, 
  Moon,
  ArrowLeft,
  Sparkles,
  BarChart3,
  User
} from 'lucide-react';
import { Button } from '../Button';
import { ViewState, CompanyProfile } from '../../types';

type UserRole = 'super_admin' | 'company_admin' | 'user';

interface HeaderProps {
  onLogout: () => void;
  view: ViewState;
  onAdminHome: () => void;
  onOrgChart: () => void;
  onIdentityHub: () => void;
  onCompanyProfile: () => void;
  
  onSuperAdminHome: () => void;
  onJobDb: () => void;
  onKarmaTalents?: () => void;
  onAnalytics?: () => void;
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

export const Header: React.FC<HeaderProps> = ({ 
  onLogout, view, onAdminHome, onOrgChart, onIdentityHub, onCompanyProfile,
  onSuperAdminHome, onJobDb, onKarmaTalents, onAnalytics, activeCompany, isSuperAdminMode, onExitImpersonation,
  isDark, toggleTheme, onBack, canGoBack, userRole, onMyProfile, hasCompanyMembership
}) => {
  // Determine what navigation to show based on role
  const showSuperAdminNav = userRole === 'super_admin' && (view.type.startsWith('SUPER_ADMIN') || view.type === 'SUPER_ADMIN_KARMA_TALENTS');
  const showAdminNav = (userRole === 'super_admin' || userRole === 'company_admin') && 
    activeCompany && 
    (view.type.startsWith('ADMIN') || view.type === 'USER_RESULT');
  const showUserNav = userRole === 'user';

  return (
  <>
    {isSuperAdminMode && activeCompany && (
      <div className="bg-amber-600 text-white px-4 py-2 text-sm font-bold flex justify-between items-center shadow-md relative z-[60]">
        <div className="flex items-center gap-2">
          <Settings size={16} />
          <span>MODALITÀ SUPERVISIONE: Stai operando come Admin in {activeCompany.name}</span>
        </div>
        <button 
          onClick={onExitImpersonation} 
          className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-xs uppercase tracking-wider transition-colors"
        >
          Esci da {activeCompany.name}
        </button>
      </div>
    )}
    <nav className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700 h-20 flex items-center justify-between px-6 lg:px-12 shadow-sm transition-colors duration-300">
      <div className="flex items-center gap-2">
        {canGoBack && (
          <button 
            onClick={onBack} 
            className="p-2 mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-all hover:scale-110"
            title="Torna indietro"
          >
            <ArrowLeft size={24} />
          </button>
        )}
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={isSuperAdminMode ? onSuperAdminHome : onAdminHome}
        >
          <div className={`transition-transform duration-300 group-hover:scale-110 ${isSuperAdminMode ? 'text-amber-600' : 'text-jnana-sage'}`}>
            <Hexagon size={32} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="font-brand font-semibold text-2xl text-jnana-text dark:text-gray-100 tracking-tight pt-1 lowercase leading-none">
              {isSuperAdminMode ? 'mudra' : 'jnana'}
            </span>
            {isSuperAdminMode && <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Admin Console</span>}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleTheme} 
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
           {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Super Admin Navigation */}
        {showSuperAdminNav && (
          <div className="hidden md:flex items-center gap-2">
            <Button 
              variant={view.type === 'SUPER_ADMIN_JOBS' ? 'primary' : 'ghost'} 
              size="sm"
              onClick={onJobDb}
              className={view.type === 'SUPER_ADMIN_JOBS' ? '!bg-amber-600' : ''}
            >
              <Database size={16} className="mr-2" />
              DB Lavori
            </Button>
            <Button 
              variant={view.type === 'SUPER_ADMIN_DASHBOARD' ? 'primary' : 'ghost'} 
              size="sm"
              onClick={onSuperAdminHome}
              className={view.type === 'SUPER_ADMIN_DASHBOARD' ? '!bg-amber-600' : ''}
            >
              <Globe size={16} className="mr-2" />
              Aziende
            </Button>
            {onKarmaTalents && (
              <Button 
                variant={view.type === 'SUPER_ADMIN_KARMA_TALENTS' || view.type === 'SUPER_ADMIN_KARMA_PROFILE' ? 'primary' : 'ghost'} 
                size="sm"
                onClick={onKarmaTalents}
                className={view.type === 'SUPER_ADMIN_KARMA_TALENTS' || view.type === 'SUPER_ADMIN_KARMA_PROFILE' ? '!bg-violet-600' : ''}
              >
                <Sparkles size={16} className="mr-2" />
                Karma Talents
              </Button>
            )}
            {onAnalytics && (
              <Button 
                variant={view.type === 'SUPER_ADMIN_ANALYTICS' ? 'primary' : 'ghost'} 
                size="sm"
                onClick={onAnalytics}
                className={view.type === 'SUPER_ADMIN_ANALYTICS' ? '!bg-blue-600' : ''}
              >
                <BarChart3 size={16} className="mr-2" />
                Analytics
              </Button>
            )}
          </div>
        )}

        {/* Company Admin Navigation (also shown to Super Admin when impersonating) */}
        {showAdminNav && (
          <>
            <div className="hidden md:flex items-center gap-2">
              <Button 
                variant={view.type === 'ADMIN_ORG_CHART' ? 'primary' : 'ghost'} 
                size="sm"
                onClick={onOrgChart}
              >
                <Network size={16} className="mr-2" />
                Organigramma
              </Button>
              <Button 
                variant={view.type === 'ADMIN_DASHBOARD' ? 'primary' : 'ghost'} 
                size="sm"
                onClick={onAdminHome}
              >
                <LayoutDashboard size={16} className="mr-2" />
                Dashboard
              </Button>
              <Button 
                variant={view.type === 'ADMIN_IDENTITY_HUB' ? 'primary' : 'ghost'} 
                size="sm"
                onClick={onIdentityHub}
              >
                <Fingerprint size={16} className="mr-2" />
                Identity Hub
              </Button>
              <Button 
                variant={view.type === 'ADMIN_COMPANY_PROFILE' ? 'primary' : 'ghost'} 
                size="sm"
                onClick={onCompanyProfile}
              >
                <Settings size={16} className="mr-2" />
                Azienda
              </Button>
              {/* My Profile button for admins who are also company members */}
              {onMyProfile && hasCompanyMembership && (
                <Button 
                  variant={view.type === 'USER_RESULT' || view.type === 'USER_WELCOME' ? 'primary' : 'ghost'} 
                  size="sm"
                  onClick={onMyProfile}
                >
                  <User size={16} className="mr-2" />
                  Il Mio Profilo
                </Button>
              )}
            </div>
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 border-l border-gray-200 dark:border-gray-700 pl-4 bg-gray-50/50 dark:bg-gray-800/50 px-3 py-1 rounded-r-full">
              <Building size={14} />
              <span className="font-medium text-gray-700 dark:text-gray-300">{activeCompany.name}</span>
            </div>
          </>
        )}

        {/* User Navigation - only shown to regular users */}
        {showUserNav && (
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Fingerprint size={16} />
            <span className="font-medium">Il Mio Profilo</span>
          </div>
        )}
        
        <Button variant="ghost" size="sm" onClick={onLogout}>
          <LogOut size={16} className="mr-2" />
          <span className="hidden sm:inline">Esci</span>
        </Button>
      </div>
    </nav>
  </>
  );
};