import { supabase } from '../integrations/supabase/client';
import type { User } from '../../types';
import { profileToLegacyUser } from './adapters';

/**
 * Pure data loaders extracted from App.tsx as part of Phase 3 / Step 2 of the
 * routing refactor. These functions have no React state dependencies — they
 * fetch data from Supabase and return plain objects. App.tsx (and future
 * route components) call them and feed results into local state.
 */

/** Load all companies (Super Admin only). */
export async function loadAllCompanies() {
  console.log('[dataLoaders] Loading all companies for Super Admin...');
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('name');

  if (error) {
    console.error('[dataLoaders] Error loading companies:', error);
    return [];
  }
  console.log('[dataLoaders] Companies loaded:', data?.length || 0);
  return data || [];
}

/** Load all users across all companies (Super Admin dashboard). */
export async function loadAllUsersForSuperAdmin(): Promise<User[]> {
  const { data: members, error } = await supabase
    .from('company_members')
    .select(`
      *,
      profiles!company_members_user_id_fkey (*)
    `);

  if (error) {
    console.error('[dataLoaders] Error loading users for super admin:', error);
    return [];
  }

  if (!members) return [];

  return members
    .filter((m: any) => m.profiles)
    .map((m: any) =>
      profileToLegacyUser(m.profiles, m, null, null, null),
    );
}

/**
 * Load all company users with full details (RIASEC, Karma, Climate, hard skills).
 * INCLUDES placeholder slots (members without user_id).
 */
export async function loadCompanyUsersWithDetails(companyId: string): Promise<User[]> {
  // 1. Load ALL company_members
  const { data: members, error: membersError } = await supabase
    .from('company_members')
    .select(`*, profiles:user_id (*)`)
    .eq('company_id', companyId);

  if (membersError || !members) {
    console.error('[dataLoaders] Error loading company members:', membersError);
    return [];
  }
  if (members.length === 0) return [];

  const membersWithProfiles = members.filter((m: any) => m.user_id && m.profiles);
  const placeholders = members.filter((m: any) => !m.user_id);

  const userIds = membersWithProfiles
    .map((m: any) => m.user_id)
    .filter((id: string | null): id is string => id !== null);

  let riasecResults: any[] = [];
  let karmaSessions: any[] = [];
  let climateResponses: any[] = [];
  let userRolesData: any[] = [];
  let userHardSkillsData: any[] = [];

  if (userIds.length > 0) {
    const [riasec, karma, climate, roles, hardSkills] = await Promise.all([
      supabase.from('riasec_results').select('*').in('user_id', userIds),
      supabase.from('karma_sessions').select('*').in('user_id', userIds),
      supabase.from('climate_responses').select('*').in('user_id', userIds),
      supabase.from('user_roles').select('*').in('user_id', userIds),
      supabase
        .from('user_hard_skills')
        .select(`*, skill:hard_skills_catalog(*)`)
        .in('user_id', userIds),
    ]);
    riasecResults = riasec.data || [];
    karmaSessions = karma.data || [];
    climateResponses = climate.data || [];
    userRolesData = roles.data || [];
    userHardSkillsData = hardSkills.data || [];
  }

  // Real users
  const realUsers: User[] = membersWithProfiles.map((member: any) => {
    const profile = member.profiles;
    const riasec = riasecResults.find((r) => r.user_id === member.user_id);
    const karma = karmaSessions.find((k) => k.user_id === member.user_id);
    const climate = climateResponses.find((c) => c.user_id === member.user_id);
    const hardSkills = userHardSkillsData.filter((hs) => hs.user_id === member.user_id);

    const isSuperAdmin = userRolesData.some(
      (r) => r.user_id === member.user_id && r.role === 'super_admin',
    );

    const legacyUser = profileToLegacyUser(profile, member, riasec, karma, climate, hardSkills);
    legacyUser.role = isSuperAdmin ? 'super_admin' : (member.role || 'user');
    legacyUser.memberId = member.id;
    return legacyUser;
  });

  // Placeholder/hiring slots
  const placeholderUsers: User[] = placeholders.map((member: any) => ({
    id: member.id,
    memberId: member.id,
    firstName: member.placeholder_first_name || '',
    lastName: member.placeholder_last_name || '',
    email: member.placeholder_email || '',
    companyId: member.company_id,
    departmentId: member.department_id || '',
    jobTitle: member.job_title || '',
    status: member.status || 'pending',
    isHiring: member.is_hiring || false,
    requiredProfile: member.required_profile
      ? {
          hardSkills: (member.required_profile as any).hardSkills || [],
          softSkills: (member.required_profile as any).softSkills || [],
          seniority: (member.required_profile as any).seniority || 'Mid',
        }
      : undefined,
    role: member.role || 'user',
  }));

  return [...realUsers, ...placeholderUsers];
}
