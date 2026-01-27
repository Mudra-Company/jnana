import React, { useEffect, useMemo } from 'react';
import { 
  ThermometerSun, 
  AlertTriangle, 
  Search, 
  Crown, 
  Handshake, 
  Building 
} from 'lucide-react';
import type { OrgChartExportOptions } from '../../types/orgChartExport';
import type { CompanyProfile, User, OrgNode } from '../../../types';
import { calculateUserCompatibility } from '../../../services/riasecService';

interface OrgChartPrintViewProps {
  company: CompanyProfile;
  users: User[];
  options: OrgChartExportOptions;
  onRenderComplete?: () => void;
}

// Print-optimized node card
const PrintNodeCard: React.FC<{
  node: OrgNode;
  users: User[];
  options: OrgChartExportOptions;
  companyValues?: string[];
  parentManagers: User[];
  level: number;
}> = ({ node, users, options, companyValues, parentManagers, level }) => {
  const nodeUsers = users.filter(u => u.departmentId === node.id);
  const hiringCount = nodeUsers.filter(u => u.isHiring).length;
  
  // Find managers for children
  const nodeManagers = nodeUsers.filter(u => 
    !u.isHiring && 
    (u.firstName || u.lastName) &&
    (u.jobTitle?.toLowerCase().includes('head') || 
     u.jobTitle?.toLowerCase().includes('manager') || 
     u.jobTitle?.toLowerCase().includes('lead') || 
     u.jobTitle?.toLowerCase().includes('director') ||
     node.isCulturalDriver)
  );

  // Calculate climate score
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

  const getNodeColor = () => {
    switch (node.type) {
      case 'root': return '#9333ea'; // Purple
      case 'department': return '#3b82f6'; // Blue
      case 'team': return '#22c55e'; // Green
      default: return '#6b7280';
    }
  };

  const getClimateColor = (score: number) => {
    if (score >= 4) return '#22c55e';
    if (score >= 3) return '#eab308';
    return '#ef4444';
  };

  const getGapColor = (gap: number) => {
    if (gap <= 20) return '#22c55e';
    if (gap <= 50) return '#eab308';
    return '#ef4444';
  };

  // Check if user is a leader
  const isLeader = (user: User) => {
    if (node.isCulturalDriver) return true;
    return user.jobTitle?.toLowerCase().includes('head') || 
           user.jobTitle?.toLowerCase().includes('manager') || 
           user.jobTitle?.toLowerCase().includes('lead') || 
           user.jobTitle?.toLowerCase().includes('director');
  };

  // Calculate culture fit for a user
  const getCultureFit = (user: User) => {
    if (!companyValues || companyValues.length === 0 || !user.karmaData?.primaryValues) {
      return null;
    }
    const matches = user.karmaData.primaryValues.filter(pv => 
      companyValues.some(cv => 
        cv.toLowerCase().includes(pv.toLowerCase()) || 
        pv.toLowerCase().includes(cv.toLowerCase())
      )
    ).length;
    return Math.min(100, Math.round((matches / Math.max(user.karmaData.primaryValues.length, 1)) * 100));
  };

  // Calculate manager fit for a user
  const getManagerFit = (user: User) => {
    if (parentManagers.length === 0 || !user.profileCode) return null;
    const scores = parentManagers
      .filter(pm => pm.profileCode)
      .map(pm => calculateUserCompatibility(user, pm));
    if (scores.length === 0) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Node Card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: `3px solid ${getNodeColor()}`,
          borderRadius: '12px',
          padding: '16px',
          minWidth: '280px',
          maxWidth: '350px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937', margin: 0 }}>
            {node.name}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
            {options.showNodeType && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: getNodeColor(),
                  color: '#ffffff',
                }}
              >
                {node.type}
              </span>
            )}
            
            {options.showClimateScore && nodeClimateScore !== null && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: getClimateColor(nodeClimateScore),
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                🌡️ {nodeClimateScore.toFixed(1)}/5
              </span>
            )}
            
            {options.showSkillGap && skillMismatchScore !== null && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: getGapColor(skillMismatchScore),
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                ⚠️ {skillMismatchScore}% gap
              </span>
            )}
            
            {options.showHiringCount && hiringCount > 0 && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                🔍 {hiringCount} {hiringCount === 1 ? 'aperta' : 'aperte'}
              </span>
            )}
          </div>
        </div>

        {/* Users */}
        {nodeUsers.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {nodeUsers.map(user => {
              const userIsLeader = isLeader(user);
              const cultureFit = options.showCultureFit ? getCultureFit(user) : null;
              const managerFit = options.showManagerFit ? getManagerFit(user) : null;
              
              return (
                <div
                  key={user.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px',
                    backgroundColor: user.isHiring ? '#ecfdf5' : '#f9fafb',
                    borderRadius: '8px',
                    border: user.isHiring ? '1px dashed #10b981' : '1px solid #e5e7eb',
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: user.isHiring ? '#10b981' : '#6366f1',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {user.isHiring ? '🔍' : `${user.firstName?.[0] || '?'}${user.lastName?.[0] || ''}`}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    {options.showEmployeeNames && (
                      <div style={{ 
                        fontSize: '13px', 
                        fontWeight: 600, 
                        color: '#1f2937',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}` 
                          : user.isHiring 
                            ? 'Posizione Aperta' 
                            : 'Non assegnato'
                        }
                        {options.showLeaderBadge && userIsLeader && !user.isHiring && (
                          <span style={{ color: '#f59e0b' }}>👑</span>
                        )}
                      </div>
                    )}
                    
                    {options.showJobTitles && user.jobTitle && (
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>
                        {user.jobTitle}
                      </div>
                    )}

                    {/* Metrics Row */}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                      {options.showRiasecCode && user.profileCode && (
                        <span style={{ 
                          fontSize: '10px', 
                          fontFamily: 'monospace',
                          padding: '1px 4px',
                          backgroundColor: '#e0e7ff',
                          color: '#4338ca',
                          borderRadius: '3px',
                        }}>
                          {user.profileCode}
                        </span>
                      )}
                      
                      {cultureFit !== null && (
                        <span style={{ 
                          fontSize: '10px',
                          padding: '1px 4px',
                          backgroundColor: '#dbeafe',
                          color: '#1d4ed8',
                          borderRadius: '3px',
                        }}>
                          🏢 {cultureFit}%
                        </span>
                      )}
                      
                      {managerFit !== null && (
                        <span style={{ 
                          fontSize: '10px',
                          padding: '1px 4px',
                          backgroundColor: '#dcfce7',
                          color: '#166534',
                          borderRadius: '3px',
                        }}>
                          🤝 {managerFit}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {nodeUsers.length === 0 && (
          <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '12px', padding: '12px' }}>
            Nessun membro
          </div>
        )}
      </div>

      {/* Children */}
      {node.children.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          {/* Connector line */}
          <div
            style={{
              width: '3px',
              height: '20px',
              backgroundColor: '#6366f1',
              margin: '0 auto',
            }}
          />
          
          {/* Horizontal line */}
          {node.children.length > 1 && (
            <div
              style={{
                height: '3px',
                backgroundColor: '#6366f1',
                width: `${Math.min(node.children.length * 320, 1200)}px`,
                margin: '0 auto',
                borderRadius: '2px',
              }}
            />
          )}

          {/* Children nodes */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '24px',
              marginTop: node.children.length > 1 ? '0' : '0',
            }}
          >
            {node.children.map(child => (
              <div key={child.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {node.children.length > 1 && (
                  <div
                    style={{
                      width: '3px',
                      height: '20px',
                      backgroundColor: '#6366f1',
                    }}
                  />
                )}
                <PrintNodeCard
                  node={child}
                  users={users}
                  options={options}
                  companyValues={companyValues}
                  parentManagers={nodeManagers.length > 0 ? nodeManagers : parentManagers}
                  level={level + 1}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const OrgChartPrintView: React.FC<OrgChartPrintViewProps> = ({
  company,
  users,
  options,
  onRenderComplete,
}) => {
  useEffect(() => {
    // Signal that rendering is complete after a brief delay
    const timer = setTimeout(() => {
      onRenderComplete?.();
    }, 100);
    return () => clearTimeout(timer);
  }, [onRenderComplete]);

  return (
    <div
      style={{
        padding: '40px',
        backgroundColor: '#ffffff',
        minWidth: '1200px',
      }}
    >
      <PrintNodeCard
        node={company.structure}
        users={users}
        options={options}
        companyValues={company.cultureValues}
        parentManagers={[]}
        level={0}
      />
    </div>
  );
};
