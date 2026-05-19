/**
 * MyRoleTab — Mostra alla persona il suo ruolo: mansionario, KPI,
 * skill vs richieste, inquadramento e reporting line.
 */
import React from 'react';
import { ClipboardList, Target, FileBadge, AlertCircle, ChevronRight, Briefcase, Info } from 'lucide-react';
import { Card } from '../../../components/Card';
import type { CompanyRole } from '../../types/roles';
import type { User } from '../../../types';
import { SkillsComparison } from './SkillsComparison';
import {
  CONTRACT_TYPE_LABELS,
  REMOTE_POLICY_LABELS,
  WORK_HOURS_LABELS,
} from '../../types/roles';

interface MyRoleTabProps {
  user: User;
  role: CompanyRole | null;
  isImplicit?: boolean;
}

export const MyRoleTab: React.FC<MyRoleTabProps> = ({ user, role, isImplicit = false }) => {
  if (!role) {
    return (
      <Card>
        <div className="flex items-start gap-3">
          <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-heading font-bold text-jnana-text mb-1">
              Nessun ruolo aziendale ancora assegnato
            </h3>
            <p className="text-sm text-jnana-text/70">
              L'HR della tua azienda non ha ancora associato il tuo profilo a un ruolo nell'organigramma.
              Quando lo farà, troverai qui mansionario, KPI e inquadramento.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mansionario */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Briefcase size={18} className="text-jnana-sage" />
          <h3 className="font-heading font-bold text-jnana-text">Mansionario</h3>
        </div>
        {role.description && (
          <p className="text-sm text-jnana-text/80 mb-4">{role.description}</p>
        )}

        {role.responsibilities && role.responsibilities.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-jnana-text/60 mb-2">
              Responsabilità
            </h4>
            <ul className="space-y-1.5">
              {role.responsibilities.map((r, i) => (
                <li key={i} className="text-sm text-jnana-text/80 flex gap-2">
                  <ChevronRight size={14} className="text-jnana-sage shrink-0 mt-1" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {role.dailyTasks && role.dailyTasks.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-jnana-text/60 mb-2">
              Attività quotidiane
            </h4>
            <ul className="space-y-1.5">
              {role.dailyTasks.map((t, i) => (
                <li key={i} className="text-sm text-jnana-text/80 flex gap-2">
                  <ChevronRight size={14} className="text-jnana-sage shrink-0 mt-1" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(!role.description && (!role.responsibilities?.length) && (!role.dailyTasks?.length)) && (
          <p className="text-sm text-jnana-text/50 italic">
            L'HR non ha ancora compilato il mansionario per questo ruolo.
          </p>
        )}
      </Card>

      {/* KPI */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Target size={18} className="text-jnana-sage" />
          <h3 className="font-heading font-bold text-jnana-text">I miei KPI</h3>
        </div>
        {role.kpis && role.kpis.length > 0 ? (
          <div className="space-y-3">
            {role.kpis.map((k, i) => (
              <div key={i} className="border border-jnana-sage/10 rounded-lg p-3">
                <div className="font-semibold text-jnana-text">{k.name}</div>
                {k.description && (
                  <p className="text-xs text-jnana-text/70 mt-1">{k.description}</p>
                )}
                {(k.target || k.measurementUnit) && (
                  <div className="mt-1 text-xs text-jnana-sageDark">
                    {k.target && <>Target: <strong>{k.target}</strong></>}
                    {k.target && k.measurementUnit && ' · '}
                    {k.measurementUnit && <>Unità: {k.measurementUnit}</>}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-jnana-text/50 italic">Nessun KPI definito per questo ruolo.</p>
        )}
      </Card>

      {/* Skills */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList size={18} className="text-jnana-sage" />
          <h3 className="font-heading font-bold text-jnana-text">Le mie skill rispetto al ruolo</h3>
        </div>
        <SkillsComparison role={role} user={user} selfLabel="che possiedi" />
      </Card>

      {/* Inquadramento */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <FileBadge size={18} className="text-jnana-sage" />
          <h3 className="font-heading font-bold text-jnana-text">Inquadramento</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Field label="CCNL" value={role.ccnlLevel} />
          <Field label="Contratto" value={role.contractType ? CONTRACT_TYPE_LABELS[role.contractType] : null} />
          <Field label="Orario" value={role.workHoursType ? WORK_HOURS_LABELS[role.workHoursType] : null} />
          <Field label="Modalità" value={role.remotePolicy ? REMOTE_POLICY_LABELS[role.remotePolicy] : null} />
        </div>
        <div className="mt-4 text-xs text-jnana-text/50">
          Trovi qualcosa di errato? Segnalalo al tuo HR — questi dati sono modificabili solo dall'azienda.
        </div>
      </Card>
    </div>
  );
};

const Field: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div>
    <div className="text-[10px] uppercase tracking-wider text-jnana-text/50 font-semibold">{label}</div>
    <div className="text-jnana-text font-medium">{value || <span className="text-jnana-text/40">—</span>}</div>
  </div>
);
