/**
 * useRoleAssignments Hook
 * 
 * Manage person-to-role assignments in the role-centric architecture.
 * Supports multiple assignment types, FTE percentages, and historical tracking.
 */

import { useState, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import type { 
  RoleAssignment, 
  CreateAssignmentInput, 
  UpdateAssignmentInput 
} from '../types/roles';

// Helper to map DB row to RoleAssignment
const mapDbRowToAssignment = (row: Record<string, unknown>): RoleAssignment => ({
  id: row.id as string,
  roleId: row.role_id as string,
  userId: row.user_id as string | null,
  companyMemberId: row.company_member_id as string | null,
  assignmentType: (row.assignment_type as RoleAssignment['assignmentType']) || 'primary',
  startDate: row.start_date as string,
  endDate: row.end_date as string | null,
  ftePercentage: (row.fte_percentage as number) || 100,
  notes: row.notes as string | null,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});

export interface UseRoleAssignmentsResult {
  assignments: RoleAssignment[];
  isLoading: boolean;
  error: string | null;
  fetchAssignmentsByRole: (roleId: string, includeEnded?: boolean) => Promise<RoleAssignment[]>;
  fetchAssignmentsByUser: (userId: string, includeEnded?: boolean) => Promise<RoleAssignment[]>;
  createAssignment: (input: CreateAssignmentInput) => Promise<{ success: boolean; assignment?: RoleAssignment; error?: string }>;
  updateAssignment: (assignmentId: string, input: UpdateAssignmentInput) => Promise<{ success: boolean; error?: string }>;
  endAssignment: (assignmentId: string, endDate?: string) => Promise<{ success: boolean; error?: string }>;
  deleteAssignment: (assignmentId: string) => Promise<{ success: boolean; error?: string }>;
  fetchAssignmentHistory: (roleId: string) => Promise<RoleAssignment[]>;
}

export const useRoleAssignments = (): UseRoleAssignmentsResult => {
  const [assignments, setAssignments] = useState<RoleAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch assignments for a specific role
   */
  const fetchAssignmentsByRole = useCallback(async (
    roleId: string, 
    includeEnded = false
  ): Promise<RoleAssignment[]> => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
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
        .order('start_date', { ascending: false });

      if (!includeEnded) {
        query = query.is('end_date', null);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const mappedAssignments = (data || []).map(a => {
        const assignment = mapDbRowToAssignment(a as unknown as Record<string, unknown>);
        if (a.profiles) {
          assignment.user = {
            id: a.profiles.id,
            firstName: a.profiles.first_name,
            lastName: a.profiles.last_name,
            email: a.profiles.email
          } as RoleAssignment['user'];
        }
        return assignment;
      });

      setAssignments(mappedAssignments);
      return mappedAssignments;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch assignments';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch all assignments for a specific user
   */
  const fetchAssignmentsByUser = useCallback(async (
    userId: string,
    includeEnded = false
  ): Promise<RoleAssignment[]> => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('company_role_assignments')
        .select(`
          *,
          company_roles:role_id (
            id,
            title,
            code,
            status
          )
        `)
        .eq('user_id', userId)
        .order('start_date', { ascending: false });

      if (!includeEnded) {
        query = query.is('end_date', null);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      return (data || []).map(a => {
        const assignment = mapDbRowToAssignment(a as unknown as Record<string, unknown>);
        if (a.company_roles) {
          assignment.role = {
            id: a.company_roles.id,
            title: a.company_roles.title,
            code: a.company_roles.code,
            status: a.company_roles.status
          } as RoleAssignment['role'];
        }
        return assignment;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch user assignments';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch complete assignment history for a role (including ended)
   */
  const fetchAssignmentHistory = useCallback(async (roleId: string): Promise<RoleAssignment[]> => {
    return fetchAssignmentsByRole(roleId, true);
  }, [fetchAssignmentsByRole]);

  /**
   * Create a new assignment
   */
  const createAssignment = useCallback(async (
    input: CreateAssignmentInput
  ): Promise<{ success: boolean; assignment?: RoleAssignment; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const insertData = {
        role_id: input.roleId,
        user_id: input.userId || null,
        company_member_id: input.companyMemberId || null,
        assignment_type: (input.assignmentType || 'primary') as 'primary' | 'interim' | 'backup' | 'training',
        start_date: input.startDate || new Date().toISOString().split('T')[0],
        end_date: input.endDate || null,
        fte_percentage: input.ftePercentage ?? 100,
        notes: input.notes || null
      };

      const { data, error: insertError } = await supabase
        .from('company_role_assignments')
        .insert(insertData)
        .select()
        .single();

      if (insertError) throw insertError;
      if (!data) throw new Error('No data returned from insert');

      const newAssignment = mapDbRowToAssignment(data as unknown as Record<string, unknown>);
      setAssignments(prev => [...prev, newAssignment]);

      return { success: true, assignment: newAssignment };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create assignment';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update an existing assignment
   */
  const updateAssignment = useCallback(async (
    assignmentId: string,
    input: UpdateAssignmentInput
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const updateData: Record<string, unknown> = {};
      
      if (input.assignmentType !== undefined) updateData.assignment_type = input.assignmentType;
      if (input.startDate !== undefined) updateData.start_date = input.startDate;
      if (input.endDate !== undefined) updateData.end_date = input.endDate;
      if (input.ftePercentage !== undefined) updateData.fte_percentage = input.ftePercentage;
      if (input.notes !== undefined) updateData.notes = input.notes;

      const { error: updateError } = await supabase
        .from('company_role_assignments')
        .update(updateData)
        .eq('id', assignmentId);

      if (updateError) throw updateError;

      setAssignments(prev => prev.map(a =>
        a.id === assignmentId
          ? { ...a, ...input, updatedAt: new Date().toISOString() }
          : a
      ));

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update assignment';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * End an assignment (set end_date to mark as historical)
   */
  const endAssignment = useCallback(async (
    assignmentId: string,
    endDate?: string
  ): Promise<{ success: boolean; error?: string }> => {
    return updateAssignment(assignmentId, {
      endDate: endDate || new Date().toISOString().split('T')[0]
    });
  }, [updateAssignment]);

  /**
   * Delete an assignment permanently
   */
  const deleteAssignment = useCallback(async (
    assignmentId: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('company_role_assignments')
        .delete()
        .eq('id', assignmentId);

      if (deleteError) throw deleteError;

      setAssignments(prev => prev.filter(a => a.id !== assignmentId));

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete assignment';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    assignments,
    isLoading,
    error,
    fetchAssignmentsByRole,
    fetchAssignmentsByUser,
    createAssignment,
    updateAssignment,
    endAssignment,
    deleteAssignment,
    fetchAssignmentHistory
  };
};
