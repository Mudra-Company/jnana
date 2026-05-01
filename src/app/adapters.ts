import type { CompanyProfile, OrgNode, User } from '../../types';

/**
 * Adapter to convert a DB profile (+ related rows) into the legacy `User`
 * shape used throughout the app. Pure function, zero dependencies — extracted
 * from App.tsx as part of Phase 3 of the routing refactor.
 */
export const profileToLegacyUser = (
  profile: any,
  membership?: any,
  riasecResult?: any,
  karmaSession?: any,
  climateResponse?: any,
  hardSkills?: any[],
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
    results: riasecResult
      ? {
          R: riasecResult.score_r,
          I: riasecResult.score_i,
          A: riasecResult.score_a,
          S: riasecResult.score_s,
          E: riasecResult.score_e,
          C: riasecResult.score_c,
        }
      : undefined,
    profileCode: riasecResult?.profile_code || undefined,
    submissionDate: riasecResult?.submitted_at?.split('T')[0] || undefined,
    karmaData: karmaSession
      ? {
          transcript: karmaSession.transcript || [],
          summary: karmaSession.summary || '',
          softSkills: karmaSession.soft_skills || [],
          primaryValues: karmaSession.primary_values || [],
          riskFactors: karmaSession.risk_factors || [],
          seniorityAssessment: karmaSession.seniority_assessment,
        }
      : undefined,
    climateData: climateResponse
      ? {
          rawScores: climateResponse.raw_scores || {},
          sectionAverages: climateResponse.section_averages || {},
          overallAverage: climateResponse.overall_average || 0,
          submissionDate: climateResponse.submitted_at?.split('T')[0],
        }
      : undefined,
    hardSkills:
      hardSkills?.map((hs) => ({
        name: hs.custom_skill_name || hs.skill?.name || 'Unknown',
        proficiencyLevel: hs.proficiency_level || 1,
        category: hs.skill?.category || undefined,
      })) || undefined,
  };
};

/**
 * Adapter to convert a DB company (+ flat org nodes) into the legacy
 * `CompanyProfile` shape with a nested tree structure.
 */
export const companyToLegacy = (company: any, orgNodes?: any[]): CompanyProfile => {
  const buildTree = (nodes: any[], parentId: string | null = null): OrgNode | null => {
    const children = nodes.filter((n) => n.parent_node_id === parentId);
    if (children.length === 0 && parentId !== null) return null;

    const rootNode = nodes.find((n) => n.parent_node_id === parentId && n.type === 'root');
    if (!rootNode && parentId === null) {
      return {
        id: company.id,
        name: company.name,
        type: 'root',
        isCulturalDriver: false,
        children: children.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          isCulturalDriver: c.is_cultural_driver || false,
          targetProfile: c.target_profile || undefined,
          children: [],
        })),
      };
    }

    const buildChildren = (pid: string): OrgNode[] => {
      return nodes
        .filter((n) => n.parent_node_id === pid)
        .map((n) => ({
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
      id: company.id,
      name: company.name,
      type: 'root',
      isCulturalDriver: false,
      children: [],
    };
  };

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
    structure: buildTree(orgNodes || [], null) || {
      id: company.id,
      name: company.name,
      type: 'root',
      isCulturalDriver: false,
      children: [],
    },
  };
};
