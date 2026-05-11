/**
 * OrgChartContextPanel
 *
 * Left contextual sidebar for the Organigramma. Shows aggregate info
 * for the current selection: company / node / position.
 */
import React, { useMemo } from 'react';
import {
  Building,
  Users,
  Briefcase,
  Search as SearchIcon,
  ThermometerSun,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Crown,
  Target,
  Award,
  Handshake,
  ExternalLink,
  Download,
} from 'lucide-react';
import type { OrgNode, CompanyProfile, User } from '../../../../types';
import type { CompanyRole } from '../../../types/roles';
import type { UnifiedPosition } from '../../../types/unified-org';
import type { OrgSelection } from '../../../hooks/useOrgChartUIState';

interface Props {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  company: CompanyProfile;
  users: User[];
  roles: CompanyRole[];
  selection: OrgSelection;
  onSelectCompany: () => void;
  onSelectNode: (nodeId: string) => void;
  onOpenFullDetail?: (position: UnifiedPosition) => void;
  onExportPdf: () => void;
}

// ---------- helpers ----------
const SENIORITY_ORDER = ['Junior', 'Mid', 'Senior', 'Lead', 'C-Level'] as const;

const findNode = (root: OrgNode, id: string): OrgNode | null => {
  if (root.id === id) return root;
  for (const c of root.children || []) {
    const f = findNode(c, id);
    if (f) return f;
  }
  return null;
};

const findPath = (root: OrgNode, id: string, acc: OrgNode[] = []): OrgNode[] | null => {
  const next = [...acc, root];
  if (root.id === id) return next;
  for (const c of root.children || []) {
    const f = findPath(c, id, next);
    if (f) return f;
  }
  return null;
};

const collectNodeUsers = (node: OrgNode, users: User[]): User[] => {
  const ids = new Set<string>();
  const walk = (n: OrgNode) => {
    ids.add(n.id);
    n.children?.forEach(walk);
  };
  walk(node);
  return users.filter(u => u.departmentId && ids.has(u.departmentId));
};

const calcClimateAvg = (us: User[]): number | null => {
  const withClimate = us.filter(u => u.climateData);
  if (!withClimate.length) return null;
  const tot = withClimate.reduce((s, u) => s + (u.climateData?.overallAverage || 0), 0);
  return tot / withClimate.length;
};

const calcSkillGap = (us: User[]): number | null => {
  let gaps = 0;
  let req = 0;
  us.forEach(u => {
    const p = u.requiredProfile;
    if (!p) return;
    const required = [...(p.softSkills || []), ...(p.hardSkills || [])];
    const userSkills = u.karmaData?.softSkills || [];
    required.forEach(r => {
      req++;
      const hit = userSkills.some(
        s =>
          s.toLowerCase().includes(r.toLowerCase()) ||
          r.toLowerCase().includes(s.toLowerCase())
      );
      if (!hit) gaps++;
    });
  });
  if (!req) return null;
  return Math.round((gaps / req) * 100);
};

const climateColor = (s: number) =>
  s >= 4
    ? 'text-green-600 dark:text-green-400'
    : s >= 3
    ? 'text-yellow-600 dark:text-yellow-400'
    : 'text-red-600 dark:text-red-400';

const gapColor = (g: number) =>
  g <= 20
    ? 'text-green-600 dark:text-green-400'
    : g <= 50
    ? 'text-yellow-600 dark:text-yellow-400'
    : 'text-red-600 dark:text-red-400';

// ---------- subcomponents ----------
const KpiTile: React.FC<{
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  tone?: string;
}> = ({ label, value, icon, tone }) => (
  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 flex flex-col gap-1">
    <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">
      {icon}
      {label}
    </div>
    <div className={`text-xl font-bold ${tone || 'text-gray-800 dark:text-gray-100'}`}>
      {value}
    </div>
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div>
    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
      {title}
    </h4>
    {children}
  </div>
);

// ---------- views ----------
const CompanyView: React.FC<{
  company: CompanyProfile;
  users: User[];
  roles: CompanyRole[];
}> = ({ company, users, roles }) => {
  const totalPeople = users.filter(u => !u.isHiring && (u.firstName || u.lastName)).length;
  const totalRoles = roles.length;
  const openPositions =
    roles.filter(r => r.isHiring).length + users.filter(u => u.isHiring).length;
  const climate = calcClimateAvg(users);
  const gap = calcSkillGap(users);

  const culturalDrivers = useMemo(() => {
    const acc: OrgNode[] = [];
    const walk = (n: OrgNode) => {
      if (n.isCulturalDriver) acc.push(n);
      n.children?.forEach(walk);
    };
    if (company.structure) walk(company.structure);
    return acc;
  }, [company.structure]);

  const seniorityDist = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach(u => {
      const s = u.karmaData?.seniorityAssessment;
      if (s) counts[s] = (counts[s] || 0) + 1;
    });
    const max = Math.max(1, ...Object.values(counts));
    return SENIORITY_ORDER.map(s => ({ s, n: counts[s] || 0, pct: ((counts[s] || 0) / max) * 100 }));
  }, [users]);

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold mb-1">
          Vista azienda
        </div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Building size={18} className="text-jnana-sage" />
          {company.name}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <KpiTile label="Persone" value={totalPeople} icon={<Users size={12} />} />
        <KpiTile label="Ruoli" value={totalRoles} icon={<Briefcase size={12} />} />
        <KpiTile
          label="Posizioni aperte"
          value={openPositions}
          icon={<SearchIcon size={12} />}
          tone={openPositions > 0 ? 'text-emerald-600 dark:text-emerald-400' : undefined}
        />
        <KpiTile
          label="Cultural drivers"
          value={culturalDrivers.length}
          icon={<Crown size={12} />}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <KpiTile
          label="Clima medio"
          value={climate !== null ? `${climate.toFixed(1)}/5` : '—'}
          icon={<ThermometerSun size={12} />}
          tone={climate !== null ? climateColor(climate) : undefined}
        />
        <KpiTile
          label="Skill gap"
          value={gap !== null ? `${gap}%` : '—'}
          icon={<AlertTriangle size={12} />}
          tone={gap !== null ? gapColor(gap) : undefined}
        />
      </div>

      <Section title="Distribuzione seniority">
        <div className="space-y-1.5">
          {seniorityDist.map(({ s, n, pct }) => (
            <div key={s} className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300 w-16">
                {s}
              </span>
              <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-jnana-sage rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs font-mono text-gray-500 dark:text-gray-400 w-6 text-right">
                {n}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {culturalDrivers.length > 0 && (
        <Section title="Cultural drivers">
          <ul className="space-y-1">
            {culturalDrivers.slice(0, 6).map(n => (
              <li
                key={n.id}
                className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"
              >
                <Crown size={12} className="text-purple-500" />
                {n.name}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <p className="text-[11px] text-gray-400 dark:text-gray-500 italic pt-2 border-t border-gray-100 dark:border-gray-800">
        Clicca un nodo dell'organigramma per vederne i dettagli qui.
      </p>
    </div>
  );
};

const NodeView: React.FC<{
  node: OrgNode;
  path: OrgNode[];
  users: User[];
  roles: CompanyRole[];
  onSelectNode: (id: string) => void;
  onSelectCompany: () => void;
}> = ({ node, path, users, roles, onSelectNode, onSelectCompany }) => {
  const directUsers = users.filter(u => u.departmentId === node.id);
  const subtreeUsers = collectNodeUsers(node, users);
  const climate = calcClimateAvg(directUsers);
  const gap = calcSkillGap(directUsers);
  const nodeRoles = roles.filter(r => r.orgNodeId === node.id);
  const hiringHere =
    nodeRoles.filter(r => r.isHiring).length + directUsers.filter(u => u.isHiring).length;

  const managers = directUsers.filter(
    u =>
      !u.isHiring &&
      (node.isCulturalDriver ||
        u.jobTitle?.toLowerCase().match(/(head|manager|lead|director|ceo|ad)/))
  );

  return (
    <div className="space-y-5">
      <button
        onClick={onSelectCompany}
        className="text-xs text-gray-500 dark:text-gray-400 hover:text-jnana-sage flex items-center gap-1"
      >
        <ArrowLeft size={12} /> Torna alla vista azienda
      </button>

      <div>
        <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold mb-1 flex items-center gap-1 flex-wrap">
          {path.slice(0, -1).map((p, i) => (
            <React.Fragment key={p.id}>
              <button
                onClick={() => (i === 0 ? onSelectCompany() : onSelectNode(p.id))}
                className="hover:text-jnana-sage hover:underline"
              >
                {i === 0 ? 'Azienda' : p.name}
              </button>
              <span>›</span>
            </React.Fragment>
          ))}
          <span>{node.type}</span>
        </div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          {node.isCulturalDriver && <Crown size={16} className="text-purple-500" />}
          {node.name}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <KpiTile
          label="Persone (nodo)"
          value={directUsers.filter(u => !u.isHiring && (u.firstName || u.lastName)).length}
          icon={<Users size={12} />}
        />
        <KpiTile
          label="Persone (sottoalbero)"
          value={subtreeUsers.filter(u => !u.isHiring && (u.firstName || u.lastName)).length}
          icon={<Users size={12} />}
        />
        <KpiTile label="Ruoli" value={nodeRoles.length} icon={<Briefcase size={12} />} />
        <KpiTile
          label="Aperte"
          value={hiringHere}
          icon={<SearchIcon size={12} />}
          tone={hiringHere > 0 ? 'text-emerald-600 dark:text-emerald-400' : undefined}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <KpiTile
          label="Clima"
          value={climate !== null ? `${climate.toFixed(1)}/5` : '—'}
          icon={<ThermometerSun size={12} />}
          tone={climate !== null ? climateColor(climate) : undefined}
        />
        <KpiTile
          label="Skill gap"
          value={gap !== null ? `${gap}%` : '—'}
          icon={<AlertTriangle size={12} />}
          tone={gap !== null ? gapColor(gap) : undefined}
        />
      </div>

      {managers.length > 0 && (
        <Section title={node.isCulturalDriver ? 'Leader culturali' : 'Manager / Lead'}>
          <ul className="space-y-1">
            {managers.slice(0, 6).map(m => (
              <li
                key={m.id}
                className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"
              >
                <Award size={12} className="text-amber-500" />
                {m.firstName} {m.lastName}
                {m.jobTitle && (
                  <span className="text-xs text-gray-400">— {m.jobTitle}</span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {node.children && node.children.length > 0 && (
        <Section title="Sotto-nodi">
          <ul className="space-y-1">
            {node.children.map(c => (
              <li key={c.id}>
                <button
                  onClick={() => onSelectNode(c.id)}
                  className="text-sm text-jnana-sage hover:underline flex items-center gap-1.5"
                >
                  <ChevronRight size={12} />
                  {c.name}
                  <span className="text-xs text-gray-400">({c.type})</span>
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
};

const PositionView: React.FC<{
  position: UnifiedPosition;
  nodeId: string | null;
  rootStructure?: OrgNode;
  onSelectNode: (id: string) => void;
  onSelectCompany: () => void;
  onOpenFullDetail?: (position: UnifiedPosition) => void;
}> = ({ position, nodeId, rootStructure, onSelectNode, onSelectCompany, onOpenFullDetail }) => {
  const { role, assignee, metrics } = position;
  const path = nodeId && rootStructure ? findPath(rootStructure, nodeId) : null;

  const ScoreBar: React.FC<{ label: string; score: number | null; icon: React.ReactNode }> = ({
    label,
    score,
    icon,
  }) => (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
          {icon}
          {label}
        </span>
        <span className="font-bold text-gray-800 dark:text-gray-100">
          {score === null ? 'N/D' : `${score}%`}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            (score ?? 0) >= 75
              ? 'bg-green-500'
              : (score ?? 0) >= 50
              ? 'bg-yellow-500'
              : 'bg-red-500'
          }`}
          style={{ width: `${score ?? 0}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <button
        onClick={() => (nodeId ? onSelectNode(nodeId) : onSelectCompany())}
        className="text-xs text-gray-500 dark:text-gray-400 hover:text-jnana-sage flex items-center gap-1"
      >
        <ArrowLeft size={12} /> {nodeId ? 'Torna al nodo' : 'Torna alla vista azienda'}
      </button>

      <div>
        <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold mb-1 flex items-center gap-1 flex-wrap">
          {path?.map((p, i) => (
            <React.Fragment key={p.id}>
              <button
                onClick={() => (i === 0 ? onSelectCompany() : onSelectNode(p.id))}
                className="hover:text-jnana-sage hover:underline"
              >
                {i === 0 ? 'Azienda' : p.name}
              </button>
              <span>›</span>
            </React.Fragment>
          ))}
          <span>posizione</span>
        </div>
        <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Target size={16} className="text-jnana-sage" />
          {role.title}
        </h3>
        {assignee ? (
          <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {assignee.firstName} {assignee.lastName}
            {role.requiredSeniority && (
              <span className="text-xs text-gray-400 ml-2">· {role.requiredSeniority}</span>
            )}
          </div>
        ) : (
          <div className="text-sm text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
            <SearchIcon size={12} /> Posizione aperta
          </div>
        )}
      </div>

      {assignee && (
        <div className="space-y-3">
          <ScoreBar label="Role fit" score={metrics.roleFitScore} icon={<Target size={11} />} />
          <ScoreBar
            label="Manager fit"
            score={metrics.managerFitScore}
            icon={<Handshake size={11} />}
          />
          <ScoreBar
            label="Culture fit"
            score={metrics.cultureFitScore}
            icon={<Building size={11} />}
          />
        </div>
      )}

      {role.requiredHardSkills && role.requiredHardSkills.length > 0 && (
        <Section title="Hard skills richieste">
          <div className="flex flex-wrap gap-1">
            {role.requiredHardSkills.map(s => (
              <span
                key={s.name}
                className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
              >
                {s.name}
              </span>
            ))}
          </div>
        </Section>
      )}

      {role.requiredSoftSkills && role.requiredSoftSkills.length > 0 && (
        <Section title="Soft skills richieste">
          <div className="flex flex-wrap gap-1">
            {role.requiredSoftSkills.map(s => (
              <span
                key={s.name}
                className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
              >
                {s.name}
              </span>
            ))}
          </div>
        </Section>
      )}

      {onOpenFullDetail && (
        <button
          onClick={() => onOpenFullDetail(position)}
          className="w-full mt-2 px-3 py-2 bg-jnana-sage text-white rounded-xl text-sm font-medium hover:bg-jnana-sage/90 transition-colors flex items-center justify-center gap-1.5"
        >
          Apri dettaglio completo <ExternalLink size={14} />
        </button>
      )}
    </div>
  );
};

// ---------- main ----------
export const OrgChartContextPanel: React.FC<Props> = ({
  collapsed,
  onToggleCollapsed,
  company,
  users,
  roles,
  selection,
  onSelectCompany,
  onSelectNode,
  onOpenFullDetail,
  onExportPdf,
}) => {
  if (collapsed) {
    return (
      <aside className="w-12 shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 flex flex-col items-center pt-3 gap-2">
        <button
          onClick={onToggleCollapsed}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Apri pannello"
          aria-label="Apri pannello dettagli"
        >
          <ChevronRight size={18} />
        </button>
        <Building size={18} className="text-gray-400" />
        <button
          onClick={onExportPdf}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Esporta PDF"
          aria-label="Esporta PDF"
        >
          <Download size={16} />
        </button>
      </aside>
    );
  }

  let content: React.ReactNode = null;
  if (selection.kind === 'company') {
    content = <CompanyView company={company} users={users} roles={roles} />;
  } else if (selection.kind === 'node') {
    const node = company.structure ? findNode(company.structure, selection.nodeId) : null;
    const path = company.structure ? findPath(company.structure, selection.nodeId) || [] : [];
    if (node) {
      content = (
        <NodeView
          node={node}
          path={path}
          users={users}
          roles={roles}
          onSelectNode={onSelectNode}
          onSelectCompany={onSelectCompany}
        />
      );
    }
  } else if (selection.kind === 'position') {
    content = (
      <PositionView
        position={selection.position}
        nodeId={selection.nodeId}
        rootStructure={company.structure}
        onSelectNode={onSelectNode}
        onSelectCompany={onSelectCompany}
        onOpenFullDetail={onOpenFullDetail}
      />
    );
  }

  return (
    <aside
      className="w-[340px] shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 flex flex-col h-full min-h-0"
      aria-live="polite"
    >
      {/* Fixed header: title + export + subtitle + legend */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-200 dark:border-gray-700 shrink-0 bg-white dark:bg-gray-800/40">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h2 className="text-lg font-brand font-bold text-gray-800 dark:text-gray-100 leading-tight">
            Organigramma Aziendale
          </h2>
          <button
            onClick={onToggleCollapsed}
            className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 shrink-0"
            title="Comprimi pannello"
            aria-label="Comprimi pannello dettagli"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Struttura gerarchica e funzionale di {company.name}
        </p>
        <button
          onClick={onExportPdf}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-xs font-medium mb-3"
        >
          <Download size={14} />
          Esporta PDF
        </button>
        <div className="grid grid-cols-1 gap-1 text-[11px] font-semibold text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-destructive" />
            Clima Critico (&lt;3)
            <span className="w-2 h-2 rounded-full bg-yellow-400 ml-2" />
            Neutro (3-4)
            <span className="w-2 h-2 rounded-full bg-green-500 ml-2" />
            Ottimo (&gt;4)
          </div>
          <div className="flex items-center gap-3 pt-1">
            <span className="flex items-center gap-1 text-blue-500">
              <Building size={11} /> Fit Culturale
            </span>
            <span className="flex items-center gap-1 text-green-600">
              <Handshake size={11} /> Fit Manager
            </span>
          </div>
        </div>
      </div>
      {/* Dynamic section label */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-700 shrink-0">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Dettagli
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 min-h-0">{content}</div>
    </aside>
  );
};
