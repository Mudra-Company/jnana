import React from 'react';
import { 
  Users, CheckCircle, Briefcase, AlertTriangle, Search, Shield, Heart, ArrowRight, LucideIcon 
} from 'lucide-react';
import { Card } from '../../../components/Card';

interface KPIItem {
  label: string;
  value: string | number;
  subLabel?: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'accent' | 'gradient-blue' | 'gradient-purple';
  onClick?: () => void;
}

interface DashboardKPIGridProps {
  totalEmployees: number;
  completedTests: number;
  completionRate: number;
  totalRoles: number;
  vacantRoles: number;
  hiringRoles: number;
  complianceScore: number;
  cultureMatchScore: number;
  onNavigateToOrgChart?: () => void;
  onNavigateToOpenPositions?: () => void;
  onNavigateToCompliance?: () => void;
  onNavigateToIdentityHub?: () => void;
}

export const DashboardKPIGrid: React.FC<DashboardKPIGridProps> = ({
  totalEmployees,
  completedTests,
  completionRate,
  totalRoles,
  vacantRoles,
  hiringRoles,
  complianceScore,
  cultureMatchScore,
  onNavigateToOrgChart,
  onNavigateToOpenPositions,
  onNavigateToCompliance,
  onNavigateToIdentityHub,
}) => {
  const kpis: KPIItem[] = [
    {
      label: 'Dipendenti',
      value: totalEmployees,
      icon: Users,
      variant: 'default',
    },
    {
      label: 'Test Completati',
      value: completedTests,
      subLabel: `${completionRate}%`,
      icon: CheckCircle,
      variant: 'success',
    },
    {
      label: 'Posizioni Totali',
      value: totalRoles,
      icon: Briefcase,
      onClick: onNavigateToOrgChart,
    },
    {
      label: 'Posizioni Vacanti',
      value: vacantRoles,
      icon: AlertTriangle,
      variant: vacantRoles > 0 ? 'warning' : 'default',
    },
    {
      label: 'In Hiring',
      value: hiringRoles,
      icon: Search,
      variant: 'gradient-blue',
      onClick: onNavigateToOpenPositions,
    },
    {
      label: 'Compliance',
      value: `${complianceScore}%`,
      icon: Shield,
      variant: complianceScore < 70 ? 'warning' : 'default',
      onClick: onNavigateToCompliance,
    },
    {
      label: 'Culture Match',
      value: `${cultureMatchScore}%`,
      icon: Heart,
      variant: 'gradient-purple',
      onClick: onNavigateToIdentityHub,
    },
  ];

  const getVariantClasses = (variant?: string, hasClick?: boolean) => {
    const base = hasClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : '';
    switch (variant) {
      case 'success':
        return `${base}`;
      case 'warning':
        return `${base} border-l-4 !border-l-amber-500`;
      case 'gradient-blue':
        return `${base} !bg-gradient-to-br from-blue-500 to-cyan-600 !text-white !border-0 shadow-lg`;
      case 'gradient-purple':
        return `${base} !bg-gradient-to-br from-purple-600 to-indigo-700 !text-white !border-0 shadow-lg`;
      default:
        return base;
    }
  };

  const isLightText = (variant?: string) => variant === 'gradient-blue' || variant === 'gradient-purple';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const light = isLightText(kpi.variant);
        return (
          <Card
            key={kpi.label}
            className={`flex flex-col justify-between min-h-[100px] ${getVariantClasses(kpi.variant, !!kpi.onClick)}`}
            padding="sm"
            onClick={kpi.onClick}
          >
            <div className="flex justify-between items-start">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${light ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                {kpi.label}
              </span>
              {kpi.onClick && <ArrowRight size={12} className={light ? 'text-white/70' : 'text-gray-400'} />}
            </div>
            <div className="flex items-end justify-between mt-2">
              <span className={`text-2xl font-bold ${light ? 'text-white' : 'text-gray-800 dark:text-white'}`}>
                {kpi.value}
              </span>
              {kpi.subLabel && (
                <span className={`text-xs font-medium ${light ? 'text-white/80' : 'text-gray-400'}`}>
                  {kpi.subLabel}
                </span>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};
