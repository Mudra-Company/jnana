/**
 * RoleCreationModal - Multi-step wizard for creating new positions
 * 
 * Unified flow: First define the Role, then optionally assign a Person
 * 
 * Steps:
 * 1. Info Base (title, code, description, org node) - REQUIRED
 * 2. Mansionario (responsibilities, tasks, KPIs) - Optional (Advanced)
 * 3. Requisiti (skills, seniority, education) - Optional (Advanced)
 * 4. Inquadramento (CCNL, RAL, contract type) - Optional (Advanced)
 * 5. Assegna Persona (assign existing, invite new, or leave vacant) - Optional
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  FileText,
  GraduationCap,
  Building2,
  Plus,
  Trash2,
  Check,
  Loader2,
  User as UserIcon,
  UserPlus,
  Search,
  Settings2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import type { 
  CreateRoleInput,
  ContractType,
  WorkHoursType,
  RemotePolicy,
  RoleStatus,
  RequiredSkill,
  KPI
} from '../../types/roles';
import {
  CONTRACT_TYPE_LABELS,
  WORK_HOURS_LABELS,
  REMOTE_POLICY_LABELS,
  ROLE_STATUS_LABELS
} from '../../types/roles';
import type { SeniorityLevel, OrgNode, User } from '../../../types';

// Assignment mode for Step 5
type AssignmentMode = 'none' | 'existing' | 'invite';

interface RoleCreationModalProps {
  companyId: string;
  orgNodes: OrgNode[];
  companyMembers?: User[]; // For selecting existing employees
  onClose: () => void;
  onSave: (input: CreateRoleInput, assignment?: {
    mode: AssignmentMode;
    userId?: string;
    inviteData?: { firstName: string; lastName: string; email: string };
  }) => Promise<void>;
  defaultOrgNodeId?: string;
}

type Step = 1 | 2 | 3 | 4 | 5;

const SENIORITY_OPTIONS: SeniorityLevel[] = ['Junior', 'Mid', 'Senior', 'Lead', 'C-Level'];
const CONTRACT_TYPES: ContractType[] = ['permanent', 'fixed_term', 'apprenticeship', 'internship', 'freelance', 'consulting'];
const WORK_HOURS_TYPES: WorkHoursType[] = ['full_time', 'part_time', 'flexible'];
const REMOTE_POLICIES: RemotePolicy[] = ['on_site', 'hybrid', 'remote', 'flexible'];
const ROLE_STATUSES: RoleStatus[] = ['active', 'vacant', 'frozen', 'planned'];

const STEP_TITLES: Record<Step, { title: string; icon: React.ReactNode }> = {
  1: { title: 'Informazioni Base', icon: <Briefcase size={20} /> },
  2: { title: 'Mansionario', icon: <FileText size={20} /> },
  3: { title: 'Requisiti', icon: <GraduationCap size={20} /> },
  4: { title: 'Inquadramento', icon: <Building2 size={20} /> },
  5: { title: 'Assegna Persona', icon: <UserIcon size={20} /> }
};

// Flatten org nodes for select
const flattenOrgNodes = (node: OrgNode, prefix = ''): { id: string; name: string }[] => {
  if (!node) return [];
  const result: { id: string; name: string }[] = [];
  const displayName = prefix ? `${prefix} > ${node.name}` : node.name;
  result.push({ id: node.id, name: displayName });
  (node.children || []).forEach(child => {
    result.push(...flattenOrgNodes(child, displayName));
  });
  return result;
};

export const RoleCreationModal: React.FC<RoleCreationModalProps> = ({
  companyId,
  orgNodes,
  companyMembers = [],
  onClose,
  onSave,
  defaultOrgNodeId
}) => {
  const [step, setStep] = useState<Step>(1);
  const [isSaving, setIsSaving] = useState(false);
  
  // Quick mode vs Advanced mode
  const [showAdvancedSteps, setShowAdvancedSteps] = useState(false);
  
  // Form state - Step 1
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [orgNodeId, setOrgNodeId] = useState(defaultOrgNodeId || '');
  // Status and headcount are now auto-calculated, not user inputs
  const [isHiring, setIsHiring] = useState(false);
  
  // Mansionario - Step 2
  const [responsibilities, setResponsibilities] = useState<string[]>([]);
  const [dailyTasks, setDailyTasks] = useState<string[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [newResponsibility, setNewResponsibility] = useState('');
  const [newTask, setNewTask] = useState('');
  const [newKpi, setNewKpi] = useState({ name: '', target: '' });
  
  // Requisiti - Step 3
  const [requiredSeniority, setRequiredSeniority] = useState<SeniorityLevel | ''>('');
  const [yearsExperienceMin, setYearsExperienceMin] = useState<number | ''>('');
  const [yearsExperienceMax, setYearsExperienceMax] = useState<number | ''>('');
  const [requiredHardSkills, setRequiredHardSkills] = useState<RequiredSkill[]>([]);
  const [requiredSoftSkills, setRequiredSoftSkills] = useState<RequiredSkill[]>([]);
  const [requiredCertifications, setRequiredCertifications] = useState<string[]>([]);
  const [newHardSkill, setNewHardSkill] = useState('');
  const [newSoftSkill, setNewSoftSkill] = useState('');
  const [newCertification, setNewCertification] = useState('');
  
  // Inquadramento - Step 4
  const [ccnlLevel, setCcnlLevel] = useState('');
  const [ralRangeMin, setRalRangeMin] = useState<number | ''>('');
  const [ralRangeMax, setRalRangeMax] = useState<number | ''>('');
  const [contractType, setContractType] = useState<ContractType | ''>('');
  const [workHoursType, setWorkHoursType] = useState<WorkHoursType>('full_time');
  const [remotePolicy, setRemotePolicy] = useState<RemotePolicy>('on_site');
  
  // Assignment - Step 5
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>('none');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');

  // Flattened org nodes for dropdown
  const flatNodes = orgNodes && orgNodes.length > 0 ? flattenOrgNodes(orgNodes[0]) : [];
  
  // Available employees for assignment (exclude hiring positions)
  const availableEmployees = useMemo(() => {
    return companyMembers.filter(u => 
      !u.isHiring && 
      u.firstName && 
      u.lastName &&
      (employeeSearchQuery === '' || 
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
        u.jobTitle?.toLowerCase().includes(employeeSearchQuery.toLowerCase())
      )
    );
  }, [companyMembers, employeeSearchQuery]);

  // Calculate which steps to show
  const visibleSteps: Step[] = showAdvancedSteps 
    ? [1, 2, 3, 4, 5] 
    : [1, 5];
  
  const currentStepIndex = visibleSteps.indexOf(step);
  const isLastStep = currentStepIndex === visibleSteps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  const canProceed = () => {
    switch (step) {
      case 1:
        return title.trim().length > 0;
      case 5:
        if (assignmentMode === 'invite') {
          return inviteEmail.trim().length > 0;
        }
        if (assignmentMode === 'existing') {
          return selectedUserId !== null;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < visibleSteps.length) {
      setStep(visibleSteps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(visibleSteps[prevIndex]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Auto-calculate status based on assignment
      const hasAssignment = assignmentMode !== 'none';
      
      const input: CreateRoleInput = {
        companyId,
        title,
        code: code || undefined,
        description: description || undefined,
        orgNodeId: orgNodeId || undefined,
        // Status: active if someone is assigned, vacant otherwise
        status: hasAssignment ? 'active' : 'vacant',
        // Headcount: always 1 in role-centric model (1 role = 1 position)
        headcount: 1,
        // If no one assigned, default to hiring mode
        isHiring: hasAssignment ? isHiring : true,
        responsibilities: responsibilities.length > 0 ? responsibilities : undefined,
        dailyTasks: dailyTasks.length > 0 ? dailyTasks : undefined,
        kpis: kpis.length > 0 ? kpis : undefined,
        requiredSeniority: requiredSeniority || undefined,
        yearsExperienceMin: yearsExperienceMin !== '' ? yearsExperienceMin : undefined,
        yearsExperienceMax: yearsExperienceMax !== '' ? yearsExperienceMax : undefined,
        requiredHardSkills: requiredHardSkills.length > 0 ? requiredHardSkills : undefined,
        requiredSoftSkills: requiredSoftSkills.length > 0 ? requiredSoftSkills : undefined,
        requiredCertifications: requiredCertifications.length > 0 ? requiredCertifications : undefined,
        ccnlLevel: ccnlLevel || undefined,
        ralRangeMin: ralRangeMin !== '' ? ralRangeMin : undefined,
        ralRangeMax: ralRangeMax !== '' ? ralRangeMax : undefined,
        contractType: contractType || undefined,
        workHoursType,
        remotePolicy
      };
      
      // Build assignment data
      const assignment = assignmentMode !== 'none' ? {
        mode: assignmentMode,
        userId: assignmentMode === 'existing' ? selectedUserId || undefined : undefined,
        inviteData: assignmentMode === 'invite' ? {
          firstName: inviteFirstName,
          lastName: inviteLastName,
          email: inviteEmail
        } : undefined
      } : undefined;
      
      await onSave(input, assignment);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  // Add helpers
  const addResponsibility = () => {
    if (newResponsibility.trim()) {
      setResponsibilities([...responsibilities, newResponsibility.trim()]);
      setNewResponsibility('');
    }
  };

  const addTask = () => {
    if (newTask.trim()) {
      setDailyTasks([...dailyTasks, newTask.trim()]);
      setNewTask('');
    }
  };

  const addKpi = () => {
    if (newKpi.name.trim()) {
      setKpis([...kpis, { name: newKpi.name.trim(), target: newKpi.target.trim() || undefined }]);
      setNewKpi({ name: '', target: '' });
    }
  };

  const addHardSkill = () => {
    if (newHardSkill.trim()) {
      setRequiredHardSkills([...requiredHardSkills, { name: newHardSkill.trim() }]);
      setNewHardSkill('');
    }
  };

  const addSoftSkill = () => {
    if (newSoftSkill.trim()) {
      setRequiredSoftSkills([...requiredSoftSkills, { name: newSoftSkill.trim() }]);
      setNewSoftSkill('');
    }
  };

  const addCertification = () => {
    if (newCertification.trim()) {
      setRequiredCertifications([...requiredCertifications, newCertification.trim()]);
      setNewCertification('');
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Titolo Posizione *
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="es. Senior Frontend Developer"
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Codice (opzionale)
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="es. DEV-SR-001"
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Dipartimento/Team
                </label>
                <select
                  value={orgNodeId}
                  onChange={e => setOrgNodeId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Seleziona...</option>
                  {flatNodes.map(node => (
                    <option key={node.id} value={node.id}>{node.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descrizione
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Descrizione della posizione..."
                rows={2}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
              />
            </div>
            
            {/* In Hiring checkbox - Status and Headcount are auto-calculated */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHiring}
                  onChange={e => setIsHiring(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Posizione in Hiring
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Stiamo cercando candidati per questa posizione
                  </p>
                </div>
              </label>
            </div>
            
            {/* Toggle for Advanced Steps */}
            <button
              type="button"
              onClick={() => setShowAdvancedSteps(!showAdvancedSteps)}
              className="flex items-center gap-2 w-full p-3 mt-2 border border-dashed rounded-xl text-gray-500 hover:text-gray-700 hover:border-gray-400 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <Settings2 size={16} />
              <span className="text-sm font-medium">
                {showAdvancedSteps ? 'Nascondi configurazione avanzata' : 'Mostra configurazione avanzata'}
              </span>
              {showAdvancedSteps ? <ChevronUp size={16} className="ml-auto" /> : <ChevronDown size={16} className="ml-auto" />}
            </button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Responsibilities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Responsabilità
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newResponsibility}
                  onChange={e => setNewResponsibility(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addResponsibility())}
                  placeholder="Aggiungi responsabilità..."
                  className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <Button onClick={addResponsibility} disabled={!newResponsibility.trim()}>
                  <Plus size={16} />
                </Button>
              </div>
              <div className="space-y-2">
                {responsibilities.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{r}</span>
                    <button onClick={() => setResponsibilities(responsibilities.filter((_, idx) => idx !== i))}>
                      <Trash2 size={14} className="text-red-400 hover:text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Tasks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Attività Quotidiane
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTask())}
                  placeholder="Aggiungi attività..."
                  className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <Button onClick={addTask} disabled={!newTask.trim()}>
                  <Plus size={16} />
                </Button>
              </div>
              <div className="space-y-2">
                {dailyTasks.map((t, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{t}</span>
                    <button onClick={() => setDailyTasks(dailyTasks.filter((_, idx) => idx !== i))}>
                      <Trash2 size={14} className="text-red-400 hover:text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* KPIs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                KPI
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newKpi.name}
                  onChange={e => setNewKpi({ ...newKpi, name: e.target.value })}
                  placeholder="Nome KPI..."
                  className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <input
                  type="text"
                  value={newKpi.target}
                  onChange={e => setNewKpi({ ...newKpi, target: e.target.value })}
                  placeholder="Target (opz.)"
                  className="w-32 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <Button onClick={addKpi} disabled={!newKpi.name.trim()}>
                  <Plus size={16} />
                </Button>
              </div>
              <div className="space-y-2">
                {kpis.map((k, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {k.name} {k.target && <span className="text-gray-500">→ {k.target}</span>}
                    </span>
                    <button onClick={() => setKpis(kpis.filter((_, idx) => idx !== i))}>
                      <Trash2 size={14} className="text-red-400 hover:text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Seniority & Experience */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Seniority
                </label>
                <select
                  value={requiredSeniority}
                  onChange={e => setRequiredSeniority(e.target.value as SeniorityLevel)}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Non specificata</option>
                  {SENIORITY_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Anni Exp. Min
                </label>
                <input
                  type="number"
                  min={0}
                  value={yearsExperienceMin}
                  onChange={e => setYearsExperienceMin(e.target.value ? parseInt(e.target.value) : '')}
                  placeholder="0"
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Anni Exp. Max
                </label>
                <input
                  type="number"
                  min={0}
                  value={yearsExperienceMax}
                  onChange={e => setYearsExperienceMax(e.target.value ? parseInt(e.target.value) : '')}
                  placeholder="∞"
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            {/* Hard Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hard Skills
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newHardSkill}
                  onChange={e => setNewHardSkill(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addHardSkill())}
                  placeholder="Aggiungi hard skill..."
                  className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <Button onClick={addHardSkill} disabled={!newHardSkill.trim()}>
                  <Plus size={16} />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {requiredHardSkills.map((s, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {s.name}
                    <button onClick={() => setRequiredHardSkills(requiredHardSkills.filter((_, idx) => idx !== i))}>
                      <X size={12} className="text-gray-400 hover:text-red-500" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Soft Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Soft Skills
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newSoftSkill}
                  onChange={e => setNewSoftSkill(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addSoftSkill())}
                  placeholder="Aggiungi soft skill..."
                  className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <Button onClick={addSoftSkill} disabled={!newSoftSkill.trim()}>
                  <Plus size={16} />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {requiredSoftSkills.map((s, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                    {s.name}
                    <button onClick={() => setRequiredSoftSkills(requiredSoftSkills.filter((_, idx) => idx !== i))}>
                      <X size={12} className="text-indigo-400 hover:text-red-500" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Certificazioni
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newCertification}
                  onChange={e => setNewCertification(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                  placeholder="Aggiungi certificazione..."
                  className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <Button onClick={addCertification} disabled={!newCertification.trim()}>
                  <Plus size={16} />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {requiredCertifications.map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                    {c}
                    <button onClick={() => setRequiredCertifications(requiredCertifications.filter((_, idx) => idx !== i))}>
                      <X size={12} className="text-green-400 hover:text-red-500" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Contract Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo Contratto
                </label>
                <select
                  value={contractType}
                  onChange={e => setContractType(e.target.value as ContractType)}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Non specificato</option>
                  {CONTRACT_TYPES.map(t => (
                    <option key={t} value={t}>{CONTRACT_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>

              {/* Work Hours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Orario
                </label>
                <select
                  value={workHoursType}
                  onChange={e => setWorkHoursType(e.target.value as WorkHoursType)}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {WORK_HOURS_TYPES.map(t => (
                    <option key={t} value={t}>{WORK_HOURS_LABELS[t]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Remote Policy */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Modalità Lavoro
                </label>
                <select
                  value={remotePolicy}
                  onChange={e => setRemotePolicy(e.target.value as RemotePolicy)}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {REMOTE_POLICIES.map(p => (
                    <option key={p} value={p}>{REMOTE_POLICY_LABELS[p]}</option>
                  ))}
                </select>
              </div>

              {/* CCNL Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Livello CCNL
                </label>
                <input
                  type="text"
                  value={ccnlLevel}
                  onChange={e => setCcnlLevel(e.target.value)}
                  placeholder="es. Quadro, Impiegato 3°"
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            {/* RAL Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Range RAL (€)
              </label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={ralRangeMin}
                    onChange={e => setRalRangeMin(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="Minimo"
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <span className="text-gray-400">—</span>
                <div className="flex-1">
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={ralRangeMax}
                    onChange={e => setRalRangeMax(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="Massimo"
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="text-center py-2">
              <h4 className="font-bold text-gray-700 dark:text-gray-200 mb-1">Chi occuperà questa posizione?</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Puoi assegnare subito o lasciare vacante</p>
            </div>
            
            <div className="space-y-3">
              {/* Option: Vacant */}
              <label className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                assignmentMode === 'none' 
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}>
                <input 
                  type="radio" 
                  name="assignmentMode"
                  checked={assignmentMode === 'none'} 
                  onChange={() => setAssignmentMode('none')}
                  className="mt-1"
                />
                <div>
                  <div className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <Search size={16} className="text-emerald-600" />
                    Posizione Vacante
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Sarà segnata come "In Hiring", assegna qualcuno in seguito
                  </div>
                </div>
              </label>
              
              {/* Option: Existing Employee */}
              <label className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                assignmentMode === 'existing' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}>
                <input 
                  type="radio" 
                  name="assignmentMode"
                  checked={assignmentMode === 'existing'} 
                  onChange={() => setAssignmentMode('existing')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <UserIcon size={16} className="text-blue-600" />
                    Dipendente Esistente
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Seleziona da lista dipendenti azienda
                  </div>
                </div>
              </label>
              
              {/* Existing Employee Selector */}
              {assignmentMode === 'existing' && (
                <div className="ml-8 space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <input
                    type="text"
                    placeholder="Cerca dipendente..."
                    value={employeeSearchQuery}
                    onChange={e => setEmployeeSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {availableEmployees.length > 0 ? (
                      availableEmployees.slice(0, 10).map(emp => (
                        <label 
                          key={emp.id}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            selectedUserId === emp.id 
                              ? 'bg-blue-100 dark:bg-blue-900/40' 
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name="selectedEmployee"
                            checked={selectedUserId === emp.id}
                            onChange={() => setSelectedUserId(emp.id)}
                          />
                          <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">
                            {emp.firstName?.[0]}{emp.lastName?.[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-800 dark:text-gray-100 truncate">
                              {emp.firstName} {emp.lastName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {emp.jobTitle || 'Nessun ruolo'}
                            </div>
                          </div>
                        </label>
                      ))
                    ) : (
                      <div className="text-center py-4 text-sm text-gray-500">
                        {employeeSearchQuery ? 'Nessun risultato' : 'Nessun dipendente disponibile'}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Option: Invite New */}
              <label className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                assignmentMode === 'invite' 
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}>
                <input 
                  type="radio" 
                  name="assignmentMode"
                  checked={assignmentMode === 'invite'} 
                  onChange={() => setAssignmentMode('invite')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <UserPlus size={16} className="text-purple-600" />
                    Invita Nuova Persona
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Inserisci i dati per inviare un invito
                  </div>
                </div>
              </label>
              
              {/* Invite Form */}
              {assignmentMode === 'invite' && (
                <div className="ml-8 space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Nome"
                      value={inviteFirstName}
                      onChange={e => setInviteFirstName(e.target.value)}
                      className="px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="Cognome"
                      value={inviteLastName}
                      onChange={e => setInviteLastName(e.target.value)}
                      className="px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <input
                    type="email"
                    placeholder="Email aziendale *"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[130] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            {STEP_TITLES[step].icon}
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                Nuova Posizione
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Step {currentStepIndex + 1}/{visibleSteps.length}: {STEP_TITLES[step].title}
              </p>
            </div>
          </div>
          <button onClick={onClose}>
            <X className="text-gray-400 hover:text-red-500 transition-colors" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-6">
          {visibleSteps.map((s, idx) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full transition-colors ${
                idx <= currentStepIndex ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-2 mb-6">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={isFirstStep}
          >
            <ChevronLeft size={16} className="mr-1" /> Indietro
          </Button>
          
          {!isLastStep ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Avanti <ChevronRight size={16} className="ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={isSaving || !canProceed()}>
              {isSaving ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" /> Salvataggio...
                </>
              ) : (
                <>
                  <Check size={16} className="mr-2" /> Crea Posizione
                </>
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default RoleCreationModal;
