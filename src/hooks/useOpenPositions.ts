import { useState, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import type { RequiredProfile, SeniorityLevel } from '../../types';

export interface OpenPosition {
  id: string; // company_members.id
  jobTitle: string;
  departmentId: string | null;
  departmentName: string | null;
  requiredProfile: RequiredProfile | null;
  createdAt: string;
}

export const useOpenPositions = () => {
  const [positions, setPositions] = useState<OpenPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPositions = useCallback(async (companyId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all hiring positions for the company
      const { data, error: queryError } = await supabase
        .from('company_members')
        .select(`
          id,
          job_title,
          department_id,
          required_profile,
          created_at,
          org_nodes!company_members_department_id_fkey(name)
        `)
        .eq('company_id', companyId)
        .eq('is_hiring', true)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      const formattedPositions: OpenPosition[] = (data || []).map(item => ({
        id: item.id,
        jobTitle: item.job_title || 'Posizione senza titolo',
        departmentId: item.department_id,
        departmentName: (item as any).org_nodes?.name || null,
        requiredProfile: item.required_profile as RequiredProfile | null,
        createdAt: item.created_at,
      }));

      setPositions(formattedPositions);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching open positions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPositionById = useCallback(async (positionId: string): Promise<OpenPosition | null> => {
    try {
      const { data, error } = await supabase
        .from('company_members')
        .select(`
          id,
          job_title,
          department_id,
          required_profile,
          created_at,
          org_nodes!company_members_department_id_fkey(name)
        `)
        .eq('id', positionId)
        .eq('is_hiring', true)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        jobTitle: data.job_title || 'Posizione senza titolo',
        departmentId: data.department_id,
        departmentName: (data as any).org_nodes?.name || null,
        requiredProfile: data.required_profile as RequiredProfile | null,
        createdAt: data.created_at,
      };
    } catch (err) {
      console.error('Error fetching position:', err);
      return null;
    }
  }, []);

  return {
    positions,
    isLoading,
    error,
    fetchPositions,
    getPositionById,
  };
};
