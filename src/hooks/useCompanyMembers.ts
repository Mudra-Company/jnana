import { useState, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import type { Json } from '../integrations/supabase/types';

export interface RequiredProfileData {
  hardSkills?: string[];
  softSkills?: string[];
  seniority?: string;
}

export interface CompanyMemberInput {
  companyId: string;
  departmentId: string;
  jobTitle: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  isHiring?: boolean;
  requiredProfile?: RequiredProfileData;
}

export interface CompanyMember {
  id: string;
  user_id: string | null;
  company_id: string;
  department_id: string | null;
  role: 'admin' | 'user' | 'super_admin';
  status: 'pending' | 'invited' | 'test_completed' | 'completed';
  is_hiring: boolean | null;
  required_profile: Json | null;
  job_title: string | null;
  placeholder_first_name: string | null;
  placeholder_last_name: string | null;
  placeholder_email: string | null;
  created_at: string;
}

const toJson = (obj: RequiredProfileData | undefined): Json | undefined => {
  if (!obj) return undefined;
  return obj as unknown as Json;
};

export const useCompanyMembers = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Creates a new company member entry.
   * If email is provided and user exists, links them.
   * Otherwise, creates a placeholder entry for hiring/empty slots.
   */
  const createCompanyMember = useCallback(async (input: CompanyMemberInput): Promise<{ success: boolean; memberId?: string; userId?: string; error?: string }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      let userId: string | null = null;

      // If email is provided, check if user/profile already exists
      if (input.email) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('email', input.email)
          .maybeSingle();
        
        if (existingProfile) {
          userId = existingProfile.id;
        }
      }

      // Validate department_id exists in org_nodes (if provided)
      let validDepartmentId: string | null = null;
      if (input.departmentId) {
        const { data: orgNode } = await supabase
          .from('org_nodes')
          .select('id')
          .eq('id', input.departmentId)
          .maybeSingle();
        
        validDepartmentId = orgNode?.id || null;
        
        if (!orgNode) {
          console.warn('[useCompanyMembers] department_id not found in org_nodes, using null');
        }
      }

      // Prepare required_profile as Json
      const requiredProfileJson: Json = input.requiredProfile ? {
        hardSkills: input.requiredProfile.hardSkills || [],
        softSkills: input.requiredProfile.softSkills || [],
        seniority: input.requiredProfile.seniority || 'Mid'
      } : {};

      // Determine is_hiring status:
      // - If user_id exists -> NOT hiring (real user assigned)
      // - If no user_id BUT has name/email -> NOT hiring (identified person, pending invite)
      // - If no user_id AND no name/email -> IS hiring (empty slot)
      const hasUserId = userId !== null;
      const hasPlaceholderInfo = !!(input.email || (input.firstName && input.lastName));
      const isHiringValue = input.isHiring ?? (!hasUserId && !hasPlaceholderInfo);

      // Create the company_member entry
      const insertData: {
        company_id: string;
        department_id: string | null;
        user_id?: string;
        role: 'user';
        status: 'pending' | 'invited' | 'test_completed' | 'completed';
        is_hiring: boolean;
        required_profile: Json;
        job_title: string;
        placeholder_first_name?: string;
        placeholder_last_name?: string;
        placeholder_email?: string;
      } = {
        company_id: input.companyId,
        department_id: validDepartmentId,
        role: 'user' as const,
        status: hasUserId ? 'invited' : 'pending',
        is_hiring: isHiringValue,
        required_profile: requiredProfileJson,
        job_title: input.jobTitle
      };

      // Add user_id if we found an existing user
      if (userId) {
        insertData.user_id = userId;
      }
      
      // Store placeholder info for invites without existing user
      if (!userId && input.firstName) {
        insertData.placeholder_first_name = input.firstName;
      }
      if (!userId && input.lastName) {
        insertData.placeholder_last_name = input.lastName;
      }
      if (!userId && input.email) {
        insertData.placeholder_email = input.email;
      }

      const { data: member, error: memberError } = await supabase
        .from('company_members')
        .insert(insertData)
        .select()
        .single();

      if (memberError) {
        throw memberError;
      }

      setIsLoading(false);
      return { 
        success: true, 
        memberId: member.id, 
        userId: userId || undefined 
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create company member';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Updates an existing company member's department, job title, required profile, or placeholder info
   */
  const updateCompanyMember = useCallback(async (
    memberId: string, 
    updates: {
      department_id?: string;
      is_hiring?: boolean;
      required_profile?: RequiredProfileData;
      job_title?: string;
      placeholder_first_name?: string;
      placeholder_last_name?: string;
      placeholder_email?: string;
    }
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const updateData: {
        department_id?: string;
        is_hiring?: boolean;
        required_profile?: Json;
        job_title?: string;
        placeholder_first_name?: string;
        placeholder_last_name?: string;
        placeholder_email?: string;
      } = {};
      
      if (updates.department_id !== undefined) updateData.department_id = updates.department_id;
      if (updates.is_hiring !== undefined) updateData.is_hiring = updates.is_hiring;
      if (updates.job_title !== undefined) updateData.job_title = updates.job_title;
      if (updates.placeholder_first_name !== undefined) updateData.placeholder_first_name = updates.placeholder_first_name;
      if (updates.placeholder_last_name !== undefined) updateData.placeholder_last_name = updates.placeholder_last_name;
      if (updates.placeholder_email !== undefined) updateData.placeholder_email = updates.placeholder_email;
      if (updates.required_profile) {
        updateData.required_profile = {
          hardSkills: updates.required_profile.hardSkills || [],
          softSkills: updates.required_profile.softSkills || [],
          seniority: updates.required_profile.seniority || 'Mid'
        };
      }

      const { error: updateError } = await supabase
        .from('company_members')
        .update(updateData)
        .eq('id', memberId);

      if (updateError) {
        throw updateError;
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update company member';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Assigns an existing user to a slot (updates their department_id and required_profile)
   */
  const assignUserToSlot = useCallback(async (
    userId: string,
    companyId: string,
    departmentId: string,
    requiredProfile?: RequiredProfileData,
    jobTitle?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      // Find existing company_member for this user
      const { data: existingMember } = await supabase
        .from('company_members')
        .select('id')
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .maybeSingle();

      const requiredProfileJson: Json | undefined = requiredProfile ? {
        hardSkills: requiredProfile.hardSkills || [],
        softSkills: requiredProfile.softSkills || [],
        seniority: requiredProfile.seniority || 'Mid'
      } : undefined;

      if (existingMember) {
        // Update existing member
        const updateData: {
          department_id: string;
          is_hiring: boolean;
          required_profile?: Json;
          job_title?: string;
        } = {
          department_id: departmentId,
          is_hiring: false
        };
        
        if (requiredProfileJson) {
          updateData.required_profile = requiredProfileJson;
        }
        if (jobTitle) {
          updateData.job_title = jobTitle;
        }

        const { error: updateError } = await supabase
          .from('company_members')
          .update(updateData)
          .eq('id', existingMember.id);

        if (updateError) throw updateError;
      } else {
        // Create new company_member for this user
        const insertData: {
          user_id: string;
          company_id: string;
          department_id: string;
          role: 'user';
          status: 'test_completed';
          is_hiring: boolean;
          required_profile?: Json;
          job_title?: string;
        } = {
          user_id: userId,
          company_id: companyId,
          department_id: departmentId,
          role: 'user',
          status: 'test_completed',
          is_hiring: false
        };
        
        if (requiredProfileJson) {
          insertData.required_profile = requiredProfileJson;
        }
        if (jobTitle) {
          insertData.job_title = jobTitle;
        }

        const { error: insertError } = await supabase
          .from('company_members')
          .insert(insertData);

        if (insertError) throw insertError;
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign user to slot';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Deletes a company member (used for removing empty slots)
   */
  const deleteCompanyMember = useCallback(async (memberId: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('company_members')
        .delete()
        .eq('id', memberId);

      if (deleteError) {
        throw deleteError;
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete company member';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Fetches all company members for a company
   */
  const fetchCompanyMembers = useCallback(async (companyId: string): Promise<CompanyMember[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('company_members')
        .select('*')
        .eq('company_id', companyId);

      if (fetchError) {
        throw fetchError;
      }

      setIsLoading(false);
      return (data || []) as CompanyMember[];
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch company members';
      setError(errorMessage);
      setIsLoading(false);
      return [];
    }
  }, []);

  /**
   * Updates a company member's role (admin/user)
   */
  const updateMemberRole = useCallback(async (
    memberId: string,
    newRole: 'admin' | 'user'
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('company_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (updateError) {
        throw updateError;
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update member role';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  return {
    isLoading,
    error,
    createCompanyMember,
    updateCompanyMember,
    updateMemberRole,
    assignUserToSlot,
    deleteCompanyMember,
    fetchCompanyMembers
  };
};
