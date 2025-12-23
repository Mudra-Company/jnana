import React, { useState, useMemo, forwardRef } from 'react';
import { 
  X, 
  Crown, 
  Target, 
  Plus, 
  Edit2, 
  Users, 
  Fingerprint, 
  UserPlus,
  ThermometerSun,
  Handshake,
  Building,
  BarChart3,
  AlertTriangle,
  Search
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { OrgNode, CompanyProfile, User, RequiredProfile, SeniorityLevel } from '../../types';
import { SOFT_SKILLS_OPTIONS } from '../../constants';
import { calculateUserCompatibility } from '../../services/riasecService';

const SENIORITY_OPTIONS: SeniorityLevel[] = ['Junior', 'Mid', 'Senior', 'Lead', 'C-Level'];

// --- SUB-COMPONENTS ---

// --- Helper to compute team skill aggregations ---
interface TeamSkillStats {
    hardSkillCounts: Record<string, number>;
    softSkillCounts: Record<string, number>;
    seniorityCounts: Record<string, number>;
    membersWithProfile: number;
    membersWithoutProfile: number;
    gaps: { skill: string; type: 'hard' | 'soft'; membersMissing: number }[];
}

const computeTeamSkillStats = (nodeUsers: User[]): TeamSkillStats => {
    const hardSkillCounts: Record<string, number> = {};
    const softSkillCounts: Record<string, number> = {};
    const seniorityCounts: Record<string, number> = {};
    let membersWithProfile = 0;
    let membersWithoutProfile = 0;
    const gaps: { skill: string; type: 'hard' | 'soft'; membersMissing: number }[] = [];

    nodeUsers.forEach(user => {
        const profile = user.requiredProfile;
        if (profile && (profile.hardSkills?.length || profile.softSkills?.length)) {
            membersWithProfile++;
            profile.hardSkills?.forEach(skill => {
                hardSkillCounts[skill] = (hardSkillCounts[skill] || 0) + 1;
            });
            profile.softSkills?.forEach(skill => {
                softSkillCounts[skill] = (softSkillCounts[skill] || 0) + 1;
            });
            if (profile.seniority) {
                seniorityCounts[profile.seniority] = (seniorityCounts[profile.seniority] || 0) + 1;
            }
        } else {
            membersWithoutProfile++;
        }
    });

    // Gap Analysis: check if members have the skills their profile requires
    nodeUsers.forEach(user => {
        const profile = user.requiredProfile;
        if (!profile) return;
        
        // Check hard skills - compare with user's karma soft skills (simplified check)
        const userSoftSkills = user.karmaData?.softSkills || [];
        profile.softSkills?.forEach(requiredSkill => {
            if (!userSoftSkills.some(s => s.toLowerCase().includes(requiredSkill.toLowerCase()))) {
                const existing = gaps.find(g => g.skill === requiredSkill && g.type === 'soft');
                if (existing) existing.membersMissing++;
                else gaps.push({ skill: requiredSkill, type: 'soft', membersMissing: 1 });
            }
        });
    });

    return { hardSkillCounts, softSkillCounts, seniorityCounts, membersWithProfile, membersWithoutProfile, gaps };
};

const NodeEditorModal: React.FC<{ 
    node: OrgNode;
    nodeUsers: User[];
    onSave: (node: OrgNode) => void; 
    onDelete: (id: string) => void;
    onClose: () => void; 
}> = ({ node, nodeUsers, onSave, onDelete, onClose }) => {
    const [formData, setFormData] = useState(node);
    
    const teamStats = useMemo(() => computeTeamSkillStats(nodeUsers), [nodeUsers]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const sortedHardSkills = Object.entries(teamStats.hardSkillCounts)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 5);
    
    const sortedSoftSkills = Object.entries(teamStats.softSkillCounts)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 5);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold dark:text-gray-100">Modifica Nodo</h3>
                    <button onClick={onClose}><X className="text-gray-400 hover:text-red-500" /></button>
                </div>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Nome Reparto/Team</label>
                        <input 
                            required 
                            className="w-full p-3 border rounded-xl bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                        />
                    </div>
                    
                    <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
                        <input 
                            type="checkbox" 
                            id="isCulturalDriver"
                            checked={formData.isCulturalDriver || false}
                            onChange={e => setFormData({...formData, isCulturalDriver: e.target.checked})}
                            className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                        />
                        <label htmlFor="isCulturalDriver" className="text-sm font-bold text-amber-800 dark:text-amber-200 cursor-pointer select-none flex items-center gap-2">
                            <Crown size={16}/> Cultural Driver (Nodo Strategico)
                        </label>
                    </div>

                    {/* TEAM STATISTICS SECTION */}
                    <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-4">
                        <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <BarChart3 size={16}/> Analisi Skills del Team ({nodeUsers.length} membri)
                        </h4>
                        
                        {nodeUsers.length === 0 ? (
                            <div className="text-center py-6 text-gray-400 text-sm italic">
                                Nessun membro assegnato a questo nodo
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Hard Skills */}
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Hard Skills Più Richieste</label>
                                    {sortedHardSkills.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {sortedHardSkills.map(([skill, count]) => (
                                                <span key={skill} className="px-2 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded text-xs border border-blue-100 dark:border-blue-800">
                                                    {skill} <span className="font-bold">({count})</span>
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">Nessuna hard skill definita</span>
                                    )}
                                </div>

                                {/* Soft Skills */}
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Soft Skills Più Richieste</label>
                                    {sortedSoftSkills.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {sortedSoftSkills.map(([skill, count]) => (
                                                <span key={skill} className="px-2 py-1 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded text-xs border border-purple-100 dark:border-purple-800">
                                                    {skill} <span className="font-bold">({count})</span>
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">Nessuna soft skill definita</span>
                                    )}
                                </div>

                                {/* Gap Analysis */}
                                {(teamStats.gaps.length > 0 || teamStats.membersWithoutProfile > 0) && (
                                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800">
                                        <label className="block text-xs font-bold uppercase text-orange-600 dark:text-orange-400 mb-2 flex items-center gap-1">
                                            <AlertTriangle size={12}/> Gap Analysis
                                        </label>
                                        <div className="space-y-1 text-xs text-orange-700 dark:text-orange-300">
                                            {teamStats.membersWithoutProfile > 0 && (
                                                <div>⚠️ {teamStats.membersWithoutProfile} membri senza profilo skill definito</div>
                                            )}
                                            {teamStats.gaps.slice(0, 3).map((gap, i) => (
                                                <div key={i}>⚠️ {gap.membersMissing} membri non hanno "{gap.skill}"</div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Seniority Distribution */}
                                {Object.keys(teamStats.seniorityCounts).length > 0 && (
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Distribuzione Seniority</label>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(teamStats.seniorityCounts).map(([level, count]) => (
                                                <span key={level} className="px-2 py-1 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded text-xs border border-gray-200 dark:border-gray-600">
                                                    {level}: <span className="font-bold">{count}</span>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700 mt-4">
                        <Button type="button" variant="ghost" onClick={() => onDelete(formData.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 mr-auto">Elimina Nodo</Button>
                        <Button type="button" variant="ghost" onClick={onClose}>Annulla</Button>
                        <Button type="submit">Salva</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

// Helper function to find the leader within a list of users
const findNodeManager = (nodeUsers: User[], node: OrgNode): User | undefined => {
    return nodeUsers.find(u => 
        u.jobTitle?.toLowerCase().includes('head') || 
        u.jobTitle?.toLowerCase().includes('manager') || 
        u.jobTitle?.toLowerCase().includes('lead') || 
        u.jobTitle?.toLowerCase().includes('director') ||
        u.jobTitle?.toLowerCase().includes('ceo') ||
        u.jobTitle?.toLowerCase().includes('ad')
    ) || nodeUsers.find(u => node.isCulturalDriver) || nodeUsers[0];
};

interface OrgNodeViewProps {
    node: OrgNode; 
    depth?: number; 
    users: User[]; 
    onAddNode: (parentId: string, type: 'department' | 'team') => void; 
    onEditNode: (node: OrgNode) => void;
    onInviteUser: (nodeId: string) => void;
    onViewUser: (userId: string) => void;
    companyValues?: string[];
    isFirst?: boolean;
    isLast?: boolean;
    hasSiblings?: boolean;
    parentManager?: User;
}

const OrgNodeView = forwardRef<HTMLDivElement, OrgNodeViewProps>(
  ({ node, depth = 0, users, onAddNode, onEditNode, onInviteUser, onViewUser, companyValues, isFirst, isLast, hasSiblings, parentManager }, ref) => {
  const [collapsed, setCollapsed] = useState(false);
  
  // 1. Find users BELONGING to this node
  const nodeUsers = users.filter(u => u.departmentId === node.id);
  
  // 2. Determine who is the "Leader" of THIS node (to pass down to children)
  // Even if they are just a member here, they might be the boss of the sub-teams.
  const currentNodeManager = findNodeManager(nodeUsers, node);

  // 3. Calculate Node Climate Average
  const nodeClimateScore = useMemo(() => {
      const usersWithClimate = nodeUsers.filter(u => u.climateData);
      if (usersWithClimate.length === 0) return null;
      const totalAvg = usersWithClimate.reduce((sum, u) => sum + (u.climateData?.overallAverage || 0), 0);
      return totalAvg / usersWithClimate.length;
  }, [nodeUsers]);

  const getScoreColor = (score: number) => {
      if (score >= 4) return 'bg-green-100 text-green-700 border-green-200';
      if (score >= 3) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      return 'bg-red-100 text-red-700 border-red-200';
  };

  return (
    <div className="flex flex-col items-center px-4">
      
      {/* 1. UPPER CONNECTORS (CONNECT TO PARENT) */}
      {depth > 0 && (
          <div className="h-8 w-full relative">
              {/* Vertical line connecting up to the bus */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-0 h-full w-0.5 bg-gray-300 dark:bg-gray-600"></div>
              
              {/* Horizontal Bus Line Segments */}
              {hasSiblings && (
                  <>
                      {/* Left Half: Visible unless First child */}
                      {!isFirst && <div className="absolute top-0 left-0 w-1/2 h-0.5 bg-gray-300 dark:bg-gray-600"></div>}
                      {/* Right Half: Visible unless Last child */}
                      {!isLast && <div className="absolute top-0 right-0 w-1/2 h-0.5 bg-gray-300 dark:bg-gray-600"></div>}
                  </>
              )}
          </div>
      )}

      {/* 2. THE NODE CARD */}
      <Card 
        className={`relative min-w-[300px] max-w-[340px] border-t-4 flex flex-col transition-all group z-10 ${
            node.type === 'root' ? 'border-t-purple-600 bg-purple-50/50 dark:bg-purple-900/20' : 
            node.type === 'department' ? 'border-t-blue-500 bg-white dark:bg-gray-800' : 
            'border-t-green-500 bg-white dark:bg-gray-800'
        }`}
        padding="sm"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
            <div className="flex-1 pr-2">
                <h4 className="font-bold text-gray-800 dark:text-gray-100 text-lg leading-tight truncate" title={node.name}>{node.name}</h4>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{node.type}</span>
                    {nodeClimateScore !== null && (
                        <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${getScoreColor(nodeClimateScore)}`}>
                            <ThermometerSun size={10} />
                            Clima: {nodeClimateScore.toFixed(1)}/5
                        </div>
                    )}
                    {(() => {
                        const hiringCount = nodeUsers.filter(u => u.isHiring).length;
                        return hiringCount > 0 && (
                            <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                                <Search size={10}/> {hiringCount} {hiringCount === 1 ? 'posizione aperta' : 'posizioni aperte'}
                            </span>
                        );
                    })()}
                </div>
            </div>
            <div className="flex gap-0.5 shrink-0">
                 <button onClick={() => onInviteUser(node.id)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-blue-600 transition-colors" title="Aggiungi/Invita Persona"><UserPlus size={14}/></button>
                 <button onClick={() => onEditNode(node)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-indigo-600 transition-colors"><Edit2 size={14}/></button>
                 <button onClick={() => onAddNode(node.id, node.type === 'root' ? 'department' : 'team')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-green-600 transition-colors"><Plus size={14}/></button>
            </div>
        </div>

        {/* User List with Enhanced Metrics */}
        <div className="space-y-2 mt-1 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
            {nodeUsers.length > 0 ? (
                nodeUsers.map(u => {
                    // CALCULATE METRICS PER USER
                    
                    // 1. Cultural Fit (Company Values)
                    let cultureFitScore = 0;
                    if (companyValues && companyValues.length > 0 && u.karmaData?.primaryValues) {
                        const matches = u.karmaData.primaryValues.filter(pv => 
                            companyValues.some(cv => cv.toLowerCase().includes(pv.toLowerCase()) || pv.toLowerCase().includes(cv.toLowerCase()))
                        ).length;
                        cultureFitScore = Math.round((matches / Math.max(u.karmaData.primaryValues.length, 1)) * 100);
                        if (cultureFitScore > 100) cultureFitScore = 100;
                    }

                    // 2. Manager Fit (Compatibility with PARENT NODE Manager)
                    // If this is the Root Node, there is no parent manager, so null.
                    const managerFitScore = parentManager ? calculateUserCompatibility(u, parentManager) : null;
                    const isInternalLeader = currentNodeManager?.id === u.id; // Check if this user is the leader of the current node

                    return (
                        <div 
                            key={u.id} 
                            onClick={() => onViewUser(u.id)}
                            className={`flex flex-col p-2 bg-gray-50 hover:bg-white hover:shadow-md dark:bg-gray-700/50 dark:hover:bg-gray-700/80 rounded-lg transition-all border group/user cursor-pointer relative ${
                                u.isHiring 
                                    ? 'border-dashed border-green-400 dark:border-green-600 bg-green-50/50 dark:bg-green-900/20' 
                                    : 'border-transparent hover:border-gray-200 dark:hover:border-gray-600'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-sm ${
                                        u.isHiring ? 'bg-green-500' :
                                        node.isCulturalDriver && isInternalLeader ? 'bg-amber-500 ring-2 ring-amber-200' : 'bg-jnana-sage'
                                    }`}>
                                        {u.isHiring ? <Search size={12}/> : `${u.firstName[0] || '?'}${u.lastName[0] || ''}`}
                                    </div>
                                    <div className="truncate">
                                        <div className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate group-hover/user:text-indigo-600 transition-colors flex items-center gap-1">
                                            {u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : <span className="text-gray-400 italic">Da assegnare</span>}
                                            {u.isHiring && (
                                                <span className="text-[9px] bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200 px-1.5 py-0.5 rounded-full font-bold ml-1">
                                                    HIRING
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[9px] text-gray-500 truncate">{u.jobTitle}</div>
                                    </div>
                                </div>
                                {u.profileCode && !u.isHiring && (
                                    <span className="text-[9px] font-mono font-bold bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 text-gray-500 shrink-0">
                                        {u.profileCode}
                                    </span>
                                )}
                            </div>

                            {/* Compatibility Indicators */}
                            <div className="flex items-center gap-2 mt-1 pt-1 border-t border-gray-200/50 dark:border-gray-600/50">
                                {/* Cultural Fit */}
                                <div className="flex items-center gap-1 text-[9px] text-gray-500" title="Fit Culturale (Azienda)">
                                    <Building size={10} className={cultureFitScore > 60 ? "text-blue-500" : "text-gray-400"} />
                                    <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${cultureFitScore > 70 ? 'bg-blue-500' : cultureFitScore > 40 ? 'bg-blue-300' : 'bg-red-300'}`} 
                                            style={{width: `${cultureFitScore}%`}}
                                        ></div>
                                    </div>
                                </div>

                                {/* Manager Fit (Vs Parent Node Manager) */}
                                {parentManager && managerFitScore !== null && (
                                    <div className="flex items-center gap-1 text-[9px] text-gray-500 ml-auto" title={`Compatibilità con ${parentManager.firstName} ${parentManager.lastName} (${parentManager.jobTitle})`}>
                                        <Handshake size={10} className={managerFitScore > 60 ? "text-green-500" : "text-gray-400"} />
                                        <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${managerFitScore > 70 ? 'bg-green-500' : managerFitScore > 40 ? 'bg-yellow-400' : 'bg-red-400'}`} 
                                                style={{width: `${managerFitScore}%`}}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                                {isInternalLeader && node.isCulturalDriver && (
                                    <span className="ml-auto text-[9px] font-bold text-amber-600 flex items-center gap-1" title="Leader / Driver Culturale"><Crown size={10}/> LEADER</span>
                                )}
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="text-center py-4 text-xs text-gray-400 italic bg-gray-50/50 dark:bg-gray-800/30 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                    Nessun dipendente assegnato
                </div>
            )}
        </div>
      </Card>

      {/* 3. LOWER CONNECTOR (TO CHILDREN) */}
      {node.children.length > 0 && !collapsed && (
           <div className="h-8 w-0.5 bg-gray-300 dark:bg-gray-600"></div>
      )}

      {/* 4. CHILDREN CONTAINER */}
      {node.children.length > 0 && !collapsed && (
         <div className="flex justify-center">
             {node.children.map((child, index) => (
                 <OrgNodeView 
                    key={child.id} 
                    node={child} 
                    depth={depth + 1} 
                    users={users} 
                    onAddNode={onAddNode} 
                    onEditNode={onEditNode} 
                    onInviteUser={onInviteUser}
                    onViewUser={onViewUser}
                    companyValues={companyValues}
                    // Tree Logic props
                    isFirst={index === 0}
                    isLast={index === node.children.length - 1}
                    hasSiblings={node.children.length > 1}
                    // IMPORTANT: Pass the CURRENT node's manager as the "Parent Manager" for the children
                    parentManager={currentNodeManager}
                />
             ))}
         </div>
      )}
    </div>
  );
});

OrgNodeView.displayName = 'OrgNodeView';

// --- MAIN COMPONENT ---

export const CompanyOrgView: React.FC<{ 
    company: CompanyProfile; 
    users: User[]; 
    onUpdateStructure: (root: OrgNode) => void;
    onUpdateUsers: (users: User[]) => void;
    onViewUser: (userId: string) => void;
}> = ({ company, users, onUpdateStructure, onUpdateUsers, onViewUser }) => {
    const [editingNode, setEditingNode] = useState<OrgNode | null>(null);
    const [inviteNodeId, setInviteNodeId] = useState<string | null>(null);
    const [inviteName, setInviteName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('');
    
    // Required Profile state for new member
    const [inviteHardSkills, setInviteHardSkills] = useState<string[]>([]);
    const [inviteSoftSkills, setInviteSoftSkills] = useState<string[]>([]);
    const [inviteSeniority, setInviteSeniority] = useState<SeniorityLevel>('Mid');
    const [newHardSkill, setNewHardSkill] = useState('');
    const [newSoftSkill, setNewSoftSkill] = useState('');
    const [isHiring, setIsHiring] = useState(false);

    const handleInviteUser = () => {
        // Job Title is the ONLY required field
        if (!inviteRole || !inviteNodeId) {
            return;
        }
        const newUser: User = {
            id: `u_${Date.now()}`,
            firstName: inviteName ? inviteName.split(' ')[0] : '',
            lastName: inviteName ? inviteName.split(' ').slice(1).join(' ') : '',
            email: inviteEmail || '',
            companyId: company.id,
            status: isHiring ? 'pending' : (inviteEmail ? 'invited' : 'pending'),
            jobTitle: inviteRole,
            departmentId: inviteNodeId,
            isHiring: isHiring,
            requiredProfile: {
                hardSkills: inviteHardSkills,
                softSkills: inviteSoftSkills,
                seniority: inviteSeniority
            }
        };
        const updatedUsers = [...users, newUser];
        onUpdateUsers(updatedUsers);
        // Reset form
        setInviteNodeId(null);
        setInviteName('');
        setInviteEmail('');
        setInviteRole('');
        setInviteHardSkills([]);
        setInviteSoftSkills([]);
        setInviteSeniority('Mid');
        setNewHardSkill('');
        setNewSoftSkill('');
        setIsHiring(false);
    };
    
    const addInviteHardSkill = () => {
        if (newHardSkill && !inviteHardSkills.includes(newHardSkill)) {
            setInviteHardSkills([...inviteHardSkills, newHardSkill]);
            setNewHardSkill('');
        }
    };
    
    const addInviteSoftSkill = () => {
        if (newSoftSkill && !inviteSoftSkills.includes(newSoftSkill)) {
            setInviteSoftSkills([...inviteSoftSkills, newSoftSkill]);
            setNewSoftSkill('');
        }
    };

    // Recursively find and add child
    const addNodeRecursive = (parent: OrgNode, parentId: string, newNode: OrgNode): OrgNode => {
        if (parent.id === parentId) {
            return { ...parent, children: [...parent.children, newNode] };
        }
        return { ...parent, children: parent.children.map(child => addNodeRecursive(child, parentId, newNode)) };
    };

    const handleAddNode = (parentId: string, type: 'department' | 'team') => {
        const newNode: OrgNode = {
            id: `n_${Date.now()}`,
            name: type === 'department' ? 'Nuovo Dipartimento' : 'Nuovo Team',
            type: type,
            children: [],
            targetProfile: { hardSkills: [], softSkills: [], seniority: 'Mid' }
        };
        const newRoot = addNodeRecursive(company.structure, parentId, newNode);
        onUpdateStructure(newRoot);
    };

    // Recursively find and update node
    const updateNodeRecursive = (root: OrgNode, updatedNode: OrgNode): OrgNode => {
        if (root.id === updatedNode.id) return updatedNode;
        return { ...root, children: root.children.map(child => updateNodeRecursive(child, updatedNode)) };
    };

    const handleSaveNode = (node: OrgNode) => {
        const newRoot = updateNodeRecursive(company.structure, node);
        onUpdateStructure(newRoot);
        setEditingNode(null);
    };

    // Recursively delete
    const deleteNodeRecursive = (root: OrgNode, idToDelete: string): OrgNode | null => {
        if (root.id === idToDelete) return null; 
        return { 
            ...root, 
            children: root.children
                .map(child => deleteNodeRecursive(child, idToDelete))
                .filter(child => child !== null) as OrgNode[]
        };
    };

    const handleDeleteNode = (id: string) => {
        if (id === company.structure.id) {
            alert("Non puoi eliminare la radice.");
            return;
        }
        if (confirm("Eliminare questo nodo e tutti i suoi figli?")) {
            const newRoot = deleteNodeRecursive(company.structure, id);
            if(newRoot) onUpdateStructure(newRoot);
            setEditingNode(null);
        }
    };

    return (
        <div className="p-8 max-w-full overflow-x-auto min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
            {inviteNodeId && (
                <div className="fixed inset-0 bg-black/50 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
                    <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold dark:text-gray-100">Aggiungi Ruolo/Persona al Nodo</h3>
                            <button onClick={() => setInviteNodeId(null)}><X className="text-gray-400 hover:text-red-500" /></button>
                        </div>
                        <div className="space-y-4">
                            {/* Basic Info - Job Title is REQUIRED, others optional */}
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                                        Ruolo/Job Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        required
                                        className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="Es. Marketing Manager, Senior Developer..."
                                        value={inviteRole}
                                        onChange={e => setInviteRole(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                                        Nome e Cognome <span className="text-gray-400 text-[10px]">(opzionale)</span>
                                    </label>
                                    <input
                                        className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="Se conosci già chi occuperà questo ruolo"
                                        value={inviteName}
                                        onChange={e => setInviteName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                                        Email Aziendale <span className="text-gray-400 text-[10px]">(opzionale)</span>
                                    </label>
                                    <input
                                        className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="Per inviare l'invito ai test"
                                        value={inviteEmail}
                                        onChange={e => setInviteEmail(e.target.value)}
                                    />
                                </div>
                                
                                {/* Hiring Checkbox */}
                                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                                    <input 
                                        type="checkbox" 
                                        id="isHiring"
                                        checked={isHiring}
                                        onChange={e => setIsHiring(e.target.checked)}
                                        className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                                    />
                                    <label htmlFor="isHiring" className="text-sm font-bold text-green-800 dark:text-green-200 cursor-pointer select-none flex items-center gap-2">
                                        <Search size={16}/> Posizione in Hiring (aperta)
                                    </label>
                                </div>
                            </div>

                            {/* Required Profile Section */}
                            <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                                <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                    <Target size={16}/> Profilo Richiesto per questo Ruolo
                                </h4>
                                
                                {/* Seniority */}
                                <div className="mb-4">
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Seniority</label>
                                    <select
                                        className="w-full p-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={inviteSeniority}
                                        onChange={e => setInviteSeniority(e.target.value as SeniorityLevel)}
                                    >
                                        {SENIORITY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>

                                {/* Hard Skills */}
                                <div className="mb-4">
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Hard Skills Richieste</label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            className="flex-1 p-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            placeholder="Es. Python, Excel, SQL..."
                                            value={newHardSkill}
                                            onChange={e => setNewHardSkill(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addInviteHardSkill())}
                                        />
                                        <button type="button" onClick={addInviteHardSkill} className="px-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                                            <Plus size={16}/>
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {inviteHardSkills.map(skill => (
                                            <span key={skill} className="px-2 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded text-xs border border-blue-100 dark:border-blue-800 flex items-center gap-1">
                                                {skill}
                                                <button type="button" onClick={() => setInviteHardSkills(inviteHardSkills.filter(s => s !== skill))}>
                                                    <X size={12}/>
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Soft Skills */}
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Soft Skills Richieste</label>
                                    <div className="flex gap-2 mb-2">
                                        <select
                                            className="flex-1 p-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            value={newSoftSkill}
                                            onChange={e => setNewSoftSkill(e.target.value)}
                                        >
                                            <option value="">Seleziona skill...</option>
                                            {SOFT_SKILLS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        <button type="button" onClick={addInviteSoftSkill} className="px-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                                            <Plus size={16}/>
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {inviteSoftSkills.map(skill => (
                                            <span key={skill} className="px-2 py-1 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded text-xs border border-purple-100 dark:border-purple-800 flex items-center gap-1">
                                                {skill}
                                                <button type="button" onClick={() => setInviteSoftSkills(inviteSoftSkills.filter(s => s !== skill))}>
                                                    <X size={12}/>
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <Button fullWidth onClick={handleInviteUser}>Conferma</Button>
                                <Button variant="ghost" onClick={() => setInviteNodeId(null)}>Annulla</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            <div className="mb-8 text-center">
                 <h2 className="text-3xl font-brand font-bold dark:text-gray-100">Organigramma Aziendale</h2>
                 <p className="text-gray-500">Struttura gerarchica e funzionale di {company.name}</p>
                 <div className="flex justify-center gap-6 mt-4 text-xs font-bold text-gray-500">
                     <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Clima Critico (&lt;3)</div>
                     <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-400"></div> Clima Neutro (3-4)</div>
                     <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Clima Ottimo (&gt;4)</div>
                     <div className="w-px h-4 bg-gray-300 mx-2"></div>
                     <div className="flex items-center gap-1 text-blue-500"><Building size={12}/> Fit Culturale</div>
                     <div className="flex items-center gap-1 text-green-600"><Handshake size={12}/> Fit Manager (Liv. Superiore)</div>
                 </div>
            </div>
            <div className="w-fit min-w-full flex justify-center pb-20">
                <OrgNodeView 
                    node={company.structure} 
                    users={users} 
                    onAddNode={handleAddNode} 
                    onEditNode={setEditingNode} 
                    onInviteUser={(nodeId) => setInviteNodeId(nodeId)}
                    onViewUser={onViewUser}
                    companyValues={company.cultureValues}
                    parentManager={undefined} // Root node has no parent manager
                />
            </div>
            {editingNode && (
                <NodeEditorModal 
                    node={editingNode}
                    nodeUsers={users.filter(u => u.departmentId === editingNode.id)}
                    onSave={handleSaveNode} 
                    onDelete={handleDeleteNode}
                    onClose={() => setEditingNode(null)} 
                />
            )}
        </div>
    );
};