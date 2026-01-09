import { useState, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import type { KarmaProfile, WorkType, UserHardSkill, PortfolioItem, SocialLink, UserExperience, UserEducation, UserCertification, UserLanguage } from '../types/karma';
import type { SeniorityLevel } from '../../types';

// Type definitions for database results
interface RiasecResultRow {
  user_id: string;
  profile_code: string | null;
  score_r: number;
  score_i: number;
  score_a: number;
  score_s: number;
  score_e: number;
  score_c: number;
}

interface KarmaSessionRow {
  user_id: string;
  summary: string | null;
  soft_skills: string[] | null;
  primary_values: string[] | null;
  risk_factors: string[] | null;
  seniority_assessment: string | null;
  transcript?: any;
}

export interface KarmaSearchFilters {
  query?: string;
  lookingForWorkOnly?: boolean;
  hasCompletedTests?: boolean;
  skills?: string[];  // Hard skill IDs
  softSkills?: string[];  // Soft skill names from Karma AI
  locations?: string[];
  riasecCodes?: string[];  // e.g. ['R', 'I', 'A']
  minExperience?: number;
  maxExperience?: number;
  workTypes?: WorkType[];
  seniorityLevels?: SeniorityLevel[];
  profileSource?: 'karma' | 'jnana' | 'all'; // Filter by profile origin
}

export interface KarmaSearchResult {
  profile: KarmaProfile;
  hasRiasec: boolean;
  hasKarma: boolean;
  skillsCount: number;
  topSkills?: string[];  // Top 3 skill names
}

export const useKarmaAdminSearch = () => {
  const [results, setResults] = useState<KarmaSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const search = useCallback(async (filters: KarmaSearchFilters, page = 0, pageSize = 20) => {
    setIsLoading(true);
    setError(null);

    try {
      // Build query for profiles
      let query = supabase
        .from('profiles')
        .select('*');

      // Text search
      if (filters.query) {
        query = query.or(`first_name.ilike.%${filters.query}%,last_name.ilike.%${filters.query}%,email.ilike.%${filters.query}%,headline.ilike.%${filters.query}%`);
      }

      // Looking for work filter
      if (filters.lookingForWorkOnly) {
        query = query.eq('looking_for_work', true);
      }

      // Location filter
      if (filters.locations && filters.locations.length > 0) {
        query = query.in('location', filters.locations);
      }

      // Profile source filter - wants_karma_visibility for Karma talent pool
      if (filters.profileSource === 'karma') {
        query = query.eq('wants_karma_visibility', true);
      }

      // Work type filter
      if (filters.workTypes && filters.workTypes.length > 0) {
        query = query.in('preferred_work_type', filters.workTypes);
      }

      // Experience filter
      if (filters.minExperience !== undefined) {
        query = query.gte('years_experience', filters.minExperience);
      }
      if (filters.maxExperience !== undefined) {
        query = query.lte('years_experience', filters.maxExperience);
      }

      // Order and fetch all for filtering
      query = query.order('created_at', { ascending: false });

      const { data: allProfiles, error: profilesError } = await query;

      if (profilesError) throw profilesError;

      // Get all profile IDs to check for Karma data
      let allProfileIds = allProfiles?.map(p => p.id) || [];

      // For Jnana filter, we need to get only users who belong to a company
      let jnanaUserIds: Set<string> | null = null;
      if (filters.profileSource === 'jnana' || filters.profileSource === 'all') {
        const { data: companyMembers } = await supabase
          .from('company_members')
          .select('user_id')
          .in('user_id', allProfileIds);
        jnanaUserIds = new Set(companyMembers?.map(cm => cm.user_id) || []);
        
        if (filters.profileSource === 'jnana') {
          // Only keep users who are company members
          allProfileIds = allProfileIds.filter(id => jnanaUserIds!.has(id));
        }
      }

      if (allProfileIds.length === 0) {
        setResults([]);
        setTotalCount(0);
        setIsLoading(false);
        return;
      }

      // Fetch Karma signals for ALL profiles to determine who qualifies
      const [
        { data: riasecCheck },
        { data: karmaCheck },
        { data: skillsCheck },
        { data: portfolioCheck }
      ] = await Promise.all([
        supabase.from('riasec_results').select('user_id').in('user_id', allProfileIds),
        supabase.from('karma_sessions').select('user_id').in('user_id', allProfileIds),
        supabase.from('user_hard_skills').select('user_id').in('user_id', allProfileIds),
        supabase.from('user_portfolio_items').select('user_id').in('user_id', allProfileIds)
      ]);

      // Create sets of users with Karma data
      const usersWithRiasec = new Set(riasecCheck?.map(r => r.user_id) || []);
      const usersWithKarma = new Set(karmaCheck?.map(k => k.user_id) || []);
      const usersWithSkills = new Set(skillsCheck?.map(s => s.user_id) || []);
      const usersWithPortfolio = new Set(portfolioCheck?.map(p => p.user_id) || []);

      // A profile is a "Karma profile" if:
      // 1. is_karma_profile = true, OR
      // 2. Has ANY Karma data (RIASEC, Karma session, skills, portfolio)
      const karmaProfiles = allProfiles?.filter(p => 
        p.is_karma_profile === true ||
        usersWithRiasec.has(p.id) ||
        usersWithKarma.has(p.id) ||
        usersWithSkills.has(p.id) ||
        usersWithPortfolio.has(p.id)
      ) || [];

      const karmaProfileIds = karmaProfiles.map(p => p.id);

      if (karmaProfileIds.length === 0) {
        setResults([]);
        setTotalCount(0);
        setIsLoading(false);
        return;
      }

      // Get full RIASEC results for qualified profiles
      const { data: riasecResults } = await supabase
        .from('riasec_results')
        .select('user_id, profile_code, score_r, score_i, score_a, score_s, score_e, score_c')
        .in('user_id', karmaProfileIds);

      const riasecByUser = new Map(riasecResults?.map(r => [r.user_id, r]) || []);

      // Get full Karma sessions for qualified profiles
      const { data: karmaSessions } = await supabase
        .from('karma_sessions')
        .select('user_id, summary, soft_skills, primary_values, risk_factors, seniority_assessment')
        .in('user_id', karmaProfileIds);

      const karmaByUser = new Map(karmaSessions?.map(k => [k.user_id, k]) || []);

      // Get hard skills with skill names
      const { data: userSkills } = await supabase
        .from('user_hard_skills')
        .select(`
          user_id,
          skill_id,
          custom_skill_name,
          proficiency_level,
          hard_skills_catalog (id, name, category)
        `)
        .in('user_id', karmaProfileIds);

      // Group skills by user
      const skillsByUser: Record<string, { count: number; topSkills: string[] }> = {};
      userSkills?.forEach(s => {
        if (!skillsByUser[s.user_id]) {
          skillsByUser[s.user_id] = { count: 0, topSkills: [] };
        }
        skillsByUser[s.user_id].count++;
        const skillName = (s.hard_skills_catalog as any)?.name || s.custom_skill_name;
        if (skillName && skillsByUser[s.user_id].topSkills.length < 3) {
          skillsByUser[s.user_id].topSkills.push(skillName);
        }
      });

      // Apply complex filters that need joined data
      let filteredProfiles = karmaProfiles;

      // Filter: has completed tests (RIASEC)
      if (filters.hasCompletedTests) {
        filteredProfiles = filteredProfiles.filter(p => riasecByUser.has(p.id));
      }

      // Filter: RIASEC codes (check if profile_code contains any of the selected letters)
      if (filters.riasecCodes && filters.riasecCodes.length > 0) {
        filteredProfiles = filteredProfiles.filter(p => {
          const riasec = riasecByUser.get(p.id);
          if (!riasec?.profile_code) return false;
          return filters.riasecCodes!.some(code => 
            riasec.profile_code!.toUpperCase().includes(code.toUpperCase())
          );
        });
      }

      // Filter: seniority levels
      if (filters.seniorityLevels && filters.seniorityLevels.length > 0) {
        filteredProfiles = filteredProfiles.filter(p => {
          const karma = karmaByUser.get(p.id);
          if (!karma?.seniority_assessment) return false;
          return filters.seniorityLevels!.includes(karma.seniority_assessment as SeniorityLevel);
        });
      }

      // Filter: soft skills (from Karma AI)
      if (filters.softSkills && filters.softSkills.length > 0) {
        filteredProfiles = filteredProfiles.filter(p => {
          const karma = karmaByUser.get(p.id);
          if (!karma?.soft_skills) return false;
          const userSoftSkills = karma.soft_skills.map(s => s.toLowerCase());
          return filters.softSkills!.some(skill => 
            userSoftSkills.some(us => us.includes(skill.toLowerCase()))
          );
        });
      }

      // Filter: hard skills
      if (filters.skills && filters.skills.length > 0) {
        const usersWithMatchingSkills = new Set(
          userSkills?.filter(s => filters.skills!.includes(s.skill_id || '')).map(s => s.user_id) || []
        );
        filteredProfiles = filteredProfiles.filter(p => usersWithMatchingSkills.has(p.id));
      }

      // Set total count AFTER all filtering
      setTotalCount(filteredProfiles.length);

      // Apply pagination AFTER counting
      const paginatedProfiles = filteredProfiles.slice(page * pageSize, (page + 1) * pageSize);

      // Build results
      const searchResults: KarmaSearchResult[] = paginatedProfiles.map(p => {
        const riasec = riasecByUser.get(p.id);
        const karma = karmaByUser.get(p.id);
        const skills = skillsByUser[p.id];

        return {
          profile: {
            id: p.id,
            email: p.email,
            firstName: p.first_name || undefined,
            lastName: p.last_name || undefined,
            avatarUrl: p.avatar_url || undefined,
            bio: p.bio || undefined,
            location: p.location || undefined,
            headline: p.headline || undefined,
            jobTitle: p.job_title || undefined,
            gender: p.gender as 'M' | 'F' | undefined,
            age: p.age || undefined,
            isKarmaProfile: p.is_karma_profile || false,
            wantsKarmaVisibility: p.wants_karma_visibility || false,
            profileVisibility: (p.profile_visibility as 'private' | 'subscribers_only') || 'private',
            lookingForWork: p.looking_for_work || false,
            preferredWorkType: p.preferred_work_type as any,
            yearsExperience: p.years_experience || undefined,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
            profileCode: riasec?.profile_code || undefined,
            isJnanaUser: jnanaUserIds?.has(p.id) || false, // Track if user belongs to a company
            riasecScore: riasec ? {
              R: riasec.score_r,
              I: riasec.score_i,
              A: riasec.score_a,
              S: riasec.score_s,
              E: riasec.score_e,
              C: riasec.score_c,
            } : undefined,
            karmaData: karma ? {
              transcript: [],
              summary: karma.summary || undefined,
              softSkills: karma.soft_skills || undefined,
              primaryValues: karma.primary_values || undefined,
              riskFactors: karma.risk_factors || undefined,
              seniorityAssessment: karma.seniority_assessment || undefined,
            } : undefined,
          },
          hasRiasec: !!riasec,
          hasKarma: !!karma,
          skillsCount: skills?.count || 0,
          topSkills: skills?.topSkills || [],
        };
      });

      setResults(searchResults);
    } catch (err) {
      console.error('Error searching Karma profiles:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string): Promise<KarmaSearchResult | null> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      // Get RIASEC
      const { data: riasec } = await supabase
        .from('riasec_results')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // Get Karma
      const { data: karma } = await supabase
        .from('karma_sessions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // Get hard skills with details
      const { data: hardSkills } = await supabase
        .from('user_hard_skills')
        .select(`
          id,
          user_id,
          skill_id,
          custom_skill_name,
          proficiency_level,
          created_at,
          hard_skills_catalog (id, name, category)
        `)
        .eq('user_id', userId);

      // Get portfolio items
      const { data: portfolio } = await supabase
        .from('user_portfolio_items')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order');

      // Get social links
      const { data: socialLinks } = await supabase
        .from('user_social_links')
        .select('*')
        .eq('user_id', userId);

      // Get experiences
      const { data: experiences } = await supabase
        .from('user_experiences')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order');

      // Get education
      const { data: education } = await supabase
        .from('user_education')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order');

      // Get certifications
      const { data: certifications } = await supabase
        .from('user_certifications')
        .select('*')
        .eq('user_id', userId)
        .order('issue_date', { ascending: false });

      // Get languages
      const { data: languages } = await supabase
        .from('user_languages')
        .select('*')
        .eq('user_id', userId);

      // Transform hard skills
      const transformedSkills: UserHardSkill[] = (hardSkills || []).map(s => ({
        id: s.id,
        userId: s.user_id,
        skillId: s.skill_id || undefined,
        customSkillName: s.custom_skill_name || undefined,
        proficiencyLevel: s.proficiency_level as 1 | 2 | 3 | 4 | 5,
        createdAt: s.created_at || undefined,
        skill: (s.hard_skills_catalog as any) ? {
          id: (s.hard_skills_catalog as any).id,
          name: (s.hard_skills_catalog as any).name,
          category: (s.hard_skills_catalog as any).category,
        } : undefined,
      }));

      // Transform portfolio
      const transformedPortfolio: PortfolioItem[] = (portfolio || []).map(p => ({
        id: p.id,
        userId: p.user_id,
        itemType: p.item_type as any,
        title: p.title,
        description: p.description || undefined,
        fileUrl: p.file_url || undefined,
        externalUrl: p.external_url || undefined,
        sortOrder: p.sort_order || 0,
        createdAt: p.created_at,
      }));

      // Transform social links
      const transformedSocialLinks: SocialLink[] = (socialLinks || []).map(s => ({
        id: s.id,
        userId: s.user_id,
        platform: s.platform as any,
        url: s.url,
        createdAt: s.created_at || undefined,
      }));

      // Transform experiences
      const transformedExperiences: UserExperience[] = (experiences || []).map(e => ({
        id: e.id,
        userId: e.user_id,
        company: e.company,
        role: e.role,
        startDate: e.start_date || undefined,
        endDate: e.end_date || undefined,
        isCurrent: e.is_current || false,
        description: e.description || undefined,
        location: e.location || undefined,
        sortOrder: e.sort_order || 0,
        createdAt: e.created_at || undefined,
      }));

      // Transform education
      const transformedEducation: UserEducation[] = (education || []).map(e => ({
        id: e.id,
        userId: e.user_id,
        institution: e.institution,
        degree: e.degree,
        fieldOfStudy: e.field_of_study || undefined,
        startYear: e.start_year || undefined,
        endYear: e.end_year || undefined,
        description: e.description || undefined,
        sortOrder: e.sort_order || 0,
        createdAt: e.created_at || undefined,
      }));

      // Transform certifications
      const transformedCertifications: UserCertification[] = (certifications || []).map(c => ({
        id: c.id,
        userId: c.user_id,
        name: c.name,
        issuingOrganization: c.issuing_organization || undefined,
        issueDate: c.issue_date || undefined,
        expiryDate: c.expiry_date || undefined,
        credentialId: c.credential_id || undefined,
        credentialUrl: c.credential_url || undefined,
        createdAt: c.created_at || undefined,
      }));

      // Transform languages
      const transformedLanguages: UserLanguage[] = (languages || []).map(l => ({
        id: l.id,
        userId: l.user_id,
        language: l.language,
        proficiency: (l.proficiency || 'intermediate') as UserLanguage['proficiency'],
        createdAt: l.created_at || undefined,
      }));

      return {
        profile: {
          id: profile.id,
          email: profile.email,
          firstName: profile.first_name || undefined,
          lastName: profile.last_name || undefined,
          avatarUrl: profile.avatar_url || undefined,
          bio: profile.bio || undefined,
          location: profile.location || undefined,
          headline: profile.headline || undefined,
          jobTitle: profile.job_title || undefined,
          gender: profile.gender as 'M' | 'F' | undefined,
          age: profile.age || undefined,
          isKarmaProfile: profile.is_karma_profile || false,
          profileVisibility: (profile.profile_visibility as 'private' | 'subscribers_only') || 'private',
          lookingForWork: profile.looking_for_work || false,
          preferredWorkType: profile.preferred_work_type as any,
          yearsExperience: profile.years_experience || undefined,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
          profileCode: riasec?.profile_code || undefined,
          riasecScore: riasec ? {
            R: riasec.score_r,
            I: riasec.score_i,
            A: riasec.score_a,
            S: riasec.score_s,
            E: riasec.score_e,
            C: riasec.score_c,
          } : undefined,
          karmaData: karma ? {
            transcript: Array.isArray(karma.transcript) ? karma.transcript as any[] : [],
            summary: karma.summary || undefined,
            softSkills: karma.soft_skills || undefined,
            primaryValues: karma.primary_values || undefined,
            riskFactors: karma.risk_factors || undefined,
            seniorityAssessment: karma.seniority_assessment || undefined,
          } : undefined,
          hardSkills: transformedSkills,
          portfolio: transformedPortfolio,
          socialLinks: transformedSocialLinks,
          experiences: transformedExperiences,
          education: transformedEducation,
          certifications: transformedCertifications,
          languages: transformedLanguages,
        },
        hasRiasec: !!riasec,
        hasKarma: !!karma,
        skillsCount: hardSkills?.length || 0,
        topSkills: transformedSkills.slice(0, 3).map(s => s.skill?.name || s.customSkillName || ''),
      };
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  }, []);

  return { 
    results, 
    isLoading, 
    error, 
    totalCount, 
    search,
    fetchProfile,
  };
};
