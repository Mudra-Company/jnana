/**
 * RoleStatusBadge - Visual status indicator for roles
 */

import React from 'react';
import { User, Clock, Snowflake, Calendar, Search } from 'lucide-react';
import type { RoleStatus } from '../../types/roles';

interface RoleStatusBadgeProps {
  status: RoleStatus;
  isHiring?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const STATUS_CONFIG: Record<RoleStatus, { bg: string; text: string; border: string; icon: React.ElementType; label: string }> = {
  active: {
    bg: 'bg-green-100 dark:bg-green-900/40',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-300 dark:border-green-700',
    icon: User,
    label: 'Attivo'
  },
  vacant: {
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-700',
    icon: Clock,
    label: 'Vacante'
  },
  frozen: {
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-700',
    icon: Snowflake,
    label: 'Congelato'
  },
  planned: {
    bg: 'bg-purple-100 dark:bg-purple-900/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-700',
    icon: Calendar,
    label: 'Pianificato'
  }
};

const SIZE_CONFIG = {
  sm: { padding: 'px-1.5 py-0.5', text: 'text-[10px]', icon: 10 },
  md: { padding: 'px-2 py-1', text: 'text-xs', icon: 12 },
  lg: { padding: 'px-3 py-1.5', text: 'text-sm', icon: 14 }
};

export const RoleStatusBadge: React.FC<RoleStatusBadgeProps> = ({
  status,
  isHiring = false,
  size = 'md'
}) => {
  const sizeConfig = SIZE_CONFIG[size];

  if (isHiring) {
    return (
      <span className={`inline-flex items-center gap-1 ${sizeConfig.padding} ${sizeConfig.text} font-bold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700`}>
        <Search size={sizeConfig.icon} />
        HIRING
      </span>
    );
  }

  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 ${sizeConfig.padding} ${sizeConfig.text} font-bold rounded-full ${config.bg} ${config.text} border ${config.border}`}>
      <Icon size={sizeConfig.icon} />
      {config.label.toUpperCase()}
    </span>
  );
};

export default RoleStatusBadge;
