/**
 * Compliance Score Hero Widget - Premium visual gauge showing company compliance health
 */
import React from 'react';
import { Shield, CheckCircle, AlertTriangle, XCircle, TrendingUp } from 'lucide-react';
import { Card } from '../../../components/Card';
import { ComplianceRiskScore } from '../../types/compliance';

interface ComplianceProgressProps {
  riskScore: ComplianceRiskScore;
  companyName?: string;
  isLoading?: boolean;
}

export const ComplianceProgress: React.FC<ComplianceProgressProps> = ({ 
  riskScore, 
  companyName,
  isLoading 
}) => {
  const { score, totalObligations, greenCount, yellowCount, redCount } = riskScore;
  
  // Calculate gauge parameters
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  // Determine color based on score
  const getScoreGradient = () => {
    if (score >= 80) return { from: 'from-emerald-500', to: 'to-teal-600', stroke: '#10b981' };
    if (score >= 50) return { from: 'from-amber-500', to: 'to-orange-600', stroke: '#f59e0b' };
    return { from: 'from-red-500', to: 'to-rose-600', stroke: '#ef4444' };
  };

  const colors = getScoreGradient();

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      </Card>
    );
  }

  return (
    <Card className={`bg-gradient-to-br ${colors.from} ${colors.to} text-white border-0 shadow-lg overflow-hidden relative`}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Compliance Score</h2>
            {companyName && (
              <p className="text-white/70 text-sm">{companyName}</p>
            )}
          </div>
        </div>

        {/* Score with Gauge */}
        <div className="flex items-center gap-6 mb-6">
          {/* Circular Gauge */}
          <div className="relative w-28 h-28">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="10"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="white"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            {/* Center score */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold">{score}</span>
            </div>
          </div>

          {/* Score text */}
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-bold">{score}</span>
              <span className="text-2xl text-white/60">/100</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-white/80 text-sm">
              <TrendingUp className="h-4 w-4" />
              <span>{totalObligations} obblighi monitorati</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <CheckCircle className="h-4 w-4 text-green-200" />
              <span className="text-2xl font-bold">{greenCount}</span>
            </div>
            <span className="text-xs text-white/70 uppercase tracking-wide">OK</span>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <AlertTriangle className="h-4 w-4 text-amber-200" />
              <span className="text-2xl font-bold">{yellowCount}</span>
            </div>
            <span className="text-xs text-white/70 uppercase tracking-wide">Scadenza</span>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <XCircle className="h-4 w-4 text-red-200" />
              <span className="text-2xl font-bold">{redCount}</span>
            </div>
            <span className="text-xs text-white/70 uppercase tracking-wide">Critici</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
