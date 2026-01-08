import React from 'react';
import type { CandidateStatus } from '../../types/shortlist';

// Simple cn utility for classnames
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

interface CandidateStatusBadgeProps {
  status: CandidateStatus;
  size?: 'sm' | 'md';
  className?: string;
}

const statusConfig: Record<CandidateStatus, { label: string; className: string }> = {
  shortlisted: {
    label: 'In Shortlist',
    className: 'bg-blue-100 text-blue-700 border-blue-200'
  },
  interviewing: {
    label: 'In Colloquio',
    className: 'bg-purple-100 text-purple-700 border-purple-200'
  },
  offered: {
    label: 'Offerta Inviata',
    className: 'bg-amber-100 text-amber-700 border-amber-200'
  },
  rejected: {
    label: 'Scartato',
    className: 'bg-red-100 text-red-700 border-red-200'
  },
  hired: {
    label: 'Assunto',
    className: 'bg-green-100 text-green-700 border-green-200'
  }
};

export const CandidateStatusBadge: React.FC<CandidateStatusBadgeProps> = ({
  status,
  size = 'md',
  className
}) => {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        size === 'sm' ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
};

// Dropdown for changing status
interface CandidateStatusSelectProps {
  status: CandidateStatus;
  onChange: (status: CandidateStatus) => void;
  disabled?: boolean;
}

export const CandidateStatusSelect: React.FC<CandidateStatusSelectProps> = ({
  status,
  onChange,
  disabled = false
}) => {
  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value as CandidateStatus)}
      disabled={disabled}
      className={cn(
        "text-sm rounded-md border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/30",
        "bg-background text-foreground border-input",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <option value="shortlisted">In Shortlist</option>
      <option value="interviewing">In Colloquio</option>
      <option value="offered">Offerta Inviata</option>
      <option value="rejected">Scartato</option>
      <option value="hired">Assunto</option>
    </select>
  );
};
