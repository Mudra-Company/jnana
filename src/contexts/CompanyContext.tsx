import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CompanyProfile, User, OrgNode } from '../../types';
import { supabase } from '../integrations/supabase/client';
import { toast } from '../hooks/use-toast';

interface CompanyContextType {
  activeCompany: CompanyProfile | null;
  companyUsers: User[];
  existingOrgNodeIds: string[];
  isLoading: boolean;
  
  // Actions
  loadCompanyData: (companyId: string) => Promise<void>;
  updateCompanyUsers: (users: User[]) => void;
  updateOrgChart: (newRoot: OrgNode) => Promise<void>;
  updateCompanyProfile: (company: CompanyProfile) => Promise<void>;
  clearCompanyContext: () => void;
  setActiveCompany: (company: CompanyProfile | null) => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

// Adapter functions (moved from App.tsx)
const profileToLegacyUser = (
  profile: any, 
  membership?: any, 
  riasecResult?: any, 
  karmaSession?: any, 
  climateResponse?: any
): User => {
  return {
    id: profile.id,
    firstName: profile.first_name || '',
    lastName: profile.last_name || '',
    email: profile.email,
    gender: profile.gender as 'M' | 'F' | undefined,
    age: profile.age || undefined,
    companyId: membership?.company_id || '',
    jobTitle: membership?.job_title || profile.job_title || '',
    departmentId: membership?.department_id || '',
    status: membership?.status || 'pending',
    memberId: membership?.id || undefined,
    results: riasecResult ? {
      R: riasecResult.score_r,
      I: riasecResult.score_i,
      A: riasecResult.score_a,
      S: riasecResult.score_s,
      E: riasecResult.score_e,
      C: riasecResult.score_c,
    } : undefined,
    profileCode: riasecResult?.profile_code || undefined,
    submissionDate: riasecResult?.submitted_at?.split('T')[0] || undefined,
    karmaData: karmaSession ? {
      transcript: karmaSession.transcript || [],
      summary: karmaSession.summary || '',
      softSkills: karmaSession.soft_skills || [],
      primaryValues: karmaSession.primary_values || [],
      riskFactors: karmaSession.risk_factors || [],
      seniorityAssessment: karmaSession.seniority_assessment,
    } : undefined,
    climateData: climateResponse ? {
      rawScores: climateResponse.raw_scores || {},
      sectionAverages: climateResponse.section_averages || {},
      overallAverage: climateResponse.overall_average || 0,
      submissionDate: climateResponse.submitted_at?.split('T')[0],
    } : undefined,
  };
};

const buildTree = (nodes: any[], parentId: string | null, companyId: string, companyName: string): OrgNode => {
  const children = nodes.filter(n => n.parent_node_id === parentId);
  const rootNode = nodes.find(n => n.parent_node_id === parentId && n.type === 'root');
  
  const buildChildren = (pid: string): OrgNode[] => {
    return nodes
      .filter(n => n.parent_node_id === pid)
      .map(n => ({
        id: n.id,
        name: n.name,
        type: n.type,
        isCulturalDriver: n.is_cultural_driver || false,
        targetProfile: n.target_profile || undefined,
        children: buildChildren(n.id),
      }));
  };

  if (rootNode) {
    return {
      id: rootNode.id,
      name: rootNode.name,
      type: rootNode.type,
      isCulturalDriver: rootNode.is_cultural_driver || false,
      children: buildChildren(rootNode.id),
    };
  }

  return {
    id: companyId,
    name: companyName,
    type: 'root',
    isCulturalDriver: false,
    children: children.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      isCulturalDriver: c.is_cultural_driver || false,
      targetProfile: c.target_profile || undefined,
      children: [],
    })),
  };
};

const companyToLegacy = (company: any, orgNodes?: any[]): CompanyProfile => {
  return {
    id: company.id,
    name: company.name,
    email: company.email || '',
    industry: company.industry || '',
    sizeRange: company.size_range || '',
    vatNumber: company.vat_number || '',
    logoUrl: company.logo_url || '',
    foundationYear: company.foundation_year || undefined,
    website: company.website || '',
    address: company.address || '',
    description: company.description || '',
    cultureValues: company.culture_values || [],
    structure: buildTree(orgNodes || [], null, company.id, company.name),
  };
};

export const CompanyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeCompany, setActiveCompany] = useState<CompanyProfile | null>(null);
  const [companyUsers, setCompanyUsers] = useState<User[]>([]);
  const [existingOrgNodeIds, setExistingOrgNodeIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadCompanyUsersWithDetails = async (companyId: string): Promise<User[]> => {
    const { data: members, error: membersError } = await supabase
      .from('company_members')
      .select(`*, profiles:user_id (*)`)
      .eq('company_id', companyId);
    
    if (membersError || !members) {
      console.error('Error loading company members:', membersError);
      return [];
    }
    
    if (members.length === 0) return [];
    
    const membersWithProfiles = members.filter(m => m.user_id && m.profiles);
    const placeholders = members.filter(m => !m.user_id);
    const userIds = membersWithProfiles.map(m => m.user_id).filter(Boolean);
    
    let riasecResults: any[] = [];
    let karmaSessions: any[] = [];
    let climateResponses: any[] = [];
    let userRolesData: any[] = [];
    
    if (userIds.length > 0) {
      const [riasec, karma, climate, roles] = await Promise.all([
        supabase.from('riasec_results').select('*').in('user_id', userIds),
        supabase.from('karma_sessions').select('*').in('user_id', userIds),
        supabase.from('climate_responses').select('*').in('user_id', userIds),
        supabase.from('user_roles').select('*').in('user_id', userIds)
      ]);
      riasecResults = riasec.data || [];
      karmaSessions = karma.data || [];
      climateResponses = climate.data || [];
      userRolesData = roles.data || [];
    }
    
    const realUsers = membersWithProfiles.map(member => {
      const profile = member.profiles as any;
      const riasec = riasecResults.find(r => r.user_id === member.user_id);
      const karma = karmaSessions.find(k => k.user_id === member.user_id);
      const climate = climateResponses.find(c => c.user_id === member.user_id);
      const isSuperAdmin = userRolesData.some(r => r.user_id === member.user_id && r.role === 'super_admin');
      
      const legacyUser = profileToLegacyUser(profile, member, riasec, karma, climate);
      legacyUser.role = isSuperAdmin ? 'super_admin' : (member.role || 'user');
      legacyUser.memberId = member.id;
      return legacyUser;
    });
    
    const placeholderUsers: User[] = placeholders.map(member => ({
      id: member.id,
      memberId: member.id,
      firstName: member.placeholder_first_name || '',
      lastName: member.placeholder_last_name || '',
      email: member.placeholder_email || '',
      companyId: member.company_id,
      departmentId: member.department_id || '',
      jobTitle: member.job_title || '',
      status: member.status || 'pending',
      isHiring: member.is_hiring || false,
      requiredProfile: member.required_profile ? {
        hardSkills: (member.required_profile as any).hardSkills || [],
        softSkills: (member.required_profile as any).softSkills || [],
        seniority: (member.required_profile as any).seniority || 'Mid'
      } : undefined,
      role: member.role || 'user'
    }));
    
    return [...realUsers, ...placeholderUsers];
  };

  const loadCompanyData = useCallback(async (companyId: string) => {
    setIsLoading(true);
    try {
      // Load company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .maybeSingle();

      if (companyError || !company) {
        console.error('Error loading company:', companyError);
        return;
      }

      // Load org nodes
      const { data: orgNodes } = await supabase
        .from('org_nodes')
        .select('*')
        .eq('company_id', companyId)
        .order('sort_order');

      setActiveCompany(companyToLegacy(company, orgNodes || []));
      setExistingOrgNodeIds((orgNodes || []).map(n => n.id));

      // Load users
      const users = await loadCompanyUsersWithDetails(companyId);
      setCompanyUsers(users);
    } catch (error) {
      console.error('Error loading company data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateCompanyUsers = useCallback((users: User[]) => {
    setCompanyUsers(users);
  }, []);

  const updateOrgChart = useCallback(async (newRoot: OrgNode) => {
    if (!activeCompany) return;
    
    // Update local state immediately
    setActiveCompany(prev => prev ? { ...prev, structure: newRoot } : null);

    toast({
      title: "Modifiche salvate",
      description: "L'organigramma è stato aggiornato correttamente.",
    });
  }, [activeCompany]);

  const updateCompanyProfile = useCallback(async (updatedCompany: CompanyProfile) => {
    if (!activeCompany) return;

    const dbUpdates = {
      name: updatedCompany.name,
      email: updatedCompany.email || null,
      industry: updatedCompany.industry || null,
      size_range: updatedCompany.sizeRange || null,
      vat_number: updatedCompany.vatNumber || null,
      logo_url: updatedCompany.logoUrl || null,
      foundation_year: updatedCompany.foundationYear || null,
      website: updatedCompany.website || null,
      address: updatedCompany.address || null,
      description: updatedCompany.description || null,
      culture_values: updatedCompany.cultureValues || [],
    };

    const { error } = await supabase
      .from('companies')
      .update(dbUpdates)
      .eq('id', activeCompany.id);

    if (error) {
      console.error('Error updating company:', error);
      toast({
        title: "Errore",
        description: "Impossibile salvare le modifiche.",
        variant: "destructive",
      });
    } else {
      setActiveCompany(updatedCompany);
      toast({
        title: "Salvato",
        description: "Profilo aziendale aggiornato.",
      });
    }
  }, [activeCompany]);

  const clearCompanyContext = useCallback(() => {
    setActiveCompany(null);
    setCompanyUsers([]);
    setExistingOrgNodeIds([]);
  }, []);

  return (
    <CompanyContext.Provider value={{
      activeCompany,
      companyUsers,
      existingOrgNodeIds,
      isLoading,
      loadCompanyData,
      updateCompanyUsers,
      updateOrgChart,
      updateCompanyProfile,
      clearCompanyContext,
      setActiveCompany,
    }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompanyContext = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompanyContext must be used within a CompanyProvider');
  }
  return context;
};

// Re-export adapters for use elsewhere
export { profileToLegacyUser, companyToLegacy };
