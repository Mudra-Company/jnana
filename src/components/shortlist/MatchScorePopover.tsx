import React from 'react';
import { X, CheckCircle, XCircle, TrendingUp, TrendingDown, Minus, User, Plus, Eye } from 'lucide-react';
import { Button } from '../../../components/Button';
import { getMatchQuality } from '../../utils/matchingEngine';

export interface MatchBreakdown {
  totalScore: number;
  riasecMatch?: number;
  skillsMatch?: number;
  hardSkillsMatched?: string[];
  hardSkillsMissing?: string[];
  softSkillsMatched?: string[];
  softSkillsMissing?: string[];
  seniorityMatch?: 'match' | 'above' | 'below';
  candidateSeniority?: string;
  requiredSeniority?: string;
  candidateProfileCode?: string;
  targetProfileCode?: string;
}

interface MatchScorePopoverProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  candidateType: 'internal' | 'external';
  breakdown: MatchBreakdown;
  isInShortlist: boolean;
  onAddToShortlist?: () => void;
  onViewProfile?: () => void;
}

const ProgressBar: React.FC<{ value: number; className?: string }> = ({ value, className = '' }) => (
  <div className={`h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex-1 ${className}`}>
    <div 
      className={`h-full rounded-full transition-all ${
        value >= 70 ? 'bg-green-500' : value >= 40 ? 'bg-yellow-500' : 'bg-red-500'
      }`}
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

const SeniorityIcon: React.FC<{ match: 'match' | 'above' | 'below' }> = ({ match }) => {
  if (match === 'match') return <CheckCircle size={14} className="text-green-500" />;
  if (match === 'above') return <TrendingUp size={14} className="text-orange-500" />;
  return <TrendingDown size={14} className="text-yellow-500" />;
};

export const MatchScorePopover: React.FC<MatchScorePopoverProps> = ({
  isOpen,
  onClose,
  candidateName,
  candidateType,
  breakdown,
  isInShortlist,
  onAddToShortlist,
  onViewProfile,
}) => {
  if (!isOpen) return null;

  const quality = getMatchQuality(breakdown.totalScore);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />
      
      {/* Popover */}
      <div className="fixed inset-x-4 top-1/4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-50 w-auto md:w-[440px] max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
              candidateType === 'internal' 
                ? 'bg-gradient-to-br from-purple-500 to-indigo-500' 
                : 'bg-gradient-to-br from-green-500 to-teal-500'
            }`}>
              <User size={18} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">{candidateName}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                candidateType === 'internal' 
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
                  : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              }`}>
                {candidateType === 'internal' ? 'Interno' : 'Esterno'}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Total Score */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">MATCH TOTALE</span>
            <div className={`px-3 py-1 rounded-full ${quality.bgColor}`}>
              <span className={`font-bold text-lg ${quality.color}`}>{breakdown.totalScore}%</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ProgressBar value={breakdown.totalScore} />
            <span className={`text-sm font-medium ${quality.color}`}>{quality.label}</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="p-4 space-y-4">
          {/* RIASEC Match */}
          {breakdown.riasecMatch !== undefined && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">🎯 RIASEC Match</span>
                <span className={`text-sm font-bold ${breakdown.riasecMatch >= 70 ? 'text-green-600' : breakdown.riasecMatch >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {breakdown.riasecMatch}%
                </span>
              </div>
              <ProgressBar value={breakdown.riasecMatch} />
              {(breakdown.candidateProfileCode || breakdown.targetProfileCode) && (
                <p className="text-xs text-gray-500">
                  {breakdown.candidateProfileCode && `Profilo: ${breakdown.candidateProfileCode}`}
                  {breakdown.candidateProfileCode && breakdown.targetProfileCode && ' vs '}
                  {breakdown.targetProfileCode && `${breakdown.targetProfileCode} (richiesto)`}
                </p>
              )}
            </div>
          )}

          {/* Skills Match */}
          {breakdown.skillsMatch !== undefined && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">🛠️ Hard Skills</span>
                <span className={`text-sm font-bold ${breakdown.skillsMatch >= 70 ? 'text-green-600' : breakdown.skillsMatch >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {breakdown.skillsMatch}%
                </span>
              </div>
              <ProgressBar value={breakdown.skillsMatch} />
              <div className="flex flex-wrap gap-1.5 mt-1">
                {breakdown.hardSkillsMatched?.slice(0, 4).map((skill, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    <CheckCircle size={10} /> {skill}
                  </span>
                ))}
                {breakdown.hardSkillsMissing?.slice(0, 3).map((skill, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                    <XCircle size={10} /> {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Soft Skills */}
          {breakdown.softSkillsMatched && breakdown.softSkillsMatched.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">💡 Soft Skills</span>
              <div className="flex flex-wrap gap-1.5">
                {breakdown.softSkillsMatched.slice(0, 4).map((skill, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    <CheckCircle size={10} /> {skill}
                  </span>
                ))}
                {breakdown.softSkillsMissing?.slice(0, 2).map((skill, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                    <Minus size={10} /> {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Seniority Match */}
          {breakdown.seniorityMatch && (
            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">📈 Seniority</span>
              <div className="flex items-center gap-2">
                <SeniorityIcon match={breakdown.seniorityMatch} />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {breakdown.candidateSeniority || '?'} 
                  {breakdown.requiredSeniority && ` → ${breakdown.requiredSeniority}`}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  breakdown.seniorityMatch === 'match' 
                    ? 'bg-green-100 text-green-700' 
                    : breakdown.seniorityMatch === 'above' 
                      ? 'bg-orange-100 text-orange-700' 
                      : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {breakdown.seniorityMatch === 'match' ? 'Match' : breakdown.seniorityMatch === 'above' ? 'Over' : 'Under'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
          {!isInShortlist ? (
            <Button 
              onClick={() => {
                onAddToShortlist?.();
                onClose();
              }}
              className="flex-1"
            >
              <Plus size={16} className="mr-1" /> Aggiungi a Shortlist
            </Button>
          ) : (
            <span className="flex-1 flex items-center justify-center gap-1 py-2 px-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-lg text-sm font-medium">
              <CheckCircle size={16} /> Già in Shortlist
            </span>
          )}
          <Button 
            variant="outline"
            onClick={() => {
              onViewProfile?.();
              onClose();
            }}
          >
            <Eye size={16} className="mr-1" /> Profilo
          </Button>
        </div>
      </div>
    </>
  );
};
