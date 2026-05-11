import React from 'react';
import { Hexagon } from 'lucide-react';
import { UserMenu } from './UserMenu';

interface Props {
  isSuperAdminMode: boolean;
  userRole: 'super_admin' | 'company_admin' | 'user';
  onHome: () => void;
  isDark: boolean;
  toggleTheme: () => void;
  onLogout: () => void;
  onMyProfile?: () => void;
  activeCompanyName?: string;
}

export const GlobalBar: React.FC<Props> = ({
  isSuperAdminMode, userRole, onHome, isDark, toggleTheme, onLogout, onMyProfile, activeCompanyName,
}) => (
  <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 h-14 flex items-center justify-between px-6 lg:px-10 transition-colors">
    <button
      onClick={onHome}
      className="flex items-center gap-2.5 group"
    >
      <span className={`transition-transform duration-300 group-hover:scale-110 ${isSuperAdminMode ? 'text-amber-600' : 'text-jnana-sage'}`}>
        <Hexagon size={26} strokeWidth={2.5} />
      </span>
      <span className="font-brand font-semibold text-xl text-jnana-text dark:text-gray-100 tracking-tight lowercase leading-none pt-0.5">
        {isSuperAdminMode ? 'mudra' : 'jnana'}
      </span>
    </button>

    <div className="flex items-center gap-2">
      <UserMenu
        isDark={isDark}
        toggleTheme={toggleTheme}
        onLogout={onLogout}
        onMyProfile={onMyProfile}
        isSuperAdminMode={isSuperAdminMode}
        userRole={userRole}
        activeCompanyName={activeCompanyName}
      />
    </div>
  </div>
);
