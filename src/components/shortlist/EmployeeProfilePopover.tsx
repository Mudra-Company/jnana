import React from 'react';
import { 
  X, 
  User, 
  Target, 
  Handshake, 
  Building, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  TrendingDown, 
  Eye,
  Shuffle,
  Briefcase,
  Award,
  Wrench,
  Star
} from 'lucide-react';
import { Button } from '../../../components/Button';
import { User as UserType, RequiredProfile } from '../../../types';
import { ManagerFitBreakdown } from '../../../views/admin/OrgNodeCard';

export interface UserHardSkillDisplay {
  name: string;
  proficiencyLevel: number;
  category?: string;
}

interface EmployeeProfilePopoverProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType;
  // Pre-calculated metrics from OrgNodeCard
  metrics: {
    roleFitScore?: number;
    softSkillsMatched?: string[];
    softSkillsMissing?: string[];
    hardSkillsRequired?: string[];
    seniorityMatch?: 'match' | 'above' | 'below';
    userSeniority?: string;
    requiredSeniority?: string;
    managerFitScore?: number | null;
    managerFitBreakdown?: ManagerFitBreakdown[];
    cultureFitScore?: number;
    matchedValues?: string[];
    userHardSkills?: UserHardSkillDisplay[];
  };
  companyValues?: string[];
  onViewFullProfile?: () => void;
  onProposeJobRotation?: () => void;
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

const SeniorityBadge: React.FC<{ match: 'match' | 'above' | 'below' }> = ({ match }) => {
  const config = {
    match: { bg: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle, label: 'Match' },
    above: { bg: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', icon: TrendingUp, label: 'Superiore' },
    below: { bg: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', icon: TrendingDown, label: 'Inferiore' }
  };
  
  const { bg, icon: Icon, label } = config[match];
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${bg}`}>
      <Icon size={12} /> {label}
    </span>
  );
};

export const EmployeeProfilePopover: React.FC<EmployeeProfilePopoverProps> = ({
  isOpen,
  onClose,
  user,
  metrics,
  companyValues,
  onViewFullProfile,
  onProposeJobRotation
}) => {
  if (!isOpen) return null;

  const {
    roleFitScore = 0,
    softSkillsMatched = [],
    softSkillsMissing = [],
    hardSkillsRequired = [],
    seniorityMatch,
    userSeniority,
    requiredSeniority,
    managerFitScore,
    managerFitBreakdown = [],
    cultureFitScore = 0,
    matchedValues = [],
    userHardSkills = []
  } = metrics;

  const hasManagerData = managerFitBreakdown.length > 0;
  const hasRoleRequirements = user.requiredProfile?.softSkills?.length || user.requiredProfile?.hardSkills?.length;
  const hasUserHardSkills = userHardSkills.length > 0;

  const getProficiencyLabel = (level: number) => {
    if (level >= 5) return 'Esperto';
    if (level >= 4) return 'Avanzato';
    if (level >= 3) return 'Intermedio';
    if (level >= 2) return 'Base';
    return 'Principiante';
  };

  const getProficiencyColor = (level: number) => {
    if (level >= 5) return 'bg-green-500';
    if (level >= 4) return 'bg-blue-500';
    if (level >= 3) return 'bg-yellow-500';
    if (level >= 2) return 'bg-orange-500';
    return 'bg-gray-400';
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 z-[200]"
        onClick={onClose}
      />
      
      {/* Popover */}
      <div className="fixed inset-x-4 top-1/4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-[210] w-auto md:w-[480px] max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-br from-jnana-sage/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br from-jnana-sage to-jnana-sage/80 shadow-lg">
              {`${user.firstName?.[0] || '?'}${user.lastName?.[0] || ''}`}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                {user.firstName} {user.lastName}
              </h3>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">{user.jobTitle}</span>
                {user.profileCode && (
                  <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-400">
                    {user.profileCode}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* 1. FIT CON IL RUOLO ATTUALE */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Target size={16} className="text-indigo-500" />
              <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wide">Fit con il Ruolo</h4>
            </div>
            
            {hasRoleRequirements ? (
              <>
                {/* Overall Role Fit Score */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Aderenza</span>
                  <ProgressBar value={roleFitScore} />
                  <span className={`font-bold text-sm ${roleFitScore >= 70 ? 'text-green-600' : roleFitScore >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {roleFitScore}%
                  </span>
                </div>

                {/* Soft Skills */}
                {(softSkillsMatched.length > 0 || softSkillsMissing.length > 0) && (
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Soft Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {softSkillsMatched.map((skill, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                          <CheckCircle size={10} /> {skill}
                        </span>
                      ))}
                      {softSkillsMissing.map((skill, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                          <XCircle size={10} /> {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hard Skills (if any required) */}
                {hardSkillsRequired.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Hard Skills Richieste</span>
                    <div className="flex flex-wrap gap-1.5">
                      {hardSkillsRequired.map((skill, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          <Award size={10} /> {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Seniority Match */}
                {seniorityMatch && (
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Briefcase size={14} className="text-gray-400" />
                      Seniority
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {userSeniority || '?'} → {requiredSeniority || '?'}
                      </span>
                      <SeniorityBadge match={seniorityMatch} />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400 italic py-2">
                Nessun requisito definito per questo ruolo
              </p>
            )}
          </div>

          {/* 2. COMPATIBILITÀ CON I RESPONSABILI */}
          {hasManagerData && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Handshake size={16} className="text-green-500" />
                <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wide">Compatibilità Responsabili</h4>
              </div>
              
              {/* Average Score */}
              {managerFitScore != null && managerFitScore !== undefined && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Media</span>
                  <ProgressBar value={managerFitScore} />
                  <span className={`font-bold text-sm ${managerFitScore >= 70 ? 'text-green-600' : managerFitScore >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {managerFitScore}%
                  </span>
                </div>
              )}

              {/* Breakdown per Manager */}
              {managerFitBreakdown.length > 0 && (
                <div className="space-y-2">
                  {managerFitBreakdown.map((mb) => (
                    <div key={mb.managerId} className="flex items-center justify-between py-2 px-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <User size={12} className="text-gray-400" />
                        {mb.managerName}
                      </span>
                      {mb.score >= 0 ? (
                        <span className={`text-sm font-bold ${mb.score >= 70 ? 'text-green-600' : mb.score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {mb.score}%
                        </span>
                      ) : (
                        <span className="text-xs italic text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                          N/A (profilo incompleto)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. FIT CULTURALE */}
          {companyValues && companyValues.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Building size={16} className="text-blue-500" />
                <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wide">Fit Culturale</h4>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Allineamento</span>
                <ProgressBar value={cultureFitScore} />
                <span className={`font-bold text-sm ${cultureFitScore >= 70 ? 'text-blue-600' : cultureFitScore >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {cultureFitScore}%
                </span>
              </div>

              {user.karmaData?.primaryValues && user.karmaData.primaryValues.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Valori del Dipendente</span>
                  <div className="flex flex-wrap gap-1.5">
                    {user.karmaData.primaryValues.map((value, i) => {
                      const isMatched = companyValues.some(cv => 
                        cv.toLowerCase().includes(value.toLowerCase()) || 
                        value.toLowerCase().includes(cv.toLowerCase())
                      );
                      return (
                        <span 
                          key={i} 
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                            isMatched 
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {isMatched && <CheckCircle size={10} />}
                          {value}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. HARD SKILLS DEL DIPENDENTE */}
          {hasUserHardSkills && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Wrench size={16} className="text-purple-500" />
                <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wide">Hard Skills</h4>
              </div>
              
              <div className="space-y-2">
                {userHardSkills.map((skill, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{skill.name}</span>
                      {skill.category && (
                        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                          {skill.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <Star
                            key={level}
                            size={12}
                            className={level <= skill.proficiencyLevel 
                              ? 'text-yellow-500 fill-yellow-500' 
                              : 'text-gray-300 dark:text-gray-600'
                            }
                          />
                        ))}
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${getProficiencyColor(skill.proficiencyLevel)} text-white`}>
                        {getProficiencyLabel(skill.proficiencyLevel)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              onViewFullProfile?.();
            }}
            className="flex-1"
          >
            <Eye size={16} className="mr-1" /> Visualizza Profilo Completo
          </Button>
          {onProposeJobRotation && (
            <Button 
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onProposeJobRotation();
              }}
              title="Proponi per Job Rotation"
            >
              <Shuffle size={16} />
            </Button>
          )}
        </div>
      </div>
    </>
  );
};
