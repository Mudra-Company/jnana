/**
 * UnifiedRolePersonCard
 * 
 * A single card that displays both Role (primary) and Person (secondary) information.
 * Replaces separate role/person cards in the org chart.
 */

import React from 'react';
import {
  Briefcase,
  Search,
  User,
  Clock,
  Snowflake,
  Calendar,
  Crown,
  Users,
  Target,
  Handshake,
  Building,
  ChevronRight
} from 'lucide-react';
import { GenerationBadge } from '../GenerationBadge';
import type { UnifiedPosition } from '../../types/unified-org';
import type { CompanyRole, RoleStatus } from '../../types/roles';

interface UnifiedRolePersonCardProps {
  position: UnifiedPosition;
  onClick?: () => void;
  compact?: boolean;
}

const STATUS_CONFIG: Record<RoleStatus, { bg: string; text: string; border: string; icon: React.ReactNode; label: string }> = {
  active: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
    icon: <User size={10} />,
    label: 'Attivo'
  },
  vacant: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    icon: <Clock size={10} />,
    label: 'Vacante'
  },
  frozen: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    icon: <Snowflake size={10} />,
    label: 'Congelato'
  },
  planned: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    icon: <Calendar size={10} />,
    label: 'Pianificato'
  }
};

const ASSIGNMENT_TYPE_BADGES: Record<string, React.ReactNode> = {
  interim: <span className="text-[9px] bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-1 py-0.5 rounded font-bold">INTERIM</span>,
  backup: <span className="text-[9px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1 py-0.5 rounded font-bold">BACKUP</span>,
  training: <span className="text-[9px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-1 py-0.5 rounded font-bold">FORMAZIONE</span>
};

const MetricBadge: React.FC<{ value: number | null; icon: React.ReactNode; label: string; colorClass: string }> = ({
  value,
  icon,
  label,
  colorClass
}) => {
  if (value === null) return null;
  
  const getValueColor = (v: number) => {
    if (v >= 70) return 'text-green-600 dark:text-green-400';
    if (v >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className={`flex items-center gap-1 text-[10px] ${colorClass}`} title={label}>
      {icon}
      <span className={`font-bold ${getValueColor(value)}`}>{value}%</span>
    </div>
  );
};

export const UnifiedRolePersonCard: React.FC<UnifiedRolePersonCardProps> = ({
  position,
  onClick,
  compact = false
}) => {
  const { role, assignee, assignment, metrics } = position;
  const statusConfig = STATUS_CONFIG[role.status];
  const hasAssignee = !!assignee;
  const isHiring = role.isHiring;
  const assignmentType = assignment?.assignmentType || 'primary';
  const ftePercentage = assignment?.ftePercentage || 100;

  return (
    <div
      onClick={onClick}
      className={`
        relative p-3 rounded-xl transition-all duration-200 cursor-pointer group
        border-2 hover:shadow-lg
        ${isHiring 
          ? 'border-dashed border-emerald-400 dark:border-emerald-600 bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-900/20 dark:to-gray-800 hover:from-emerald-50 hover:to-emerald-50/50 dark:hover:from-emerald-900/30' 
          : hasAssignee
            ? 'border-transparent bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-gray-200 dark:hover:border-gray-600 shadow-sm'
            : `border-dashed ${statusConfig.border} ${statusConfig.bg}`
        }
      `}
    >
      {/* ROLE SECTION (Primary) */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={`
            w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm
            ${isHiring 
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white' 
              : hasAssignee 
                ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white' 
                : `${statusConfig.bg} ${statusConfig.text}`
            }
          `}>
            {isHiring ? <Search size={18} /> : <Briefcase size={18} />}
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {role.title}
            </div>
            {role.code && (
              <div className="text-[10px] text-gray-400 dark:text-gray-500 font-mono tracking-wide">
                {role.code}
              </div>
            )}
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-1 shrink-0">
          {isHiring && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 animate-pulse">
              <Search size={10} />
              HIRING
            </span>
          )}
          {!isHiring && !hasAssignee && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}>
              {statusConfig.icon}
              {statusConfig.label.toUpperCase()}
            </span>
          )}
          {role.headcount > 1 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
              <Users size={10} />
              {role.headcount}
            </span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 dark:border-gray-700 my-2" />

      {/* PERSON SECTION (Secondary) */}
      {hasAssignee ? (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-jnana-sage to-jnana-sage/80 flex items-center justify-center text-xs font-bold text-white shadow-sm">
            {assignee.firstName?.[0] || '?'}{assignee.lastName?.[0] || ''}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                {assignee.firstName} {assignee.lastName}
              </span>
              {assignee.profileCode && (
                <span className="text-[10px] font-mono text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">
                  {assignee.profileCode}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {ASSIGNMENT_TYPE_BADGES[assignmentType]}
              {ftePercentage < 100 && (
                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                  {ftePercentage}% FTE
                </span>
              )}
              {assignee.birthDate && (
                <GenerationBadge birthDate={assignee.birthDate} size="sm" />
              )}
            </div>
          </div>
          <ChevronRight size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 italic">
          <User size={14} className="text-gray-300 dark:text-gray-600" />
          {isHiring ? 'Ricerca in corso...' : 'Nessuno assegnato'}
        </div>
      )}

      {/* METRICS SECTION (Quick view) */}
      {hasAssignee && !compact && (
        <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <MetricBadge 
            value={metrics.roleFitScore} 
            icon={<Target size={10} />} 
            label="Fit Ruolo"
            colorClass="text-indigo-500"
          />
          <MetricBadge 
            value={metrics.managerFitScore} 
            icon={<Handshake size={10} />} 
            label="Fit Manager"
            colorClass="text-green-600"
          />
          <MetricBadge 
            value={metrics.cultureFitScore} 
            icon={<Building size={10} />} 
            label="Fit Culturale"
            colorClass="text-blue-500"
          />
          {metrics.isLeader && (
            <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
              <Crown size={10} />
              LEADER
            </span>
          )}
        </div>
      )}

      {/* Quick role info for non-compact view */}
      {!compact && (role.requiredSeniority || role.ccnlLevel) && !hasAssignee && (
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400">
          {role.requiredSeniority && (
            <span className="flex items-center gap-1">
              <Crown size={10} />
              {role.requiredSeniority}
            </span>
          )}
          {role.ccnlLevel && (
            <span>CCNL: {role.ccnlLevel}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default UnifiedRolePersonCard;
