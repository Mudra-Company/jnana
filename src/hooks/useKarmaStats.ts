import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';

export interface KarmaStats {
  totalProfiles: number;
  profilesWithTests: number;
  lookingForWork: number;
  newThisWeek: number;
  newThisMonth: number;
  topSkills: { name: string; count: number }[];
  locationDistribution: { location: string; count: number }[];
}

export const useKarmaStats = () => {
  const [stats, setStats] = useState<KarmaStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get all Karma profiles (profiles without company membership OR with is_karma_profile = true)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, is_karma_profile, looking_for_work, location, created_at');

      if (profilesError) throw profilesError;

      // Get company members to filter out users that belong to companies
      const { data: members, error: membersError } = await supabase
        .from('company_members')
        .select('user_id');

      if (membersError) throw membersError;

      const memberUserIds = new Set(members?.map(m => m.user_id) || []);
      
      // Karma profiles = those marked as karma OR those without company membership
      const karmaProfiles = profiles?.filter(p => 
        p.is_karma_profile === true || !memberUserIds.has(p.id)
      ) || [];

      const karmaProfileIds = karmaProfiles.map(p => p.id);

      // Get RIASEC results for karma profiles
      const { data: riasecResults } = await supabase
        .from('riasec_results')
        .select('user_id')
        .in('user_id', karmaProfileIds);

      const profilesWithTests = new Set(riasecResults?.map(r => r.user_id) || []).size;

      // Calculate time-based stats
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const newThisWeek = karmaProfiles.filter(p => 
        new Date(p.created_at) >= weekAgo
      ).length;

      const newThisMonth = karmaProfiles.filter(p => 
        new Date(p.created_at) >= monthAgo
      ).length;

      // Get hard skills distribution
      const { data: skills } = await supabase
        .from('user_hard_skills')
        .select(`
          skill_id,
          custom_skill_name,
          hard_skills_catalog (name)
        `)
        .in('user_id', karmaProfileIds);

      const skillCounts: Record<string, number> = {};
      skills?.forEach(s => {
        const skillName = (s.hard_skills_catalog as any)?.name || s.custom_skill_name || 'Unknown';
        skillCounts[skillName] = (skillCounts[skillName] || 0) + 1;
      });

      const topSkills = Object.entries(skillCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Location distribution
      const locationCounts: Record<string, number> = {};
      karmaProfiles.forEach(p => {
        if (p.location) {
          locationCounts[p.location] = (locationCounts[p.location] || 0) + 1;
        }
      });

      const locationDistribution = Object.entries(locationCounts)
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setStats({
        totalProfiles: karmaProfiles.length,
        profilesWithTests,
        lookingForWork: karmaProfiles.filter(p => p.looking_for_work === true).length,
        newThisWeek,
        newThisMonth,
        topSkills,
        locationDistribution,
      });
    } catch (err) {
      console.error('Error fetching Karma stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, error, refetch: fetchStats };
};
