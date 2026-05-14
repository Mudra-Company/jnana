import React, { useMemo, useState } from 'react';
import { AlertTriangle, ShieldAlert, Briefcase, UserCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card } from '../../../components/Card';
import type { CompanyRole } from '../../types/roles';
import type { ComplianceItem } from '../../types/compliance';

interface LegacyHiringPosition {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  isHiring?: boolean;
}

type FocusCategory = 'urgent' | 'compliance' | 'hiring' | 'people';

interface FocusItem {
  id: string;
  category: FocusCategory;
  severity: 'high' | 'medium' | 'low';
  message: string;
  meta?: string;
  cta?: { label: string; onClick: () => void };
}

interface TodaysFocusPanelProps {
  vacantRoles: CompanyRole[];
  legacyHiringPositions?: LegacyHiringPosition[];
  hiringRoles: CompanyRole[];
  expiringCompliance: ComplianceItem[];
  pendingTestUsers: { id: string; firstName: string; lastName: string }[];
  onNavigateToRole?: (roleId: string) => void;
  onNavigateToCompliance?: () => void;
  onNavigateToOpenPositions?: () => void;
}

const tabsConfig: { key: FocusCategory; label: string; icon: typeof AlertTriangle }[] = [
  { key: 'urgent',     label: 'Urgenti',    icon: AlertTriangle },
  { key: 'compliance', label: 'Compliance', icon: ShieldAlert },
  { key: 'hiring',     label: 'Hiring',     icon: Briefcase },
  { key: 'people',     label: 'Persone',    icon: UserCheck },
];

const severityClasses: Record<FocusItem['severity'], { dot: string; text: string }> = {
  high:   { dot: 'bg-red-500',    text: 'text-red-600 dark:text-red-400' },
  medium: { dot: 'bg-amber-500',  text: 'text-amber-600 dark:text-amber-400' },
  low:    { dot: 'bg-blue-500',   text: 'text-blue-600 dark:text-blue-400' },
};

export const TodaysFocusPanel: React.FC<TodaysFocusPanelProps> = ({
  vacantRoles,
  legacyHiringPositions = [],
  hiringRoles,
  expiringCompliance,
  pendingTestUsers,
  onNavigateToRole,
  onNavigateToCompliance,
  onNavigateToOpenPositions,
}) => {
  const items = useMemo<FocusItem[]>(() => {
    const list: FocusItem[] = [];

    // Compliance
    expiringCompliance.forEach(item => {
      const days = item.daysUntilExpiry;
      if (days === null || days === undefined) return;
      if (days <= 0) {
        list.push({
          id: `c-exp-${item.id}`,
          category: 'compliance',
          severity: 'high',
          message: `${item.requirement.obligationName} è scaduto`,
          meta: 'rinnovare ora',
          cta: onNavigateToCompliance ? { label: 'Rinnova', onClick: onNavigateToCompliance } : undefined,
        });
      } else if (days <= 30) {
        list.push({
          id: `c-${item.id}`,
          category: 'compliance',
          severity: days <= 7 ? 'high' : 'medium',
          message: item.requirement.obligationName,
          meta: `scade tra ${days}gg`,
          cta: onNavigateToCompliance ? { label: 'Gestisci', onClick: onNavigateToCompliance } : undefined,
        });
      }
    });

    // Vacant roles aged > 30 days
    vacantRoles.forEach(role => {
      const daysSince = Math.floor((Date.now() - new Date(role.createdAt).getTime()) / 86_400_000);
      if (daysSince > 30) {
        list.push({
          id: `v-${role.id}`,
          category: 'hiring',
          severity: daysSince > 90 ? 'high' : 'medium',
          message: `${role.title} vacante`,
          meta: `da ${daysSince}gg`,
          cta: onNavigateToRole ? { label: 'Apri ruolo', onClick: () => onNavigateToRole(role.id) } : undefined,
        });
      }
    });

    // Active hiring
    hiringRoles.forEach(role => {
      list.push({
        id: `h-${role.id}`,
        category: 'hiring',
        severity: 'low',
        message: `${role.title} in hiring`,
        meta: 'pipeline attiva',
        cta: onNavigateToRole ? { label: 'Apri ruolo', onClick: () => onNavigateToRole(role.id) } : undefined,
      });
    });

    legacyHiringPositions.forEach(pos => {
      list.push({
        id: `lh-${pos.id}`,
        category: 'hiring',
        severity: 'low',
        message: pos.jobTitle || 'Posizione aperta',
        meta: 'in cerca di candidati',
        cta: onNavigateToOpenPositions ? { label: 'Vedi', onClick: onNavigateToOpenPositions } : undefined,
      });
    });

    // People — pending tests
    pendingTestUsers.slice(0, 8).forEach(u => {
      list.push({
        id: `p-${u.id}`,
        category: 'people',
        severity: 'low',
        message: `${u.firstName} ${u.lastName}`,
        meta: 'test non completato',
      });
    });

    return list;
  }, [
    vacantRoles, legacyHiringPositions, hiringRoles, expiringCompliance, pendingTestUsers,
    onNavigateToRole, onNavigateToCompliance, onNavigateToOpenPositions,
  ]);

  const counts = useMemo(() => {
    const map: Record<FocusCategory, number> = { urgent: 0, compliance: 0, hiring: 0, people: 0 };
    items.forEach(i => {
      map[i.category]++;
      if (i.severity === 'high') map.urgent++;
    });
    return map;
  }, [items]);

  const [activeTab, setActiveTab] = useState<FocusCategory>(() => {
    if (counts.urgent > 0) return 'urgent';
    if (counts.compliance > 0) return 'compliance';
    if (counts.hiring > 0) return 'hiring';
    return 'people';
  });

  const filtered = useMemo(() => {
    const list = activeTab === 'urgent'
      ? items.filter(i => i.severity === 'high')
      : items.filter(i => i.category === activeTab);
    // Sort by severity then natural order
    const order = { high: 0, medium: 1, low: 2 };
    return list.sort((a, b) => order[a.severity] - order[b.severity]);
  }, [items, activeTab]);

  return (
    <Card padding="none" className="overflow-hidden">
      {/* Header + Tabs */}
      <div className="px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Focus di oggi</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Cosa richiede la tua attenzione adesso.</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
            <AlertTriangle size={14} className="text-amber-500" />
            {items.length} totali
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto -mx-1 px-1">
          {tabsConfig.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            const count = counts[tab.key];
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/40'
                }`}
              >
                <Icon size={14} />
                {tab.label}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-white/20 text-white dark:bg-gray-900/20 dark:text-gray-900'
                    : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                }`}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="max-h-[280px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={16} />
            Nessuna voce in questa categoria. Tutto sotto controllo.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map(item => {
              const sev = severityClasses[item.severity];
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/70 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${sev.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {item.message}
                    </div>
                    {item.meta && (
                      <div className={`text-[11px] font-semibold ${sev.text} mt-0.5`}>
                        {item.meta}
                      </div>
                    )}
                  </div>
                  {item.cta && (
                    <button
                      onClick={item.cta.onClick}
                      className="flex items-center gap-1 text-xs font-bold text-gray-700 dark:text-gray-200 hover:text-amber-600 dark:hover:text-amber-400 transition-colors shrink-0"
                    >
                      {item.cta.label}
                      <ArrowRight size={12} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
};
