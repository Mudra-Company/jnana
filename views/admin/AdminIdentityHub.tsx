import React, { useMemo, useState } from 'react';
import { Fingerprint, FileSpreadsheet, CheckCircle, Database, AlertTriangle, Users, ThermometerSun, BarChart3, Lightbulb, TrendingUp, Handshake, ShieldAlert, Award, AlertCircle, Info, ChevronDown, ChevronRight, User as UserIcon } from 'lucide-react';
import { Card } from '../../components/Card';
import { CompanyProfile, User } from '../../types';
import { calculateCultureAnalysis, calculateClimateAnalytics, calculateTeamClimateStats, calculateLeadershipAnalytics, MemberBreakdown } from '../../services/riasecService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, ReferenceLine, LabelList, PieChart, Pie } from 'recharts';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../src/components/ui/collapsible';

interface AdminIdentityHubProps {
  company: CompanyProfile;
  users: User[];
}

// Helper to parse **bold** text
const renderFormattedText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return (
        <span>
            {parts.map((part, i) => 
                i % 2 === 1 ? <strong key={i} className="font-bold text-gray-900 dark:text-white">{part}</strong> : part
            )}
        </span>
    );
};

// Risk Mapping for Climate Dimensions (match exact keys from CLIMATE_SURVEY)
const CLIMATE_RISKS: Record<string, string> = {
    "Senso di Appartenenza": "Rischio elevato di turnover volontario e bassa employer branding advocacy. I dipendenti non si sentono ambasciatori del brand.",
    "Organizzazione e Cambiamento": "Rischio di paralisi operativa e resistenza passiva alle innovazioni. Possibili colli di bottiglia decisionali e processi non chiari.",
    "Il Mio Lavoro": "Rischio di calo della produttività individuale e noia professionale. Possibile disallineamento tra competenze e mansioni.",
    "La Mia Remunerazione": "Rischio di perdita immediata dei top performer verso competitor con offerte economiche migliori.",
    "Rapporto con il Capo": "Rischio di conflittualità diffusa e mancanza di fiducia nella leadership. Spesso causa primaria di dimissioni.",
    "La Mia Unità (Team)": "Rischio di lavoro a silos, scarsa cooperazione interna e isolamento dei singoli.",
    "Responsabilità": "Rischio di deresponsabilizzazione (scaricabarile) e mancanza di autonomia operativa.",
    "Aspetto Umano": "Rischio di ambiente tossico, scarsa sicurezza psicologica e difficoltà nella collaborazione orizzontale.",
    "Identità": "Rischio di frammentazione culturale. I dipendenti non si riconoscono nella missione aziendale, lavorando per inerzia."
};

export const AdminIdentityHub: React.FC<AdminIdentityHubProps> = ({ company, users }) => {
    // Calculate deep culture analysis
    const cultureAnalysis = useMemo(() => calculateCultureAnalysis(company, users), [company, users]);
    
    // Calculate climate stats
    const climateStats = useMemo(() => calculateClimateAnalytics(users), [users]);
    const teamStats = useMemo(() => calculateTeamClimateStats(company.structure, users), [company, users]);

    // Calculate Leadership stats
    const leadershipStats = useMemo(() => calculateLeadershipAnalytics(company, users), [company, users]);

    // --- STRATEGIC INSIGHT GENERATION LOGIC ---
    
    const generateCultureInsight = () => {
        const score = cultureAnalysis.matchScore;
        const gapCount = cultureAnalysis.gapValues.length;
        const driverCount = cultureAnalysis.driverCount;
        const hasDeclaredValues = (company.cultureValues?.length || 0) > 0;
        
        // Check if there's enough data for meaningful analysis
        if (driverCount === 0) {
            return {
                analysis: "**Dati insufficienti per l'analisi culturale.** Non sono ancora stati identificati Cultural Drivers nell'organigramma, oppure i leader identificati non hanno completato il profilo Karma AI.",
                risk: "Per ottenere un'analisi significativa: 1) Assegna il flag 'Cultural Driver' ai nodi chiave nell'Org Chart. 2) Assicurati che i leader di questi nodi completino il test RIASEC e il colloquio Karma AI.",
                hasData: false
            };
        }
        
        if (!hasDeclaredValues) {
            return {
                analysis: "**Nessun valore aziendale dichiarato.** Per confrontare la cultura agita con quella desiderata, definisci prima i valori aziendali nel Profilo Aziendale.",
                risk: "Vai nella sezione 'Profilo Aziendale' e aggiungi i valori culturali che l'azienda vuole promuovere.",
                hasData: false
            };
        }

        let analysis = "";
        let risk = "";

        if (score >= 70) {
            analysis = `L'allineamento culturale è **solido (${score}%)**. I leader aziendali incarnano efficacemente i valori dichiarati nel DNA dell'organizzazione. C'è coerenza tra "ciò che si dice" e "ciò che si fa".`;
            risk = "Il rischio principale è l'omologazione (groupthink): attenzione a mantenere viva la diversità di pensiero per non stagnare.";
        } else if (score >= 40) {
            analysis = `L'allineamento è **parziale (${score}%)**. Esiste una frattura tra la cultura desiderata e quella agita quotidianamente dalla leadership. Ben **${gapCount} valori chiave** dichiarati non trovano riscontro nei comportamenti osservati.`;
            risk = `**Rischi Strategici:** Questa dissonanza cognitiva genera cinismo nei dipendenti. Se l'azienda dichiara valori (es. "${cultureAnalysis.gapValues[0] || 'Innovazione'}") che i leader non agiscono, si rischia una crisi di credibilità interna e difficoltà nell'attrarre talenti affini alla cultura desiderata.`;
        } else {
            analysis = `Situazione critica: **Disallineamento Culturale Severo (${score}%)**. La cultura reale dell'azienda (quella agita dai decision maker) è quasi opposta a quella dichiarata istituzionalmente.`;
            risk = `**Rischi Strategici:** Crisi di identità aziendale. I dipendenti percepiscono i valori aziendali come "slogan vuoti". Questo porta a disimpegno morale, basso senso di appartenenza e altissimo rischio di turnover dei profili migliori che cercano coerenza etica.`;
        }

        return { analysis, risk, hasData: true };
    };

    const generateClimateInsight = () => {
        if (!climateStats) return null;

        const avg = climateStats.overallAverage;
        
        // Find ALL critical dimensions, not just the worst one
        const criticalDimensions = climateStats.globalAverages
            .filter(d => d.value < 3.0)
            .sort((a, b) => a.value - b.value); // Sort by lowest score

        let overview = "";
        let details: string[] = [];

        // 1. Strict Severity Thresholds
        if (avg >= 4.2) {
            overview = "Il clima organizzativo è **eccellente**, un vero vantaggio competitivo.";
        } else if (avg >= 4.0) {
            overview = "Il clima è **positivo**, con una buona tenuta generale.";
        } else if (avg >= 3.5) {
            overview = "Il clima è **discreto ma vulnerabile**. Siamo in una zona grigia: non c'è crisi aperta, ma mancano entusiasmo e spinta propulsiva.";
        } else {
            overview = "Il clima presenta **criticità strutturali severe**. Il benessere organizzativo è compromesso.";
        }

        // 2. Deep Dive into Critical Areas (< 3.0)
        if (criticalDimensions.length > 0) {
            details.push("È necessario intervenire con urgenza sulle seguenti aree critiche:");
            criticalDimensions.forEach(dim => {
                const specificRisk = CLIMATE_RISKS[dim.name] || "Rischio di inefficienza generale.";
                details.push(`- **${dim.name} (${dim.value.toFixed(2)}/5)**: ${specificRisk}`);
            });
        } else {
            // Check for mediocre areas (3.0 - 3.5) if no critical ones exist
            const mediocreDimensions = climateStats.globalAverages.filter(d => d.value >= 3.0 && d.value < 3.5);
            if (mediocreDimensions.length > 0) {
                details.push("Sebbene non ci siano aree rosse, alcune dimensioni mostrano segnali di affaticamento:");
                mediocreDimensions.forEach(dim => {
                    details.push(`- **${dim.name} (${dim.value.toFixed(2)})**: Da monitorare per evitare scivolamenti.`);
                });
            } else {
                details.push("Non si rilevano dimensioni in area di rischio, indice di una gestione equilibrata.");
            }
        }

        return { overview, details };
    };

    const climateInsight = generateClimateInsight();
    const cultureInsight = generateCultureInsight();

    const pieData = [
        { name: 'Fit Alto', value: leadershipStats.distribution.high, color: '#22c55e' },
        { name: 'Fit Medio', value: leadershipStats.distribution.medium, color: '#eab308' },
        { name: 'Fit Basso', value: leadershipStats.distribution.low, color: '#ef4444' },
    ].filter(d => d.value > 0);

    return (
        <div className="p-6 space-y-12 max-w-7xl mx-auto pb-20">
            {/* HEADER */}
            <div className="flex justify-between items-end">
                 <div>
                    <h1 className="text-3xl font-brand font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                        <Fingerprint className="text-purple-600" size={32}/> Identity Hub
                    </h1>
                    <p className="text-gray-600 mt-1">Analisi Profonda della Cultura Aziendale e del Benessere Organizzativo.</p>
                 </div>
                 <div className="flex gap-6 text-right">
                     <div>
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block">Culture Score</span>
                        <div className="text-3xl font-bold text-purple-600">{cultureAnalysis.matchScore}%</div>
                     </div>
                     {climateStats && (
                         <div>
                            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block">Climate Index</span>
                            <div className={`text-3xl font-bold ${
                                climateStats.overallAverage >= 4 ? 'text-green-500' :
                                climateStats.overallAverage >= 3.5 ? 'text-yellow-500' : 'text-red-500'
                            }`}>
                                {climateStats.overallAverage.toFixed(2)}/5
                            </div>
                         </div>
                     )}
                 </div>
            </div>

            {/* --- SECTION 1: CULTURAL ALIGNMENT --- */}
            <div>
                <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200 border-l-4 border-purple-500 pl-3 mb-6">1. Allineamento Valoriale</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* 1. DECLARED VALUES */}
                    <Card className="border-t-4 border-t-blue-500">
                        <h3 className="text-sm font-bold uppercase text-gray-500 mb-4 flex items-center gap-2"><FileSpreadsheet size={16}/> Cultura Dichiarata</h3>
                        <div className="flex flex-wrap gap-2">
                            {company.cultureValues?.map(v => (
                                <span key={v} className="px-3 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg text-sm font-bold border border-blue-100 dark:border-blue-800">
                                    {v}
                                </span>
                            )) || <span className="text-gray-400 italic">Nessun valore definito.</span>}
                        </div>
                        <p className="text-xs text-gray-500 mt-4">Valori definiti nel Profilo Aziendale.</p>
                    </Card>

                    {/* 2. EFFECTIVE VALUES (FROM LEADERS) */}
                    <Card className="border-t-4 border-t-green-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Database size={100}/></div>
                        <h3 className="text-sm font-bold uppercase text-gray-500 mb-4 flex items-center gap-2"><Users size={16}/> Cultura Agita (Dai Leader)</h3>
                        <div className="flex flex-wrap gap-2 relative z-10">
                            {cultureAnalysis.effectiveValues.map(v => {
                                const isAligned = cultureAnalysis.alignedValues.includes(v);
                                return (
                                    <span key={v} className={`px-3 py-1 rounded-lg text-sm font-bold border flex items-center gap-1 ${
                                        isAligned 
                                        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' 
                                        : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                                    }`}>
                                        {v} {isAligned && <CheckCircle size={12}/>}
                                    </span>
                                );
                            })}
                        </div>
                        <p className="text-xs text-gray-500 mt-4 relative z-10">Basato su {cultureAnalysis.driverCount} Cultural Drivers identificati nell'Org Chart.</p>
                    </Card>

                    {/* 3. HIDDEN RISKS (ENTROPY) */}
                    <Card className="border-t-4 border-t-red-500 bg-red-50/30 dark:bg-red-900/10">
                        <h3 className="text-sm font-bold uppercase text-red-800 dark:text-red-400 mb-4 flex items-center gap-2"><AlertTriangle size={16}/> Rischi Latenti (Entropia)</h3>
                        <ul className="space-y-2">
                            {cultureAnalysis.hiddenRisks.map(risk => (
                                <li key={risk} className="flex items-center gap-2 text-red-700 dark:text-red-300 font-medium text-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                    {risk}
                                </li>
                            ))}
                            {cultureAnalysis.hiddenRisks.length === 0 && <li className="text-gray-400 italic text-sm">Nessun rischio rilevante rilevato.</li>}
                        </ul>
                    </Card>
                </div>
            </div>

             {/* --- SECTION 2: ORGANIZATIONAL CLIMATE --- */}
             <div>
                <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200 border-l-4 border-orange-500 pl-3 mb-6">2. Analisi Clima Organizzativo (Benessere)</h2>
                
                {climateStats ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* GLOBAL CHART - HORIZONTAL LAYOUT */}
                        <Card className="min-h-[500px] flex flex-col">
                            <h3 className="text-sm font-bold uppercase text-gray-500 mb-2 flex items-center gap-2">
                                <BarChart3 size={16}/> Media Aziendale (Aggregata su {climateStats.respondentCount} dipendenti)
                            </h3>
                            <p className="text-xs text-gray-400 mb-6">Punteggio medio (1-5) per dimensione.</p>
                            
                            <div className="flex-1 w-full min-h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart 
                                        layout="vertical"
                                        data={climateStats.globalAverages} 
                                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                                        <XAxis type="number" domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} stroke="#9CA3AF" tick={{fontSize: 10}}/>
                                        <YAxis 
                                            dataKey="name" 
                                            type="category" 
                                            width={180}
                                            tick={{fontSize: 11, fontWeight: 600, fill: '#374151'}} 
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip 
                                            cursor={{fill: 'rgba(0,0,0,0.05)'}} 
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                            formatter={(value: number) => [value.toFixed(2), "Media"]}
                                        />
                                        <ReferenceLine x={3} stroke="#9CA3AF" strokeDasharray="3 3" />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                                            {climateStats.globalAverages.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={
                                                    entry.value >= 4 ? '#22c55e' : // Green
                                                    entry.value < 3 ? '#ef4444' : // Red
                                                    '#eab308' // Yellow
                                                } />
                                            ))}
                                            <LabelList dataKey="value" position="right" formatter={(val: number) => val.toFixed(2)} style={{ fontSize: '11px', fontWeight: 'bold', fill: '#6B7280' }} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* TEAM BREAKDOWN TABLE */}
                        <Card className="min-h-[500px] overflow-hidden flex flex-col">
                            <h3 className="text-sm font-bold uppercase text-gray-500 mb-6 flex items-center gap-2">
                                <ThermometerSun size={16}/> Dettaglio per Team / Dipartimento
                            </h3>
                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 uppercase text-xs font-bold">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Unità Organizzativa</th>
                                            <th className="px-4 py-3 text-center">Risposte</th>
                                            <th className="px-4 py-3 text-right">Media</th>
                                            <th className="px-4 py-3 text-center">Stato</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {teamStats.map(team => (
                                            <tr key={team.nodeId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="px-4 py-3">
                                                    <div className="font-bold text-gray-800 dark:text-gray-200">{team.nodeName}</div>
                                                    <div className="text-[10px] text-gray-400 uppercase">{team.type}</div>
                                                </td>
                                                <td className="px-4 py-3 text-center text-gray-500">
                                                    {team.respondentCount > 0 ? team.respondentCount : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono font-bold">
                                                    {team.score ? team.score.toFixed(2) : <span className="text-gray-300">N/A</span>}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {team.score ? (
                                                        <span className={`inline-block w-3 h-3 rounded-full ${
                                                            team.score >= 4 ? 'bg-green-500' :
                                                            team.score >= 3.5 ? 'bg-yellow-400' :
                                                            'bg-red-500'
                                                        }`}></span>
                                                    ) : (
                                                        <span className="inline-block w-3 h-3 rounded-full bg-gray-200"></span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-48 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                         <ThermometerSun size={40} className="text-gray-300 mb-2"/>
                         <p className="text-gray-400 font-medium">Nessun sondaggio sul clima completato in questa azienda.</p>
                    </div>
                )}
             </div>

             {/* --- SECTION 3: LEADERSHIP & MANAGEMENT (NEW) --- */}
             <div>
                <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200 border-l-4 border-green-600 pl-3 mb-6">3. Sintonia Leadership & Management</h2>
                
                {leadershipStats.totalPairsAnalyzed > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* 1. KEY METRICS */}
                        <Card className="flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-sm font-bold uppercase text-gray-500 flex items-center gap-2"><Handshake size={16}/> Indice Allineamento</h3>
                                {leadershipStats.globalAlignmentIndex >= 70 ? <Award className="text-green-500"/> : <ShieldAlert className="text-yellow-500"/>}
                            </div>
                            <div className="text-center py-6">
                                <span className={`text-6xl font-bold tracking-tight ${
                                    leadershipStats.globalAlignmentIndex >= 70 ? 'text-green-600' :
                                    leadershipStats.globalAlignmentIndex >= 40 ? 'text-yellow-600' :
                                    'text-red-600'
                                }`}>
                                    {leadershipStats.globalAlignmentIndex}%
                                </span>
                                <p className="text-sm text-gray-400 mt-2 font-medium">Compatibilità Media (Manager/Subordinato)</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center text-sm mb-1">
                                    <span className="text-gray-500">Tasso di Frizione</span>
                                    <span className="font-bold text-red-500">{leadershipStats.frictionRate}%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-red-500" style={{ width: `${leadershipStats.frictionRate}%` }}></div>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-2">Percentuale di coppie con compatibilità &lt; 40%</p>
                            </div>
                        </Card>

                        {/* 2. DISTRIBUTION CHART */}
                        <Card className="flex flex-col">
                            <h3 className="text-sm font-bold uppercase text-gray-500 mb-2 flex items-center gap-2"><TrendingUp size={16}/> Distribuzione Compatibilità</h3>
                            <div className="flex-1 min-h-[250px] relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '8px', border: 'none' }}
                                            formatter={(value: number) => [value, "Persone"]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-center">
                                        <span className="block text-2xl font-bold text-gray-700 dark:text-gray-200">{leadershipStats.totalPairsAnalyzed}</span>
                                        <span className="text-[10px] uppercase text-gray-400 font-bold">Relazioni</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-center gap-4 text-xs font-bold text-gray-500">
                                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Alta</div>
                                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Media</div>
                                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Bassa</div>
                            </div>
                        </Card>

                        {/* 3. TEAM ANALYSIS & INSIGHT */}
                        <Card className="flex flex-col">
                            <h3 className="text-sm font-bold uppercase text-gray-500 mb-4 flex items-center gap-2"><Lightbulb size={16}/> Analisi Team</h3>
                            <p className="text-[10px] text-gray-400 -mt-2 mb-3">Clicca su un team per vedere il dettaglio dei membri</p>
                            <div className="flex-1 overflow-y-auto max-h-[320px] space-y-2 pr-2 custom-scrollbar">
                                {leadershipStats.teamAlignment.map((team, idx) => (
                                    <Collapsible key={idx}>
                                        <CollapsibleTrigger className="w-full">
                                            <div className="flex justify-between items-center p-2 rounded bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group">
                                                <div className="flex items-center gap-2">
                                                    <ChevronRight size={14} className="text-gray-400 group-data-[state=open]:rotate-90 transition-transform" />
                                                    <div className="text-left">
                                                        <div className="font-bold text-xs text-gray-800 dark:text-gray-200">{team.teamName}</div>
                                                        <div className="text-[10px] text-gray-400">Mgr: {team.managerName}</div>
                                                    </div>
                                                </div>
                                                <div className={`px-2 py-1 rounded text-xs font-bold ${
                                                    team.status === 'High' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    team.status === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                    {Math.round(team.averageFit)}%
                                                </div>
                                            </div>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <div className="ml-4 pl-3 py-2 space-y-2 border-l-2 border-gray-200 dark:border-gray-600">
                                                {team.memberBreakdown.map((member: MemberBreakdown) => (
                                                    <div key={member.memberId} className="text-xs">
                                                        <div className="flex justify-between items-center font-medium text-gray-700 dark:text-gray-300">
                                                            <span className="flex items-center gap-1.5">
                                                                <UserIcon size={12} className={member.averageFit < 40 ? 'text-red-500' : member.averageFit >= 70 ? 'text-green-500' : 'text-yellow-500'} />
                                                                {member.memberName} 
                                                                <span className="text-gray-400 font-normal">({member.memberRole})</span>
                                                            </span>
                                                            <span className={`font-bold ${
                                                                member.averageFit >= 70 ? 'text-green-600' :
                                                                member.averageFit >= 40 ? 'text-yellow-600' :
                                                                'text-red-600'
                                                            }`}>
                                                                {member.averageFit}%
                                                            </span>
                                                        </div>
                                                        <div className="pl-4 mt-0.5 space-y-0.5">
                                                            {member.managerScores.map(ms => (
                                                                <div key={ms.managerId} className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
                                                                    <span>↳ {ms.managerName}</span>
                                                                    <span className={
                                                                        ms.score >= 70 ? 'text-green-600' :
                                                                        ms.score >= 40 ? 'text-yellow-600' :
                                                                        'text-red-600'
                                                                    }>{ms.score}%</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                                {team.memberBreakdown.length === 0 && (
                                                    <div className="text-[10px] text-gray-400 italic">Nessun membro con profilo completo</div>
                                                )}
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 italic">
                                {leadershipStats.globalAlignmentIndex < 50 
                                    ? "Attenzione: L'indice generale suggerisce potenziali colli di bottiglia decisionali dovuti a scarsa sintonia tra i livelli gerarchici."
                                    : "Buona fluidità decisionale. I team mostrano un solido allineamento con i rispettivi responsabili."
                                }
                            </div>
                        </Card>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-32 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <Handshake size={32} className="text-gray-300 mb-2"/>
                        <p className="text-gray-400 font-medium text-sm">Dati insufficienti per l'analisi della leadership.</p>
                    </div>
                )}
             </div>

            {/* GAP ANALYSIS & STRATEGIC SYNTHESIS FOOTER */}
            <Card className="mt-8 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
                <div className="p-2 mb-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Lightbulb className="text-amber-500" size={24}/> Sintesi Strategica & Suggerimenti
                    </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 p-2">
                     {/* COLUMN 1: CULTURE ANALYSIS */}
                     <div>
                         <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Analisi Culturale (Gap Analysis)</h4>
                         
                         <div className="space-y-4">
                             {cultureInsight.hasData && (
                                 <div>
                                     <span className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Valori "Persi" (Dichiarati ma non Agiti):</span>
                                     {cultureAnalysis.gapValues.length > 0 ? (
                                         <div className="flex flex-wrap gap-2">
                                             {cultureAnalysis.gapValues.map(v => (
                                                 <span key={v} className="px-3 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-sm line-through decoration-orange-400">
                                                     {v}
                                                 </span>
                                             ))}
                                         </div>
                                     ) : (
                                         <p className="text-green-600 text-sm flex items-center gap-2 font-medium"><CheckCircle size={16}/> Tutti i valori dichiarati sono presenti!</p>
                                     )}
                                 </div>
                             )}
                             
                             {cultureInsight.hasData ? (
                                 <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-lg border border-blue-100 dark:border-blue-800">
                                    <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed mb-3">
                                        {renderFormattedText(cultureInsight.analysis)}
                                    </p>
                                    <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed italic border-t border-blue-200 dark:border-blue-700 pt-3">
                                        {renderFormattedText(cultureInsight.risk)}
                                    </p>
                                 </div>
                             ) : (
                                 <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-lg border border-amber-200 dark:border-amber-800">
                                    <div className="flex items-start gap-3">
                                        <Info className="text-amber-500 shrink-0 mt-0.5" size={20}/>
                                        <div>
                                            <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed mb-2">
                                                {renderFormattedText(cultureInsight.analysis)}
                                            </p>
                                            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed italic">
                                                {renderFormattedText(cultureInsight.risk)}
                                            </p>
                                        </div>
                                    </div>
                                 </div>
                             )}
                         </div>
                     </div>

                     {/* COLUMN 2: CLIMATE & RISKS */}
                     <div className="border-l border-gray-100 dark:border-gray-700 pl-0 md:pl-12">
                         <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Analisi Clima & Azioni Consigliate</h4>
                         
                         {climateInsight ? (
                             <div className="space-y-4">
                                 <div className="flex items-start gap-3">
                                     <ThermometerSun className={`shrink-0 mt-1 ${climateStats?.overallAverage && climateStats.overallAverage < 3.5 ? 'text-red-500' : 'text-green-500'}`} size={24}/>
                                     <div className="space-y-3">
                                         <div className="text-sm text-gray-800 dark:text-gray-100 leading-relaxed font-medium">
                                             {renderFormattedText(climateInsight.overview)}
                                         </div>
                                         <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed space-y-2">
                                             {climateInsight.details.map((detail, idx) => (
                                                 <p key={idx} className="pl-2 border-l-2 border-gray-200 dark:border-gray-600">
                                                     {renderFormattedText(detail)}
                                                 </p>
                                             ))}
                                         </div>
                                     </div>
                                 </div>
                                 
                                 {/* Entropy Correlation Warning */}
                                 {cultureAnalysis.hiddenRisks.length > 0 && climateStats && climateStats.overallAverage < 3.8 && (
                                     <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-lg border border-amber-100 dark:border-amber-800 mt-4">
                                         <p className="text-xs text-amber-800 dark:text-amber-200 font-bold mb-2 flex items-center gap-1"><AlertTriangle size={14}/> Correlazione Rischio Culturale</p>
                                         <p className="text-sm text-amber-900 dark:text-amber-100">
                                             La presenza di entropia culturale (es. "{cultureAnalysis.hiddenRisks[0]}") è probabilmente la causa radice delle performance negative in area climatica. L'intervento deve partire dalla leadership.
                                         </p>
                                     </div>
                                 )}
                             </div>
                         ) : (
                             <p className="text-gray-400 italic text-sm">In attesa di dati sul clima per generare suggerimenti.</p>
                         )}
                     </div>
                </div>
            </Card>
        </div>
    );
};