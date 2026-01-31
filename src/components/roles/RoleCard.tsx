/**
 * RoleCard - Display a role in the org chart
 * 
 * Role-centric display: Shows the role as primary entity with assignee as secondary.
 * Supports states: active, vacant, hiring, interim, planned
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
  ChevronRight
} from 'lucide-react';
import type { CompanyRole, RoleAssignment, RoleStatus, ROLE_STATUS_LABELS } from '../../types/roles';
import type { User as UserType } from '../../../types';

interface RoleCardProps {
  role: CompanyRole;
  assignee?: UserType | null;
  assignment?: RoleAssignment | null;
  onClick?: () => void;
  compact?: boolean;
}

const STATUS_CONFIG: Record<RoleStatus, { bg: string; text: string; border: string; icon: React.ReactNode; label: string }> = {
  active: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
    icon: <User size={12} />,
    label: 'Attivo'
  },
  vacant: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    icon: <Clock size={12} />,
    label: 'Vacante'
  },
  frozen: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    icon: <Snowflake size={12} />,
    label: 'Congelato'
  },
  planned: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    icon: <Calendar size={12} />,
    label: 'Pianificato'
  }
};

const ASSIGNMENT_TYPE_ICONS: Record<string, React.ReactNode> = {
  primary: null,
  interim: <span className="text-[10px] bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-1.5 py-0.5 rounded font-medium">AD INTERIM</span>,
  backup: <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded font-medium">BACKUP</span>,
  training: <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-medium">IN FORMAZIONE</span>
};

export const RoleCard: React.FC<RoleCardProps> = ({
  role,
  assignee,
  assignment,
  onClick,
  compact = false
}) => {
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
        border-2 hover:shadow-md
        ${isHiring 
          ? 'border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' 
          : hasAssignee
            ? 'border-transparent bg-gray-50 dark:bg-gray-700/30 hover:bg-white dark:hover:bg-gray-700/60 hover:border-gray-200 dark:hover:border-gray-600'
            : `border-dashed ${statusConfig.border} ${statusConfig.bg}`
        }
      `}
    >
      {/* Role Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={`
            w-8 h-8 rounded-lg flex items-center justify-center shrink-0
            ${isHiring 
              ? 'bg-emerald-500 text-white' 
              : hasAssignee 
                ? 'bg-jnana-sage text-white' 
                : `${statusConfig.bg} ${statusConfig.text}`
            }
          `}>
            {isHiring ? <Search size={16} /> : <Briefcase size={16} />}
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {role.title}
            </div>
            {role.code && (
              <div className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                {role.code}
              </div>
            )}
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-1 shrink-0">
          {isHiring && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
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

      {/* Assignee Section */}
      {hasAssignee ? (
        <div className="flex items-center gap-2 pl-10">
          <div className="w-7 h-7 rounded-full bg-jnana-sage flex items-center justify-center text-xs font-bold text-white shadow-sm">
            {assignee.firstName?.[0] || '?'}{assignee.lastName?.[0] || ''}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
              {assignee.firstName} {assignee.lastName}
            </div>
            <div className="flex items-center gap-2">
              {ASSIGNMENT_TYPE_ICONS[assignmentType]}
              {ftePercentage < 100 && (
                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                  {ftePercentage}% FTE
                </span>
              )}
              {assignee.profileCode && (
                <span className="text-[10px] font-mono text-gray-400">
                  {assignee.profileCode}
                </span>
              )}
            </div>
          </div>
          <ChevronRight size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ) : (
        <div className="pl-10 text-xs text-gray-400 dark:text-gray-500 italic">
          {isHiring ? 'Ricerca in corso...' : 'Nessuno assegnato'}
        </div>
      )}

      {/* Quick Info (non-compact mode) */}
      {!compact && (role.ccnlLevel || role.requiredSeniority) && (
        <div className="mt-2 pt-2 pl-10 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400">
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

export default RoleCard;
