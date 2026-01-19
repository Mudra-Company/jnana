/**
 * Risk Score Widget - Visual gauge showing company compliance health
 */
import React from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { ComplianceRiskScore } from '../../types/compliance';

interface ComplianceProgressProps {
  riskScore: ComplianceRiskScore;
  isLoading?: boolean;
}

export const ComplianceProgress: React.FC<ComplianceProgressProps> = ({ riskScore, isLoading }) => {
  const { score, totalObligations, greenCount, yellowCount, redCount } = riskScore;
  
  // Determine color based on score
  const getScoreColor = () => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getProgressColor = () => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
        <div className="h-12 bg-muted rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-muted rounded w-full"></div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Compliance Score</h3>
      </div>

      {/* Score Display */}
      <div className="flex items-end gap-2 mb-4">
        <span className={`text-5xl font-bold ${getScoreColor()}`}>
          {score}
        </span>
        <span className="text-2xl text-muted-foreground mb-1">/100</span>
      </div>

      {/* Progress Bar */}
      <div className="h-3 bg-muted rounded-full overflow-hidden mb-4">
        <div 
          className={`h-full ${getProgressColor()} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Status Counts */}
      <div className="flex justify-between text-sm">
        <div className="flex items-center gap-1.5">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-muted-foreground">{greenCount} OK</span>
        </div>
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <span className="text-muted-foreground">{yellowCount} In scadenza</span>
        </div>
        <div className="flex items-center gap-1.5">
          <XCircle className="h-4 w-4 text-red-500" />
          <span className="text-muted-foreground">{redCount} Critici</span>
        </div>
      </div>

      {/* Total */}
      <p className="text-xs text-muted-foreground mt-3 text-center">
        {totalObligations} obblighi monitorati
      </p>
    </div>
  );
};
