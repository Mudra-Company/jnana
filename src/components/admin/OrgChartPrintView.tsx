import React, { useEffect, useMemo } from 'react';
import { Tree, TreeNode } from 'react-organizational-chart';
import type { CompanyProfile, User, OrgNode } from '../../../types';
import type { OrgChartExportOptions } from '../../types/orgChartExport';
import { calculateUserCompatibility } from '../../../services/riasecService';

// Extended OrgNode with parentNodeId for internal tree flattening
interface FlatOrgNode extends OrgNode {
  parentNodeId?: string;
}

interface OrgChartPrintViewProps {
  company: CompanyProfile;
  users: User[];
  options: OrgChartExportOptions;
  onRenderComplete?: () => void;
}

// Unicode symbols to replace Lucide icons (html2canvas compatible)
const ICONS = {
  thermometer: '◉',
  alert: '△',
  search: '◎',
  crown: '★',
  building: '▣',
  handshake: '⇄',
  hiring: '⊕',
};

// Color scheme for consistent styling
const COLORS = {
  root: { border: '#9333ea', bg: 'linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)', badge: '#9333ea' },
  department: { border: '#3b82f6', bg: '#ffffff', badge: '#3b82f6' },
  team: { border: '#22c55e', bg: '#ffffff', badge: '#22c55e' },
  hiring: '#10b981',
  avatar: '#6366f1',
  leaderAvatar: '#f59e0b',
};

// Shared inline styles for PDF rendering
const cardStyle = (nodeType: string): React.CSSProperties => ({
  borderRadius: '12px',
  borderLeft: `4px solid ${nodeType === 'root' ? COLORS.root.border : nodeType === 'department' ? COLORS.department.border : COLORS.team.border}`,
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  background: nodeType === 'root' ? COLORS.root.bg : '#ffffff',
  backgroundColor: '#ffffff',
  padding: '16px',
  minWidth: '280px',
  maxWidth: '380px',
  display: 'inline-block',
  textAlign: 'left' as const,
  fontFamily: 'Arial, Helvetica, sans-serif',
  color: '#1f2937',
});

const typeBadgeStyle = (nodeType: string): React.CSSProperties => ({
  fontSize: '10px',
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  padding: '2px 8px',
  borderRadius: '4px',
  backgroundColor: nodeType === 'root' ? COLORS.root.badge : nodeType === 'department' ? COLORS.department.badge : COLORS.team.badge,
  color: '#ffffff',
  display: 'inline-block',
  marginRight: '6px',
  fontFamily: 'Arial, Helvetica, sans-serif',
});

const metricBadgeStyle = (color: 'green' | 'yellow' | 'red' | 'emerald'): React.CSSProperties => {
  const colors = {
    green: { bg: '#dcfce7', border: '#86efac', text: '#15803d' },
    yellow: { bg: '#fef9c3', border: '#fde047', text: '#a16207' },
    red: { bg: '#fee2e2', border: '#fca5a5', text: '#b91c1c' },
    emerald: { bg: '#d1fae5', border: '#6ee7b7', text: '#047857' },
  };
  const c = colors[color];
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '10px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '4px',
    border: `1px solid ${c.border}`,
    backgroundColor: c.bg,
    color: c.text,
    marginRight: '6px',
    fontFamily: 'Arial, Helvetica, sans-serif',
  };
};

const iconStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 'bold',
  marginRight: '3px',
  display: 'inline',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const avatarStyle = (isLeader: boolean, isHiring: boolean): React.CSSProperties => ({
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  backgroundColor: isHiring ? COLORS.hiring : isLeader ? COLORS.leaderAvatar : COLORS.avatar,
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  fontWeight: 700,
  flexShrink: 0,
  fontFamily: 'Arial, Helvetica, sans-serif',
});

const progressBarBg: React.CSSProperties = {
  width: '60px',
  height: '6px',
  backgroundColor: '#e5e7eb',
  borderRadius: '3px',
  overflow: 'hidden',
  display: 'inline-block',
  verticalAlign: 'middle',
};

const progressBarFill = (percent: number, color: string): React.CSSProperties => ({
  width: `${percent}%`,
  height: '100%',
  backgroundColor: color,
  borderRadius: '3px',
});

interface PrintNodeCardProps {
  node: OrgNode;
  users: User[];
  options: OrgChartExportOptions;
  companyValues?: string[];
  parentManagers?: User[];
}

const PrintNodeCard: React.FC<PrintNodeCardProps> = ({ 
  node, 
  users, 
  options,
  companyValues = [],
  parentManagers = []
}) => {
  const nodeUsers = users.filter(u => u.departmentId === node.id);
  
  // Calculate node climate
  const nodeClimateScore = useMemo(() => {
    const usersWithClimate = nodeUsers.filter(u => u.climateData);
    if (usersWithClimate.length === 0) return null;
    const totalAvg = usersWithClimate.reduce((sum, u) => sum + (u.climateData?.overallAverage || 0), 0);
    return totalAvg / usersWithClimate.length;
  }, [nodeUsers]);

  // Calculate skill gap
  const skillMismatchScore = useMemo(() => {
    let totalGaps = 0;
    let totalRequired = 0;
    
    nodeUsers.forEach(user => {
      const profile = user.requiredProfile;
      if (!profile) return;
      
      const requiredSkills = [...(profile.softSkills || []), ...(profile.hardSkills || [])];
      const userSkills = [...(user.karmaData?.softSkills || [])];
      
      requiredSkills.forEach(required => {
        totalRequired++;
        const hasSkill = userSkills.some(s => 
          s.toLowerCase().includes(required.toLowerCase()) || 
          required.toLowerCase().includes(s.toLowerCase())
        );
        if (!hasSkill) totalGaps++;
      });
    });
    
    if (totalRequired === 0) return null;
    return Math.round((totalGaps / totalRequired) * 100);
  }, [nodeUsers]);

  const hiringCount = nodeUsers.filter(u => u.isHiring).length;

  // Find leaders in this node
  const findNodeManagers = (nodeUsersList: User[], orgNode: OrgNode): User[] => {
    if (orgNode.isCulturalDriver) {
      return nodeUsersList.filter(u => !u.isHiring && (u.firstName || u.lastName));
    }
    const managers = nodeUsersList.filter(u => 
      !u.isHiring && 
      (u.firstName || u.lastName) &&
      (u.jobTitle?.toLowerCase().includes('head') || 
       u.jobTitle?.toLowerCase().includes('manager') || 
       u.jobTitle?.toLowerCase().includes('lead') || 
       u.jobTitle?.toLowerCase().includes('director') ||
       u.jobTitle?.toLowerCase().includes('ceo') ||
       u.jobTitle?.toLowerCase().includes('ad'))
    );
    return managers;
  };
  
  const currentNodeManagers = findNodeManagers(nodeUsers, node);

  const getClimateColor = (score: number): 'green' | 'yellow' | 'red' => {
    if (score >= 4) return 'green';
    if (score >= 3) return 'yellow';
    return 'red';
  };

  const getGapColor = (gap: number): 'green' | 'yellow' | 'red' => {
    if (gap <= 20) return 'green';
    if (gap <= 50) return 'yellow';
    return 'red';
  };

  const getFitColor = (score: number): string => {
    if (score > 70) return '#22c55e';
    if (score > 40) return '#facc15';
    return '#ef4444';
  };

  return (
    <div style={cardStyle(node.type)}>
      {/* Header */}
      <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#1f2937', marginBottom: '8px', fontFamily: 'Arial, Helvetica, sans-serif' }}>
          {node.name}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
          {options.showNodeType && (
            <span style={typeBadgeStyle(node.type)}>
              {node.type.toUpperCase()}
            </span>
          )}
          
          {options.showClimateScore && nodeClimateScore !== null && (
            <span style={metricBadgeStyle(getClimateColor(nodeClimateScore))}>
              <span style={iconStyle}>{ICONS.thermometer}</span>
              {nodeClimateScore.toFixed(1)}/5
            </span>
          )}
          
          {options.showSkillGap && skillMismatchScore !== null && (
            <span style={metricBadgeStyle(getGapColor(skillMismatchScore))}>
              <span style={iconStyle}>{ICONS.alert}</span>
              {skillMismatchScore}% gap
            </span>
          )}
          
          {options.showHiringCount && hiringCount > 0 && (
            <span style={metricBadgeStyle('emerald')}>
              <span style={iconStyle}>{ICONS.search}</span>
              {hiringCount} {hiringCount === 1 ? 'aperta' : 'aperte'}
            </span>
          )}
        </div>
      </div>

      {/* Users List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {nodeUsers.length > 0 ? (
          nodeUsers.map(u => {
            const isHiring = u.isHiring;
            const isLeader = currentNodeManagers.some(m => m.id === u.id);
            
            // Calculate cultural fit
            let cultureFitScore = 0;
            if (companyValues.length > 0 && u.karmaData?.primaryValues) {
              const matches = u.karmaData.primaryValues.filter(pv => 
                companyValues.some(cv => cv.toLowerCase().includes(pv.toLowerCase()) || pv.toLowerCase().includes(cv.toLowerCase()))
              ).length;
              cultureFitScore = Math.round((matches / Math.max(u.karmaData.primaryValues.length, 1)) * 100);
              if (cultureFitScore > 100) cultureFitScore = 100;
            }

            // Calculate manager fit
            const managersWithProfiles = parentManagers.filter(pm => pm.profileCode);
            let managerFitScore: number | null = null;
            if (managersWithProfiles.length > 0 && u.profileCode) {
              const totalScore = managersWithProfiles.reduce((sum, pm) => 
                sum + calculateUserCompatibility(u, pm), 0);
              managerFitScore = Math.round(totalScore / managersWithProfiles.length);
            }

            const showEmployeeDetails = options.showEmployeeNames || options.showJobTitles;
            const showMetrics = options.showRiasecCode || options.showCultureFit || options.showManagerFit || options.showLeaderBadge;

            if (!showEmployeeDetails && !showMetrics && !isHiring) {
              return null;
            }

            return (
              <div 
                key={u.id} 
                style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: isHiring ? '#f0fdf4' : '#f9fafb',
                  border: isHiring ? '1px dashed #86efac' : '1px solid transparent',
                }}
              >
                {/* User Header Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Avatar */}
                  <div style={avatarStyle(isLeader && node.isCulturalDriver, isHiring)}>
                    {isHiring ? (
                      <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{ICONS.hiring}</span>
                    ) : (
                      `${u.firstName?.[0] || '?'}${u.lastName?.[0] || ''}`
                    )}
                  </div>
                  
                  {/* Name & Title */}
                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    {options.showEmployeeNames && (
                      <div style={{ 
                        fontSize: '13px', 
                        fontWeight: 600, 
                        color: '#1f2937',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontFamily: 'Arial, Helvetica, sans-serif',
                      }}>
                        {u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : 'Da assegnare'}
                      </div>
                    )}
                    {options.showJobTitles && u.jobTitle && (
                      <div style={{ 
                        fontSize: '11px', 
                        color: '#6b7280',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontFamily: 'Arial, Helvetica, sans-serif',
                      }}>
                        {u.jobTitle}
                      </div>
                    )}
                  </div>
                  
                  {/* RIASEC Code */}
                  {options.showRiasecCode && u.profileCode && !isHiring && (
                    <div style={{ 
                      fontSize: '10px', 
                      fontWeight: 700, 
                      fontFamily: 'monospace',
                      backgroundColor: '#ffffff',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb',
                      color: '#4b5563'
                    }}>
                      {u.profileCode}
                    </div>
                  )}
                  
                  {/* Hiring Badge */}
                  {isHiring && (
                    <span style={metricBadgeStyle('emerald')}>
                      <span style={{ fontSize: '10px', marginRight: '2px' }}>{ICONS.search}</span>
                      HIRING
                    </span>
                  )}
                </div>

                {/* Metrics Row */}
                {!isHiring && showMetrics && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    marginTop: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    {/* Culture Fit */}
                    {options.showCultureFit && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', color: cultureFitScore > 60 ? '#3b82f6' : '#9ca3af' }}>{ICONS.building}</span>
                        <div style={progressBarBg}>
                          <div style={progressBarFill(cultureFitScore, getFitColor(cultureFitScore))} />
                        </div>
                        <span style={{ fontSize: '10px', color: '#6b7280', fontFamily: 'Arial, Helvetica, sans-serif' }}>{cultureFitScore}%</span>
                      </div>
                    )}
                    
                    {/* Manager Fit */}
                    {options.showManagerFit && managerFitScore !== null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', color: managerFitScore > 60 ? '#22c55e' : '#9ca3af' }}>{ICONS.handshake}</span>
                        <div style={progressBarBg}>
                          <div style={progressBarFill(managerFitScore, getFitColor(managerFitScore))} />
                        </div>
                        <span style={{ fontSize: '10px', color: '#6b7280', fontFamily: 'Arial, Helvetica, sans-serif' }}>{managerFitScore}%</span>
                      </div>
                    )}
                    
                    {/* Leader Badge */}
                    {options.showLeaderBadge && isLeader && node.isCulturalDriver && (
                      <div style={{ 
                        marginLeft: 'auto',
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#d97706',
                        backgroundColor: '#fffbeb',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontFamily: 'Arial, Helvetica, sans-serif',
                      }}>
                        <span style={{ fontSize: '10px' }}>{ICONS.crown}</span>
                        LEADER
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '16px', 
            fontSize: '12px', 
            color: '#9ca3af',
            fontStyle: 'italic',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '2px dashed #e5e7eb',
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}>
            Nessun dipendente
          </div>
        )}
      </div>
    </div>
  );
};

// Recursive tree renderer
interface TreeNodeRendererProps {
  node: FlatOrgNode;
  users: User[];
  options: OrgChartExportOptions;
  companyValues?: string[];
  allNodes: FlatOrgNode[];
}

const TreeNodeRenderer: React.FC<TreeNodeRendererProps> = ({ 
  node, 
  users, 
  options, 
  companyValues,
  allNodes 
}) => {
  // Find children of this node
  const children = allNodes.filter(n => n.parentNodeId === node.id);
  
  // Find parent managers (for manager fit calculation)
  const parentNode = allNodes.find(n => n.id === node.parentNodeId);
  const parentManagers = parentNode 
    ? users.filter(u => u.departmentId === parentNode.id && !u.isHiring && (u.firstName || u.lastName))
    : [];

  if (children.length === 0) {
    return (
      <TreeNode 
        label={
          <PrintNodeCard 
            node={node} 
            users={users} 
            options={options} 
            companyValues={companyValues}
            parentManagers={parentManagers}
          />
        }
      />
    );
  }

  return (
    <TreeNode 
      label={
        <PrintNodeCard 
          node={node} 
          users={users} 
          options={options} 
          companyValues={companyValues}
          parentManagers={parentManagers}
        />
      }
    >
      {children.map(child => (
        <TreeNodeRenderer 
          key={child.id}
          node={child}
          users={users}
          options={options}
          companyValues={companyValues}
          allNodes={allNodes}
        />
      ))}
    </TreeNode>
  );
};

export const OrgChartPrintView: React.FC<OrgChartPrintViewProps> = ({
  company,
  users,
  options,
  onRenderComplete,
}) => {
  // Build tree structure from company.structure
  const flattenNodes = (node: OrgNode, parentId?: string): FlatOrgNode[] => {
    const current: FlatOrgNode = {
      ...node,
      parentNodeId: parentId,
    };
    const childNodes = (node.children || []).flatMap(child => 
      flattenNodes(child, node.id)
    );
    return [current, ...childNodes];
  };

  const allNodes = useMemo(() => {
    if (!company.structure) return [];
    return flattenNodes(company.structure);
  }, [company.structure]);

  const rootNode = company.structure;

  useEffect(() => {
    // Signal render complete after a delay for fonts/layout
    const timer = setTimeout(() => {
      onRenderComplete?.();
    }, 100);
    return () => clearTimeout(timer);
  }, [onRenderComplete]);

  if (!rootNode) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontFamily: 'Arial, Helvetica, sans-serif' }}>
        Nessun organigramma disponibile
      </div>
    );
  }

  // Find root's children
  const rootChildren = allNodes.filter(n => n.parentNodeId === rootNode.id);

  return (
    <div 
      style={{ 
        padding: '40px', 
        backgroundColor: '#ffffff', 
        minWidth: '1800px',
        fontFamily: 'Arial, Helvetica, sans-serif',
        color: '#1f2937',
      }}
    >
      <Tree
        lineWidth="2px"
        lineColor="#6366f1"
        lineBorderRadius="8px"
        label={
          <PrintNodeCard 
            node={rootNode} 
            users={users} 
            options={options} 
            companyValues={company.cultureValues}
            parentManagers={[]}
          />
        }
      >
        {rootChildren.map(child => (
          <TreeNodeRenderer
            key={child.id}
            node={child}
            users={users}
            options={options}
            companyValues={company.cultureValues}
            allNodes={allNodes}
          />
        ))}
      </Tree>
    </div>
  );
};
