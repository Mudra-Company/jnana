/**
 * SkillsComparison (versione condivisa per il profilo personale).
 * Stessa logica del componente nell'org chart, riadattato per essere riusabile.
 */
import React from 'react';
import type { CompanyRole } from '../../types/roles';
import type { User } from '../../../types';

const fuzzySkillMatch = (needle: string, haystack: string[]): boolean =>
  haystack.some(h => {
    const a = h.toLowerCase().trim();
    const b = needle.toLowerCase().trim();
    return a.includes(b) || b.includes(a);
  });

type SkillChipState = 'owned' | 'missing' | 'neutral';

const SkillChip: React.FC<{
  name: string;
  state: SkillChipState;
  tone: 'hard' | 'soft';
  title?: string;
}> = ({ name, state, tone, title }) => {
  const base = 'text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1';
  const owned =
    tone === 'hard'
      ? 'bg-blue-100 text-blue-800'
      : 'bg-purple-100 text-purple-800';
  const missing = 'border border-dashed border-red-300 text-red-500 bg-transparent';
  const neutral =
    tone === 'hard' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700';
  const cls = state === 'owned' ? owned : state === 'missing' ? missing : neutral;
  return (
    <span className={`${base} ${cls}`} title={title}>
      {state === 'owned' && <span aria-hidden>✓</span>}
      {state === 'missing' && <span aria-hidden>✕</span>}
      {name}
    </span>
  );
};

interface Props {
  role: Pick<CompanyRole, 'requiredHardSkills' | 'requiredSoftSkills'>;
  user?: User | null;
  selfLabel?: string; // "le tue" vs nome di terzi
}

export const SkillsComparison: React.FC<Props> = ({ role, user, selfLabel = 'le tue' }) => {
  const hasUser = !!user;
  const userHardList = hasUser ? (user!.hardSkills || []) : [];
  const userHardNames = userHardList.map(s => s.name);
  const userSoftNames = hasUser ? (user!.karmaData?.softSkills || []) : [];

  const reqHard = role.requiredHardSkills || [];
  const reqSoft = role.requiredSoftSkills || [];

  const hardMatched = reqHard.filter(s => hasUser && fuzzySkillMatch(s.name, userHardNames)).length;
  const softMatched = reqSoft.filter(s => hasUser && fuzzySkillMatch(s.name, userSoftNames)).length;

  const extraHard = userHardList
    .filter(s => !reqHard.some(r => fuzzySkillMatch(r.name, [s.name])))
    .slice(0, 8);
  const extraSoft = userSoftNames
    .filter(n => !reqSoft.some(r => fuzzySkillMatch(r.name, [n])))
    .slice(0, 8);

  const counterTone = (matched: number, total: number) => {
    if (total === 0) return 'text-gray-500';
    if (matched === total) return 'text-green-600';
    if (matched === 0) return 'text-red-600';
    return 'text-amber-600';
  };

  const Counter: React.FC<{ matched: number; total: number }> = ({ matched, total }) => (
    <span className={`text-[11px] font-semibold ${counterTone(matched, total)}`}>
      {hasUser ? `${matched}/${total} presenti` : `${total} richieste`}
    </span>
  );

  if (reqHard.length === 0 && reqSoft.length === 0) {
    return (
      <p className="text-sm text-jnana-text/60">
        Nessuna skill richiesta è ancora stata definita per questo ruolo.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[11px] text-jnana-text/50">
        <span>✓ presente</span><span>·</span><span>✕ mancante</span>
      </div>

      {reqHard.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-jnana-text/60">
              Hard skill richieste
            </h4>
            <Counter matched={hardMatched} total={reqHard.length} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {reqHard.map(s => {
              const owned = hasUser && fuzzySkillMatch(s.name, userHardNames);
              const userSkill = userHardList.find(u => fuzzySkillMatch(s.name, [u.name]));
              return (
                <SkillChip
                  key={s.name}
                  name={s.name}
                  tone="hard"
                  state={!hasUser ? 'neutral' : owned ? 'owned' : 'missing'}
                  title={userSkill?.proficiencyLevel ? `Livello ${userSkill.proficiencyLevel}/5` : undefined}
                />
              );
            })}
          </div>
        </div>
      )}

      {reqSoft.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-jnana-text/60">
              Soft skill richieste
            </h4>
            <Counter matched={softMatched} total={reqSoft.length} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {reqSoft.map(s => {
              const owned = hasUser && fuzzySkillMatch(s.name, userSoftNames);
              return (
                <SkillChip
                  key={s.name}
                  name={s.name}
                  tone="soft"
                  state={!hasUser ? 'neutral' : owned ? 'owned' : 'missing'}
                />
              );
            })}
          </div>
        </div>
      )}

      {hasUser && (extraHard.length > 0 || extraSoft.length > 0) && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-jnana-text/60 mb-2">
            Altre skill {selfLabel}
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {extraHard.map(s => (
              <span
                key={`eh-${s.name}`}
                className="text-xs px-2 py-0.5 rounded-full border border-gray-200 text-gray-600"
                title={s.proficiencyLevel ? `Livello ${s.proficiencyLevel}/5` : undefined}
              >
                {s.name}
              </span>
            ))}
            {extraSoft.map(n => (
              <span
                key={`es-${n}`}
                className="text-xs px-2 py-0.5 rounded-full border border-gray-200 text-gray-600"
              >
                {n}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
