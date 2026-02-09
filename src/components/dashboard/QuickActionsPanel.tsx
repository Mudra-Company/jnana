import React from 'react';
import { 
  Briefcase, Fingerprint, Shield, Building, Search, UserPlus, LucideIcon 
} from 'lucide-react';
import { Card } from '../../../components/Card';
import type { ViewState } from '../../../types';

interface QuickAction {
  icon: LucideIcon;
  label: string;
  description: string;
  onClick: () => void;
  color: string;
}

interface QuickActionsPanelProps {
  setView: (view: ViewState) => void;
  onInviteUser?: () => void;
}

export const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({ setView, onInviteUser }) => {
  const actions: QuickAction[] = [
    {
      icon: Briefcase,
      label: 'Organigramma',
      description: 'Struttura e posizioni',
      onClick: () => setView({ type: 'ADMIN_ORG_CHART' }),
      color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400',
    },
    {
      icon: Fingerprint,
      label: 'Identity Hub',
      description: 'Profili RIASEC e cultura',
      onClick: () => setView({ type: 'ADMIN_IDENTITY_HUB' }),
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400',
    },
    {
      icon: Shield,
      label: 'Compliance',
      description: 'Obblighi e documenti',
      onClick: () => setView({ type: 'ADMIN_COMPLIANCE' }),
      color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
    },
    {
      icon: Building,
      label: 'Profilo Azienda',
      description: 'Dati societari',
      onClick: () => setView({ type: 'ADMIN_COMPANY_PROFILE' }),
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
    },
    {
      icon: Search,
      label: 'Talent Search',
      description: 'Cerca talenti Karma',
      onClick: () => setView({ type: 'COMPANY_TALENT_SEARCH' }),
      color: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400',
    },
  ];

  if (onInviteUser) {
    actions.push({
      icon: UserPlus,
      label: 'Invita Utente',
      description: 'Aggiungi dipendente',
      onClick: onInviteUser,
      color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400',
    });
  }

  return (
    <Card padding="sm">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
        ⚡ Azioni Rapide
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {actions.map(action => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={action.onClick}
              className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left group"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${action.color}`}>
                <Icon size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-amber-600 transition-colors truncate">
                  {action.label}
                </div>
                <div className="text-[10px] text-gray-400 truncate">{action.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
};
