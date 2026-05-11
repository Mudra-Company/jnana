import React, { useEffect, useRef, useState } from 'react';
import { User as UserIcon, Sun, Moon, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../src/hooks/useAuth';

interface Props {
  isDark: boolean;
  toggleTheme: () => void;
  onLogout: () => void;
  onMyProfile?: () => void;
  isSuperAdminMode: boolean;
  userRole: 'super_admin' | 'company_admin' | 'user';
  activeCompanyName?: string;
}

export const UserMenu: React.FC<Props> = ({
  isDark, toggleTheme, onLogout, onMyProfile, isSuperAdminMode, userRole, activeCompanyName,
}) => {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const firstName = profile?.first_name || '';
  const lastName = profile?.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim() || user?.email || 'Utente';
  const email = user?.email || '';
  const initials = (firstName[0] || email[0] || '?').toUpperCase() + (lastName[0] || '').toUpperCase();
  const avatarUrl = (profile as any)?.avatar_url as string | undefined;

  const roleBadge = isSuperAdminMode && activeCompanyName
    ? `Admin di ${activeCompanyName} (Supervisione)`
    : userRole === 'super_admin'
      ? 'Super Admin'
      : userRole === 'company_admin'
        ? activeCompanyName ? `Admin di ${activeCompanyName}` : 'Admin'
        : 'Membro';

  const ringColor = isSuperAdminMode ? 'ring-amber-500' : 'ring-jnana-sage';
  const bgAvatar = isSuperAdminMode ? 'bg-amber-600' : 'bg-jnana-sage';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ring-1 ${open ? ringColor : 'ring-transparent'}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={fullName} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className={`w-8 h-8 rounded-full ${bgAvatar} text-white flex items-center justify-center text-xs font-bold`}>
            {initials}
          </div>
        )}
        <ChevronDown size={14} className="text-gray-500 dark:text-gray-400" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-72 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden z-[70] animate-fade-in"
        >
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img src={avatarUrl} alt={fullName} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className={`w-10 h-10 rounded-full ${bgAvatar} text-white flex items-center justify-center text-sm font-bold`}>
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <div className="font-semibold text-jnana-text dark:text-gray-100 truncate">{fullName}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{email}</div>
              </div>
            </div>
            <div className="mt-2 inline-block text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              {roleBadge}
            </div>
          </div>

          <div className="py-1">
            {onMyProfile && (
              <button
                onClick={() => { setOpen(false); onMyProfile(); }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-jnana-text dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <UserIcon size={16} className="text-gray-500 dark:text-gray-400" />
                Il mio profilo
              </button>
            )}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between gap-3 px-4 py-2 text-sm text-jnana-text dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="flex items-center gap-3">
                {isDark ? <Moon size={16} className="text-gray-500 dark:text-gray-400" /> : <Sun size={16} className="text-gray-500 dark:text-gray-400" />}
                Modalità scura
              </span>
              <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isDark ? 'bg-jnana-sage' : 'bg-gray-300 dark:bg-gray-700'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDark ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </span>
            </button>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 py-1">
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut size={16} />
              Esci
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
