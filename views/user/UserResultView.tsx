import React, { useState, useMemo, useEffect } from 'react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import { 
  Hexagon, 
  Briefcase, 
  Sparkles,
  User as UserIcon,
  ThermometerSun,
  LayoutTemplate,
  BrainCircuit,
  AlertTriangle,
  Award,
  X,
  Handshake,
  TrendingUp,
  ShieldCheck,
  Target,
  Quote,
  CheckCircle2,
  Info,
  ArrowRight,
  Hammer, // R
  Lightbulb, // I
  Palette, // A
  HeartHandshake, // S
  ClipboardList, // C
  FileText
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { User, JobDatabase, CompanyProfile, RiasecScore, RiasecDimension } from '../../types';
import { generateMainRadarData, generateDetailedReport, generateAdjectivesData, findManagerForUser, analyzeUserCompatibility } from '../../services/riasecService';

// --- CONFIGURAZIONE VISIVA ---
const RIASEC_CONFIG: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  'Realistico': { color: '#E74C3C', icon: Hammer, label: 'Realistico' },
  'Investigativo': { color: '#8E44AD', icon: Lightbulb, label: 'Investigativo' },
  'Artistico': { color: '#E67E22', icon: Palette, label: 'Artistico' },
  'Sociale': { color: '#2ECC71', icon: HeartHandshake, label: 'Sociale' },
  'Intraprendente': { color: '#3498DB', icon: Briefcase, label: 'Intraprendente' },
  'Convenzionale': { color: '#F1C40F', icon: ClipboardList, label: 'Convenzionale' }
};

// --- DATA ADAPTER (LEGACY TRICAM -> STANDARD RIASEC) ---
const normalizeScores = (raw: any): RiasecScore => {
  if (!raw) return { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  // Check for Legacy Keys (T = Technique, M = Methode)
  const isLegacy = 'T' in raw || 'M' in raw;

  if (isLegacy) {
    // MAPPING RIGOROSO TRICAM -> RIASEC
    // T (Technique)   -> R (Realistic)
    // R (Reflechi)    -> I (Investigative)
    // I (Imagination) -> A (Artistic)
    // C (Contact)     -> S (Social)
    // A (Action)      -> E (Enterprising)
    // M (Methode)     -> C (Conventional)
    return {
      R: raw.T || 0,
      I: raw.R || 0, 
      A: raw.I || 0, 
      S: raw.C || 0,
      E: raw.A || 0, 
      C: raw.M || 0
    };
  }

  // Se è già formato standard, ritorna una copia sicura
  return {
    R: raw.R || 0,
    I: raw.I || 0,
    A: raw.A || 0,
    S: raw.S || 0,
    E: raw.E || 0,
    C: raw.C || 0
  };
};

const CustomRadarTick = (props: any) => {
  const { payload, x, y, cx, cy } = props;
  const config = RIASEC_CONFIG[payload.value];
  if (!config) return <text x={x} y={y} fill="#9CA3AF" fontSize={10}>{payload.value}</text>;
  const Icon = config.icon;
  const isTop = y < cy - 50;
  const isBottom = y > cy + 50;
  
  return (
    <g transform={`translate(${x},${y})`}>
      <foreignObject x={-40} y={isTop ? -50 : isBottom ? 10 : -20} width={80} height={60}>
        <div className="flex flex-col items-center justify-center w-full h-full pointer-events-none">
          <div className="p-1.5 rounded-full bg-white shadow-sm border mb-1 flex items-center justify-center" style={{ borderColor: config.color }}>
            <Icon size={16} color={config.color} strokeWidth={2.5} />
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider text-center leading-none" style={{ color: config.color }}>
            {config.label}
          </span>
        </div>
      </foreignObject>
    </g>
  );
};

const ReportContentRenderer: React.FC<{ content: string }> = ({ content }) => {
    if (!content) return null;
    
    // Helper to parse **bold** text
    const parseBold = (text: string) => {
        const parts = text.split(/\*\*(.*?)\*\*/g);
        return parts.map((part, i) => 
            i % 2 === 1 ? <strong key={i} className="font-bold text-gray-800 dark:text-gray-100">{part}</strong> : part
        );
    };
    
    const blocks = content.split(/(?=### )/g);
    return (
        <div className="space-y-6">
            {blocks.map((block, blockIdx) => {
                const headerMatch = block.match(/^### (.*?)\n/);
                const header = headerMatch ? headerMatch[1] : null;
                let body = header ? block.replace(/^### .*?\n/, '') : block;
                const parts = body.split(/(\[BLOCK:TRAITS\]|\[BLOCK:QUOTES\])/g);

                return (
                    <div key={blockIdx} className={`rounded-2xl ${header ? 'bg-gray-50 dark:bg-gray-800/50 p-6 border border-gray-100 dark:border-gray-700' : ''}`}>
                        {header && (
                            <h3 className="text-xl font-brand font-bold text-jnana-sage mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                                {parseBold(header)}
                            </h3>
                        )}
                        {parts.map((part, partIdx) => {
                            if (part.includes('[BLOCK:TRAITS]') || part.includes('[BLOCK:QUOTES]')) return null; 
                            const mode = parts[partIdx - 1];
                            if (mode === '[BLOCK:TRAITS]') {
                                const traits = part.split(',').map(t => t.trim()).filter(t => t);
                                return (
                                    <div key={partIdx} className="my-4">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2"><Target size={12}/> Tratti Distintivi</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {traits.map((trait, tIdx) => (
                                                <span key={tIdx} className="px-3 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium shadow-sm">{trait}</span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }
                            if (mode === '[BLOCK:QUOTES]') {
                                const quotes = part.split('"').filter(q => q.trim().length > 2);
                                return (
                                    <div key={partIdx} className="my-4 grid grid-cols-1 gap-3">
                                        {quotes.map((quote, qIdx) => (
                                            <div key={qIdx} className="relative pl-6 py-2 italic text-gray-600 dark:text-gray-400 border-l-4 border-jnana-powder/50 bg-white dark:bg-gray-800 rounded-r-lg">
                                                <Quote size={16} className="absolute left-1 top-2 text-jnana-powder/50" />"{quote.trim()}"
                                            </div>
                                        ))}
                                    </div>
                                );
                            }
                            if (!part.trim()) return null;
                            
                            // Check for job listings (lines starting with *)
                            const lines = part.split('\n');
                            const hasJobList = lines.some(l => l.trim().startsWith('* '));
                            
                            if (hasJobList) {
                                return (
                                    <div key={partIdx} className="space-y-3">
                                        {lines.map((line, lIdx) => {
                                            if (!line.trim()) return null;
                                            if (line.trim().startsWith('* ')) {
                                                const jobContent = line.replace(/^\s*\*\s*/, '');
                                                return (
                                                    <div key={lIdx} className="flex items-center gap-3 p-4 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow">
                                                        <div className="p-2 bg-jnana-sage/10 rounded-lg">
                                                            <Briefcase size={18} className="text-jnana-sage" />
                                                        </div>
                                                        <span className="text-gray-700 dark:text-gray-200 font-medium">{parseBold(jobContent)}</span>
                                                    </div>
                                                );
                                            }
                                            return <p key={lIdx} className="text-gray-600 dark:text-gray-300">{parseBold(line)}</p>;
                                        })}
                                    </div>
                                );
                            }
                            
                            return (
                                <div key={partIdx} className="text-gray-600 dark:text-gray-300 leading-relaxed space-y-2">
                                    {lines.map((line, lIdx) => {
                                        if (!line.trim()) return <br key={lIdx}/>;
                                        return <p key={lIdx}>{parseBold(line)}</p>;
                                    })}
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: any; label: string }> = ({ active, onClick, icon: Icon, label }) => (
    <button onClick={onClick} className={`flex items-center gap-2 px-6 py-4 font-bold border-b-2 transition-colors duration-200 ${active ? 'border-jnana-sage text-jnana-sage' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
        <Icon size={18} /><span>{label}</span>
    </button>
);

interface UserResultViewProps {
  user: User;
  jobDb: JobDatabase;
  company?: CompanyProfile;
  companyUsers?: User[];
  onLogout: () => void;
  onStartClimate: () => void;
  onStartKarma?: () => void;
  isReadOnly?: boolean;
  onClose?: () => void;
}

export const UserResultView: React.FC<UserResultViewProps> = ({ user, jobDb, company, companyUsers, onLogout, onStartClimate, onStartKarma, isReadOnly, onClose }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'riasec' | 'karma' | 'climate'>('overview');

    // --- SINGLE SOURCE OF TRUTH ---
    // 1. Normalize Scores immediately
    const finalScores = useMemo(() => normalizeScores(user.results), [user.results]);

    // 2. Debugging Log
    useEffect(() => {
        console.log("Processed Scores (Single Source of Truth):", finalScores);
    }, [finalScores]);

    // 3. Calculate Code based on finalScores (NOT user.profileCode which might be stale)
    const activeProfileCode = useMemo(() => {
        const entries = Object.entries(finalScores) as [RiasecDimension, number][];
        entries.sort((a, b) => b[1] - a[1]);
        return entries.slice(0, 3).map(e => e[0]).join('-');
    }, [finalScores]);

    // 4. Generate Derived Data from finalScores
    const radarData = useMemo(() => generateMainRadarData(finalScores), [finalScores]);
    const adjData = useMemo(() => generateAdjectivesData(finalScores), [finalScores]);
    const report = useMemo(() => generateDetailedReport(finalScores, jobDb, user), [finalScores, jobDb, user]);

    const climateChartData = useMemo(() => {
        if (!user.climateData) return [];
        return Object.entries(user.climateData.sectionAverages)
            .map(([key, val]) => ({ name: key, score: Number(val) }))
            .sort((a, b) => b.score - a.score);
    }, [user.climateData]);

    const managerAnalysis = useMemo(() => {
        if (!company || !companyUsers || !user.departmentId) return null;
        const userWithCorrectCode = { ...user, profileCode: activeProfileCode }; // Inject calculated code
        const manager = findManagerForUser(userWithCorrectCode, company.structure, companyUsers);
        if (!manager) return null;
        return { manager, ...analyzeUserCompatibility(userWithCorrectCode, manager) };
    }, [user, company, companyUsers, activeProfileCode]);

    const getAdjectiveColor = (score: number) => {
        if (score >= 5) return '#15803d'; 
        if (score >= 4) return '#22c55e';
        if (score >= 3) return '#eab308';
        if (score >= 2) return '#f97316';
        return '#9ca3af';
    };

    return (
        <div className="max-w-7xl mx-auto p-8 font-sans pb-24">
             {isReadOnly && (
               <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 flex items-center gap-3">
                 <Info size={18} className="text-blue-500" />
                 <span className="text-sm text-blue-700 dark:text-blue-300">Stai visualizzando il profilo di <strong>{user.firstName} {user.lastName}</strong></span>
               </div>
             )}
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                 <div className="flex items-center gap-4">
                     <div>
                        <h1 className="text-4xl font-brand font-bold text-jnana-sage mb-1">{user.firstName} {user.lastName}</h1>
                        <p className="text-gray-500 font-medium flex items-center gap-2">
                            <Briefcase size={16}/> {user.jobTitle} 
                            {company && <span className="text-gray-300">|</span>}
                            {company && <span className="flex items-center gap-1"><UserIcon size={14}/> {company.name}</span>}
                        </p>
                     </div>
                     <div className="hidden md:flex flex-col items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ml-4">
                         <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Profilo</span>
                         <span className="text-xl font-mono font-bold text-jnana-sage tracking-widest">{activeProfileCode}</span>
                     </div>
                 </div>
                 {isReadOnly ? (
                   <Button variant="outline" onClick={onClose} size="sm">Chiudi</Button>
                 ) : (
                   <Button variant="outline" onClick={onLogout} size="sm">Esci</Button>
                 )}
             </div>

             <div className="mb-8 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                 <div className="flex min-w-max">
                     <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={LayoutTemplate} label="Overview" />
                     <TabButton active={activeTab === 'riasec'} onClick={() => setActiveTab('riasec')} icon={Hexagon} label="Analisi RIASEC" />
                     <TabButton active={activeTab === 'karma'} onClick={() => setActiveTab('karma')} icon={BrainCircuit} label="Karma AI" />
                     <TabButton active={activeTab === 'climate'} onClick={() => setActiveTab('climate')} icon={ThermometerSun} label="Clima Aziendale" />
                 </div>
             </div>

             {activeTab === 'overview' && (
                 <div className="animate-fade-in space-y-8">
                     {/* Hero Card */}
                     <Card className="!bg-jnana-sage text-white border-none relative overflow-hidden shadow-xl">
                        <div className="absolute top-0 right-0 p-8 opacity-10"><Hexagon size={250} /></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 p-6">
                            <div className="md:col-span-2 flex flex-col justify-center">
                                <h2 className="text-3xl font-brand font-bold mb-3 text-white">Profilo Completato</h2>
                                <p className="text-white/90 mb-8 leading-relaxed text-lg">
                                    Ciao <strong>{user.firstName}</strong>, ecco i risultati della tua mappatura attitudinale.
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <Button onClick={() => setActiveTab('riasec')} className="bg-white !text-jnana-sage hover:bg-gray-100 border-none font-bold shadow-md">Vedi Dettaglio RIASEC</Button>
                                    <Button onClick={() => setActiveTab('karma')} variant="outline" className="border-white/40 text-white hover:bg-white/10 font-medium">Analisi Karma AI</Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 flex items-center justify-between">
                                    <div><div className="text-xs uppercase tracking-wider opacity-80 font-bold text-white">Codice Profilo</div><div className="text-2xl font-mono font-bold mt-1 text-white">{activeProfileCode}</div></div><Hexagon size={24} className="text-white/60"/>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 flex items-center justify-between">
                                    <div><div className="text-xs uppercase tracking-wider opacity-80 font-bold text-white">Clima Index</div><div className="text-2xl font-bold mt-1 text-white">{user.climateData ? `${user.climateData.overallAverage.toFixed(1)}/5` : '-'}</div></div><ThermometerSun size={24} className="text-white/60"/>
                                </div>
                            </div>
                        </div>
                     </Card>

                     {/* Quick Insights Grid */}
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Top 3 RIASEC Dimensions */}
                        <Card className="p-5">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                                <Award size={14} className="text-jnana-sage" /> Top 3 Dimensioni
                            </h3>
                            <div className="space-y-3">
                                {(() => {
                                    const entries = Object.entries(finalScores) as [RiasecDimension, number][];
                                    entries.sort((a, b) => b[1] - a[1]);
                                    const top3 = entries.slice(0, 3);
                                    const dimLabels: Record<string, string> = {
                                        R: 'Realistico', I: 'Investigativo', A: 'Artistico',
                                        S: 'Sociale', E: 'Intraprendente', C: 'Convenzionale'
                                    };
                                    return top3.map(([dim, score], idx) => (
                                        <div key={dim} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${idx === 0 ? 'bg-jnana-sage' : idx === 1 ? 'bg-jnana-sage/70' : 'bg-jnana-sage/50'}`}>{idx + 1}</span>
                                                <span className="font-medium text-gray-700 dark:text-gray-200">{dimLabels[dim]}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-jnana-sage rounded-full" style={{ width: `${(score / 30) * 100}%` }} />
                                                </div>
                                                <span className="text-sm font-bold text-gray-500">{score}</span>
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </Card>

                        {/* Soft Skills */}
                        <Card className="p-5">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                                <Sparkles size={14} className="text-purple-500" /> Soft Skills
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {user.karmaData?.softSkills?.slice(0, 5).map((skill, i) => (
                                    <span key={i} className="px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium border border-purple-200 dark:border-purple-700">
                                        {skill}
                                    </span>
                                )) || <span className="text-gray-400 text-sm italic">Completa Karma AI</span>}
                            </div>
                        </Card>

                        {/* Primary Values */}
                        <Card className="p-5">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                                <ShieldCheck size={14} className="text-green-500" /> Valori Primari
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {user.karmaData?.primaryValues?.slice(0, 4).map((value, i) => (
                                    <span key={i} className="px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium border border-green-200 dark:border-green-700">
                                        {value}
                                    </span>
                                )) || <span className="text-gray-400 text-sm italic">Completa Karma AI</span>}
                            </div>
                        </Card>

                        {/* Top Jobs */}
                        <Card className="p-5">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                                <Briefcase size={14} className="text-blue-500" /> Lavori Suggeriti
                            </h3>
                            <div className="space-y-2">
                                {(() => {
                                    const jobSection = report.find(s => s.type === 'jobs');
                                    if (!jobSection) return <span className="text-gray-400 text-sm italic">Non disponibile</span>;
                                    const jobLines = jobSection.content.split('\n').filter(l => l.trim().startsWith('* ')).slice(0, 3);
                                    return jobLines.map((line, i) => {
                                        const content = line.replace(/^\s*\*\s*/, '').replace(/\*\*/g, '').split(':')[0];
                                        return (
                                            <div key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                                {content}
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </Card>
                     </div>

                     {/* Climate Snapshot */}
                     {user.climateData && (
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-bold text-gray-400 uppercase flex items-center gap-2">
                                    <ThermometerSun size={16} className="text-amber-500" /> Snapshot Clima Aziendale
                                </h3>
                                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full">
                                    <span className="text-xs text-gray-500 font-medium">Indice Globale:</span>
                                    <span className={`text-lg font-bold ${user.climateData.overallAverage >= 3.5 ? 'text-green-600' : user.climateData.overallAverage >= 2.5 ? 'text-amber-600' : 'text-red-600'}`}>
                                        {user.climateData.overallAverage.toFixed(1)}/5
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                {climateChartData.slice(0, 5).map((item, idx) => (
                                    <div key={idx} className="text-center">
                                        <div className="relative w-16 h-16 mx-auto mb-2">
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle cx="32" cy="32" r="28" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                                                <circle 
                                                    cx="32" cy="32" r="28" fill="none" 
                                                    stroke={item.score >= 3.5 ? '#22c55e' : item.score >= 2.5 ? '#f59e0b' : '#ef4444'} 
                                                    strokeWidth="6"
                                                    strokeDasharray={`${(item.score / 5) * 176} 176`}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-200">
                                                {item.score.toFixed(1)}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-500 font-medium leading-tight block">{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                     )}

                     {/* Call to action if karma not done */}
                     {!user.karmaData && onStartKarma && !isReadOnly && (
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-l-8 border-indigo-500 rounded-2xl p-8 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-start gap-5">
                                <div className="p-4 bg-white dark:bg-gray-800 rounded-full text-indigo-500 shadow-sm shrink-0 mt-1"><BrainCircuit size={32} strokeWidth={2} /></div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">🎯 Completa il tuo profilo!</h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-lg">
                                        Hai completato {user.results ? 'RIASEC' : ''}{user.results && user.climateData ? ' e ' : ''}{user.climateData ? 'Climate' : ''}.
                                        Parla con Karma AI per scoprire le tue soft skills e valori.
                                    </p>
                                </div>
                            </div>
                            <Button onClick={onStartKarma} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg px-8 py-4 text-lg font-bold shrink-0 min-w-[200px]">
                                Inizia Colloquio <ArrowRight className="ml-2"/>
                            </Button>
                        </div>
                     )}

                     {/* Call to action if climate not done */}
                     {!user.climateData && !isReadOnly && (
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-l-8 border-amber-500 rounded-2xl p-8 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-start gap-5">
                                <div className="p-4 bg-white dark:bg-gray-800 rounded-full text-amber-500 shadow-sm shrink-0 mt-1"><ThermometerSun size={32} strokeWidth={2} /></div>
                                <div><h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Analisi Clima Richiesta</h3><p className="text-gray-600 dark:text-gray-300 text-lg">Completa il sondaggio per sbloccare l'analisi completa.</p></div>
                            </div>
                            <Button onClick={onStartClimate} className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg px-8 py-4 text-lg font-bold shrink-0 min-w-[200px]">Compila Ora <ArrowRight className="ml-2"/></Button>
                        </div>
                     )}
                 </div>
             )}

             {activeTab === 'riasec' && (
                 <div className="space-y-8 animate-fade-in">
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                         <Card className="flex flex-col items-center justify-center min-h-[450px]">
                             <h3 className="text-sm font-bold text-gray-400 uppercase mb-6 flex items-center gap-2"><Hexagon size={16}/> Mappa Attitudinale</h3>
                             <div className="w-full h-[400px]">
                                 <ResponsiveContainer width="100%" height="100%">
                                     <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                                         <PolarGrid gridType="polygon" stroke="#e5e7eb" />
                                         <PolarAngleAxis dataKey="subject" tick={<CustomRadarTick />} />
                                         <PolarRadiusAxis angle={30} domain={[0, 30]} tick={false} axisLine={false} />
                                         <Radar name="Tu" dataKey="A" stroke="#334155" strokeWidth={3} fill="#475569" fillOpacity={0.5} />
                                         <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                                     </RadarChart>
                                 </ResponsiveContainer>
                             </div>
                         </Card>
                         <Card className="flex flex-col items-center justify-center min-h-[450px]">
                             <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2"><Target size={16}/> Intensità Tratti</h3>
                             <div className="w-full h-[350px]">
                                 <ResponsiveContainer width="100%" height="100%">
                                     <BarChart layout="vertical" data={adjData} margin={{ left: 40, right: 20 }}>
                                         <XAxis type="number" domain={[0, 5]} hide />
                                         <YAxis dataKey="subject" type="category" width={120} tick={{fontSize: 11, fontWeight: 'bold', fill: '#6B7280'}} axisLine={false} tickLine={false} />
                                         <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none'}} />
                                         <Bar dataKey="A" radius={[0, 4, 4, 0]} barSize={20}>
                                             {adjData.map((entry, index) => <Cell key={`cell-${index}`} fill={getAdjectiveColor(entry.A)} />)}
                                         </Bar>
                                     </BarChart>
                                 </ResponsiveContainer>
                             </div>
                         </Card>
                     </div>
                     <div className="space-y-8">
                         {report.filter(s => s.type !== 'karma').map((section, idx) => (
                             <Card key={idx} className="p-8">
                                 <ReportContentRenderer content={section.content} />
                             </Card>
                         ))}
                     </div>
                 </div>
             )}

             {activeTab === 'karma' && (
                 <div className="animate-fade-in space-y-8">
                     {user.karmaData ? (
                         <>
                             <Card className="bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-900/20 dark:to-gray-800 border-l-4 border-indigo-500">
                                 <div className="p-4"><h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-100 mb-2">Sintesi Esecutiva</h3><p className="italic">"{user.karmaData.summary}"</p></div>
                             </Card>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                 <Card><h3 className="font-bold mb-4">Valori & Fit</h3><div className="flex flex-wrap gap-2">{user.karmaData.primaryValues?.map(v => <span key={v} className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-bold border border-green-200">{v}</span>)}</div></Card>
                                 <Card className="bg-red-50/30 border-red-100"><h3 className="font-bold text-red-700 mb-4">Rischi (Entropia)</h3><ul>{user.karmaData.riskFactors?.map(r => <li key={r} className="flex gap-2 items-center text-red-800 text-sm mb-2"><X size={14}/> {r}</li>)}</ul></Card>
                             </div>
                         </>
                     ) : (
                         <div className="text-center py-16">
                             <div className="max-w-md mx-auto">
                                 <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                     <BrainCircuit size={40} className="text-indigo-500" />
                                 </div>
                                 <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">Colloquio Karma AI</h3>
                                 <p className="text-gray-500 dark:text-gray-400 mb-8">
                                     Parla con la nostra AI per scoprire le tue soft skills, valori e aree di crescita.
                                     Il colloquio dura circa 5 minuti.
                                 </p>
                                 {onStartKarma && !isReadOnly && (
                                     <Button onClick={onStartKarma} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 text-lg font-bold">
                                         <BrainCircuit className="mr-2" size={20} /> Inizia Colloquio
                                     </Button>
                                 )}
                             </div>
                         </div>
                     )}
                 </div>
             )}

             {activeTab === 'climate' && (
                 <div className="animate-fade-in space-y-8">
                     {user.climateData ? (
                         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                             <Card className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 border-2 border-dashed">
                                 <div className="text-6xl font-black text-gray-800">{user.climateData.overallAverage.toFixed(1)}</div>
                                 <div className="text-sm uppercase font-bold text-gray-400">Clima Index</div>
                             </Card>
                             <Card className="lg:col-span-2">
                                 <h3 className="font-bold mb-6">Dettaglio Dimensioni</h3>
                                 <div className="space-y-4">
                                    {climateChartData.map((item, idx) => (
                                        <div key={idx}>
                                            <div className="flex justify-between text-sm font-bold mb-1"><span>{item.name}</span><span>{item.score.toFixed(1)}/5</span></div>
                                            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${item.score >= 3.5 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${(item.score / 5) * 100}%` }}></div></div>
                                        </div>
                                    ))}
                                 </div>
                             </Card>
                             {managerAnalysis && (
                                 <Card className="lg:col-span-3 border-t-4 border-purple-500 bg-purple-50/20">
                                     <div className="flex items-center gap-4 mb-4"><Handshake className="text-purple-600"/><h3 className="font-bold text-purple-900">Sintonia Manager: {managerAnalysis.score}%</h3></div>
                                     <ul className="space-y-2">{managerAnalysis.reasons.map((r, i) => <li key={i} className="text-sm text-gray-700 flex gap-2"><CheckCircle2 size={14} className="text-purple-500 mt-1 shrink-0"/>{r}</li>)}</ul>
                                 </Card>
                             )}
                         </div>
                     ) : !isReadOnly ? <div className="text-center py-20 bg-gray-50 border-2 border-dashed rounded-3xl"><Button onClick={onStartClimate}>Compila Ora</Button></div> : <div className="text-center py-20 bg-gray-50 border-2 border-dashed rounded-3xl text-gray-500">Test Climate non ancora completato</div>}
                 </div>
             )}
        </div>
    );
};