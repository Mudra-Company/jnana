import React, { useEffect, useState, useMemo } from 'react';
import {
  ArrowLeft, Briefcase, Award, CheckCircle, XCircle, AlertCircle, Search, Loader2,
  Shuffle, Building, ArrowRight, Users, TrendingDown, Plus, ListChecks, Eye,
  Calendar, UserCheck, Target, Sparkles, GitCompareArrows, ChevronDown, ChevronUp,
  Filter, X, Lightbulb, Clock, MapPin, BadgeCheck,
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { useOpenPositions, OpenPosition } from '../../src/hooks/useOpenPositions';
import { useTalentSearch } from '../../src/hooks/useTalentSearch';
import { usePositionShortlist } from '../../src/hooks/usePositionShortlist';
import { CompanyProfile, SeniorityLevel, User as LegacyUser, RequiredProfile } from '../../types';
import type { CandidateMatch } from '../../src/types/karma';
import type { ShortlistUser, UnifiedCandidate } from '../../src/types/shortlist';
import { ShortlistTab } from '../../src/components/shortlist/ShortlistTab';
import { CandidateComparisonModal } from '../../src/components/shortlist/CandidateComparisonModal';
import { JobRotationReportModal } from '../../src/components/shortlist/JobRotationReportModal';
import { analyzeRotation, type RotationAnalysis } from '../../src/utils/jobRotationAnalyzer';
import { supabase } from '../../src/integrations/supabase/client';
import { useToast } from '../../src/hooks/use-toast';
import { GenerationBadge } from '../../src/components/GenerationBadge';
import { SynergyBadge } from '../../src/components/SynergyBadge';
import { analyzeSynergy, UserWithGeneration } from '../../services/generationService';

// ============================================================
// Props & constants
// ============================================================

interface PositionMatchingViewProps {
  positionId: string;
  company: CompanyProfile;
  companyUsers: LegacyUser[];
  onBack: () => void;
  onViewCandidate: (userId: string) => void;
  onAssignInternal: (slotId: string, userId: string) => void;
}

const SENIORITY_LABELS: Record<SeniorityLevel, string> = {
  Junior: 'Junior', Mid: 'Mid-Level', Senior: 'Senior', Lead: 'Lead', 'C-Level': 'C-Level',
};
const SENIORITY_LEVELS: Record<SeniorityLevel, number> = {
  Junior: 1, Mid: 2, Senior: 3, Lead: 4, 'C-Level': 5,
};

type Tier = 'ready' | 'evaluate' | 'unfit';
type TabKey = 'all' | 'internal' | 'external' | 'shortlist';
type SortKey = 'match-desc' | 'match-asc' | 'seniority' | 'name';

interface UnifiedRow {
  kind: 'internal' | 'external';
  id: string;
  score: number;
  name: string;
  subtitle: string;
  location?: string;
  birthDate?: string;
  age?: number;
  seniority?: string;
  hardMatched: string[];
  hardMissing: string[];
  softMatched: string[];
  softMissing: string[];
  seniorityMatch: 'match' | 'above' | 'below' | 'unknown';
  isLooking?: boolean;
  currentDepartment?: string;
  internal?: { user: LegacyUser; matchData: any };
  external?: CandidateMatch;
}

// ============================================================
// Internal match calculator (preserved from original)
// ============================================================

const calculateInternalMatch = (candidate: LegacyUser, required: RequiredProfile | undefined) => {
  if (!required) return {
    score: 100, softMatches: [], softGaps: [], hardMatches: [], hardGaps: [],
    seniorityMatch: 'match' as const, seniorityPenalty: 0,
  };

  const userSoftSkills = candidate.karmaData?.softSkills || [];
  const userSeniority = candidate.karmaData?.seniorityAssessment as SeniorityLevel | undefined;

  const softMatches: string[] = [];
  const softGaps: string[] = [];
  (required.softSkills || []).forEach(reqSkill => {
    const found = userSoftSkills.some(us =>
      us.toLowerCase().includes(reqSkill.toLowerCase()) ||
      reqSkill.toLowerCase().includes(us.toLowerCase())
    );
    if (found) softMatches.push(reqSkill); else softGaps.push(reqSkill);
  });

  const hardMatches: string[] = [];
  const hardGaps: string[] = required.hardSkills || [];

  let seniorityMatch: 'match' | 'above' | 'below' = 'match';
  let seniorityScore = 100;
  let seniorityPenalty = 0;

  if (required.seniority && userSeniority) {
    const reqLevel = SENIORITY_LEVELS[required.seniority] || 0;
    const userLevel = SENIORITY_LEVELS[userSeniority] || 0;
    const diff = userLevel - reqLevel;
    if (diff === 0) { seniorityMatch = 'match'; seniorityScore = 100; }
    else if (diff > 0) {
      seniorityPenalty = Math.min(diff * 30, 100);
      seniorityScore = Math.max(0, 100 - seniorityPenalty);
      seniorityMatch = 'above';
    } else {
      seniorityScore = Math.max(0, 100 + diff * 15);
      seniorityMatch = 'below';
    }
  }

  const softScore = (required.softSkills?.length || 0) > 0
    ? (softMatches.length / (required.softSkills?.length || 1)) * 100
    : 100;
  const finalScore = Math.round(softScore * 0.5 + seniorityScore * 0.5);

  return {
    score: Math.max(0, Math.min(finalScore, 100)),
    softMatches, softGaps, hardMatches, hardGaps, seniorityMatch, seniorityPenalty,
  };
};

const tierOf = (score: number): Tier =>
  score >= 75 ? 'ready' : score >= 50 ? 'evaluate' : 'unfit';

const tierMeta: Record<Tier, { label: string; cls: string; ring: string; desc: string }> = {
  ready:    { label: 'Pronti subito',    cls: 'bg-jnana-sage/10 text-jnana-sageDark border-jnana-sage/30', ring: 'text-jnana-sage', desc: 'Match ≥ 75%' },
  evaluate: { label: 'Da valutare',      cls: 'bg-amber-50 text-amber-800 border-amber-300', ring: 'text-amber-500', desc: 'Match 50–74%' },
  unfit:    { label: 'Non adatti',       cls: 'bg-rose-50 text-rose-700 border-rose-200', ring: 'text-rose-400', desc: 'Match < 50%' },
};

const daysSince = (iso?: string) => {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
};

// ============================================================
// Atoms
// ============================================================

const ScoreRing: React.FC<{ value: number; size?: number }> = ({ value, size = 52 }) => {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.max(0, Math.min(100, value)) / 100) * c;
  const tier = tierOf(value);
  const colorClass = tier === 'ready' ? 'stroke-jnana-sage' : tier === 'evaluate' ? 'stroke-amber-500' : 'stroke-rose-400';
  const txt = tier === 'ready' ? 'text-jnana-sage' : tier === 'evaluate' ? 'text-amber-600' : 'text-rose-500';
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={5} fill="none" className="stroke-gray-200 dark:stroke-gray-700" />
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={5} fill="none"
          className={`${colorClass} transition-all`} strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${txt}`}>
        {value}
      </div>
    </div>
  );
};

const KPITile: React.FC<{ icon: React.ReactNode; label: string; value: string | number; sub?: string; tone?: 'default' | 'good' | 'warn' }> = ({
  icon, label, value, sub, tone = 'default',
}) => {
  const toneCls = tone === 'good' ? 'text-jnana-sage' : tone === 'warn' ? 'text-amber-600' : 'text-jnana-text dark:text-gray-100';
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-start gap-3 shadow-soft">
      <div className="p-2 bg-jnana-bg dark:bg-gray-900 rounded-lg text-jnana-sage">{icon}</div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">{label}</div>
        <div className={`text-2xl font-bold leading-tight ${toneCls}`}>{value}</div>
        {sub && <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
};

// ============================================================
// Main view
// ============================================================

export const PositionMatchingView: React.FC<PositionMatchingViewProps> = ({
  positionId, company, companyUsers, onBack, onViewCandidate, onAssignInternal,
}) => {
  const { getPositionById } = useOpenPositions();
  const { candidates: externalRaw, isLoading: searchLoading, searchCandidates } = useTalentSearch();
  const { toast } = useToast();

  const [position, setPosition] = useState<OpenPosition | null>(null);
  const [positionLoading, setPositionLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyLooking, setShowOnlyLooking] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [nodeNames, setNodeNames] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState<SortKey>('match-desc');
  const [generationFilter, setGenerationFilter] = useState<string>('all');
  const [hideUnfit, setHideUnfit] = useState(true);
  const [showRequirements, setShowRequirements] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [comparisonSelection, setComparisonSelection] = useState<Set<string>>(new Set());

  const [selectedRotationReport, setSelectedRotationReport] = useState<{ analysis: RotationAnalysis; candidate: any } | null>(null);
  const [comparisonModal, setComparisonModal] = useState<[UnifiedCandidate, UnifiedCandidate] | null>(null);

  const {
    candidates: shortlistCandidates,
    addInternalCandidate, addExternalCandidate, removeCandidate, updateCandidate,
    buildUnifiedCandidates, isInShortlist,
  } = usePositionShortlist(positionId, company.id);

  // Fetch node names
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('org_nodes').select('id, name').eq('company_id', company.id);
      const map: Record<string, string> = {};
      (data || []).forEach((n: any) => { map[n.id] = n.name; });
      setNodeNames(map);
    })();
  }, [company.id]);

  // Load position + initial search
  useEffect(() => {
    (async () => {
      setPositionLoading(true);
      const pos = await getPositionById(positionId);
      setPosition(pos);
      setPositionLoading(false);
      if (pos) {
        await searchCandidates(
          {
            lookingForWorkOnly: showOnlyLooking,
            seniorityLevels: pos.requiredProfile?.seniority ? [pos.requiredProfile.seniority as SeniorityLevel] : undefined,
            query: undefined,
          },
          undefined,
          pos.requiredProfile?.hardSkills || []
        );
      }
    })();
  }, [positionId, getPositionById]);

  const handleRefreshExternal = async () => {
    if (!position) return;
    await searchCandidates(
      {
        lookingForWorkOnly: showOnlyLooking,
        seniorityLevels: position.requiredProfile?.seniority ? [position.requiredProfile.seniority as SeniorityLevel] : undefined,
        query: searchQuery || undefined,
      },
      undefined,
      position.requiredProfile?.hardSkills || []
    );
  };

  // Hiring manager
  const hiringManager = useMemo((): { user: LegacyUser; gen: UserWithGeneration } | null => {
    const nodeId = (position as any)?.nodeId || position?.departmentId;
    if (!nodeId) return null;
    const manager = companyUsers.find(u => u.departmentId === nodeId && u.isHiring);
    if (!manager) return null;
    return {
      user: manager,
      gen: {
        birthDate: manager.birthDate,
        age: manager.age,
        hardSkills: manager.hardSkills?.map(s => ({
          name: typeof s === 'string' ? s : s.name,
          proficiencyLevel: typeof s === 'object' ? s.proficiencyLevel : undefined,
        })),
      },
    };
  }, [position, companyUsers]);

  // Internal candidates
  const internalRows = useMemo<UnifiedRow[]>(() => {
    if (!position) return [];
    const reqLevel = SENIORITY_LEVELS[position.requiredProfile?.seniority as SeniorityLevel] || 0;
    return companyUsers
      .filter(u => {
        if (!u.firstName || !u.lastName || u.isHiring) return false;
        const us = u.karmaData?.seniorityAssessment as SeniorityLevel | undefined;
        if (us && reqLevel > 0) {
          const diff = (SENIORITY_LEVELS[us] || 0) - reqLevel;
          if (diff > 1) return false;
        }
        return true;
      })
      .map(u => {
        const m = calculateInternalMatch(u, position.requiredProfile as RequiredProfile);
        return {
          kind: 'internal' as const,
          id: u.id,
          score: m.score,
          name: `${u.firstName} ${u.lastName}`,
          subtitle: `${u.karmaData?.seniorityAssessment || 'N/A'} · ${u.jobTitle || 'Dipendente'}`,
          birthDate: u.birthDate,
          age: u.age,
          seniority: u.karmaData?.seniorityAssessment,
          hardMatched: m.hardMatches,
          hardMissing: m.hardGaps,
          softMatched: m.softMatches,
          softMissing: m.softGaps,
          seniorityMatch: m.seniorityMatch,
          currentDepartment: u.departmentId ? (nodeNames[u.departmentId] || '—') : 'Non assegnato',
          internal: { user: u, matchData: m },
        };
      });
  }, [companyUsers, position, nodeNames]);

  // External candidates
  const externalRows = useMemo<UnifiedRow[]>(() => {
    return externalRaw.map(c => ({
      kind: 'external' as const,
      id: c.profile.id,
      score: c.matchScore,
      name: `${c.profile.firstName || 'Utente'} ${c.profile.lastName || ''}`.trim(),
      subtitle: c.profile.headline || c.profile.jobTitle || 'Professionista',
      location: c.profile.location,
      birthDate: c.profile.birthDate,
      age: c.profile.age,
      seniority: c.profile.karmaData?.seniorityAssessment,
      hardMatched: c.skillsOverlap || [],
      hardMissing: c.missingSkills || [],
      softMatched: [],
      softMissing: [],
      seniorityMatch: c.seniorityMatch ? 'match' : 'below',
      isLooking: c.profile.lookingForWork,
      external: c,
    }));
  }, [externalRaw]);

  // Tab pool
  const pool = useMemo<UnifiedRow[]>(() => {
    if (activeTab === 'internal') return internalRows;
    if (activeTab === 'external') return externalRows;
    if (activeTab === 'all') return [...internalRows, ...externalRows];
    return [];
  }, [activeTab, internalRows, externalRows]);

  // Filtered + sorted
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return pool.filter(r => {
      if (q && !r.name.toLowerCase().includes(q) && !r.subtitle.toLowerCase().includes(q)) return false;
      if (hideUnfit && r.score < 50) return false;
      if (generationFilter !== 'all') {
        // simple decade filter via age
        const age = r.age ?? (r.birthDate ? Math.floor((Date.now() - new Date(r.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000)) : null);
        if (age == null) return false;
        if (generationFilter === 'genz' && !(age <= 28)) return false;
        if (generationFilter === 'milly' && !(age >= 29 && age <= 44)) return false;
        if (generationFilter === 'genx' && !(age >= 45 && age <= 59)) return false;
        if (generationFilter === 'boomer' && age < 60) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'match-desc') return b.score - a.score;
      if (sortBy === 'match-asc') return a.score - b.score;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      const sa = SENIORITY_LEVELS[a.seniority as SeniorityLevel] || 0;
      const sb = SENIORITY_LEVELS[b.seniority as SeniorityLevel] || 0;
      return sb - sa;
    });
  }, [pool, searchQuery, hideUnfit, generationFilter, sortBy]);

  const grouped = useMemo(() => {
    const g: Record<Tier, UnifiedRow[]> = { ready: [], evaluate: [], unfit: [] };
    filtered.forEach(r => g[tierOf(r.score)].push(r));
    return g;
  }, [filtered]);

  // KPIs
  const kpi = useMemo(() => {
    const bestInt = internalRows.reduce((m, r) => Math.max(m, r.score), 0);
    const bestExt = externalRows.reduce((m, r) => Math.max(m, r.score), 0);
    const reqHard = position?.requiredProfile?.hardSkills || [];
    const allMatched = new Set<string>();
    [...internalRows, ...externalRows].forEach(r => r.hardMatched.forEach(s => allMatched.add(s)));
    const coverage = reqHard.length ? Math.round((reqHard.filter(s => allMatched.has(s)).length / reqHard.length) * 100) : 100;
    return {
      total: internalRows.length + externalRows.length,
      bestInt, bestExt,
      shortlisted: shortlistCandidates.length,
      coverage,
    };
  }, [internalRows, externalRows, shortlistCandidates, position]);

  // Skill gaps for insight panel
  const skillGaps = useMemo(() => {
    const reqHard = position?.requiredProfile?.hardSkills || [];
    const matched = new Set<string>();
    [...internalRows, ...externalRows].forEach(r => r.hardMatched.forEach(s => matched.add(s)));
    return reqHard.filter(s => !matched.has(s));
  }, [position, internalRows, externalRows]);

  // ===== Shortlist helpers =====
  const unifiedShortlistCandidates = useMemo(() => {
    const usersMap: ShortlistUser[] = companyUsers.map(u => ({
      id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email,
      avatarUrl: (u as any).avatarUrl, jobTitle: u.jobTitle,
      seniority: u.karmaData?.seniorityAssessment, profileCode: u.profileCode,
      riasecScore: (u as any).riasecScore, karmaData: u.karmaData,
    }));
    return buildUnifiedCandidates(shortlistCandidates, usersMap);
  }, [shortlistCandidates, companyUsers, buildUnifiedCandidates]);

  const handleAddInternal = async (row: UnifiedRow) => {
    if (!row.internal) return;
    const u = row.internal.user;
    const ok = await addInternalCandidate({
      id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email,
      avatarUrl: (u as any).avatarUrl, jobTitle: u.jobTitle,
      seniority: u.karmaData?.seniorityAssessment, profileCode: u.profileCode,
      riasecScore: (u as any).riasecScore, karmaData: u.karmaData,
    }, {
      matchScore: row.score,
      skillsOverlap: row.softMatched,
      missingSkills: row.softMissing,
      seniorityMatch: row.seniorityMatch === 'match',
    });
    if (ok) toast({ title: 'Aggiunto alla shortlist', description: row.name });
  };

  const handleAddExternal = async (row: UnifiedRow) => {
    if (!row.external) return;
    const ok = await addExternalCandidate(row.external);
    if (ok) toast({ title: 'Aggiunto alla shortlist', description: row.name });
  };

  const handleAddToShortlist = (row: UnifiedRow) =>
    row.kind === 'internal' ? handleAddInternal(row) : handleAddExternal(row);

  const inShortlist = (row: UnifiedRow) => isInShortlist(row.id, row.kind);

  const handleOpenDetail = (row: UnifiedRow) => {
    if (row.kind === 'internal' && row.internal && position) {
      const analysis = analyzeRotation({
        candidate: row.internal.user,
        candidateMatch: row.internal.matchData,
        position: {
          jobTitle: position.jobTitle,
          requiredProfile: position.requiredProfile as RequiredProfile | undefined,
          nodeId: (position as any).nodeId || null,
        },
        companyUsers, nodeNames,
      });
      setSelectedRotationReport({ analysis, candidate: row.internal });
    } else {
      onViewCandidate(row.id);
    }
  };

  // Comparison handlers
  const toggleCompare = (id: string) => {
    setComparisonSelection(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 4) next.add(id);
      else toast({ title: 'Massimo 4 candidati', variant: 'destructive' as any });
      return next;
    });
  };

  const startComparison = () => {
    const ids = Array.from(comparisonSelection);
    if (ids.length < 2) {
      toast({ title: 'Seleziona almeno 2 candidati per confrontarli' });
      return;
    }
    // Build UnifiedCandidate-like objects from rows (re-using shortlist comparison modal which expects pair)
    const buildUC = (row: UnifiedRow): UnifiedCandidate => {
      const src: any = row.internal?.user || row.external?.profile;
      return {
        id: row.id,
        type: row.kind,
        name: row.name,
        jobTitle: row.subtitle,
        avatarUrl: src?.avatarUrl,
        matchScore: row.score,
        riasecScore: src?.riasecScore,
        profileCode: src?.profileCode,
        skills: [...row.hardMatched, ...row.hardMissing],
        matchedSkills: row.hardMatched,
        missingSkills: row.hardMissing,
        softSkills: src?.karmaData?.softSkills || row.softMatched,
        seniority: row.seniority,
        seniorityMatch: row.seniorityMatch === 'match',
        yearsExperience: src?.yearsExperience ?? src?.karmaData?.yearsExperience,
        location: row.location,
        status: 'shortlisted',
        internalUserId: row.kind === 'internal' ? row.id : undefined,
        externalProfileId: row.kind === 'external' ? row.id : undefined,
      };
    };
    const rows = ids.map(id => filtered.find(r => r.id === id)!).filter(Boolean);
    if (rows.length < 2) return;
    setComparisonModal([buildUC(rows[0]), buildUC(rows[1])]);
    if (rows.length > 2) {
      toast({ title: 'Confronto a coppie', description: 'Mostro i primi 2 selezionati. Confronto multi-candidato in arrivo.' });
    }
  };

  // ============================================================
  // Loading/empty
  // ============================================================
  if (positionLoading && !position) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="animate-spin mx-auto mb-3 text-jnana-sage" size={32} />
        <p className="text-gray-500 dark:text-gray-400">Caricamento posizione…</p>
      </div>
    );
  }
  if (!position) {
    return (
      <div className="p-8 text-center">
        <AlertCircle size={48} className="text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Posizione non trovata</h2>
        <Button onClick={onBack}>Torna indietro</Button>
      </div>
    );
  }

  const openDays = daysSince(position.createdAt);
  const urgency = openDays != null && openDays > 30 ? 'high' : openDays != null && openDays > 14 ? 'medium' : 'low';
  const urgencyMeta = {
    low: { label: 'Apertura recente', cls: 'bg-jnana-sage/10 text-jnana-sageDark border-jnana-sage/30' },
    medium: { label: 'Da chiudere a breve', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
    high: { label: 'Urgente', cls: 'bg-rose-100 text-rose-700 border-rose-300' },
  }[urgency];

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start gap-4 flex-wrap">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 -ml-2">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-wider text-jnana-sage font-semibold mb-1">Posizione aperta</div>
          <h1 className="text-2xl lg:text-3xl font-bold text-jnana-text dark:text-gray-100 leading-tight">
            {position.jobTitle}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            {position.departmentName && (
              <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-300">
                <Building size={14} /> {position.departmentName}
              </span>
            )}
            {position.requiredProfile?.seniority && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-jnana-bg text-jnana-sageDark border border-jnana-sage/20">
                {SENIORITY_LABELS[position.requiredProfile.seniority as SeniorityLevel]}
              </span>
            )}
            {openDays != null && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${urgencyMeta.cls}`}>
                <Clock size={12} /> Aperta da {openDays}gg · {urgencyMeta.label}
              </span>
            )}
            {hiringManager && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                <UserCheck size={12} /> Hiring Mgr: <strong className="text-jnana-text dark:text-gray-100">{hiringManager.user.firstName} {hiringManager.user.lastName}</strong>
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {comparisonSelection.size > 0 && (
            <Button onClick={startComparison} className="flex items-center gap-1.5">
              <GitCompareArrows size={16} /> Confronta ({comparisonSelection.size})
            </Button>
          )}
          <Button variant="ghost" onClick={handleRefreshExternal} className="flex items-center gap-1.5">
            <Search size={16} /> Aggiorna ricerca
          </Button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KPITile icon={<Users size={18} />} label="Candidati totali" value={kpi.total} sub={`${internalRows.length} interni · ${externalRows.length} esterni`} />
        <KPITile icon={<Award size={18} />} label="Best interno" value={`${kpi.bestInt}%`} tone={kpi.bestInt >= 75 ? 'good' : kpi.bestInt >= 50 ? 'warn' : 'default'} />
        <KPITile icon={<Sparkles size={18} />} label="Best esterno" value={`${kpi.bestExt}%`} tone={kpi.bestExt >= 75 ? 'good' : kpi.bestExt >= 50 ? 'warn' : 'default'} />
        <KPITile icon={<ListChecks size={18} />} label="In shortlist" value={kpi.shortlisted} sub={kpi.shortlisted >= 3 ? 'Pronto per il confronto' : 'Aggiungi candidati'} />
        <KPITile icon={<Target size={18} />} label="Copertura skill" value={`${kpi.coverage}%`} tone={kpi.coverage >= 75 ? 'good' : kpi.coverage >= 50 ? 'warn' : 'default'} sub={`${(position.requiredProfile?.hardSkills?.length || 0)} richieste`} />
      </div>

      {/* Requirements */}
      <Card className="!p-0 overflow-hidden">
        <button
          onClick={() => setShowRequirements(s => !s)}
          className="w-full flex items-center justify-between p-4 bg-jnana-bg dark:bg-gray-900/40"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg text-jnana-sage">
              <Briefcase size={18} />
            </div>
            <div className="text-left">
              <div className="font-bold text-jnana-text dark:text-gray-100">Requisiti della posizione</div>
              <div className="text-xs text-gray-500">
                {(position.requiredProfile?.hardSkills?.length || 0)} hard · {(position.requiredProfile?.softSkills?.length || 0)} soft · {position.requiredProfile?.seniority || 'qualsiasi seniority'}
              </div>
            </div>
          </div>
          {showRequirements ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {showRequirements && (
          <div className="p-4 space-y-3">
            {position.requiredProfile?.description && (
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {position.requiredProfile.description}
              </p>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">Hard skills</div>
                <div className="flex flex-wrap gap-1.5">
                  {(position.requiredProfile?.hardSkills || []).length > 0
                    ? position.requiredProfile!.hardSkills!.map(s => {
                        const covered = !skillGaps.includes(s);
                        return (
                          <span key={s} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                            covered ? 'bg-jnana-sage/10 text-jnana-sageDark border-jnana-sage/30' : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {covered ? <CheckCircle size={10} /> : <XCircle size={10} />} {s}
                          </span>
                        );
                      })
                    : <span className="text-xs text-gray-400">Nessuna definita</span>}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">Soft skills</div>
                <div className="flex flex-wrap gap-1.5">
                  {(position.requiredProfile?.softSkills || []).length > 0
                    ? position.requiredProfile!.softSkills!.map(s => (
                        <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-jnana-powder/30 text-jnana-sageDark border border-jnana-powder">
                          {s}
                        </span>
                      ))
                    : <span className="text-xs text-gray-400">Nessuna definita</span>}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 -mb-px overflow-x-auto">
        {([
          { k: 'all', label: 'Tutti', n: internalRows.length + externalRows.length, icon: Users },
          { k: 'internal', label: 'Interni (Job Rotation)', n: internalRows.length, icon: Shuffle },
          { k: 'external', label: 'Esterni (Karma Talents)', n: externalRows.length, icon: Sparkles },
          { k: 'shortlist', label: 'Shortlist', n: shortlistCandidates.length, icon: ListChecks },
        ] as const).map(t => {
          const I = t.icon;
          const active = activeTab === t.k;
          return (
            <button
              key={t.k}
              onClick={() => setActiveTab(t.k)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                active
                  ? 'border-jnana-sage text-jnana-sageDark dark:text-jnana-sage'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <I size={16} /> {t.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[11px] font-semibold ${active ? 'bg-jnana-sage text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                {t.n}
              </span>
            </button>
          );
        })}
      </div>

      {/* Body */}
      {activeTab === 'shortlist' ? (
        <ShortlistTab
          candidates={unifiedShortlistCandidates}
          positionTitle={position.jobTitle}
          requiredSkills={position.requiredProfile?.hardSkills || []}
          targetRiasec={undefined}
          onRemoveCandidate={async (id) => {
            const ok = await removeCandidate(id);
            if (ok) toast({ title: 'Rimosso dalla shortlist' });
          }}
          onUpdateCandidate={(id, updates) => updateCandidate(id, updates)}
          onViewProfile={(c) => {
            if (c.type === 'internal' && c.internalUserId) onViewCandidate(c.internalUserId);
            else if (c.externalProfileId) onViewCandidate(c.externalProfileId);
          }}
          onSelectCandidate={(c) => {
            if (c.type === 'internal' && c.internalUserId) onAssignInternal(positionId, c.internalUserId);
            else toast({ title: 'Candidato selezionato', description: c.name });
          }}
        />
      ) : (
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Left: list */}
          <div className="space-y-4 min-w-0">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cerca per nome o ruolo…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800"
              >
                <option value="match-desc">Match ↓</option>
                <option value="match-asc">Match ↑</option>
                <option value="seniority">Seniority</option>
                <option value="name">Nome</option>
              </select>
              <button
                onClick={() => setShowFilters(s => !s)}
                className={`text-sm px-2.5 py-1.5 rounded-lg border flex items-center gap-1 ${
                  showFilters ? 'bg-jnana-sage text-white border-jnana-sage' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                <Filter size={14} /> Filtri
              </button>
              <label className="text-xs flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <input type="checkbox" checked={hideUnfit} onChange={e => setHideUnfit(e.target.checked)} className="rounded" />
                Nascondi non adatti
              </label>
            </div>

            {showFilters && (
              <div className="bg-jnana-bg dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-xl p-3 flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Generazione:</span>
                  {[
                    { k: 'all', l: 'Tutte' },
                    { k: 'genz', l: 'Gen Z' },
                    { k: 'milly', l: 'Millennials' },
                    { k: 'genx', l: 'Gen X' },
                    { k: 'boomer', l: 'Boomer' },
                  ].map(o => (
                    <button
                      key={o.k}
                      onClick={() => setGenerationFilter(o.k)}
                      className={`text-xs px-2 py-0.5 rounded-full border ${
                        generationFilter === o.k
                          ? 'bg-jnana-sage text-white border-jnana-sage'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600'
                      }`}
                    >{o.l}</button>
                  ))}
                </div>
                {(activeTab === 'external' || activeTab === 'all') && (
                  <label className="flex items-center gap-1.5 text-xs text-gray-600">
                    <input type="checkbox" checked={showOnlyLooking} onChange={e => { setShowOnlyLooking(e.target.checked); }} />
                    Solo "in cerca"
                    <button onClick={handleRefreshExternal} className="ml-1 text-jnana-sage underline">applica</button>
                  </label>
                )}
              </div>
            )}

            {/* Loading */}
            {searchLoading && activeTab !== 'internal' && (
              <div className="text-center py-6">
                <Loader2 size={24} className="animate-spin text-jnana-sage mx-auto mb-2" />
                <p className="text-sm text-gray-500">Ricerca candidati…</p>
              </div>
            )}

            {/* Groups */}
            {(['ready', 'evaluate', 'unfit'] as Tier[]).map(tier => {
              const rows = grouped[tier];
              if (!rows.length) return null;
              if (tier === 'unfit' && hideUnfit) return null;
              return (
                <CandidateGroup
                  key={tier}
                  tier={tier}
                  rows={rows}
                  managerSyn={hiringManager?.gen || null}
                  inShortlist={inShortlist}
                  onAdd={handleAddToShortlist}
                  onOpen={handleOpenDetail}
                  onAssign={(row) => row.kind === 'internal' && onAssignInternal(positionId, row.id)}
                  onCompareToggle={toggleCompare}
                  selectedForCompare={comparisonSelection}
                />
              );
            })}

            {/* Empty */}
            {!searchLoading && filtered.length === 0 && (
              <Card className="text-center py-10">
                <Users size={40} className="text-gray-300 mx-auto mb-3" />
                <h3 className="font-bold text-jnana-text dark:text-gray-100 mb-1">Nessun candidato corrisponde ai filtri</h3>
                <p className="text-sm text-gray-500 mb-4">Prova ad allargare i criteri o modifica i requisiti del ruolo.</p>
                <Button variant="ghost" onClick={() => { setSearchQuery(''); setGenerationFilter('all'); setHideUnfit(false); }}>
                  Reset filtri
                </Button>
              </Card>
            )}
          </div>

          {/* Right: insight panel */}
          <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <Card className="!p-4">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={16} className="text-jnana-sage" />
                <h4 className="font-bold text-sm text-jnana-text dark:text-gray-100">Insight HR</h4>
              </div>

              {/* Skill gaps */}
              <div className="mb-4">
                <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">Skill non coperte</div>
                {skillGaps.length === 0 ? (
                  <div className="text-xs text-jnana-sage flex items-center gap-1">
                    <CheckCircle size={12} /> Tutte le skill hanno almeno un candidato
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {skillGaps.map(s => (
                      <span key={s} className="text-[10px] px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Suggestions */}
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Suggerimenti</div>
                {kpi.bestInt >= 75 && (
                  <div className="text-xs bg-jnana-sage/10 border border-jnana-sage/20 rounded-md p-2 text-jnana-sageDark">
                    Hai un ottimo candidato interno ({kpi.bestInt}%). Valuta il <strong>Job Rotation Report</strong> prima di pubblicare l'annuncio.
                  </div>
                )}
                {kpi.bestInt < 50 && externalRows.length > 0 && (
                  <div className="text-xs bg-amber-50 border border-amber-200 rounded-md p-2 text-amber-800">
                    Match interno basso. Concentra l'effort sui candidati esterni o riconsidera la seniority richiesta.
                  </div>
                )}
                {kpi.shortlisted >= 2 && (
                  <div className="text-xs bg-jnana-powder/30 border border-jnana-powder rounded-md p-2 text-jnana-text">
                    Pronto per il confronto: usa la shortlist per decidere.
                  </div>
                )}
                {openDays != null && openDays > 30 && (
                  <div className="text-xs bg-rose-50 border border-rose-200 rounded-md p-2 text-rose-700">
                    Posizione aperta da oltre 30 giorni. Considera azioni urgenti.
                  </div>
                )}
              </div>
            </Card>

            {hiringManager && (
              <Card className="!p-4">
                <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Hiring manager</div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-jnana-powder/40 flex items-center justify-center text-jnana-sageDark font-bold text-sm">
                    {hiringManager.user.firstName?.[0]}{hiringManager.user.lastName?.[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{hiringManager.user.firstName} {hiringManager.user.lastName}</div>
                    <div className="text-[11px] text-gray-500 truncate">{hiringManager.user.jobTitle || 'Manager'}</div>
                  </div>
                </div>
              </Card>
            )}
          </aside>
        </div>
      )}

      {/* Comparison floating bar */}
      {comparisonSelection.size > 0 && activeTab !== 'shortlist' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-jnana-text text-white rounded-full shadow-2xl px-4 py-2 flex items-center gap-3">
          <GitCompareArrows size={16} />
          <span className="text-sm font-medium">{comparisonSelection.size} selezionati</span>
          <button onClick={startComparison} className="text-xs bg-jnana-sage px-3 py-1.5 rounded-full font-semibold hover:bg-jnana-sageDark">
            Confronta
          </button>
          <button onClick={() => setComparisonSelection(new Set())} className="text-white/60 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Modals */}
      {selectedRotationReport && (
        <JobRotationReportModal
          isOpen
          onClose={() => setSelectedRotationReport(null)}
          analysis={selectedRotationReport.analysis}
          isInShortlist={isInShortlist(selectedRotationReport.candidate.user.id, 'internal')}
          onAddToShortlist={() => {
            const u = selectedRotationReport.candidate.user as LegacyUser;
            const m = selectedRotationReport.candidate.matchData;
            handleAddInternal({
              kind: 'internal', id: u.id, score: m.score, name: `${u.firstName} ${u.lastName}`,
              subtitle: '', hardMatched: m.hardMatches, hardMissing: m.hardGaps,
              softMatched: m.softMatches, softMissing: m.softGaps, seniorityMatch: m.seniorityMatch,
              internal: { user: u, matchData: m },
            });
          }}
          onViewProfile={() => {
            onViewCandidate(selectedRotationReport.candidate.user.id);
            setSelectedRotationReport(null);
          }}
          onAssign={() => {
            onAssignInternal(positionId, selectedRotationReport.candidate.user.id);
            setSelectedRotationReport(null);
          }}
        />
      )}

      {comparisonModal && (
        <CandidateComparisonModal
          candidates={comparisonModal}
          positionTitle={position.jobTitle}
          requiredSkills={position.requiredProfile?.hardSkills || []}
          targetRiasec={undefined}
          onClose={() => setComparisonModal(null)}
          onSelectCandidate={(id) => {
            const c = comparisonModal.find(x => x.id === id);
            if (c?.type === 'internal' && c.internalUserId) onAssignInternal(positionId, c.internalUserId);
            setComparisonModal(null);
          }}
          onUpdateRating={() => {}}
          onUpdateNotes={() => {}}
        />
      )}
    </div>
  );
};

// ============================================================
// Subcomponents
// ============================================================

const CandidateGroup: React.FC<{
  tier: Tier;
  rows: UnifiedRow[];
  managerSyn: UserWithGeneration | null;
  inShortlist: (row: UnifiedRow) => boolean;
  onAdd: (row: UnifiedRow) => void;
  onOpen: (row: UnifiedRow) => void;
  onAssign: (row: UnifiedRow) => void;
  onCompareToggle: (id: string) => void;
  selectedForCompare: Set<string>;
}> = ({ tier, rows, managerSyn, inShortlist, onAdd, onOpen, onAssign, onCompareToggle, selectedForCompare }) => {
  const [open, setOpen] = useState(tier !== 'unfit');
  const meta = tierMeta[tier];
  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border ${meta.cls}`}
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          <span className="font-semibold text-sm">{meta.label}</span>
          <span className="text-xs opacity-70">· {meta.desc}</span>
        </div>
        <span className="text-xs font-bold">{rows.length}</span>
      </button>
      {open && (
        <div className="space-y-2">
          {rows.map(row => (
            <CandidateRow
              key={`${row.kind}-${row.id}`}
              row={row}
              managerSyn={managerSyn}
              inShortlist={inShortlist(row)}
              isSelectedForCompare={selectedForCompare.has(row.id)}
              onAdd={() => onAdd(row)}
              onOpen={() => onOpen(row)}
              onAssign={() => onAssign(row)}
              onCompareToggle={() => onCompareToggle(row.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CandidateRow: React.FC<{
  row: UnifiedRow;
  managerSyn: UserWithGeneration | null;
  inShortlist: boolean;
  isSelectedForCompare: boolean;
  onAdd: () => void;
  onOpen: () => void;
  onAssign: () => void;
  onCompareToggle: () => void;
}> = ({ row, managerSyn, inShortlist, isSelectedForCompare, onAdd, onOpen, onAssign, onCompareToggle }) => {
  const candidateGen: UserWithGeneration = {
    birthDate: row.birthDate,
    age: row.age,
    hardSkills: row.internal?.user.hardSkills?.map(s => ({
      name: typeof s === 'string' ? s : s.name,
      proficiencyLevel: typeof s === 'object' ? s.proficiencyLevel : undefined,
    })) || row.external?.profile.hardSkills?.map(s => ({
      name: s.skill?.name || s.customSkillName || 'Unknown',
      proficiencyLevel: s.proficiencyLevel,
    })),
  };
  const synergy = managerSyn ? analyzeSynergy(candidateGen, managerSyn) : null;
  const initials = row.name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase();
  const tier = tierOf(row.score);
  const borderTone = tier === 'ready' ? 'border-l-jnana-sage' : tier === 'evaluate' ? 'border-l-amber-400' : 'border-l-rose-300';

  return (
    <div
      onClick={onOpen}
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 border-l-4 ${borderTone} p-3 hover:shadow-soft transition-all cursor-pointer ${
        isSelectedForCompare ? 'ring-2 ring-jnana-sage' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Compare checkbox */}
        <input
          type="checkbox"
          checked={isSelectedForCompare}
          onChange={(e) => { e.stopPropagation(); onCompareToggle(); }}
          onClick={(e) => e.stopPropagation()}
          className="mt-2 rounded border-gray-300 text-jnana-sage focus:ring-jnana-sage"
          aria-label="Seleziona per confronto"
        />

        {/* Avatar */}
        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${
          row.kind === 'internal' ? 'bg-gradient-to-br from-jnana-sage to-jnana-sageDark' : 'bg-gradient-to-br from-jnana-powder to-jnana-sage'
        }`}>
          {initials || '?'}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm text-jnana-text dark:text-gray-100 truncate">{row.name}</span>
            <GenerationBadge birthDate={row.birthDate} age={row.age} size="sm" />
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold border ${
              row.kind === 'internal'
                ? 'bg-jnana-sage/10 text-jnana-sageDark border-jnana-sage/30'
                : 'bg-jnana-powder/30 text-jnana-sageDark border-jnana-powder'
            }`}>
              {row.kind === 'internal' ? 'Interno' : 'Esterno'}
            </span>
            {row.kind === 'external' && (
              row.isLooking ? (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] bg-jnana-sage/10 text-jnana-sageDark font-medium">
                  <BadgeCheck size={10} /> In cerca
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-50 text-amber-700 font-medium">
                  <Eye size={10} /> Passivo
                </span>
              )
            )}
            {row.seniorityMatch === 'above' && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600">
                <TrendingDown size={10} /> Seniority alta
              </span>
            )}
            {inShortlist && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-jnana-sage text-white rounded-full font-semibold">
                <CheckCircle size={10} /> Shortlist
              </span>
            )}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 truncate">
            {row.subtitle}
          </div>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500 flex-wrap">
            {row.kind === 'internal' && row.currentDepartment && (
              <span className="inline-flex items-center gap-0.5"><Building size={10} /> {row.currentDepartment}</span>
            )}
            {row.location && <span className="inline-flex items-center gap-0.5"><MapPin size={10} /> {row.location}</span>}
            {synergy && synergy.type !== 'None' && <SynergyBadge synergy={synergy} size="sm" />}
          </div>

          {/* Skills mini-breakdown */}
          {(row.hardMatched.length + row.hardMissing.length) > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {row.hardMatched.slice(0, 4).map(s => (
                <span key={`m-${s}`} className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-jnana-sage/10 text-jnana-sageDark border border-jnana-sage/30 rounded">
                  <CheckCircle size={9} /> {s}
                </span>
              ))}
              {row.hardMissing.slice(0, 3).map(s => (
                <span key={`x-${s}`} className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded">
                  <XCircle size={9} /> {s}
                </span>
              ))}
              {(row.hardMatched.length + row.hardMissing.length) > 7 && (
                <span className="text-[10px] text-gray-400">+{row.hardMatched.length + row.hardMissing.length - 7}</span>
              )}
            </div>
          )}
        </div>

        {/* Score + actions */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <ScoreRing value={row.score} />
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {!inShortlist ? (
              <button
                onClick={onAdd}
                className="text-[11px] px-2 py-1 bg-jnana-text text-white rounded-md hover:bg-jnana-sageDark transition-colors flex items-center gap-1 font-medium"
              >
                <Plus size={11} /> Shortlist
              </button>
            ) : (
              <span className="text-[10px] px-2 py-1 bg-jnana-sage/10 text-jnana-sageDark rounded-md flex items-center gap-1">
                <CheckCircle size={10} /> In lista
              </span>
            )}
            {row.kind === 'internal' && (
              <button
                onClick={onAssign}
                className="text-[11px] px-2 py-1 bg-jnana-sage text-white rounded-md hover:bg-jnana-sageDark transition-colors flex items-center gap-1"
              >
                <ArrowRight size={11} /> Assegna
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
