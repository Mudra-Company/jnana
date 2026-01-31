/**
 * RoleDetailModal - Complete role view with tabs
 * 
 * Sections:
 * - Overview (role info + current assignee)
 * - Mansionario (responsibilities, tasks, KPIs)
 * - Requisiti (skills, seniority, education)
 * - Inquadramento (CCNL, RAL, contract)
 * - Storico (assignment history)
 */

import React, { useState } from 'react';
import {
  X,
  Briefcase,
  User,
  FileText,
  GraduationCap,
  Building2,
  History,
  Search,
  Edit2,
  UserPlus,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Clock,
  Crown,
  Wallet,
  MapPin,
  Calendar,
  Target
} from 'lucide-react';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { RoleStatusBadge } from './RoleStatusBadge';
import type { 
  CompanyRole, 
  RoleAssignment
} from '../../types/roles';
import {
  CONTRACT_TYPE_LABELS,
  WORK_HOURS_LABELS,
  REMOTE_POLICY_LABELS,
  ASSIGNMENT_TYPE_LABELS
} from '../../types/roles';
import type { User as UserType } from '../../../types';

type TabId = 'overview' | 'mansionario' | 'requisiti' | 'inquadramento' | 'storico';

interface RoleDetailModalProps {
  role: CompanyRole;
  assignee?: UserType | null;
  currentAssignment?: RoleAssignment | null;
  allAssignments?: RoleAssignment[];
  onClose: () => void;
  onEdit?: () => void;
  onAssign?: () => void;
  onViewUser?: (userId: string) => void;
}

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Panoramica', icon: <Briefcase size={16} /> },
  { id: 'mansionario', label: 'Mansionario', icon: <FileText size={16} /> },
  { id: 'requisiti', label: 'Requisiti', icon: <GraduationCap size={16} /> },
  { id: 'inquadramento', label: 'Inquadramento', icon: <Building2 size={16} /> },
  { id: 'storico', label: 'Storico', icon: <History size={16} /> },
];

export const RoleDetailModal: React.FC<RoleDetailModalProps> = ({
  role,
  assignee,
  currentAssignment,
  allAssignments = [],
  onClose,
  onEdit,
  onAssign,
  onViewUser
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  
  const hasAssignee = !!assignee;
  const contractTypeLabel = role.contractType ? CONTRACT_TYPE_LABELS[role.contractType] : null;
  const workHoursLabel = role.workHoursType ? WORK_HOURS_LABELS[role.workHoursType] : null;
  const remotePolicyLabel = role.remotePolicy ? REMOTE_POLICY_LABELS[role.remotePolicy] : null;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Current Assignee */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <User size={16} /> Persona Assegnata
              </h4>
              
              {hasAssignee ? (
                <div 
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-indigo-300 transition-colors"
                  onClick={() => onViewUser?.(assignee.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-jnana-sage flex items-center justify-center text-lg font-bold text-white">
                      {assignee.firstName?.[0]}{assignee.lastName?.[0]}
                    </div>
                    <div>
                      <div className="font-bold text-gray-800 dark:text-gray-100">
                        {assignee.firstName} {assignee.lastName}
                      </div>
                      {assignee.profileCode && (
                        <span className="text-xs font-mono text-gray-500">{assignee.profileCode}</span>
                      )}
                      {currentAssignment && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium">
                            {ASSIGNMENT_TYPE_LABELS[currentAssignment.assignmentType]}
                          </span>
                          {currentAssignment.ftePercentage < 100 && (
                            <span className="text-[10px] text-gray-500">{currentAssignment.ftePercentage}% FTE</span>
                          )}
                          <span className="text-[10px] text-gray-400">
                            Dal {new Date(currentAssignment.startDate).toLocaleDateString('it-IT')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </div>
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg">
                  <User size={32} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    {role.isHiring ? 'Ricerca candidati in corso' : 'Nessuna persona assegnata'}
                  </p>
                  {onAssign && (
                    <Button size="sm" onClick={onAssign}>
                      <UserPlus size={14} className="mr-1" /> Assegna Persona
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-4">
              {role.requiredSeniority && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <div className="text-xs text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
                    <Crown size={12} /> Seniority Richiesta
                  </div>
                  <div className="font-bold text-amber-800 dark:text-amber-200">{role.requiredSeniority}</div>
                </div>
              )}
              
              {role.ccnlLevel && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-xs text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">
                    <Building2 size={12} /> Livello CCNL
                  </div>
                  <div className="font-bold text-blue-800 dark:text-blue-200">{role.ccnlLevel}</div>
                </div>
              )}
              
              {(role.ralRangeMin || role.ralRangeMax) && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-xs text-green-600 dark:text-green-400 mb-1 flex items-center gap-1">
                    <Wallet size={12} /> RAL
                  </div>
                  <div className="font-bold text-green-800 dark:text-green-200">
                    {role.ralRangeMin && role.ralRangeMax 
                      ? `€${role.ralRangeMin.toLocaleString()} - €${role.ralRangeMax.toLocaleString()}`
                      : role.ralRangeMin 
                        ? `Da €${role.ralRangeMin.toLocaleString()}`
                        : `Fino a €${role.ralRangeMax?.toLocaleString()}`
                    }
                  </div>
                </div>
              )}
              
              {remotePolicyLabel && (
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-xs text-purple-600 dark:text-purple-400 mb-1 flex items-center gap-1">
                    <MapPin size={12} /> Modalità
                  </div>
                  <div className="font-bold text-purple-800 dark:text-purple-200">{remotePolicyLabel}</div>
                </div>
              )}
            </div>

            {/* Description */}
            {role.description && (
              <div>
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Descrizione</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{role.description}</p>
              </div>
            )}
          </div>
        );

      case 'mansionario':
        return (
          <div className="space-y-6">
            {/* Responsibilities */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Target size={16} /> Responsabilità
              </h4>
              {role.responsibilities && role.responsibilities.length > 0 ? (
                <ul className="space-y-2">
                  {role.responsibilities.map((resp, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                      {resp}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 italic">Nessuna responsabilità definita</p>
              )}
            </div>

            {/* Daily Tasks */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Clock size={16} /> Attività Quotidiane
              </h4>
              {role.dailyTasks && role.dailyTasks.length > 0 ? (
                <ul className="space-y-2">
                  {role.dailyTasks.map((task, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="text-gray-400">•</span>
                      {task}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 italic">Nessuna attività definita</p>
              )}
            </div>

            {/* KPIs */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Target size={16} /> KPI
              </h4>
              {role.kpis && role.kpis.length > 0 ? (
                <div className="grid gap-3">
                  {role.kpis.map((kpi, i) => (
                    <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="font-medium text-gray-800 dark:text-gray-200">{kpi.name}</div>
                      {kpi.description && <p className="text-xs text-gray-500 mt-1">{kpi.description}</p>}
                      {kpi.target && <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">Target: {kpi.target}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Nessun KPI definito</p>
              )}
            </div>
          </div>
        );

      case 'requisiti':
        return (
          <div className="space-y-6">
            {/* Hard Skills */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Hard Skills Richieste</h4>
              {role.requiredHardSkills && role.requiredHardSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {role.requiredHardSkills.map((skill, i) => (
                    <span 
                      key={i} 
                      className={`px-3 py-1 rounded-full text-sm ${
                        skill.mandatory 
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800' 
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {skill.name}
                      {skill.level && <span className="ml-1 opacity-60">L{skill.level}</span>}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Nessuna hard skill definita</p>
              )}
            </div>

            {/* Soft Skills */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Soft Skills Richieste</h4>
              {role.requiredSoftSkills && role.requiredSoftSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {role.requiredSoftSkills.map((skill, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                      {skill.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Nessuna soft skill definita</p>
              )}
            </div>

            {/* Seniority & Experience */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Seniority</h4>
                {role.requiredSeniority ? (
                  <span className="px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                    {role.requiredSeniority}
                  </span>
                ) : (
                  <p className="text-sm text-gray-400 italic">Non specificata</p>
                )}
              </div>
              
              <div>
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Esperienza</h4>
                {role.yearsExperienceMin || role.yearsExperienceMax ? (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {role.yearsExperienceMin && role.yearsExperienceMax 
                      ? `${role.yearsExperienceMin}-${role.yearsExperienceMax} anni`
                      : role.yearsExperienceMin 
                        ? `Min ${role.yearsExperienceMin} anni`
                        : `Max ${role.yearsExperienceMax} anni`
                    }
                  </span>
                ) : (
                  <p className="text-sm text-gray-400 italic">Non specificata</p>
                )}
              </div>
            </div>

            {/* Education */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Formazione</h4>
              {role.requiredEducation && role.requiredEducation.length > 0 ? (
                <div className="space-y-2">
                  {role.requiredEducation.map((edu, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <GraduationCap size={14} className="text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">{edu.degree}</span>
                      {edu.field && <span className="text-gray-500">({edu.field})</span>}
                      {edu.mandatory && <span className="text-xs text-red-500">Obbligatorio</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Nessun requisito formativo</p>
              )}
            </div>

            {/* Certifications */}
            {role.requiredCertifications && role.requiredCertifications.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Certificazioni</h4>
                <div className="flex flex-wrap gap-2">
                  {role.requiredCertifications.map((cert, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {role.requiredLanguages && role.requiredLanguages.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Lingue</h4>
                <div className="flex flex-wrap gap-2">
                  {role.requiredLanguages.map((lang, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      {lang.language} ({lang.level})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'inquadramento':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Contract Type */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tipo Contratto</div>
                <div className="font-bold text-gray-800 dark:text-gray-200">
                  {contractTypeLabel || 'Non specificato'}
                </div>
              </div>

              {/* Work Hours */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Orario</div>
                <div className="font-bold text-gray-800 dark:text-gray-200">
                  {workHoursLabel || 'Non specificato'}
                </div>
              </div>

              {/* CCNL Level */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Livello CCNL</div>
                <div className="font-bold text-gray-800 dark:text-gray-200">
                  {role.ccnlLevel || 'Non specificato'}
                </div>
              </div>

              {/* Remote Policy */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Modalità Lavoro</div>
                <div className="font-bold text-gray-800 dark:text-gray-200">
                  {remotePolicyLabel || 'Non specificato'}
                </div>
              </div>
            </div>

            {/* RAL Range */}
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div className="text-xs text-green-600 dark:text-green-400 mb-2 flex items-center gap-1">
                <Wallet size={12} /> Range RAL
              </div>
              {role.ralRangeMin || role.ralRangeMax ? (
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Minimo</div>
                    <div className="text-xl font-bold text-gray-800 dark:text-gray-200">
                      {role.ralRangeMin ? `€${role.ralRangeMin.toLocaleString()}` : '-'}
                    </div>
                  </div>
                  <div className="text-2xl text-gray-300">→</div>
                  <div>
                    <div className="text-xs text-gray-500">Massimo</div>
                    <div className="text-xl font-bold text-gray-800 dark:text-gray-200">
                      {role.ralRangeMax ? `€${role.ralRangeMax.toLocaleString()}` : '-'}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Range non specificato</p>
              )}
            </div>
          </div>
        );

      case 'storico':
        return (
          <div className="space-y-4">
            {allAssignments.length > 0 ? (
              allAssignments.map((assignment, i) => {
                const isActive = !assignment.endDate;
                return (
                  <div 
                    key={assignment.id}
                    className={`p-4 rounded-xl border-2 ${
                      isActive 
                        ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10' 
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-jnana-sage flex items-center justify-center text-xs font-bold text-white">
                          {assignment.user?.firstName?.[0] || '?'}{assignment.user?.lastName?.[0] || ''}
                        </div>
                        <div>
                          <div className="font-bold text-gray-800 dark:text-gray-200">
                            {assignment.user ? `${assignment.user.firstName} ${assignment.user.lastName}` : 'Utente non trovato'}
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            {ASSIGNMENT_TYPE_LABELS[assignment.assignmentType]}
                          </span>
                        </div>
                      </div>
                      {isActive && (
                        <span className="text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                          <CheckCircle size={12} /> ATTUALE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pl-10">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(assignment.startDate).toLocaleDateString('it-IT')}
                        {assignment.endDate && ` - ${new Date(assignment.endDate).toLocaleDateString('it-IT')}`}
                      </span>
                      <span>{assignment.ftePercentage}% FTE</span>
                    </div>
                    {assignment.notes && (
                      <p className="text-xs text-gray-500 mt-2 pl-10 italic">{assignment.notes}</p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-400">
                <History size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nessuno storico disponibile</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[130] flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              role.isHiring 
                ? 'bg-emerald-500 text-white' 
                : 'bg-jnana-sage text-white'
            }`}>
              <Briefcase size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {role.title}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                {role.code && (
                  <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                    {role.code}
                  </span>
                )}
                <RoleStatusBadge status={role.status} isHiring={role.isHiring} size="sm" />
                {role.orgNode && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    • {role.orgNode.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit2 size={14} className="mr-1" /> Modifica
              </Button>
            )}
            <button onClick={onClose}>
              <X className="text-gray-400 hover:text-red-500 transition-colors" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-2">
          {renderTabContent()}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
          {!hasAssignee && onAssign && (
            <Button onClick={onAssign}>
              <UserPlus size={16} className="mr-2" />
              {role.isHiring ? 'Trova Candidati' : 'Assegna Persona'}
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>Chiudi</Button>
        </div>
      </Card>
    </div>
  );
};

export default RoleDetailModal;
