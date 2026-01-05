import { useState, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import type { KarmaProfile } from '../types/karma';

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
  skills?: string[];
  locations?: string[];
}

export interface KarmaSearchResult {
  profile: KarmaProfile;
  hasRiasec: boolean;
  hasKarma: boolean;
  skillsCount: number;
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
      // Get company members to filter them out
      const { data: members } = await supabase
        .from('company_members')
        .select('user_id');

      const memberUserIds = new Set(members?.map(m => m.user_id) || []);

      // Build query
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' });

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

      // Pagination
      query = query
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      const { data: profiles, error: profilesError, count } = await query;

      if (profilesError) throw profilesError;

      // Filter to only Karma profiles (not company members)
      const karmaProfiles = profiles?.filter(p => 
        p.is_karma_profile === true || !memberUserIds.has(p.id)
      ) || [];

      const karmaProfileIds = karmaProfiles.map(p => p.id);

      // Get RIASEC results
      const { data: riasecResults } = await supabase
        .from('riasec_results')
        .select('user_id, profile_code, score_r, score_i, score_a, score_s, score_e, score_c')
        .in('user_id', karmaProfileIds);

      const riasecByUser = new Map(riasecResults?.map(r => [r.user_id, r]) || []);

      // Get Karma sessions
      const { data: karmaSessions } = await supabase
        .from('karma_sessions')
        .select('user_id, summary, soft_skills, primary_values, risk_factors, seniority_assessment')
        .in('user_id', karmaProfileIds);

      const karmaByUser = new Map(karmaSessions?.map(k => [k.user_id, k]) || []);

      // Get hard skills count
      const { data: skillsCounts } = await supabase
        .from('user_hard_skills')
        .select('user_id')
        .in('user_id', karmaProfileIds);

      const skillsCountByUser: Record<string, number> = {};
      skillsCounts?.forEach(s => {
        skillsCountByUser[s.user_id] = (skillsCountByUser[s.user_id] || 0) + 1;
      });

      // Apply has completed tests filter
      let filteredProfiles = karmaProfiles;
      if (filters.hasCompletedTests) {
        filteredProfiles = karmaProfiles.filter(p => riasecByUser.has(p.id));
      }

      // Build results
      const searchResults: KarmaSearchResult[] = filteredProfiles.map(p => {
        const riasec = riasecByUser.get(p.id);
        const karma = karmaByUser.get(p.id);

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
            profileVisibility: (p.profile_visibility as 'private' | 'subscribers_only') || 'private',
            lookingForWork: p.looking_for_work || false,
            preferredWorkType: p.preferred_work_type as any,
            yearsExperience: p.years_experience || undefined,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
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
          skillsCount: skillsCountByUser[p.id] || 0,
        };
      });

      setResults(searchResults);
      setTotalCount(count || 0);
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

      // Get skills count
      const { count: skillsCount } = await supabase
        .from('user_hard_skills')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

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
        },
        hasRiasec: !!riasec,
        hasKarma: !!karma,
        skillsCount: skillsCount || 0,
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
