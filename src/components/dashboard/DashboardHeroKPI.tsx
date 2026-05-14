import React from 'react';
import { Users, Briefcase, ShieldCheck, Heart, ArrowRight, type LucideIcon } from 'lucide-react';

interface HeroKPIProps {
  headcount: number;
  headcountDelta?: number; // positive/negative or undefined
  openPositions: number;          // vacant + hiring
  openPositionsDetail?: string;   // sub label
  complianceScore: number;        // 0-100
  complianceExpiring: number;     // # items expiring <= 30d
  cultureScore: number;           // 0-100
  cultureDelta?: number;
  onClickHeadcount?: () => void;
  onClickOpenPositions?: () => void;
  onClickCompliance?: () => void;
  onClickCulture?: () => void;
}

type Tone = 'neutral' | 'good' | 'warn' | 'bad' | 'accent';

interface TileProps {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: Tone;
  onClick?: () => void;
}

const toneClasses: Record<Tone, { bar: string; iconWrap: string; sub: string }> = {
  neutral: { bar: 'bg-gray-300 dark:bg-gray-600', iconWrap: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300', sub: 'text-gray-500' },
  good:    { bar: 'bg-emerald-500', iconWrap: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300', sub: 'text-emerald-600 dark:text-emerald-400' },
  warn:    { bar: 'bg-amber-500',   iconWrap: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300',     sub: 'text-amber-600 dark:text-amber-400' },
  bad:     { bar: 'bg-red-500',     iconWrap: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300',           sub: 'text-red-600 dark:text-red-400' },
  accent:  { bar: 'bg-indigo-500',  iconWrap: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300', sub: 'text-indigo-600 dark:text-indigo-400' },
};

const HeroTile: React.FC<TileProps> = ({ icon: Icon, label, value, sub, tone = 'neutral', onClick }) => {
  const t = toneClasses[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`relative text-left bg-white dark:bg-gray-800 rounded-3xl shadow-soft dark:shadow-none border border-white/50 dark:border-gray-700 overflow-hidden p-5 flex flex-col gap-3 transition-all duration-300 ${onClick ? 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer' : 'cursor-default'}`}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${t.bar}`} />
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${t.iconWrap}`}>
            <Icon size={18} />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {label}
          </span>
        </div>
        {onClick && <ArrowRight size={14} className="text-gray-300 dark:text-gray-600" />}
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white leading-none">
          {value}
        </span>
        {sub && (
          <span className={`text-xs font-semibold ${t.sub} text-right`}>
            {sub}
          </span>
        )}
      </div>
    </button>
  );
};

export const DashboardHeroKPI: React.FC<HeroKPIProps> = ({
  headcount,
  headcountDelta,
  openPositions,
  openPositionsDetail,
  complianceScore,
  complianceExpiring,
  cultureScore,
  cultureDelta,
  onClickHeadcount,
  onClickOpenPositions,
  onClickCompliance,
  onClickCulture,
}) => {
  // Tones based on KPI semantics
  const openTone: Tone = openPositions === 0 ? 'good' : openPositions > 5 ? 'bad' : 'warn';
  const compTone: Tone = complianceScore >= 85 ? 'good' : complianceScore >= 65 ? 'warn' : 'bad';
  const cultTone: Tone = cultureScore >= 75 ? 'good' : cultureScore >= 55 ? 'warn' : 'bad';

  const headcountSub = headcountDelta !== undefined && headcountDelta !== 0
    ? `${headcountDelta > 0 ? '+' : ''}${headcountDelta} questo mese`
    : 'organico attuale';

  const cultureSub = cultureDelta !== undefined && cultureDelta !== 0
    ? `${cultureDelta > 0 ? '▲' : '▼'} ${Math.abs(cultureDelta)} pt`
    : 'allineamento valori';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <HeroTile
        icon={Users}
        label="Headcount"
        value={headcount}
        sub={headcountSub}
        tone="accent"
        onClick={onClickHeadcount}
      />
      <HeroTile
        icon={Briefcase}
        label="Posizioni Aperte"
        value={openPositions}
        sub={openPositionsDetail || (openPositions === 0 ? 'tutte coperte' : 'da gestire')}
        tone={openTone}
        onClick={onClickOpenPositions}
      />
      <HeroTile
        icon={ShieldCheck}
        label="Compliance"
        value={`${complianceScore}%`}
        sub={complianceExpiring > 0 ? `${complianceExpiring} in scadenza` : 'tutto in regola'}
        tone={compTone}
        onClick={onClickCompliance}
      />
      <HeroTile
        icon={Heart}
        label="Culture Match"
        value={`${cultureScore}%`}
        sub={cultureSub}
        tone={cultTone}
        onClick={onClickCulture}
      />
    </div>
  );
};
