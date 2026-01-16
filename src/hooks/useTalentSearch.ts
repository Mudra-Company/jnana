import { useState, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSubscription } from './useSubscription';
import type { KarmaProfile, CandidateMatch, TalentSearchFilters, WorkType } from '../types/karma';
import type { RiasecScore, ChatMessage, SeniorityLevel } from '../../types';

export const useTalentSearch = () => {
  const { membership } = useAuth();
  const { canViewProfiles, logProfileView } = useSubscription();
  
  const [candidates, setCandidates] = useState<CandidateMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Calculate RIASEC match score between two profiles
  const calculateRiasecMatch = (candidate: RiasecScore, target: RiasecScore): number => {
    const dimensions: (keyof RiasecScore)[] = ['R', 'I', 'A', 'S', 'E', 'C'];
    let totalDiff = 0;
    let maxDiff = 0;

    dimensions.forEach(dim => {
      const diff = Math.abs((candidate[dim] || 0) - (target[dim] || 0));
      totalDiff += diff;
      maxDiff += 100;
    });

    return Math.round(100 - (totalDiff / maxDiff) * 100);
  };

  // Calculate skills match
  const calculateSkillsMatch = (
    candidateSkills: string[], 
    requiredSkills: string[]
  ): { score: number; overlap: string[]; missing: string[] } => {
    if (!requiredSkills.length) return { score: 100, overlap: candidateSkills, missing: [] };

    const normalizedCandidateSkills = candidateSkills.map(s => s.toLowerCase());

    const overlap = requiredSkills.filter(s => 
      normalizedCandidateSkills.includes(s.toLowerCase())
    );
    const missing = requiredSkills.filter(s => 
      !normalizedCandidateSkills.includes(s.toLowerCase())
    );

    const score = Math.round((overlap.length / requiredSkills.length) * 100);

    return { score, overlap, missing };
  };

  // Search candidates with filters
  const searchCandidates = useCallback(async (
    filters: TalentSearchFilters,
    targetRiasec?: RiasecScore,
    requiredSkills?: string[]
  ) => {
    if (!membership?.company_id) {
      setError(new Error('No company context'));
      return;
    }

    try {
      setIsLoading(true);
      setCandidates([]);

      // Build query for karma profiles
      let query = supabase
        .from('profiles')
        .select(`
          *,
          user_hard_skills(
            *,
            skill:hard_skills_catalog(*)
          ),
          riasec_results(
            score_r, score_i, score_a, score_s, score_e, score_c, profile_code
          ),
          karma_sessions(
            soft_skills, seniority_assessment
          )
        `)
        .eq('is_karma_profile', true)
        .eq('profile_visibility', 'subscribers_only');

      // Apply filters
      if (filters.lookingForWorkOnly) {
        query = query.eq('looking_for_work', true);
      }

      if (filters.locations?.length) {
        query = query.in('location', filters.locations);
      }

      if (filters.workTypes?.length) {
        query = query.in('preferred_work_type', filters.workTypes);
      }

      if (filters.minExperience !== undefined) {
        query = query.gte('years_experience', filters.minExperience);
      }

      if (filters.maxExperience !== undefined) {
        query = query.lte('years_experience', filters.maxExperience);
      }

      if (filters.query) {
        query = query.or(`first_name.ilike.%${filters.query}%,last_name.ilike.%${filters.query}%,headline.ilike.%${filters.query}%`);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      // Process and score candidates
      const scoredCandidates: CandidateMatch[] = (data || []).map(candidate => {
        // Get candidate's skills
        const candidateSkills = ((candidate as any).user_hard_skills || []).map((s: any) => 
          s.skill?.name || s.custom_skill_name
        ).filter(Boolean);

        // Get RIASEC score
        const latestRiasec = (candidate as any).riasec_results?.[0];
        const candidateRiasec: RiasecScore | undefined = latestRiasec ? {
          R: latestRiasec.score_r,
          I: latestRiasec.score_i,
          A: latestRiasec.score_a,
          S: latestRiasec.score_s,
          E: latestRiasec.score_e,
          C: latestRiasec.score_c,
        } : undefined;

        // Get soft skills from karma session
        const latestKarma = (candidate as any).karma_sessions?.[0];
        const softSkills = latestKarma?.soft_skills || [];
        const seniorityAssessment = latestKarma?.seniority_assessment as SeniorityLevel | undefined;

        // Calculate match scores
        const riasecMatch = targetRiasec && candidateRiasec 
          ? calculateRiasecMatch(candidateRiasec, targetRiasec)
          : 50;

        const skillsResult = calculateSkillsMatch(candidateSkills, requiredSkills || []);

        // Seniority match
        const seniorityMatch = !filters.seniorityLevels?.length || 
          (seniorityAssessment && filters.seniorityLevels.includes(seniorityAssessment));

        // Overall score (weighted)
        const matchScore = Math.round(
          (riasecMatch * 0.3) + 
          (skillsResult.score * 0.5) + 
          (seniorityMatch ? 20 : 0)
        );

        // Build karma profile
        const profile: KarmaProfile = {
          id: candidate.id,
          email: candidate.email,
          firstName: candidate.first_name || undefined,
          lastName: candidate.last_name || undefined,
          avatarUrl: candidate.avatar_url || undefined,
          bio: (candidate as any).bio || undefined,
          location: (candidate as any).location || undefined,
          headline: (candidate as any).headline || undefined,
          jobTitle: candidate.job_title || undefined,
          isKarmaProfile: true,
          profileVisibility: 'subscribers_only',
          lookingForWork: (candidate as any).looking_for_work || false,
          preferredWorkType: (candidate as any).preferred_work_type as WorkType | undefined,
          yearsExperience: (candidate as any).years_experience || undefined,
          createdAt: candidate.created_at,
          updatedAt: candidate.updated_at,
          riasecScore: candidateRiasec,
          profileCode: latestRiasec?.profile_code || undefined,
          karmaData: {
            transcript: [],
            softSkills,
            seniorityAssessment,
          },
        };

        return {
          profile,
          matchScore,
          riasecMatch,
          skillsMatch: skillsResult.score,
          skillsOverlap: skillsResult.overlap,
          missingSkills: skillsResult.missing,
          seniorityMatch: !!seniorityMatch,
        };
      });

      // Sort by: 1) looking for work (priority), 2) match score
      scoredCandidates.sort((a, b) => {
        // Prioritize candidates actively looking for work
        if (a.profile.lookingForWork !== b.profile.lookingForWork) {
          return a.profile.lookingForWork ? -1 : 1;
        }
        // Then sort by match score
        return b.matchScore - a.matchScore;
      });

      setCandidates(scoredCandidates);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [membership?.company_id]);

  // View a candidate's full profile (logs the view)
  const viewCandidate = useCallback(async (candidateId: string): Promise<KarmaProfile | null> => {
    if (!canViewProfiles()) {
      setError(new Error('Profile view limit reached'));
      return null;
    }

    try {
      // Log the view
      await logProfileView(candidateId);

      // Fetch full profile data
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_hard_skills(*, skill:hard_skills_catalog(*)),
          user_portfolio_items(*),
          user_social_links(*),
          riasec_results(*),
          karma_sessions(*)
        `)
        .eq('id', candidateId)
        .single();

      if (error) throw error;

      // Format and return
      const profile: KarmaProfile = {
        id: data.id,
        email: data.email,
        firstName: data.first_name || undefined,
        lastName: data.last_name || undefined,
        avatarUrl: data.avatar_url || undefined,
        bio: (data as any).bio || undefined,
        location: (data as any).location || undefined,
        headline: (data as any).headline || undefined,
        jobTitle: data.job_title || undefined,
        isKarmaProfile: true,
        profileVisibility: 'subscribers_only',
        lookingForWork: (data as any).looking_for_work || false,
        preferredWorkType: (data as any).preferred_work_type as WorkType | undefined,
        yearsExperience: (data as any).years_experience || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        hardSkills: ((data as any).user_hard_skills || []).map((s: any) => ({
          id: s.id,
          userId: s.user_id,
          skillId: s.skill_id,
          customSkillName: s.custom_skill_name,
          proficiencyLevel: s.proficiency_level,
          skill: s.skill ? {
            id: s.skill.id,
            name: s.skill.name,
            category: s.skill.category,
          } : undefined,
        })),
        portfolio: ((data as any).user_portfolio_items || []).map((p: any) => ({
          id: p.id,
          userId: p.user_id,
          itemType: p.item_type,
          title: p.title,
          description: p.description,
          fileUrl: p.file_url,
          externalUrl: p.external_url,
          sortOrder: p.sort_order,
          createdAt: p.created_at,
        })),
        socialLinks: ((data as any).user_social_links || []).map((s: any) => ({
          id: s.id,
          userId: s.user_id,
          platform: s.platform,
          url: s.url,
        })),
      };

      // Add RIASEC data
      const latestRiasec = (data as any).riasec_results?.[0];
      if (latestRiasec) {
        profile.riasecScore = {
          R: latestRiasec.score_r,
          I: latestRiasec.score_i,
          A: latestRiasec.score_a,
          S: latestRiasec.score_s,
          E: latestRiasec.score_e,
          C: latestRiasec.score_c,
        };
        profile.profileCode = latestRiasec.profile_code;
      }

      // Add Karma data
      const latestKarma = (data as any).karma_sessions?.[0];
      if (latestKarma) {
        profile.karmaData = {
          transcript: (latestKarma.transcript as ChatMessage[]) || [],
          summary: latestKarma.summary,
          softSkills: latestKarma.soft_skills || [],
          primaryValues: latestKarma.primary_values || [],
          riskFactors: latestKarma.risk_factors || [],
          seniorityAssessment: latestKarma.seniority_assessment,
        };
      }

      return profile;
    } catch (err) {
      setError(err as Error);
      return null;
    }
  }, [canViewProfiles, logProfileView]);

  return {
    candidates,
    isLoading,
    error,
    searchCandidates,
    viewCandidate,
  };
};
