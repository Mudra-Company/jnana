import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from './useAuth';
import type { 
  KarmaProfile, 
  UserHardSkill, 
  PortfolioItem, 
  SocialLink,
  ProfileVisibility,
  WorkType 
} from '../types/karma';

export const useKarmaProfile = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  
  const [profile, setProfile] = useState<KarmaProfile | null>(null);
  const [hardSkills, setHardSkills] = useState<UserHardSkill[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch profile with all related data
  const fetchProfile = useCallback(async () => {
    if (!targetUserId) return;
    
    try {
      setIsLoading(true);
      
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (profileError) throw profileError;

      // Fetch hard skills with catalog data
      const { data: skillsData } = await supabase
        .from('user_hard_skills')
        .select(`
          *,
          skill:hard_skills_catalog(*)
        `)
        .eq('user_id', targetUserId);

      // Fetch portfolio items
      const { data: portfolioData } = await supabase
        .from('user_portfolio_items')
        .select('*')
        .eq('user_id', targetUserId)
        .order('sort_order');

      // Fetch social links
      const { data: socialData } = await supabase
        .from('user_social_links')
        .select('*')
        .eq('user_id', targetUserId);

      // Fetch RIASEC results
      const { data: riasecData } = await supabase
        .from('riasec_results')
        .select('*')
        .eq('user_id', targetUserId)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Fetch Karma session
      const { data: karmaData } = await supabase
        .from('karma_sessions')
        .select('*')
        .eq('user_id', targetUserId)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Format profile
      const formattedProfile: KarmaProfile = {
        id: profileData.id,
        email: profileData.email,
        firstName: profileData.first_name || undefined,
        lastName: profileData.last_name || undefined,
        avatarUrl: profileData.avatar_url || undefined,
        bio: profileData.bio || undefined,
        location: profileData.location || undefined,
        headline: profileData.headline || undefined,
        jobTitle: profileData.job_title || undefined,
        gender: profileData.gender as 'M' | 'F' | undefined,
        age: profileData.age || undefined,
        isKarmaProfile: profileData.is_karma_profile || false,
        profileVisibility: (profileData.profile_visibility as ProfileVisibility) || 'private',
        lookingForWork: profileData.looking_for_work || false,
        preferredWorkType: profileData.preferred_work_type as WorkType | undefined,
        yearsExperience: profileData.years_experience || undefined,
        createdAt: profileData.created_at,
        updatedAt: profileData.updated_at,
        riasecScore: riasecData ? {
          R: riasecData.score_r,
          I: riasecData.score_i,
          A: riasecData.score_a,
          S: riasecData.score_s,
          E: riasecData.score_e,
          C: riasecData.score_c,
        } : undefined,
        profileCode: riasecData?.profile_code || undefined,
        karmaData: karmaData ? {
          transcript: karmaData.transcript as any[] || [],
          summary: karmaData.summary || undefined,
          softSkills: karmaData.soft_skills || [],
          primaryValues: karmaData.primary_values || [],
          riskFactors: karmaData.risk_factors || [],
          seniorityAssessment: karmaData.seniority_assessment as any,
        } : undefined,
      };

      // Format hard skills
      const formattedSkills: UserHardSkill[] = (skillsData || []).map(s => ({
        id: s.id,
        userId: s.user_id,
        skillId: s.skill_id || undefined,
        customSkillName: s.custom_skill_name || undefined,
        proficiencyLevel: s.proficiency_level as 1 | 2 | 3 | 4 | 5,
        createdAt: s.created_at,
        skill: s.skill ? {
          id: s.skill.id,
          name: s.skill.name,
          category: s.skill.category || undefined,
        } : undefined,
      }));

      // Format portfolio
      const formattedPortfolio: PortfolioItem[] = (portfolioData || []).map(p => ({
        id: p.id,
        userId: p.user_id,
        itemType: p.item_type as PortfolioItem['itemType'],
        title: p.title,
        description: p.description || undefined,
        fileUrl: p.file_url || undefined,
        externalUrl: p.external_url || undefined,
        sortOrder: p.sort_order || 0,
        createdAt: p.created_at,
      }));

      // Format social links
      const formattedSocial: SocialLink[] = (socialData || []).map(s => ({
        id: s.id,
        userId: s.user_id,
        platform: s.platform as SocialLink['platform'],
        url: s.url,
        createdAt: s.created_at,
      }));

      setProfile(formattedProfile);
      setHardSkills(formattedSkills);
      setPortfolio(formattedPortfolio);
      setSocialLinks(formattedSocial);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [targetUserId]);

  // Update profile fields
  const updateProfile = useCallback(async (updates: Partial<KarmaProfile>) => {
    if (!targetUserId) return null;

    try {
      const dbUpdates: Record<string, any> = {};
      
      if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
      if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
      if (updates.location !== undefined) dbUpdates.location = updates.location;
      if (updates.headline !== undefined) dbUpdates.headline = updates.headline;
      if (updates.jobTitle !== undefined) dbUpdates.job_title = updates.jobTitle;
      if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
      if (updates.age !== undefined) dbUpdates.age = updates.age;
      if (updates.isKarmaProfile !== undefined) dbUpdates.is_karma_profile = updates.isKarmaProfile;
      if (updates.profileVisibility !== undefined) dbUpdates.profile_visibility = updates.profileVisibility;
      if (updates.lookingForWork !== undefined) dbUpdates.looking_for_work = updates.lookingForWork;
      if (updates.preferredWorkType !== undefined) dbUpdates.preferred_work_type = updates.preferredWorkType;
      if (updates.yearsExperience !== undefined) dbUpdates.years_experience = updates.yearsExperience;

      const { data, error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', targetUserId)
        .select()
        .single();

      if (error) throw error;

      await fetchProfile();
      return data;
    } catch (err) {
      setError(err as Error);
      return null;
    }
  }, [targetUserId, fetchProfile]);

  // Add hard skill
  const addHardSkill = useCallback(async (skillId?: string, customSkillName?: string, proficiencyLevel: number = 3) => {
    if (!targetUserId) return null;

    try {
      const { data, error } = await supabase
        .from('user_hard_skills')
        .insert({
          user_id: targetUserId,
          skill_id: skillId || null,
          custom_skill_name: customSkillName || null,
          proficiency_level: proficiencyLevel,
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchProfile();
      return data;
    } catch (err) {
      setError(err as Error);
      return null;
    }
  }, [targetUserId, fetchProfile]);

  // Remove hard skill
  const removeHardSkill = useCallback(async (skillRecordId: string) => {
    try {
      const { error } = await supabase
        .from('user_hard_skills')
        .delete()
        .eq('id', skillRecordId);

      if (error) throw error;
      
      setHardSkills(prev => prev.filter(s => s.id !== skillRecordId));
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  // Update skill proficiency
  const updateSkillProficiency = useCallback(async (skillRecordId: string, proficiencyLevel: number) => {
    try {
      const { error } = await supabase
        .from('user_hard_skills')
        .update({ proficiency_level: proficiencyLevel })
        .eq('id', skillRecordId);

      if (error) throw error;
      
      setHardSkills(prev => prev.map(s => 
        s.id === skillRecordId ? { ...s, proficiencyLevel: proficiencyLevel as 1|2|3|4|5 } : s
      ));
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  // Add portfolio item
  const addPortfolioItem = useCallback(async (item: Omit<PortfolioItem, 'id' | 'userId' | 'createdAt'>) => {
    if (!targetUserId) return null;

    try {
      const { data, error } = await supabase
        .from('user_portfolio_items')
        .insert({
          user_id: targetUserId,
          item_type: item.itemType,
          title: item.title,
          description: item.description || null,
          file_url: item.fileUrl || null,
          external_url: item.externalUrl || null,
          sort_order: item.sortOrder,
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchProfile();
      return data;
    } catch (err) {
      setError(err as Error);
      return null;
    }
  }, [targetUserId, fetchProfile]);

  // Remove portfolio item
  const removePortfolioItem = useCallback(async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('user_portfolio_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      
      setPortfolio(prev => prev.filter(p => p.id !== itemId));
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  // Add/update social link
  const upsertSocialLink = useCallback(async (platform: SocialLink['platform'], url: string) => {
    if (!targetUserId) return null;

    try {
      const { data, error } = await supabase
        .from('user_social_links')
        .upsert({
          user_id: targetUserId,
          platform,
          url,
        }, {
          onConflict: 'user_id,platform',
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchProfile();
      return data;
    } catch (err) {
      setError(err as Error);
      return null;
    }
  }, [targetUserId, fetchProfile]);

  // Remove social link
  const removeSocialLink = useCallback(async (platform: SocialLink['platform']) => {
    if (!targetUserId) return;

    try {
      const { error } = await supabase
        .from('user_social_links')
        .delete()
        .eq('user_id', targetUserId)
        .eq('platform', platform);

      if (error) throw error;
      
      setSocialLinks(prev => prev.filter(s => s.platform !== platform));
    } catch (err) {
      setError(err as Error);
    }
  }, [targetUserId]);

  // Upload avatar
  const uploadAvatar = useCallback(async (file: File) => {
    if (!targetUserId) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${targetUserId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-files')
        .getPublicUrl(filePath);

      await updateProfile({ avatarUrl: publicUrl });
      return publicUrl;
    } catch (err) {
      setError(err as Error);
      return null;
    }
  }, [targetUserId, updateProfile]);

  // Upload portfolio file
  const uploadPortfolioFile = useCallback(async (file: File, itemType: PortfolioItem['itemType']) => {
    if (!targetUserId) return null;

    try {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${targetUserId}/portfolio/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-files')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      setError(err as Error);
      return null;
    }
  }, [targetUserId]);

  useEffect(() => {
    if (targetUserId) {
      fetchProfile();
    }
  }, [targetUserId, fetchProfile]);

  return {
    profile,
    hardSkills,
    portfolio,
    socialLinks,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    addHardSkill,
    removeHardSkill,
    updateSkillProficiency,
    addPortfolioItem,
    removePortfolioItem,
    upsertSocialLink,
    removeSocialLink,
    uploadAvatar,
    uploadPortfolioFile,
  };
};
