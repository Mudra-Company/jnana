import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from './useAuth';
import type { 
  KarmaProfile, 
  UserHardSkill, 
  PortfolioItem, 
  SocialLink,
  ProfileVisibility,
  WorkType,
  UserExperience,
  UserEducation,
  UserCertification,
  UserLanguage,
  LanguageProficiency
} from '../types/karma';

export const useKarmaProfile = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  
  const [profile, setProfile] = useState<KarmaProfile | null>(null);
  const [hardSkills, setHardSkills] = useState<UserHardSkill[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [experiences, setExperiences] = useState<UserExperience[]>([]);
  const [education, setEducation] = useState<UserEducation[]>([]);
  const [certifications, setCertifications] = useState<UserCertification[]>([]);
  const [languages, setLanguages] = useState<UserLanguage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch profile with all related data
  const fetchProfile = useCallback(async () => {
    if (!targetUserId) return;
    
    try {
      setIsLoading(true);
      
      // Fetch all data in parallel
      const [
        { data: profileData, error: profileError },
        { data: skillsData },
        { data: portfolioData },
        { data: socialData },
        { data: experiencesData },
        { data: educationData },
        { data: certificationsData },
        { data: languagesData },
        { data: riasecData },
        { data: karmaData },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', targetUserId).single(),
        supabase.from('user_hard_skills').select(`*, skill:hard_skills_catalog(*)`).eq('user_id', targetUserId),
        supabase.from('user_portfolio_items').select('*').eq('user_id', targetUserId).order('sort_order'),
        supabase.from('user_social_links').select('*').eq('user_id', targetUserId),
        supabase.from('user_experiences').select('*').eq('user_id', targetUserId).order('sort_order'),
        supabase.from('user_education').select('*').eq('user_id', targetUserId).order('sort_order'),
        supabase.from('user_certifications').select('*').eq('user_id', targetUserId).order('issue_date', { ascending: false }),
        supabase.from('user_languages').select('*').eq('user_id', targetUserId),
        supabase.from('riasec_results').select('*').eq('user_id', targetUserId).order('submitted_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('karma_sessions').select('*').eq('user_id', targetUserId).order('completed_at', { ascending: false }).limit(1).maybeSingle(),
      ]);

      if (profileError) throw profileError;

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

      // Format experiences
      const formattedExperiences: UserExperience[] = (experiencesData || []).map(e => ({
        id: e.id,
        userId: e.user_id,
        company: e.company,
        role: e.role,
        startDate: e.start_date || undefined,
        endDate: e.end_date || undefined,
        isCurrent: e.is_current || false,
        description: e.description || undefined,
        location: e.location || undefined,
        sortOrder: e.sort_order || 0,
        createdAt: e.created_at,
      }));

      // Format education
      const formattedEducation: UserEducation[] = (educationData || []).map(e => ({
        id: e.id,
        userId: e.user_id,
        institution: e.institution,
        degree: e.degree,
        fieldOfStudy: e.field_of_study || undefined,
        startYear: e.start_year || undefined,
        endYear: e.end_year || undefined,
        description: e.description || undefined,
        sortOrder: e.sort_order || 0,
        createdAt: e.created_at,
      }));

      // Format certifications
      const formattedCertifications: UserCertification[] = (certificationsData || []).map(c => ({
        id: c.id,
        userId: c.user_id,
        name: c.name,
        issuingOrganization: c.issuing_organization || undefined,
        issueDate: c.issue_date || undefined,
        expiryDate: c.expiry_date || undefined,
        credentialId: c.credential_id || undefined,
        credentialUrl: c.credential_url || undefined,
        createdAt: c.created_at,
      }));

      // Format languages
      const formattedLanguages: UserLanguage[] = (languagesData || []).map(l => ({
        id: l.id,
        userId: l.user_id,
        language: l.language,
        proficiency: l.proficiency as LanguageProficiency,
        createdAt: l.created_at,
      }));

      setProfile(formattedProfile);
      setHardSkills(formattedSkills);
      setPortfolio(formattedPortfolio);
      setSocialLinks(formattedSocial);
      setExperiences(formattedExperiences);
      setEducation(formattedEducation);
      setCertifications(formattedCertifications);
      setLanguages(formattedLanguages);
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

  // ============ HARD SKILLS ============
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

  // ============ PORTFOLIO ============
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

  // ============ SOCIAL LINKS ============
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

  // ============ EXPERIENCES ============
  const addExperience = useCallback(async (exp: Omit<UserExperience, 'id' | 'userId' | 'createdAt'>) => {
    if (!targetUserId) return null;

    try {
      const { data, error } = await supabase
        .from('user_experiences')
        .insert({
          user_id: targetUserId,
          company: exp.company,
          role: exp.role,
          start_date: exp.startDate || null,
          end_date: exp.endDate || null,
          is_current: exp.isCurrent || false,
          description: exp.description || null,
          location: exp.location || null,
          sort_order: exp.sortOrder || 0,
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

  const updateExperience = useCallback(async (id: string, updates: Partial<UserExperience>) => {
    try {
      const dbUpdates: Record<string, any> = {};
      if (updates.company !== undefined) dbUpdates.company = updates.company;
      if (updates.role !== undefined) dbUpdates.role = updates.role;
      if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
      if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
      if (updates.isCurrent !== undefined) dbUpdates.is_current = updates.isCurrent;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.location !== undefined) dbUpdates.location = updates.location;
      if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

      const { error } = await supabase
        .from('user_experiences')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;
      await fetchProfile();
    } catch (err) {
      setError(err as Error);
    }
  }, [fetchProfile]);

  const removeExperience = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_experiences')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setExperiences(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  // ============ EDUCATION ============
  const addEducation = useCallback(async (edu: Omit<UserEducation, 'id' | 'userId' | 'createdAt'>) => {
    if (!targetUserId) return null;

    try {
      const { data, error } = await supabase
        .from('user_education')
        .insert({
          user_id: targetUserId,
          institution: edu.institution,
          degree: edu.degree,
          field_of_study: edu.fieldOfStudy || null,
          start_year: edu.startYear || null,
          end_year: edu.endYear || null,
          description: edu.description || null,
          sort_order: edu.sortOrder || 0,
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

  const updateEducation = useCallback(async (id: string, updates: Partial<UserEducation>) => {
    try {
      const dbUpdates: Record<string, any> = {};
      if (updates.institution !== undefined) dbUpdates.institution = updates.institution;
      if (updates.degree !== undefined) dbUpdates.degree = updates.degree;
      if (updates.fieldOfStudy !== undefined) dbUpdates.field_of_study = updates.fieldOfStudy;
      if (updates.startYear !== undefined) dbUpdates.start_year = updates.startYear;
      if (updates.endYear !== undefined) dbUpdates.end_year = updates.endYear;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

      const { error } = await supabase
        .from('user_education')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;
      await fetchProfile();
    } catch (err) {
      setError(err as Error);
    }
  }, [fetchProfile]);

  const removeEducation = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_education')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setEducation(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  // ============ CERTIFICATIONS ============
  const addCertification = useCallback(async (cert: Omit<UserCertification, 'id' | 'userId' | 'createdAt'>) => {
    if (!targetUserId) return null;

    try {
      const { data, error } = await supabase
        .from('user_certifications')
        .insert({
          user_id: targetUserId,
          name: cert.name,
          issuing_organization: cert.issuingOrganization || null,
          issue_date: cert.issueDate || null,
          expiry_date: cert.expiryDate || null,
          credential_id: cert.credentialId || null,
          credential_url: cert.credentialUrl || null,
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

  const updateCertification = useCallback(async (id: string, updates: Partial<UserCertification>) => {
    try {
      const dbUpdates: Record<string, any> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.issuingOrganization !== undefined) dbUpdates.issuing_organization = updates.issuingOrganization;
      if (updates.issueDate !== undefined) dbUpdates.issue_date = updates.issueDate;
      if (updates.expiryDate !== undefined) dbUpdates.expiry_date = updates.expiryDate;
      if (updates.credentialId !== undefined) dbUpdates.credential_id = updates.credentialId;
      if (updates.credentialUrl !== undefined) dbUpdates.credential_url = updates.credentialUrl;

      const { error } = await supabase
        .from('user_certifications')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;
      await fetchProfile();
    } catch (err) {
      setError(err as Error);
    }
  }, [fetchProfile]);

  const removeCertification = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_certifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setCertifications(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  // ============ LANGUAGES ============
  const addLanguage = useCallback(async (lang: Omit<UserLanguage, 'id' | 'userId' | 'createdAt'>) => {
    if (!targetUserId) return null;

    try {
      const { data, error } = await supabase
        .from('user_languages')
        .insert({
          user_id: targetUserId,
          language: lang.language,
          proficiency: lang.proficiency,
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

  const updateLanguage = useCallback(async (id: string, updates: Partial<UserLanguage>) => {
    try {
      const dbUpdates: Record<string, any> = {};
      if (updates.language !== undefined) dbUpdates.language = updates.language;
      if (updates.proficiency !== undefined) dbUpdates.proficiency = updates.proficiency;

      const { error } = await supabase
        .from('user_languages')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;
      await fetchProfile();
    } catch (err) {
      setError(err as Error);
    }
  }, [fetchProfile]);

  const removeLanguage = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_languages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setLanguages(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  // Helper function to normalize date strings to YYYY-MM-DD format
  const normalizeDate = (dateStr: string | null | undefined): string | null => {
    if (!dateStr) return null;
    
    const trimmed = dateStr.trim();
    
    // Handle "Present", "Presente", etc.
    const presentTerms = ['present', 'presente', 'current', 'attuale', 'oggi', 'ad oggi', 'now'];
    if (presentTerms.includes(trimmed.toLowerCase())) {
      return null;
    }
    
    // If already in YYYY-MM-DD format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    
    // If only year (e.g., "2025"), add -01-01
    if (/^\d{4}$/.test(trimmed)) {
      return `${trimmed}-01-01`;
    }
    
    // If year-month (e.g., "2025-03"), add -01
    if (/^\d{4}-\d{2}$/.test(trimmed)) {
      return `${trimmed}-01`;
    }
    
    // Try to parse as Date
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
    
    return null;
  };

  // ============ BULK OPERATIONS (for CV import) ============
  const importFromCV = useCallback(async (parsedData: {
    experiences?: Array<Omit<UserExperience, 'id' | 'userId' | 'createdAt'>>;
    education?: Array<Omit<UserEducation, 'id' | 'userId' | 'createdAt'>>;
    certifications?: Array<Omit<UserCertification, 'id' | 'userId' | 'createdAt'>>;
    languages?: Array<Omit<UserLanguage, 'id' | 'userId' | 'createdAt'>>;
    skills?: string[];
  }) => {
    if (!targetUserId) return;

    try {
      const operations: Promise<any>[] = [];

      // Import experiences
      if (parsedData.experiences && parsedData.experiences.length > 0) {
        const expRows = parsedData.experiences.map((exp, idx) => {
          const normalizedStartDate = normalizeDate(exp.startDate);
          const normalizedEndDate = normalizeDate(exp.endDate);
          
          return {
            user_id: targetUserId,
            company: exp.company,
            role: exp.role,
            start_date: normalizedStartDate,
            end_date: normalizedEndDate,
            is_current: exp.isCurrent || !normalizedEndDate,
            description: exp.description || null,
            location: exp.location || null,
            sort_order: idx,
          };
        });
        console.log('Importing experiences to DB:', expRows);
        operations.push(supabase.from('user_experiences' as any).insert(expRows as any).select() as unknown as Promise<any>);
      }

      // Import education
      if (parsedData.education && parsedData.education.length > 0) {
        const eduRows = parsedData.education.map((edu, idx) => ({
          user_id: targetUserId,
          institution: edu.institution,
          degree: edu.degree,
          field_of_study: edu.fieldOfStudy || null,
          start_year: edu.startYear || null,
          end_year: edu.endYear || null,
          description: edu.description || null,
          sort_order: idx,
        }));
        operations.push(supabase.from('user_education' as any).insert(eduRows as any).select() as unknown as Promise<any>);
      }

      // Import certifications
      if (parsedData.certifications && parsedData.certifications.length > 0) {
        const certRows = parsedData.certifications.map(cert => ({
          user_id: targetUserId,
          name: cert.name,
          issuing_organization: cert.issuingOrganization || null,
          issue_date: cert.issueDate || null,
          expiry_date: cert.expiryDate || null,
          credential_id: cert.credentialId || null,
          credential_url: cert.credentialUrl || null,
        }));
        operations.push(supabase.from('user_certifications' as any).insert(certRows as any).select() as unknown as Promise<any>);
      }

      // Import languages
      if (parsedData.languages && parsedData.languages.length > 0) {
        const langRows = parsedData.languages.map(lang => ({
          user_id: targetUserId,
          language: lang.language,
          proficiency: lang.proficiency || 'intermediate',
        }));
        operations.push(supabase.from('user_languages' as any).insert(langRows as any).select() as unknown as Promise<any>);
      }

      // Import skills as custom skills
      if (parsedData.skills && parsedData.skills.length > 0) {
        const existingSkillNames = hardSkills.map(s => 
          s.skill?.name?.toLowerCase() || s.customSkillName?.toLowerCase()
        ).filter(Boolean);
        
        const newSkills = parsedData.skills.filter(
          s => !existingSkillNames.includes(s.toLowerCase())
        );
        
        if (newSkills.length > 0) {
          const skillRows = newSkills.map(skill => ({
            user_id: targetUserId,
            custom_skill_name: skill,
            proficiency_level: 3,
          }));
          operations.push(supabase.from('user_hard_skills').insert(skillRows).select() as unknown as Promise<any>);
        }
      }

      await Promise.all(operations);
      await fetchProfile();
    } catch (err) {
      setError(err as Error);
    }
  }, [targetUserId, hardSkills, fetchProfile]);

  // ============ FILE UPLOADS ============
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
    experiences,
    education,
    certifications,
    languages,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    // Skills
    addHardSkill,
    removeHardSkill,
    updateSkillProficiency,
    // Portfolio
    addPortfolioItem,
    removePortfolioItem,
    // Social
    upsertSocialLink,
    removeSocialLink,
    // Experiences
    addExperience,
    updateExperience,
    removeExperience,
    // Education
    addEducation,
    updateEducation,
    removeEducation,
    // Certifications
    addCertification,
    updateCertification,
    removeCertification,
    // Languages
    addLanguage,
    updateLanguage,
    removeLanguage,
    // Bulk
    importFromCV,
    // Files
    uploadAvatar,
    uploadPortfolioFile,
  };
};
