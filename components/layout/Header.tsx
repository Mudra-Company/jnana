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
  ArrowLeft
} from 'lucide-react';
import { Button } from '../Button';
import { ViewState, CompanyProfile } from '../../types';

interface HeaderProps {
  onLogout: () => void;
  view: ViewState;
  onAdminHome: () => void;
  onOrgChart: () => void;
  onIdentityHub: () => void;
  onCompanyProfile: () => void;
  onSuperAdminHome: () => void;
  onJobDb: () => void;
  activeCompany?: CompanyProfile;
  isSuperAdminMode: boolean;
  onExitImpersonation: () => void;
  isDark: boolean;
  toggleTheme: () => void;
  onBack: () => void;
  canGoBack: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  onLogout, view, onAdminHome, onOrgChart, onIdentityHub, onCompanyProfile,
  onSuperAdminHome, onJobDb, activeCompany, isSuperAdminMode, onExitImpersonation,
  isDark, toggleTheme, onBack, canGoBack
}) => (
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
          onClick={isSuperAdminMode && !activeCompany ? onSuperAdminHome : onAdminHome}
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

        {view.type.startsWith('SUPER_ADMIN') && (
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
          </div>
        )}

        {activeCompany && (view.type.startsWith('ADMIN') || view.type === 'ADMIN_USER_DETAIL') && (
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
            </div>
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 border-l border-gray-200 dark:border-gray-700 pl-4 bg-gray-50/50 dark:bg-gray-800/50 px-3 py-1 rounded-r-full">
              <Building size={14} />
              <span className="font-medium text-gray-700 dark:text-gray-300">{activeCompany.name}</span>
            </div>
          </>
        )}
        
        <Button variant="ghost" size="sm" onClick={onLogout}>
          <LogOut size={16} className="mr-2" />
          <span className="hidden sm:inline">Esci</span>
        </Button>
      </div>
    </nav>
  </>
);