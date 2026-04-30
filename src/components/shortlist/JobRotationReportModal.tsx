import React from 'react';
import {
  X, ArrowRight, CheckCircle2, AlertTriangle, XCircle, TrendingUp, TrendingDown,
  Minus, Users, Target, Sparkles, ShieldAlert, UserCheck, Plus, Eye,
} from 'lucide-react';
import { Button } from '../../../components/Button';
import type { RotationAnalysis, RecommendationVerdict } from '../../utils/jobRotationAnalyzer';

interface JobRotationReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: RotationAnalysis;
  isInShortlist: boolean;
  onAddToShortlist?: () => void;
  onViewProfile?: () => void;
  onAssign?: () => void;
}

// ============================================================
// Atoms
// ============================================================

const verdictMeta: Record<RecommendationVerdict, { label: string; cls: string; icon: React.ReactNode }> = {
  procedi: {
    label: 'Procedi',
    cls: 'bg-jnana-sage text-white border-jnana-sageDark',
    icon: <CheckCircle2 size={18} />,
  },
  valuta: {
    label: 'Valuta',
    cls: 'bg-amber-100 text-amber-900 border-amber-300',
    icon: <AlertTriangle size={18} />,
  },
  sconsigliato: {
    label: 'Sconsigliato',
    cls: 'bg-rose-100 text-rose-900 border-rose-300',
    icon: <XCircle size={18} />,
  },
};

const RiskPill: React.FC<{ risk: 'low' | 'medium' | 'high' }> = ({ risk }) => {
  const map = {
    low: { label: 'Basso', cls: 'bg-emerald-100 text-emerald-800' },
    medium: { label: 'Medio', cls: 'bg-amber-100 text-amber-800' },
    high: { label: 'Alto', cls: 'bg-rose-100 text-rose-800' },
  };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded ${map[risk].cls}`}>{map[risk].label}</span>;
};

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string }> = ({ icon, title, subtitle }) => (
  <div className="flex items-center gap-2 mb-2">
    <div className="text-jnana-sage">{icon}</div>
    <div>
      <div className="text-sm font-bold text-jnana-text dark:text-gray-100">{title}</div>
      {subtitle && <div className="text-[11px] text-gray-500 dark:text-gray-400">{subtitle}</div>}
    </div>
  </div>
);

const ScoreBar: React.FC<{ value: number }> = ({ value }) => {
  const color = value >= 75 ? 'bg-jnana-sage' : value >= 50 ? 'bg-amber-400' : 'bg-rose-400';
  return (
    <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
};

// ============================================================
// Modal
// ============================================================

export const JobRotationReportModal: React.FC<JobRotationReportModalProps> = ({
  isOpen, onClose, analysis, isInShortlist, onAddToShortlist, onViewProfile, onAssign,
}) => {
  if (!isOpen) return null;

  const { recommendation, roleFit, managerFit, roleImpact, growth } = analysis;
  const v = verdictMeta[recommendation.verdict];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-[200]" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-x-2 top-4 bottom-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-[210] w-auto md:w-[640px] max-h-[92vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">

        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wider text-jnana-sage font-semibold mb-1">Report Job Rotation</div>
              <h2 className="text-lg font-bold text-jnana-text dark:text-gray-100">{analysis.candidateName}</h2>
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-1 flex-wrap">
                <span className="font-medium">{analysis.candidateSeniority || 'N/A'}</span>
                <span>·</span>
                <span className="truncate">{analysis.fromDepartment}</span>
                <ArrowRight size={12} />
                <span className="truncate font-medium text-jnana-sage">{analysis.toDepartment}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <X size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">

          {/* 1. RECOMMENDATION */}
          <div className={`border-l-4 rounded-lg p-4 ${v.cls.replace('text-', 'border-l-').split(' ')[2]} bg-jnana-bg dark:bg-gray-900/40`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-bold ${v.cls}`}>
                {v.icon}
                {v.label}
              </div>
              <div className="text-2xl font-bold text-jnana-text dark:text-gray-100">{recommendation.score}<span className="text-sm text-gray-500">/100</span></div>
            </div>
            <p className="text-sm text-jnana-text dark:text-gray-200 leading-snug">{recommendation.headline}</p>
            {(recommendation.pros.length > 0 || recommendation.cons.length > 0) && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {recommendation.pros.length > 0 && (
                  <div>
                    <div className="font-semibold text-emerald-700 dark:text-emerald-300 mb-1">Punti di forza</div>
                    <ul className="space-y-0.5 text-jnana-text dark:text-gray-300">
                      {recommendation.pros.map((p, i) => (
                        <li key={i} className="flex gap-1"><span className="text-emerald-600">+</span><span>{p}</span></li>
                      ))}
                    </ul>
                  </div>
                )}
                {recommendation.cons.length > 0 && (
                  <div>
                    <div className="font-semibold text-rose-700 dark:text-rose-300 mb-1">Punti di attenzione</div>
                    <ul className="space-y-0.5 text-jnana-text dark:text-gray-300">
                      {recommendation.cons.map((c, i) => (
                        <li key={i} className="flex gap-1"><span className="text-rose-600">−</span><span>{c}</span></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. ROLE FIT */}
          <section>
            <SectionHeader icon={<Target size={16} />} title="Fit con il ruolo" subtitle="Match skill e seniority" />
            <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">Match complessivo</span>
                <span className="text-sm font-bold text-jnana-text dark:text-gray-100">{roleFit.score}%</span>
              </div>
              <ScoreBar value={roleFit.score} />
              <div className="grid grid-cols-2 gap-2 text-[11px] mt-2">
                <div>
                  <div className="text-gray-500">Soft skills coperte</div>
                  <div className="font-semibold text-emerald-700">{roleFit.softMatches.length}</div>
                </div>
                <div>
                  <div className="text-gray-500">Soft skills mancanti</div>
                  <div className="font-semibold text-amber-700">{roleFit.softGaps.length}</div>
                </div>
                <div>
                  <div className="text-gray-500">Seniority</div>
                  <div className="font-semibold flex items-center gap-1">
                    {roleFit.seniorityMatch === 'match' && <><CheckCircle2 size={12} className="text-emerald-600" /> Match</>}
                    {roleFit.seniorityMatch === 'above' && <><TrendingUp size={12} className="text-amber-600" /> Sopra</>}
                    {roleFit.seniorityMatch === 'below' && <><TrendingDown size={12} className="text-amber-600" /> Sotto</>}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 3. MANAGER FIT */}
          <section>
            <SectionHeader icon={<UserCheck size={16} />} title="Fit con il nuovo manager" subtitle="Sinergia generazionale e relazionale" />
            <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-3 space-y-2">
              {managerFit.managerMissing ? (
                <p className="text-sm text-gray-500 italic">{managerFit.notes[0]}</p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-jnana-powder/40 flex items-center justify-center text-jnana-sageDark font-bold text-xs">
                        {managerFit.managerName?.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-jnana-text dark:text-gray-100">{managerFit.managerName}</div>
                        <div className="text-[11px] text-gray-500">{managerFit.managerGeneration || 'Generazione n/d'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-jnana-text dark:text-gray-100">{managerFit.fitScore}%</div>
                      {managerFit.synergy && managerFit.synergy.type !== 'None' && (
                        <div className="text-[11px] text-jnana-sage font-semibold">{managerFit.synergy.type}</div>
                      )}
                    </div>
                  </div>
                  <ScoreBar value={managerFit.fitScore} />
                  {managerFit.notes.map((n, i) => (
                    <p key={i} className="text-xs text-gray-600 dark:text-gray-400 leading-snug">{n}</p>
                  ))}
                </>
              )}
            </div>
          </section>

          {/* 4. ROLE IMPACT */}
          <section>
            <SectionHeader icon={<ShieldAlert size={16} />} title="Impatto sul ruolo lasciato" subtitle={`Cosa perde "${roleImpact.fromDepartmentName}"`} />
            <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">Livello di rischio</span>
                <RiskPill risk={roleImpact.risk} />
              </div>

              {roleImpact.criticalSkillsAtRisk.length > 0 && (
                <div>
                  <div className="text-[11px] text-gray-500 mb-1">Skill critiche scoperte ({roleImpact.criticalSkillsAtRisk.length})</div>
                  <div className="flex flex-wrap gap-1">
                    {roleImpact.criticalSkillsAtRisk.slice(0, 6).map(s => (
                      <span key={s} className="text-[10px] px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded">{s}</span>
                    ))}
                    {roleImpact.criticalSkillsAtRisk.length > 6 && (
                      <span className="text-[10px] text-gray-500">+{roleImpact.criticalSkillsAtRisk.length - 6}</span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <Users size={12} />
                <span><span className="font-semibold text-jnana-text dark:text-gray-100">{roleImpact.internalBackupsCount}</span> backup interno/i pronto/i</span>
              </div>

              {roleImpact.internalBackupsPreview.length > 0 && (
                <div className="space-y-1">
                  {roleImpact.internalBackupsPreview.map(b => (
                    <div key={b.id} className="flex items-center justify-between text-[11px] bg-white dark:bg-gray-800 rounded px-2 py-1 border border-gray-100 dark:border-gray-700">
                      <span className="text-gray-700 dark:text-gray-300">{b.name}</span>
                      <span className="text-jnana-sage font-semibold">{b.matchScore}%</span>
                    </div>
                  ))}
                </div>
              )}

              {roleImpact.notes.map((n, i) => (
                <p key={i} className="text-[11px] text-gray-600 dark:text-gray-400 leading-snug italic">{n}</p>
              ))}
            </div>
          </section>

          {/* 5. GROWTH */}
          <section>
            <SectionHeader icon={<Sparkles size={16} />} title="Crescita del candidato" subtitle="Stretch e sviluppo" />
            <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">Categoria</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                  growth.stretchLevel === 'healthy_stretch' ? 'bg-emerald-100 text-emerald-800' :
                  growth.stretchLevel === 'lateral' ? 'bg-blue-100 text-blue-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {growth.stretchLabel}
                </span>
              </div>

              {(growth.newHardSkillsToLearn.length > 0 || growth.newSoftSkillsToLearn.length > 0) && (
                <div>
                  <div className="text-[11px] text-gray-500 mb-1">Competenze da sviluppare</div>
                  <div className="flex flex-wrap gap-1">
                    {growth.newHardSkillsToLearn.map(s => (
                      <span key={`h-${s}`} className="text-[10px] px-2 py-0.5 bg-jnana-powder/30 text-jnana-sageDark border border-jnana-powder rounded">{s}</span>
                    ))}
                    {growth.newSoftSkillsToLearn.map(s => (
                      <span key={`s-${s}`} className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {growth.seniorityChange !== 'unknown' && growth.seniorityChange !== 'lateral' && (
                <div className="flex items-center gap-2 text-xs">
                  {growth.seniorityChange === 'promotion' ? (
                    <><TrendingUp size={12} className="text-emerald-600" /><span className="text-emerald-700 font-medium">Avanzamento di seniority</span></>
                  ) : (
                    <><TrendingDown size={12} className="text-amber-600" /><span className="text-amber-700 font-medium">Seniority inferiore al candidato</span></>
                  )}
                </div>
              )}

              {growth.notes.map((n, i) => (
                <p key={i} className="text-[11px] text-gray-600 dark:text-gray-400 leading-snug italic">{n}</p>
              ))}
            </div>
          </section>

        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 flex items-center gap-2">
          {!isInShortlist && onAddToShortlist && (
            <Button onClick={onAddToShortlist} className="flex-1 flex items-center justify-center gap-1.5">
              <Plus size={14} /> Aggiungi a Shortlist
            </Button>
          )}
          {isInShortlist && (
            <div className="flex-1 flex items-center justify-center gap-1.5 text-sm text-emerald-700 bg-emerald-50 py-2 rounded-lg font-medium">
              <CheckCircle2 size={14} /> Già in Shortlist
            </div>
          )}
          {onViewProfile && (
            <button
              onClick={onViewProfile}
              className="px-3 py-2 border border-jnana-sage text-jnana-sage hover:bg-jnana-bg rounded-lg text-sm flex items-center gap-1.5"
            >
              <Eye size={14} /> Profilo
            </button>
          )}
          {onAssign && recommendation.verdict !== 'sconsigliato' && (
            <button
              onClick={onAssign}
              className="px-3 py-2 bg-jnana-sageDark text-white hover:bg-jnana-sage rounded-lg text-sm flex items-center gap-1.5"
            >
              <ArrowRight size={14} /> Assegna
            </button>
          )}
        </div>

      </div>
    </>
  );
};
