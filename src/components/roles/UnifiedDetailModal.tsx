/**
 * UnifiedDetailModal
 * 
 * Comprehensive modal showing both Role and Person information.
 * 5 tabs: Persona, Ruolo (Mansionario), Requisiti, Contratto, Storia
 * 
 * Features:
 * - View mode (read-only) by default
 * - Edit mode when clicking "Modifica"
 * - Delete confirmation dialog
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  User,
  Briefcase,
  FileText,
  Scale,
  History,
  Target,
  Handshake,
  Building,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Star,
  Award,
  Crown,
  Clock,
  MapPin,
  Laptop,
  Banknote,
  GraduationCap,
  Languages,
  Calendar,
  ChevronRight,
  Edit,
  Eye,
  Shuffle,
  Users,
  FileSearch,
  Save,
  Loader2,
  Trash2,
  AlertTriangle,
  Sparkles,
  Info
} from 'lucide-react';
import { Button } from '../../../components/Button';
import { GenerationBadge } from '../GenerationBadge';
import { useUnifiedOrgData } from '../../hooks/useUnifiedOrgData';
import type { UnifiedPosition, DetailedMetrics, AssignmentHistoryEntry, UserHardSkillDisplay } from '../../types/unified-org';
import type { CompanyRole, UpdateRoleInput } from '../../types/roles';
import type { User as UserType } from '../../../types';
import {
  CONTRACT_TYPE_LABELS,
  WORK_HOURS_LABELS,
  REMOTE_POLICY_LABELS,
  ASSIGNMENT_TYPE_LABELS
} from '../../types/roles';

type TabId = 'persona' | 'ruolo' | 'requisiti' | 'contratto' | 'storia';

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabConfig[] = [
  { id: 'persona', label: 'Persona', icon: <User size={16} /> },
  { id: 'ruolo', label: 'Ruolo', icon: <FileText size={16} /> },
  { id: 'requisiti', label: 'Requisiti', icon: <Target size={16} /> },
  { id: 'contratto', label: 'Contratto', icon: <Scale size={16} /> },
  { id: 'storia', label: 'Storia', icon: <History size={16} /> },
];

interface UnifiedDetailModalProps {
  isOpen: boolean;
  position: UnifiedPosition;
  companyValues?: string[];
  parentManagers?: UserType[];
  onClose: () => void;
  // New props for save/delete
  onSaveRole?: (roleId: string, updates: UpdateRoleInput) => Promise<{ success: boolean; error?: string }>;
  onDeleteRole?: (roleId: string) => Promise<{ success: boolean; error?: string }>;
  // Legacy props (kept for compatibility)
  onEditRole?: (updates: UpdateRoleInput) => Promise<void>;
  onPromoteToFormalRole?: () => Promise<void>;
  onViewFullProfile?: () => void;
  onProposeRotation?: () => void;
  onOpenMatching?: () => void;
}

// Progress bar component
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

// Section wrapper
const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <span className="text-indigo-500">{icon}</span>
      <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wide">{title}</h4>
    </div>
    {children}
  </div>
);

// Info row
const InfoRow: React.FC<{ label: string; value?: string | React.ReactNode; icon?: React.ReactNode }> = ({ label, value, icon }) => {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{value}</span>
    </div>
  );
};

// Editable Info Row (for edit mode)
const EditableInfoRow: React.FC<{
  label: string;
  value?: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  type?: 'text' | 'number';
  placeholder?: string;
}> = ({ label, value, onChange, icon, type = 'text', placeholder }) => (
  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg gap-3">
    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2 shrink-0">
      {icon}
      {label}
    </span>
    <input
      type={type}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="text-sm font-medium text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 flex-1 min-w-0 text-right"
    />
  </div>
);

export const UnifiedDetailModal: React.FC<UnifiedDetailModalProps> = ({
  isOpen,
  position,
  companyValues,
  parentManagers,
  onClose,
  onSaveRole,
  onDeleteRole,
  onEditRole,
  onPromoteToFormalRole,
  onViewFullProfile,
  onProposeRotation,
  onOpenMatching
}) => {
  const [activeTab, setActiveTab] = useState<TabId>(() => position.assignee ? 'persona' : 'ruolo');
  const [history, setHistory] = useState<AssignmentHistoryEntry[]>([]);
  const [userHardSkills, setUserHardSkills] = useState<UserHardSkillDisplay[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editedRole, setEditedRole] = useState<Partial<UpdateRoleInput>>({});
  
  const { calculateDetailedMetrics, fetchAssignmentHistory, fetchUserHardSkills } = useUnifiedOrgData();

  const { role, assignee, assignment, metrics } = position;

  // Check if this is a formal role (not implicit)
  const isImplicitRole = role.id.startsWith('implicit-');
  const canEdit = !isImplicitRole && (!!onSaveRole || !!onEditRole);
  const canDelete = !isImplicitRole && !!onDeleteRole;

  // Calculate detailed metrics
  const detailedMetrics = useMemo(() => 
    calculateDetailedMetrics(role, assignee || null, companyValues, parentManagers),
    [role, assignee, companyValues, parentManagers, calculateDetailedMetrics]
  );

  // Reset edit state when modal opens/closes or position changes
  useEffect(() => {
    setIsEditing(false);
    setEditedRole({});
    setShowDeleteConfirm(false);
  }, [isOpen, position.role.id]);

  // Load history when Storia tab is selected
  useEffect(() => {
    if (activeTab === 'storia' && history.length === 0) {
      setIsLoadingHistory(true);
      fetchAssignmentHistory(role.id).then(data => {
        setHistory(data);
        setIsLoadingHistory(false);
      });
    }
  }, [activeTab, role.id, history.length, fetchAssignmentHistory]);

  // Load user hard skills
  useEffect(() => {
    if (assignee?.id && userHardSkills.length === 0) {
      fetchUserHardSkills(assignee.id).then(setUserHardSkills);
    }
  }, [assignee?.id, userHardSkills.length, fetchUserHardSkills]);

  if (!isOpen) return null;

  // Handle save
  const handleSave = async () => {
    if (Object.keys(editedRole).length === 0) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      if (onSaveRole) {
        const result = await onSaveRole(role.id, editedRole);
        if (result.success) {
          setIsEditing(false);
          setEditedRole({});
        }
      } else if (onEditRole) {
        // Legacy compatibility
        await onEditRole(editedRole);
        setIsEditing(false);
        setEditedRole({});
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!onDeleteRole) return;
    
    setIsSaving(true);
    try {
      const result = await onDeleteRole(role.id);
      if (result.success) {
        onClose();
      }
    } finally {
      setIsSaving(false);
      setShowDeleteConfirm(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedRole({});
  };

  // Get current value (edited or original)
  const getValue = <K extends keyof CompanyRole>(key: K): CompanyRole[K] => {
    return (editedRole[key as keyof UpdateRoleInput] as CompanyRole[K]) ?? role[key];
  };

  // Update edited value
  const updateValue = <K extends keyof UpdateRoleInput>(key: K, value: UpdateRoleInput[K]) => {
    setEditedRole(prev => ({ ...prev, [key]: value }));
  };

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

  // Tab Content Renderers
  const renderPersonaTab = () => {
    if (!assignee) {
      return (
        <div className="text-center py-12 text-gray-400">
          <User size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">Nessuno assegnato a questo ruolo</p>
          <p className="text-sm mt-1">Clicca "Avvia Matching" per trovare candidati</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* FIT CON IL RUOLO */}
        <Section title="Fit con il Ruolo" icon={<Target size={16} />}>
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Aderenza</span>
            <ProgressBar value={detailedMetrics.roleFitScore} />
            <span className={`font-bold text-sm ${detailedMetrics.roleFitScore >= 70 ? 'text-green-600' : detailedMetrics.roleFitScore >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
              {detailedMetrics.roleFitScore}%
            </span>
          </div>

          {/* Soft Skills */}
          {(detailedMetrics.softSkillsMatched.length > 0 || detailedMetrics.softSkillsMissing.length > 0) && (
            <div className="space-y-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Soft Skills</span>
              <div className="flex flex-wrap gap-1.5">
                {detailedMetrics.softSkillsMatched.map((skill, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    <CheckCircle size={10} /> {skill}
                  </span>
                ))}
                {detailedMetrics.softSkillsMissing.map((skill, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                    <XCircle size={10} /> {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Seniority Match */}
          {detailedMetrics.seniorityMatch && (
            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Crown size={14} className="text-gray-400" />
                Seniority
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {detailedMetrics.userSeniority || '?'} → {detailedMetrics.requiredSeniority || '?'}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
                  detailedMetrics.seniorityMatch === 'match' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                  detailedMetrics.seniorityMatch === 'above' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                }`}>
                  {detailedMetrics.seniorityMatch === 'match' && <><CheckCircle size={12} /> Match</>}
                  {detailedMetrics.seniorityMatch === 'above' && <><TrendingUp size={12} /> Superiore</>}
                  {detailedMetrics.seniorityMatch === 'below' && <><TrendingDown size={12} /> Inferiore</>}
                </span>
              </div>
            </div>
          )}
        </Section>

        {/* COMPATIBILITÀ RESPONSABILI */}
        {detailedMetrics.managerFitBreakdown.length > 0 && (
          <Section title="Compatibilità Responsabili" icon={<Handshake size={16} />}>
            {detailedMetrics.managerFitScore !== null && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Media</span>
                <ProgressBar value={detailedMetrics.managerFitScore} />
                <span className={`font-bold text-sm ${detailedMetrics.managerFitScore >= 70 ? 'text-green-600' : detailedMetrics.managerFitScore >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {detailedMetrics.managerFitScore}%
                </span>
              </div>
            )}
            <div className="space-y-2">
              {detailedMetrics.managerFitBreakdown.map(mb => (
                <div key={mb.managerId} className="flex items-center justify-between py-2 px-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <User size={12} className="text-gray-400" />
                    {mb.managerName}
                    {mb.managerProfileCode && <span className="text-[10px] font-mono text-gray-400">{mb.managerProfileCode}</span>}
                  </span>
                  {mb.score >= 0 ? (
                    <span className={`text-sm font-bold ${mb.score >= 70 ? 'text-green-600' : mb.score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {mb.score}%
                    </span>
                  ) : (
                    <span className="text-xs italic text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">N/A</span>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* FIT CULTURALE */}
        {companyValues && companyValues.length > 0 && (
          <Section title="Fit Culturale" icon={<Building size={16} />}>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Allineamento</span>
              <ProgressBar value={detailedMetrics.cultureFitScore} />
              <span className={`font-bold text-sm ${detailedMetrics.cultureFitScore >= 70 ? 'text-blue-600' : detailedMetrics.cultureFitScore >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                {detailedMetrics.cultureFitScore}%
              </span>
            </div>
            {assignee.karmaData?.primaryValues && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Valori del Dipendente</span>
                <div className="flex flex-wrap gap-1.5">
                  {assignee.karmaData.primaryValues.map((value, i) => {
                    const isMatched = detailedMetrics.matchedValues.includes(value);
                    return (
                      <span key={i} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        isMatched ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {isMatched && <CheckCircle size={10} />}
                        {value}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </Section>
        )}

        {/* HARD SKILLS */}
        {userHardSkills.length > 0 && (
          <Section title="Hard Skills" icon={<Award size={16} />}>
            <div className="space-y-2">
              {userHardSkills.map((skill, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{skill.name}</span>
                    {skill.category && (
                      <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{skill.category}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(level => (
                        <Star key={level} size={12} className={level <= skill.proficiencyLevel ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 dark:text-gray-600'} />
                      ))}
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${getProficiencyColor(skill.proficiencyLevel)} text-white`}>
                      {getProficiencyLabel(skill.proficiencyLevel)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    );
  };

  const renderRuoloTab = () => {
    const currentDescription = getValue('description');
    const currentResponsibilities = getValue('responsibilities') || [];
    const currentDailyTasks = getValue('dailyTasks') || [];
    const currentKpis = getValue('kpis') || [];

    return (
      <div className="space-y-6">
        {/* BANNER RUOLO IMPLICITO */}
        {isImplicitRole && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <Info size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Questo ruolo è generato automaticamente dal job title.
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Crea un ruolo formale per modificare mansionario, KPI e requisiti.
              </p>
            </div>
            {onPromoteToFormalRole && (
              <button
                onClick={async () => {
                  setIsPromoting(true);
                  try { await onPromoteToFormalRole(); } finally { setIsPromoting(false); }
                }}
                disabled={isPromoting}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
              >
                {isPromoting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                Crea Ruolo
              </button>
            )}
          </div>
        )}

        {/* TITOLO (solo in edit mode) */}
        {isEditing && (
          <Section title="Titolo Ruolo" icon={<Briefcase size={16} />}>
            <input
              value={getValue('title')}
              onChange={e => updateValue('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              placeholder="Titolo del ruolo"
            />
          </Section>
        )}

        {/* DESCRIZIONE */}
        <Section title="Descrizione" icon={<FileText size={16} />}>
          {isEditing ? (
            <textarea
              value={currentDescription || ''}
              onChange={e => updateValue('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm"
              placeholder="Descrizione del ruolo..."
            />
          ) : currentDescription ? (
            <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/30 p-3 rounded-lg">
              {currentDescription}
            </p>
          ) : (
            <p className="text-sm text-gray-400 italic">Nessuna descrizione</p>
          )}
        </Section>

        {/* RESPONSABILITÀ */}
        <Section title="Responsabilità" icon={<Target size={16} />}>
          {isEditing ? (
            <div className="space-y-2">
              {currentResponsibilities.map((resp, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={resp}
                    onChange={e => {
                      const newResp = [...currentResponsibilities];
                      newResp[i] = e.target.value;
                      updateValue('responsibilities', newResp);
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                    placeholder={`Responsabilità ${i + 1}`}
                  />
                  <button
                    onClick={() => {
                      const newResp = currentResponsibilities.filter((_, idx) => idx !== i);
                      updateValue('responsibilities', newResp);
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => updateValue('responsibilities', [...currentResponsibilities, ''])}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                + Aggiungi responsabilità
              </button>
            </div>
          ) : currentResponsibilities.length > 0 ? (
            <ul className="space-y-2">
              {currentResponsibilities.map((resp, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <ChevronRight size={14} className="text-indigo-500 shrink-0 mt-1" />
                  {resp}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 italic">Nessuna responsabilità definita</p>
          )}
        </Section>

        {/* ATTIVITÀ QUOTIDIANE */}
        <Section title="Attività Quotidiane" icon={<Clock size={16} />}>
          {isEditing ? (
            <div className="space-y-2">
              {currentDailyTasks.map((task, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={task}
                    onChange={e => {
                      const newTasks = [...currentDailyTasks];
                      newTasks[i] = e.target.value;
                      updateValue('dailyTasks', newTasks);
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                    placeholder={`Attività ${i + 1}`}
                  />
                  <button
                    onClick={() => {
                      const newTasks = currentDailyTasks.filter((_, idx) => idx !== i);
                      updateValue('dailyTasks', newTasks);
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => updateValue('dailyTasks', [...currentDailyTasks, ''])}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                + Aggiungi attività
              </button>
            </div>
          ) : currentDailyTasks.length > 0 ? (
            <ul className="space-y-2">
              {currentDailyTasks.map((task, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle size={14} className="text-green-500 shrink-0 mt-1" />
                  {task}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 italic">Nessuna attività definita</p>
          )}
        </Section>

        {/* KPI */}
        <Section title="KPI e Obiettivi" icon={<TrendingUp size={16} />}>
          {isEditing ? (
            <div className="space-y-3">
              {currentKpis.map((kpi, i) => (
                <div key={i} className="p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={kpi.name}
                      onChange={e => {
                        const newKpis = [...currentKpis];
                        newKpis[i] = { ...newKpis[i], name: e.target.value };
                        updateValue('kpis', newKpis);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm font-medium"
                      placeholder="Nome KPI"
                    />
                    <button
                      onClick={() => {
                        const newKpis = currentKpis.filter((_, idx) => idx !== i);
                        updateValue('kpis', newKpis);
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <input
                    value={kpi.target || ''}
                    onChange={e => {
                      const newKpis = [...currentKpis];
                      newKpis[i] = { ...newKpis[i], target: e.target.value };
                      updateValue('kpis', newKpis);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                    placeholder="Target (es. >95%)"
                  />
                </div>
              ))}
              <button
                onClick={() => updateValue('kpis', [...currentKpis, { name: '', target: '' }])}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                + Aggiungi KPI
              </button>
            </div>
          ) : currentKpis.length > 0 ? (
            <div className="space-y-3">
              {currentKpis.map((kpi, i) => (
                <div key={i} className="p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                  <div className="font-medium text-gray-800 dark:text-gray-200">{kpi.name}</div>
                  {kpi.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{kpi.description}</p>}
                  {kpi.target && (
                    <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">
                      Target: {kpi.target} {kpi.measurementUnit && `(${kpi.measurementUnit})`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">Nessun KPI definito</p>
          )}
        </Section>
      </div>
    );
  };

  const renderRequisitiTab = () => (
    <div className="space-y-6">
      {/* HARD SKILLS RICHIESTE */}
      {role.requiredHardSkills && role.requiredHardSkills.length > 0 && (
        <Section title="Hard Skills Richieste" icon={<Award size={16} />}>
          <div className="flex flex-wrap gap-2">
            {role.requiredHardSkills.map((skill, i) => (
              <span key={i} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
                skill.mandatory 
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700' 
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {skill.name}
                {skill.level && <span className="text-xs text-gray-500 ml-1">Liv. {skill.level}</span>}
                {skill.mandatory && <Star size={10} className="text-amber-500 fill-amber-500 ml-1" />}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* SOFT SKILLS RICHIESTE */}
      {role.requiredSoftSkills && role.requiredSoftSkills.length > 0 && (
        <Section title="Soft Skills Richieste" icon={<Users size={16} />}>
          <div className="flex flex-wrap gap-2">
            {role.requiredSoftSkills.map((skill, i) => (
              <span key={i} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
                skill.mandatory 
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-300 dark:border-purple-700' 
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {skill.name}
                {skill.mandatory && <Star size={10} className="text-amber-500 fill-amber-500 ml-1" />}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* SENIORITY & ESPERIENZA */}
      <Section title="Esperienza" icon={<Crown size={16} />}>
        <div className="space-y-2">
          <InfoRow label="Seniority" value={role.requiredSeniority} icon={<Crown size={14} />} />
          {(role.yearsExperienceMin || role.yearsExperienceMax) && (
            <InfoRow 
              label="Anni di esperienza" 
              value={`${role.yearsExperienceMin || 0} - ${role.yearsExperienceMax || '+'} anni`}
              icon={<Clock size={14} />}
            />
          )}
        </div>
      </Section>

      {/* FORMAZIONE */}
      {role.requiredEducation && role.requiredEducation.length > 0 && (
        <Section title="Formazione" icon={<GraduationCap size={16} />}>
          <div className="space-y-2">
            {role.requiredEducation.map((edu, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                <span className="text-sm text-gray-700 dark:text-gray-300">{edu.degree}</span>
                <div className="flex items-center gap-2">
                  {edu.field && <span className="text-xs text-gray-500">{edu.field}</span>}
                  {edu.mandatory && <Star size={10} className="text-amber-500 fill-amber-500" />}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* CERTIFICAZIONI */}
      {role.requiredCertifications && role.requiredCertifications.length > 0 && (
        <Section title="Certificazioni" icon={<Award size={16} />}>
          <div className="flex flex-wrap gap-2">
            {role.requiredCertifications.map((cert, i) => (
              <span key={i} className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                {cert}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* LINGUE */}
      {role.requiredLanguages && role.requiredLanguages.length > 0 && (
        <Section title="Lingue" icon={<Languages size={16} />}>
          <div className="space-y-2">
            {role.requiredLanguages.map((lang, i) => (
              <InfoRow key={i} label={lang.language} value={lang.level} icon={<Languages size={14} />} />
            ))}
          </div>
        </Section>
      )}

      {/* Empty state for requisiti */}
      {(!role.requiredHardSkills || role.requiredHardSkills.length === 0) &&
       (!role.requiredSoftSkills || role.requiredSoftSkills.length === 0) &&
       !role.requiredSeniority &&
       (!role.requiredEducation || role.requiredEducation.length === 0) &&
       (!role.requiredCertifications || role.requiredCertifications.length === 0) &&
       (!role.requiredLanguages || role.requiredLanguages.length === 0) && (
        <div className="text-center py-12 text-gray-400">
          <Target size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">Nessun requisito definito</p>
          <p className="text-sm mt-1">Clicca "Modifica" per aggiungere requisiti</p>
        </div>
      )}
    </div>
  );

  const renderContrattoTab = () => (
    <div className="space-y-6">
      {/* TIPO CONTRATTO */}
      <Section title="Tipologia" icon={<Briefcase size={16} />}>
        <div className="space-y-2">
          <InfoRow label="Tipo Contratto" value={role.contractType ? CONTRACT_TYPE_LABELS[role.contractType] : undefined} icon={<FileText size={14} />} />
          <InfoRow label="Orario" value={role.workHoursType ? WORK_HOURS_LABELS[role.workHoursType] : undefined} icon={<Clock size={14} />} />
          <InfoRow label="Modalità Lavoro" value={role.remotePolicy ? REMOTE_POLICY_LABELS[role.remotePolicy] : undefined} icon={<Laptop size={14} />} />
        </div>
      </Section>

      {/* INQUADRAMENTO */}
      <Section title="Inquadramento" icon={<Scale size={16} />}>
        <div className="space-y-2">
          <InfoRow label="Livello CCNL" value={role.ccnlLevel} icon={<Scale size={14} />} />
          {(role.ralRangeMin || role.ralRangeMax) && (
            <InfoRow 
              label="Range RAL" 
              value={`€${(role.ralRangeMin || 0).toLocaleString()} - €${(role.ralRangeMax || 0).toLocaleString()}`}
              icon={<Banknote size={14} />}
            />
          )}
        </div>
      </Section>

      {/* HEADCOUNT */}
      <Section title="Organico" icon={<Users size={16} />}>
        <InfoRow label="Headcount" value={`${role.headcount} ${role.headcount === 1 ? 'posizione' : 'posizioni'}`} icon={<Users size={14} />} />
      </Section>
    </div>
  );

  const renderStoriaTab = () => (
    <div className="space-y-4">
      {isLoadingHistory ? (
        <div className="text-center py-12 text-gray-400">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p>Caricamento storico...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <History size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">Nessuno storico disponibile</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((entry, i) => (
            <div key={entry.id} className={`relative p-4 rounded-lg border ${
              !entry.endDate 
                ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
                : 'bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700'
            }`}>
              {/* Timeline connector */}
              {i < history.length - 1 && (
                <div className="absolute left-8 top-full w-0.5 h-3 bg-gray-300 dark:bg-gray-600" />
              )}
              
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                  !entry.endDate ? 'bg-green-500' : 'bg-gray-400'
                }`}>
                  {entry.assignee ? `${entry.assignee.firstName?.[0] || ''}${entry.assignee.lastName?.[0] || ''}` : '?'}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {entry.assignee ? `${entry.assignee.firstName} ${entry.assignee.lastName}` : 'Utente rimosso'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      entry.assignmentType === 'primary' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' :
                      entry.assignmentType === 'interim' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                      entry.assignmentType === 'backup' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                    }`}>
                      {ASSIGNMENT_TYPE_LABELS[entry.assignmentType as keyof typeof ASSIGNMENT_TYPE_LABELS] || entry.assignmentType}
                    </span>
                    {!entry.endDate && (
                      <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 font-bold">
                        ATTUALE
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                    <Calendar size={12} />
                    {new Date(entry.startDate).toLocaleDateString('it-IT')}
                    {entry.endDate && (
                      <> → {new Date(entry.endDate).toLocaleDateString('it-IT')}</>
                    )}
                    {entry.ftePercentage < 100 && (
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                        {entry.ftePercentage}% FTE
                      </span>
                    )}
                  </div>
                  
                  {entry.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
                      "{entry.notes}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-x-4 top-8 bottom-8 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-[210] w-auto md:w-[640px] md:max-h-[85vh] flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-gray-800 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                role.isHiring 
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' 
                  : 'bg-gradient-to-br from-indigo-500 to-indigo-600'
              }`}>
                {role.isHiring ? <FileSearch size={28} /> : <Briefcase size={28} />}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                  {role.title}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {assignee && (
                    <>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {assignee.firstName} {assignee.lastName}
                      </span>
                      {assignee.profileCode && (
                        <span className="text-xs font-mono bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded">
                          {assignee.profileCode}
                        </span>
                      )}
                      {assignee.birthDate && <GenerationBadge birthDate={assignee.birthDate} size="sm" />}
                      {metrics.isLeader && (
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Crown size={12} /> LEADER
                        </span>
                      )}
                    </>
                  )}
                  {role.isHiring && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 animate-pulse">
                      HIRING
                    </span>
                  )}
                  {isImplicitRole && (
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                      Ruolo implicito
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors shrink-0"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-2 shrink-0 bg-gray-50 dark:bg-gray-900/30">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'persona' && renderPersonaTab()}
          {activeTab === 'ruolo' && renderRuoloTab()}
          {activeTab === 'requisiti' && renderRequisitiTab()}
          {activeTab === 'contratto' && renderContrattoTab()}
          {activeTab === 'storia' && renderStoriaTab()}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2 shrink-0 bg-gray-50 dark:bg-gray-900/30">
          {/* Edit Mode Actions */}
          {isEditing ? (
            <>
              <Button variant="ghost" onClick={handleCancelEdit} disabled={isSaving} className="flex-1">
                Annulla
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                {isSaving ? <Loader2 size={16} className="animate-spin mr-1" /> : <Save size={16} className="mr-1" />}
                Salva Modifiche
              </Button>
            </>
          ) : (
            <>
              {/* View Mode Actions */}
              {isImplicitRole && onPromoteToFormalRole && (
                <Button 
                  onClick={async () => {
                    setIsPromoting(true);
                    try { await onPromoteToFormalRole(); } finally { setIsPromoting(false); }
                  }}
                  disabled={isPromoting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isPromoting ? <Loader2 size={16} className="animate-spin mr-1" /> : <Sparkles size={16} className="mr-1" />}
                  Crea Ruolo Formale
                </Button>
              )}
              {canEdit && (
                <Button variant="outline" onClick={() => setIsEditing(true)} className="flex-1">
                  <Edit size={16} className="mr-1" /> Modifica Ruolo
                </Button>
              )}
              {canDelete && (
                <Button 
                  variant="ghost" 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 size={16} />
                </Button>
              )}
              {assignee && onViewFullProfile && (
                <Button onClick={onViewFullProfile} className="flex-1">
                  <Eye size={16} className="mr-1" /> Profilo Completo
                </Button>
              )}
              {!assignee && role.isHiring && onOpenMatching && (
                <Button onClick={onOpenMatching} className="flex-1">
                  <FileSearch size={16} className="mr-1" /> Avvia Matching
                </Button>
              )}
              {assignee && onProposeRotation && (
                <Button variant="ghost" onClick={onProposeRotation} title="Proponi Job Rotation">
                  <Shuffle size={16} />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div className="fixed inset-0 bg-black/60 z-[220]" onClick={() => setShowDeleteConfirm(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[230] w-[400px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Elimina Ruolo</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Questa azione è irreversibile</p>
              </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Sei sicuro di voler eliminare il ruolo <strong>"{role.title}"</strong>? 
              {assignee && (
                <span className="block mt-2 text-amber-600 dark:text-amber-400 text-sm">
                  ⚠️ Attenzione: {assignee.firstName} {assignee.lastName} è attualmente assegnato a questo ruolo.
                </span>
              )}
            </p>
            
            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                onClick={() => setShowDeleteConfirm(false)} 
                disabled={isSaving}
                className="flex-1"
              >
                Annulla
              </Button>
              <Button 
                onClick={handleDelete} 
                disabled={isSaving}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin mr-1" /> : <Trash2 size={16} className="mr-1" />}
                Elimina
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default UnifiedDetailModal;
