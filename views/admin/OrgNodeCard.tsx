import React, { useMemo } from 'react';
import { 
  Crown, 
  Plus, 
  Edit2, 
  UserPlus,
  ThermometerSun,
  Handshake,
  Building,
  Search
} from 'lucide-react';
import { Card } from '../../components/Card';
import { OrgNode, User } from '../../types';
import { calculateUserCompatibility } from '../../services/riasecService';

interface OrgNodeCardProps {
  node: OrgNode;
  users: User[];
  onAddNode: (parentId: string, type: 'department' | 'team') => void;
  onEditNode: (node: OrgNode) => void;
  onInviteUser: (nodeId: string) => void;
  onSelectUserForComparison: (user: User) => void;
  companyValues?: string[];
  parentManager?: User;
}

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

export const OrgNodeCard: React.FC<OrgNodeCardProps> = ({
  node,
  users,
  onAddNode,
  onEditNode,
  onInviteUser,
  onSelectUserForComparison,
  companyValues,
  parentManager
}) => {
  // Find users BELONGING to this node
  const nodeUsers = users.filter(u => u.departmentId === node.id);
  
  // Determine who is the "Leader" of THIS node
  const currentNodeManager = findNodeManager(nodeUsers, node);

  // Calculate Node Climate Average
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
    <Card 
      className={`relative min-w-[300px] max-w-[340px] border-t-4 flex flex-col transition-all group ${
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
            const managerFitScore = parentManager ? calculateUserCompatibility(u, parentManager) : null;
            const isInternalLeader = currentNodeManager?.id === u.id;

            return (
              <div 
                key={u.id} 
                onClick={() => onSelectUserForComparison(u)}
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
                      {u.isHiring ? <Search size={12}/> : `${u.firstName?.[0] || '?'}${u.lastName?.[0] || ''}`}
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
  );
};

// Export the helper function for use in parent components
export { findNodeManager };
