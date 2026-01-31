/**
 * RoleCreationModal - Multi-step wizard for creating new roles
 * 
 * Steps:
 * 1. Info Base (title, code, description, org node)
 * 2. Mansionario (responsibilities, tasks, KPIs)
 * 3. Requisiti (skills, seniority, education)
 * 4. Inquadramento (CCNL, RAL, contract type, remote policy)
 */

import React, { useState } from 'react';
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
  Loader2
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
import type { SeniorityLevel, OrgNode } from '../../../types';

interface RoleCreationModalProps {
  companyId: string;
  orgNodes: OrgNode[];
  onClose: () => void;
  onSave: (input: CreateRoleInput) => Promise<void>;
  defaultOrgNodeId?: string;
}

type Step = 1 | 2 | 3 | 4;

const SENIORITY_OPTIONS: SeniorityLevel[] = ['Junior', 'Mid', 'Senior', 'Lead', 'C-Level'];
const CONTRACT_TYPES: ContractType[] = ['permanent', 'fixed_term', 'apprenticeship', 'internship', 'freelance', 'consulting'];
const WORK_HOURS_TYPES: WorkHoursType[] = ['full_time', 'part_time', 'flexible'];
const REMOTE_POLICIES: RemotePolicy[] = ['on_site', 'hybrid', 'remote', 'flexible'];
const ROLE_STATUSES: RoleStatus[] = ['active', 'vacant', 'frozen', 'planned'];

const STEP_TITLES: Record<Step, { title: string; icon: React.ReactNode }> = {
  1: { title: 'Informazioni Base', icon: <Briefcase size={20} /> },
  2: { title: 'Mansionario', icon: <FileText size={20} /> },
  3: { title: 'Requisiti', icon: <GraduationCap size={20} /> },
  4: { title: 'Inquadramento', icon: <Building2 size={20} /> }
};

// Flatten org nodes for select
const flattenOrgNodes = (node: OrgNode, prefix = ''): { id: string; name: string }[] => {
  const result: { id: string; name: string }[] = [];
  const displayName = prefix ? `${prefix} > ${node.name}` : node.name;
  result.push({ id: node.id, name: displayName });
  node.children.forEach(child => {
    result.push(...flattenOrgNodes(child, displayName));
  });
  return result;
};

export const RoleCreationModal: React.FC<RoleCreationModalProps> = ({
  companyId,
  orgNodes,
  onClose,
  onSave,
  defaultOrgNodeId
}) => {
  const [step, setStep] = useState<Step>(1);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [orgNodeId, setOrgNodeId] = useState(defaultOrgNodeId || '');
  const [status, setStatus] = useState<RoleStatus>('active');
  const [headcount, setHeadcount] = useState(1);
  const [isHiring, setIsHiring] = useState(false);
  
  // Mansionario
  const [responsibilities, setResponsibilities] = useState<string[]>([]);
  const [dailyTasks, setDailyTasks] = useState<string[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [newResponsibility, setNewResponsibility] = useState('');
  const [newTask, setNewTask] = useState('');
  const [newKpi, setNewKpi] = useState({ name: '', target: '' });
  
  // Requisiti
  const [requiredSeniority, setRequiredSeniority] = useState<SeniorityLevel | ''>('');
  const [yearsExperienceMin, setYearsExperienceMin] = useState<number | ''>('');
  const [yearsExperienceMax, setYearsExperienceMax] = useState<number | ''>('');
  const [requiredHardSkills, setRequiredHardSkills] = useState<RequiredSkill[]>([]);
  const [requiredSoftSkills, setRequiredSoftSkills] = useState<RequiredSkill[]>([]);
  const [requiredCertifications, setRequiredCertifications] = useState<string[]>([]);
  const [newHardSkill, setNewHardSkill] = useState('');
  const [newSoftSkill, setNewSoftSkill] = useState('');
  const [newCertification, setNewCertification] = useState('');
  
  // Inquadramento
  const [ccnlLevel, setCcnlLevel] = useState('');
  const [ralRangeMin, setRalRangeMin] = useState<number | ''>('');
  const [ralRangeMax, setRalRangeMax] = useState<number | ''>('');
  const [contractType, setContractType] = useState<ContractType | ''>('');
  const [workHoursType, setWorkHoursType] = useState<WorkHoursType>('full_time');
  const [remotePolicy, setRemotePolicy] = useState<RemotePolicy>('on_site');

  // Flattened org nodes for dropdown
  const flatNodes = orgNodes.length > 0 ? flattenOrgNodes(orgNodes[0]) : [];

  const canProceed = () => {
    switch (step) {
      case 1:
        return title.trim().length > 0;
      case 2:
      case 3:
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < 4) setStep((step + 1) as Step);
  };

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as Step);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const input: CreateRoleInput = {
        companyId,
        title,
        code: code || undefined,
        description: description || undefined,
        orgNodeId: orgNodeId || undefined,
        status,
        headcount,
        isHiring,
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
      
      await onSave(input);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

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
                Titolo Ruolo *
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
                placeholder="Descrizione del ruolo..."
                rows={3}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Stato
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as RoleStatus)}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {ROLE_STATUSES.map(s => (
                    <option key={s} value={s}>{ROLE_STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Headcount
                </label>
                <input
                  type="number"
                  min={1}
                  value={headcount}
                  onChange={e => setHeadcount(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isHiring}
                    onChange={e => setIsHiring(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Posizione in Hiring
                  </span>
                </label>
              </div>
            </div>
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

            {/* Summary Preview */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Riepilogo Ruolo</h4>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p><strong>Titolo:</strong> {title || '-'}</p>
                <p><strong>Stato:</strong> {ROLE_STATUS_LABELS[status]}</p>
                {requiredSeniority && <p><strong>Seniority:</strong> {requiredSeniority}</p>}
                {requiredHardSkills.length > 0 && (
                  <p><strong>Hard Skills:</strong> {requiredHardSkills.map(s => s.name).join(', ')}</p>
                )}
                {ccnlLevel && <p><strong>CCNL:</strong> {ccnlLevel}</p>}
                {(ralRangeMin || ralRangeMax) && (
                  <p><strong>RAL:</strong> €{ralRangeMin?.toLocaleString() || '?'} - €{ralRangeMax?.toLocaleString() || '?'}</p>
                )}
              </div>
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
                Nuovo Ruolo
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Step {step}/4: {STEP_TITLES[step].title}
              </p>
            </div>
          </div>
          <button onClick={onClose}>
            <X className="text-gray-400 hover:text-red-500 transition-colors" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-6">
          {([1, 2, 3, 4] as Step[]).map(s => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full transition-colors ${
                s <= step ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-700'
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
            disabled={step === 1}
          >
            <ChevronLeft size={16} className="mr-1" /> Indietro
          </Button>
          
          {step < 4 ? (
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
                  <Check size={16} className="mr-2" /> Crea Ruolo
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
