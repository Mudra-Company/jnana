import React from 'react';
import { AlertTriangle, Clock, FileWarning, ArrowRight } from 'lucide-react';
import { Card } from '../../../components/Card';
import type { CompanyRole } from '../../types/roles';
import type { ComplianceItem } from '../../types/compliance';

export interface DashboardAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface AlertsPanelProps {
  vacantRoles: CompanyRole[];
  expiringCompliance: ComplianceItem[];
  pendingTestUsers: { id: string; firstName: string; lastName: string }[];
  onNavigateToMatching?: (roleId: string) => void;
  onNavigateToCompliance?: () => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  vacantRoles,
  expiringCompliance,
  pendingTestUsers,
  onNavigateToMatching,
  onNavigateToCompliance,
}) => {
  const alerts: DashboardAlert[] = [];

  // Vacant roles (created more than 30 days ago)
  vacantRoles.forEach(role => {
    const daysSince = Math.floor(
      (Date.now() - new Date(role.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince > 30) {
      alerts.push({
        id: `vacant-${role.id}`,
        type: 'warning',
        message: `"${role.title}" vacante da ${daysSince} giorni`,
        action: onNavigateToMatching
          ? { label: 'Trova candidati', onClick: () => onNavigateToMatching(role.id) }
          : undefined,
      });
    }
  });

  // Expiring compliance items
  expiringCompliance.forEach(item => {
    const days = item.daysUntilExpiry;
    if (days !== null && days !== undefined && days <= 30 && days > 0) {
      alerts.push({
        id: `compliance-${item.id}`,
        type: 'error',
        message: `${item.requirement.obligationName} scade tra ${days} giorni`,
        action: onNavigateToCompliance
          ? { label: 'Gestisci', onClick: onNavigateToCompliance }
          : undefined,
      });
    } else if (days !== null && days !== undefined && days <= 0) {
      alerts.push({
        id: `compliance-expired-${item.id}`,
        type: 'error',
        message: `${item.requirement.obligationName} è scaduto!`,
        action: onNavigateToCompliance
          ? { label: 'Rinnova', onClick: onNavigateToCompliance }
          : undefined,
      });
    }
  });

  // Pending tests
  pendingTestUsers.slice(0, 3).forEach(user => {
    alerts.push({
      id: `test-${user.id}`,
      type: 'info',
      message: `${user.firstName} ${user.lastName} non ha completato il test`,
    });
  });

  if (alerts.length === 0) {
    return (
      <Card padding="sm" className="border-l-4 !border-l-green-500">
        <div className="flex items-center gap-3 text-green-700 dark:text-green-400">
          <span className="text-lg">✅</span>
          <span className="text-sm font-medium">Nessuna urgenza! Tutto sotto controllo.</span>
        </div>
      </Card>
    );
  }

  const iconMap = {
    warning: <AlertTriangle size={14} className="text-amber-500 shrink-0" />,
    error: <FileWarning size={14} className="text-red-500 shrink-0" />,
    info: <Clock size={14} className="text-blue-500 shrink-0" />,
  };

  return (
    <Card padding="sm">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
        <AlertTriangle size={14} className="text-amber-500" />
        Attenzione Richiesta
        <span className="ml-auto bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
          {alerts.length}
        </span>
      </h3>
      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        {alerts.map(alert => (
          <div
            key={alert.id}
            className="flex items-center gap-2 text-sm py-1.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            {iconMap[alert.type]}
            <span className="text-gray-700 dark:text-gray-300 flex-1 text-xs">
              {alert.message}
            </span>
            {alert.action && (
              <button
                onClick={alert.action.onClick}
                className="text-[10px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-1 shrink-0"
              >
                {alert.action.label}
                <ArrowRight size={10} />
              </button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};
