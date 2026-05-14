import React from 'react';
import {
  Briefcase, Fingerprint, Shield, Building, Search, UserPlus, MapPin, ArrowUpRight,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '../../../components/Card';
import type { ViewState } from '../../../types';

interface QuickModulesPanelProps {
  setView: (view: ViewState) => void;
  onInviteUser?: () => void;
  badges?: {
    compliance?: number;       // # in scadenza
    openPositions?: number;    // # vacanti/hiring
    talentSearch?: number;     // optional new talents
    pendingPeople?: number;    // # test non completati
  };
}

interface ModuleDef {
  icon: LucideIcon;
  label: string;
  description: string;
  onClick: () => void;
  badge?: { value: number; label: string; tone: 'red' | 'amber' | 'blue' | 'emerald' };
  accent: string; // gradient
}

const accentClasses: Record<string, { bg: string; icon: string; ring: string }> = {
  amber:   { bg: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10',  icon: 'text-amber-600 bg-white/80 dark:text-amber-300 dark:bg-gray-800/60', ring: 'group-hover:ring-amber-300/40' },
  purple:  { bg: 'from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/10', icon: 'text-purple-600 bg-white/80 dark:text-purple-300 dark:bg-gray-800/60', ring: 'group-hover:ring-purple-300/40' },
  green:   { bg: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/10', icon: 'text-emerald-600 bg-white/80 dark:text-emerald-300 dark:bg-gray-800/60', ring: 'group-hover:ring-emerald-300/40' },
  blue:    { bg: 'from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/10', icon: 'text-sky-600 bg-white/80 dark:text-sky-300 dark:bg-gray-800/60', ring: 'group-hover:ring-sky-300/40' },
  cyan:    { bg: 'from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/10', icon: 'text-cyan-600 bg-white/80 dark:text-cyan-300 dark:bg-gray-800/60', ring: 'group-hover:ring-cyan-300/40' },
  rose:    { bg: 'from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/10', icon: 'text-rose-600 bg-white/80 dark:text-rose-300 dark:bg-gray-800/60', ring: 'group-hover:ring-rose-300/40' },
  indigo:  { bg: 'from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/10', icon: 'text-indigo-600 bg-white/80 dark:text-indigo-300 dark:bg-gray-800/60', ring: 'group-hover:ring-indigo-300/40' },
};

const badgeToneClasses: Record<string, string> = {
  red:     'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  amber:   'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  blue:    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

export const QuickModulesPanel: React.FC<QuickModulesPanelProps> = ({ setView, onInviteUser, badges = {} }) => {
  const modules: (ModuleDef & { accentKey: keyof typeof accentClasses })[] = [
    {
      icon: Briefcase, label: 'Organigramma', description: 'Struttura e posizioni',
      onClick: () => setView({ type: 'ADMIN_ORG_CHART' }),
      accent: 'amber', accentKey: 'amber',
      badge: badges.openPositions ? { value: badges.openPositions, label: 'aperte', tone: 'amber' } : undefined,
    },
    {
      icon: Search, label: 'Posizioni Aperte', description: 'Hiring e shortlist',
      onClick: () => setView({ type: 'ADMIN_OPEN_POSITIONS' }),
      accent: 'blue', accentKey: 'blue',
      badge: badges.openPositions ? { value: badges.openPositions, label: 'attive', tone: 'blue' } : undefined,
    },
    {
      icon: Shield, label: 'Compliance', description: 'Obblighi e documenti',
      onClick: () => setView({ type: 'ADMIN_COMPLIANCE' }),
      accent: 'green', accentKey: 'green',
      badge: badges.compliance ? { value: badges.compliance, label: 'scadenze', tone: badges.compliance > 0 ? 'red' : 'emerald' } : undefined,
    },
    {
      icon: Fingerprint, label: 'Identity Hub', description: 'Profili RIASEC e cultura',
      onClick: () => setView({ type: 'ADMIN_IDENTITY_HUB' }),
      accent: 'purple', accentKey: 'purple',
      badge: badges.pendingPeople ? { value: badges.pendingPeople, label: 'da testare', tone: 'amber' } : undefined,
    },
    {
      icon: Search, label: 'Talent Search', description: 'Cerca talenti Karma',
      onClick: () => setView({ type: 'COMPANY_TALENT_SEARCH' }),
      accent: 'cyan', accentKey: 'cyan',
      badge: badges.talentSearch ? { value: badges.talentSearch, label: 'nuovi', tone: 'emerald' } : undefined,
    },
    {
      icon: MapPin, label: 'SpaceSync', description: 'Disposizione uffici',
      onClick: () => setView({ type: 'ADMIN_SPACESYNC' }),
      accent: 'rose', accentKey: 'rose',
    },
    {
      icon: Building, label: 'Profilo Azienda', description: 'Dati societari',
      onClick: () => setView({ type: 'ADMIN_COMPANY_PROFILE' }),
      accent: 'indigo', accentKey: 'indigo',
    },
  ];

  if (onInviteUser) {
    modules.push({
      icon: UserPlus, label: 'Invita Utente', description: 'Aggiungi un dipendente',
      onClick: onInviteUser, accent: 'indigo', accentKey: 'indigo',
    });
  }

  return (
    <Card padding="none" className="p-5">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Moduli operativi</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Accesso rapido alle aree che usi ogni giorno.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {modules.map(m => {
          const Icon = m.icon;
          const a = accentClasses[m.accentKey];
          return (
            <button
              key={m.label}
              onClick={m.onClick}
              className={`group relative overflow-hidden text-left rounded-2xl bg-gradient-to-br ${a.bg} p-4 ring-1 ring-transparent ${a.ring} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${a.icon}`}>
                  <Icon size={18} />
                </div>
                <ArrowUpRight size={14} className="text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors" />
              </div>
              <div className="font-bold text-sm text-gray-900 dark:text-gray-100 leading-tight">{m.label}</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">{m.description}</div>
              {m.badge && (
                <div className={`mt-2 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeToneClasses[m.badge.tone]}`}>
                  {m.badge.value} {m.badge.label}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
};
