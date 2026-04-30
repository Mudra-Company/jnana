import { useState, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import type { RequiredProfile, SeniorityLevel } from '../../types';

export type OpenPositionSource = 'role' | 'member';

export interface OpenPosition {
  /** Stable ID used by shortlist + matching. For role-source = company_roles.id, for member-source = company_members.id */
  id: string;
  /** Where this position lives: modern role-centric table or legacy company_members row */
  source: OpenPositionSource;
  jobTitle: string;
  departmentId: string | null;
  departmentName: string | null;
  requiredProfile: RequiredProfile | null;
  createdAt: string;
}

// Build a RequiredProfile out of company_roles columns so the matching engine
// (which speaks the legacy RequiredProfile shape) can consume it unchanged.
const buildRequiredProfileFromRole = (row: {
  required_hard_skills: unknown;
  required_soft_skills: unknown;
  required_seniority: string | null;
  description: string | null;
}): RequiredProfile => {
  const hardRaw = Array.isArray(row.required_hard_skills) ? row.required_hard_skills : [];
  const softRaw = Array.isArray(row.required_soft_skills) ? row.required_soft_skills : [];

  const hardSkills = hardRaw
    .map((s: any) => (typeof s === 'string' ? s : s?.name || s?.skill || ''))
    .filter(Boolean);
  const softSkills = softRaw
    .map((s: any) => (typeof s === 'string' ? s : s?.name || s?.skill || ''))
    .filter(Boolean);

  return {
    hardSkills,
    softSkills,
    seniority: (row.required_seniority as SeniorityLevel) || undefined,
    description: row.description || '',
  } as RequiredProfile;
};

export const useOpenPositions = () => {
  const [positions, setPositions] = useState<OpenPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPositions = useCallback(async (companyId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // --- 1) Modern source: company_roles where is_hiring=true and no active assignee ---
      const rolesPromise = supabase
        .from('company_roles')
        .select(`
          id,
          title,
          description,
          org_node_id,
          required_hard_skills,
          required_soft_skills,
          required_seniority,
          created_at,
          org_nodes!company_roles_org_node_id_fkey(name),
          company_role_assignments(id, end_date)
        `)
        .eq('company_id', companyId)
        .eq('is_hiring', true)
        .order('created_at', { ascending: false });

      // --- 2) Legacy source: company_members.is_hiring=true ---
      const membersPromise = supabase
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

      const [rolesRes, membersRes] = await Promise.all([rolesPromise, membersPromise]);

      if (rolesRes.error) throw rolesRes.error;
      if (membersRes.error) throw membersRes.error;

      const rolePositions: OpenPosition[] = (rolesRes.data || [])
        .filter((row: any) => {
          // Hide roles that already have an active (end_date null) assignment
          const assignments = (row.company_role_assignments as Array<{ end_date: string | null }> | null) || [];
          return !assignments.some(a => a.end_date === null);
        })
        .map((row: any) => ({
          id: row.id,
          source: 'role' as const,
          jobTitle: row.title || 'Posizione senza titolo',
          departmentId: row.org_node_id,
          departmentName: row.org_nodes?.name || null,
          requiredProfile: buildRequiredProfileFromRole(row),
          createdAt: row.created_at,
        }));

      const memberPositions: OpenPosition[] = (membersRes.data || []).map((row: any) => ({
        id: row.id,
        source: 'member' as const,
        jobTitle: row.job_title || 'Posizione senza titolo',
        departmentId: row.department_id,
        departmentName: row.org_nodes?.name || null,
        requiredProfile: (row.required_profile as RequiredProfile | null) || null,
        createdAt: row.created_at,
      }));

      const merged = [...rolePositions, ...memberPositions].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setPositions(merged);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching open positions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPositionById = useCallback(async (positionId: string): Promise<OpenPosition | null> => {
    try {
      // Try the modern company_roles table first
      const { data: roleRow, error: roleErr } = await supabase
        .from('company_roles')
        .select(`
          id,
          title,
          description,
          org_node_id,
          required_hard_skills,
          required_soft_skills,
          required_seniority,
          created_at,
          is_hiring,
          org_nodes!company_roles_org_node_id_fkey(name)
        `)
        .eq('id', positionId)
        .maybeSingle();

      if (!roleErr && roleRow) {
        return {
          id: (roleRow as any).id,
          source: 'role',
          jobTitle: (roleRow as any).title || 'Posizione senza titolo',
          departmentId: (roleRow as any).org_node_id,
          departmentName: (roleRow as any).org_nodes?.name || null,
          requiredProfile: buildRequiredProfileFromRole(roleRow as any),
          createdAt: (roleRow as any).created_at,
        };
      }

      // Fall back to legacy company_members
      const { data: memberRow, error: memberErr } = await supabase
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
        .maybeSingle();

      if (memberErr || !memberRow) return null;

      return {
        id: (memberRow as any).id,
        source: 'member',
        jobTitle: (memberRow as any).job_title || 'Posizione senza titolo',
        departmentId: (memberRow as any).department_id,
        departmentName: (memberRow as any).org_nodes?.name || null,
        requiredProfile: ((memberRow as any).required_profile as RequiredProfile | null) || null,
        createdAt: (memberRow as any).created_at,
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
