import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import type { Tables } from '../integrations/supabase/types';

type Profile = Tables<'profiles'>;
type CompanyMember = Tables<'company_members'>;
type RiasecResult = Tables<'riasec_results'>;
type KarmaSession = Tables<'karma_sessions'>;
type ClimateResponse = Tables<'climate_responses'>;

export interface UserWithDetails extends Profile {
  membership?: CompanyMember;
  riasecResult?: RiasecResult;
  karmaSession?: KarmaSession;
  climateResponse?: ClimateResponse;
}

export const useProfiles = (companyId?: string) => {
  const [profiles, setProfiles] = useState<UserWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfiles = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase.from('profiles').select('*');
      
      // If companyId is provided, filter by company
      if (companyId) {
        const { data: members } = await supabase
          .from('company_members')
          .select('user_id')
          .eq('company_id', companyId);
        
        const userIds = members?.map(m => m.user_id) || [];
        
        if (userIds.length === 0) {
          setProfiles([]);
          return;
        }
        
        query = query.in('id', userIds.filter((id): id is string => id !== null));
      }

      const { data, error } = await query.order('last_name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserWithDetails = async (userId: string): Promise<UserWithDetails | null> => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      const { data: membership } = await supabase
        .from('company_members')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const { data: riasecResult } = await supabase
        .from('riasec_results')
        .select('*')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false })
        .maybeSingle();

      const { data: karmaSession } = await supabase
        .from('karma_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .maybeSingle();

      const { data: climateResponse } = await supabase
        .from('climate_responses')
        .select('*')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false })
        .maybeSingle();

      return {
        ...profile,
        membership: membership || undefined,
        riasecResult: riasecResult || undefined,
        karmaSession: karmaSession || undefined,
        climateResponse: climateResponse || undefined,
      };
    } catch (err) {
      setError(err as Error);
      return null;
    }
  };

  const updateProfile = async (userId: string, updates: Partial<Profile>) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, ...data } : p));
      return data;
    } catch (err) {
      setError(err as Error);
      return null;
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [companyId]);

  return {
    profiles,
    isLoading,
    error,
    fetchProfiles,
    fetchUserWithDetails,
    updateProfile,
  };
};
