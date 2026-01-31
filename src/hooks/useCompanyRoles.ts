/**
 * useCompanyRoles Hook
 * 
 * CRUD operations for company roles in the role-centric architecture.
 * Roles are the primary organizational entities to which people are assigned.
 */

import { useState, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import type { Json } from '../integrations/supabase/types';
import type { 
  CompanyRole, 
  CreateRoleInput, 
  UpdateRoleInput,
  RoleAssignment
} from '../types/roles';

// Helper to convert snake_case DB row to camelCase CompanyRole
const mapDbRowToRole = (row: Record<string, unknown>): CompanyRole => ({
  id: row.id as string,
  companyId: row.company_id as string,
  orgNodeId: row.org_node_id as string | null,
  title: row.title as string,
  code: row.code as string | null,
  description: row.description as string | null,
  responsibilities: (row.responsibilities as string[]) || [],
  dailyTasks: (row.daily_tasks as string[]) || [],
  kpis: (row.kpis as CompanyRole['kpis']) || [],
  requiredHardSkills: (row.required_hard_skills as CompanyRole['requiredHardSkills']) || [],
  requiredSoftSkills: (row.required_soft_skills as CompanyRole['requiredSoftSkills']) || [],
  requiredSeniority: row.required_seniority as CompanyRole['requiredSeniority'],
  requiredEducation: (row.required_education as CompanyRole['requiredEducation']) || [],
  requiredCertifications: (row.required_certifications as string[]) || [],
  requiredLanguages: (row.required_languages as CompanyRole['requiredLanguages']) || [],
  yearsExperienceMin: row.years_experience_min as number | null,
  yearsExperienceMax: row.years_experience_max as number | null,
  ccnlLevel: row.ccnl_level as string | null,
  ralRangeMin: row.ral_range_min as number | null,
  ralRangeMax: row.ral_range_max as number | null,
  contractType: row.contract_type as CompanyRole['contractType'],
  workHoursType: (row.work_hours_type as CompanyRole['workHoursType']) || 'full_time',
  remotePolicy: (row.remote_policy as CompanyRole['remotePolicy']) || 'on_site',
  reportsToRoleId: row.reports_to_role_id as string | null,
  status: (row.status as CompanyRole['status']) || 'active',
  headcount: (row.headcount as number) || 1,
  isHiring: (row.is_hiring as boolean) || false,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});

// Helper to convert camelCase input to snake_case for DB
const mapInputToDbRow = (input: CreateRoleInput | UpdateRoleInput): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  
  if ('companyId' in input && input.companyId) result.company_id = input.companyId;
  if ('orgNodeId' in input) result.org_node_id = input.orgNodeId || null;
  if ('title' in input && input.title) result.title = input.title;
  if ('code' in input) result.code = input.code || null;
  if ('description' in input) result.description = input.description || null;
  if ('responsibilities' in input) result.responsibilities = input.responsibilities || [];
  if ('dailyTasks' in input) result.daily_tasks = input.dailyTasks || [];
  if ('kpis' in input) result.kpis = input.kpis || [];
  if ('requiredHardSkills' in input) result.required_hard_skills = input.requiredHardSkills || [];
  if ('requiredSoftSkills' in input) result.required_soft_skills = input.requiredSoftSkills || [];
  if ('requiredSeniority' in input) result.required_seniority = input.requiredSeniority || null;
  if ('requiredEducation' in input) result.required_education = input.requiredEducation || [];
  if ('requiredCertifications' in input) result.required_certifications = input.requiredCertifications || [];
  if ('requiredLanguages' in input) result.required_languages = input.requiredLanguages || [];
  if ('yearsExperienceMin' in input) result.years_experience_min = input.yearsExperienceMin ?? null;
  if ('yearsExperienceMax' in input) result.years_experience_max = input.yearsExperienceMax ?? null;
  if ('ccnlLevel' in input) result.ccnl_level = input.ccnlLevel || null;
  if ('ralRangeMin' in input) result.ral_range_min = input.ralRangeMin ?? null;
  if ('ralRangeMax' in input) result.ral_range_max = input.ralRangeMax ?? null;
  if ('contractType' in input) result.contract_type = input.contractType || null;
  if ('workHoursType' in input) result.work_hours_type = input.workHoursType || 'full_time';
  if ('remotePolicy' in input) result.remote_policy = input.remotePolicy || 'on_site';
  if ('reportsToRoleId' in input) result.reports_to_role_id = input.reportsToRoleId || null;
  if ('status' in input) result.status = input.status || 'active';
  if ('headcount' in input) result.headcount = input.headcount ?? 1;
  if ('isHiring' in input) result.is_hiring = input.isHiring ?? false;
  
  return result;
};

export interface UseCompanyRolesResult {
  roles: CompanyRole[];
  isLoading: boolean;
  error: string | null;
  fetchRoles: (companyId: string) => Promise<CompanyRole[]>;
  fetchRolesByOrgNode: (orgNodeId: string) => Promise<CompanyRole[]>;
  fetchRoleById: (roleId: string) => Promise<CompanyRole | null>;
  createRole: (input: CreateRoleInput) => Promise<{ success: boolean; role?: CompanyRole; error?: string }>;
  updateRole: (roleId: string, input: UpdateRoleInput) => Promise<{ success: boolean; error?: string }>;
  deleteRole: (roleId: string) => Promise<{ success: boolean; error?: string }>;
  fetchRoleWithAssignments: (roleId: string) => Promise<CompanyRole | null>;
}

export const useCompanyRoles = (): UseCompanyRolesResult => {
  const [roles, setRoles] = useState<CompanyRole[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all roles for a company
   */
  const fetchRoles = useCallback(async (companyId: string): Promise<CompanyRole[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('company_roles')
        .select('*')
        .eq('company_id', companyId)
        .order('title');

      if (fetchError) throw fetchError;

      const mappedRoles = (data || []).map(row => mapDbRowToRole(row as unknown as Record<string, unknown>));
      setRoles(mappedRoles);
      return mappedRoles;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch roles';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch roles for a specific org node (department/team)
   */
  const fetchRolesByOrgNode = useCallback(async (orgNodeId: string): Promise<CompanyRole[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('company_roles')
        .select('*')
        .eq('org_node_id', orgNodeId)
        .order('title');

      if (fetchError) throw fetchError;

      return (data || []).map(row => mapDbRowToRole(row as unknown as Record<string, unknown>));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch roles';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch a single role by ID
   */
  const fetchRoleById = useCallback(async (roleId: string): Promise<CompanyRole | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('company_roles')
        .select('*')
        .eq('id', roleId)
        .single();

      if (fetchError) throw fetchError;

      return data ? mapDbRowToRole(data as unknown as Record<string, unknown>) : null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch role';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch a role with its current assignments
   */
  const fetchRoleWithAssignments = useCallback(async (roleId: string): Promise<CompanyRole | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch role
      const { data: roleData, error: roleError } = await supabase
        .from('company_roles')
        .select('*')
        .eq('id', roleId)
        .single();

      if (roleError) throw roleError;
      if (!roleData) return null;

      const role = mapDbRowToRole(roleData as unknown as Record<string, unknown>);

      // Fetch active assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('company_role_assignments')
        .select(`
          *,
          profiles:user_id (
            id,
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .eq('role_id', roleId)
        .is('end_date', null)
        .order('assignment_type');

      if (assignmentsError) throw assignmentsError;

      // Map assignments
      role.assignments = (assignmentsData || []).map(a => {
        const profileData = a.profiles as { id: string; first_name: string; last_name: string; email: string; avatar_url?: string } | null;
        return {
          id: a.id,
          roleId: a.role_id,
          userId: a.user_id,
          companyMemberId: a.company_member_id,
          assignmentType: a.assignment_type,
          startDate: a.start_date,
          endDate: a.end_date,
          ftePercentage: a.fte_percentage,
          notes: a.notes,
          createdAt: a.created_at,
          updatedAt: a.updated_at,
          user: profileData ? {
            id: profileData.id,
            firstName: profileData.first_name,
            lastName: profileData.last_name,
            email: profileData.email
          } : null
        } as RoleAssignment;
      });

      // Set current primary assignee - simplified user info
      const primaryAssignment = role.assignments.find(a => a.assignmentType === 'primary');
      if (primaryAssignment?.user) {
        role.currentAssignee = primaryAssignment.user;
      }

      return role;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch role with assignments';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a new role
   */
  const createRole = useCallback(async (input: CreateRoleInput): Promise<{ success: boolean; role?: CompanyRole; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const dbRow = mapInputToDbRow(input) as {
        company_id: string;
        title: string;
        [key: string]: unknown;
      };

      // Ensure required fields are present
      if (!dbRow.company_id || !dbRow.title) {
        throw new Error('company_id and title are required');
      }

      // Use type assertion because the generated types may not be updated yet
      const { data, error: insertError } = await (supabase
        .from('company_roles') as unknown as { 
          insert: (row: Record<string, unknown>) => { select: () => { single: () => Promise<{ data: Record<string, unknown> | null; error: Error | null }> } } 
        })
        .insert(dbRow)
        .select()
        .single();

      if (insertError) throw insertError;
      if (!data) throw new Error('No data returned from insert');

      const newRole = mapDbRowToRole(data);
      setRoles(prev => [...prev, newRole]);
      
      return { success: true, role: newRole };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create role';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update an existing role
   */
  const updateRole = useCallback(async (roleId: string, input: UpdateRoleInput): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const dbRow = mapInputToDbRow(input);

      const { error: updateError } = await supabase
        .from('company_roles')
        .update(dbRow as Record<string, Json>)
        .eq('id', roleId);

      if (updateError) throw updateError;

      // Update local state
      setRoles(prev => prev.map(role => 
        role.id === roleId 
          ? { ...role, ...input, updatedAt: new Date().toISOString() }
          : role
      ));

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update role';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Delete a role
   */
  const deleteRole = useCallback(async (roleId: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('company_roles')
        .delete()
        .eq('id', roleId);

      if (deleteError) throw deleteError;

      setRoles(prev => prev.filter(role => role.id !== roleId));
      
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete role';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    roles,
    isLoading,
    error,
    fetchRoles,
    fetchRolesByOrgNode,
    fetchRoleById,
    createRole,
    updateRole,
    deleteRole,
    fetchRoleWithAssignments
  };
};
