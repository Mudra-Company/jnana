import React from 'react';
import { Lightbulb, ArrowRight, Users, Sparkles } from 'lucide-react';
import type { SynergyResult } from '../../services/generationService';

interface SynergyBadgeProps {
  synergy: SynergyResult;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
  showDetails?: boolean;
  className?: string;
}

const SYNERGY_CONFIG = {
  'Mentoring': {
    icon: ArrowRight,
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-600',
    label: 'Mentoring'
  },
  'Reverse Mentoring': {
    icon: Sparkles,
    bg: 'bg-cyan-100 dark:bg-cyan-900/40',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-300 dark:border-cyan-600',
    label: 'Reverse Mentoring'
  },
  'Peer Support': {
    icon: Users,
    bg: 'bg-purple-100 dark:bg-purple-900/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-600',
    label: 'Peer Support'
  },
  'None': {
    icon: Lightbulb,
    bg: 'bg-gray-100 dark:bg-gray-700/40',
    text: 'text-gray-500 dark:text-gray-400',
    border: 'border-gray-300 dark:border-gray-600',
    label: 'N/A'
  }
};

export const SynergyBadge: React.FC<SynergyBadgeProps> = ({
  synergy,
  size = 'sm',
  showScore = false,
  showDetails = false,
  className = ''
}) => {
  if (synergy.type === 'None') {
    return null;
  }
  
  const config = SYNERGY_CONFIG[synergy.type];
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2'
  };
  
  const iconSizes = {
    sm: 10,
    md: 14,
    lg: 16
  };
  
  return (
    <div className={`flex flex-col ${className}`}>
      <span 
        className={`
          inline-flex items-center rounded-full font-medium border
          ${config.bg} ${config.text} ${config.border}
          ${sizeClasses[size]}
        `}
        title={synergy.reason}
      >
        <Icon size={iconSizes[size]} />
        {config.label}
        {showScore && (
          <span className="ml-1 opacity-70">{synergy.score}%</span>
        )}
      </span>
      
      {showDetails && synergy.techSkillsBonus && synergy.techSkillsBonus.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {synergy.techSkillsBonus.slice(0, 3).map((skill, i) => (
            <span 
              key={i}
              className="px-1.5 py-0.5 text-[10px] bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400 rounded"
            >
              {skill}
            </span>
          ))}
          {synergy.techSkillsBonus.length > 3 && (
            <span className="text-[10px] text-gray-400">
              +{synergy.techSkillsBonus.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Compact inline version
export const SynergyIndicator: React.FC<{
  synergy: SynergyResult;
}> = ({ synergy }) => {
  if (synergy.type === 'None') return null;
  
  const config = SYNERGY_CONFIG[synergy.type];
  const Icon = config.icon;
  
  return (
    <span 
      className={`inline-flex items-center gap-1 ${config.text}`}
      title={synergy.reason}
    >
      <Icon size={12} />
      <span className="text-xs font-medium">{config.label}</span>
    </span>
  );
};
