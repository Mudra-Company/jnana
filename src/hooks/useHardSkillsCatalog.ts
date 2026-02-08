import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import type { HardSkill } from '../types/karma';

export const useHardSkillsCatalog = () => {
  const [skills, setSkills] = useState<HardSkill[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSkills = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('hard_skills_catalog')
        .select('*')
        .order('category')
        .order('name');

      if (error) throw error;

      const formattedSkills: HardSkill[] = (data || []).map(s => ({
        id: s.id,
        name: s.name,
        category: s.category ?? undefined,
        createdAt: s.created_at ?? undefined,
      }));

      setSkills(formattedSkills);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(formattedSkills.map(s => s.category).filter(Boolean))] as string[];
      setCategories(uniqueCategories);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchSkills = useCallback((query: string, category?: string): HardSkill[] => {
    let filtered = skills;
    
    if (category) {
      filtered = filtered.filter(s => s.category === category);
    }
    
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(lowerQuery)
      );
    }
    
    return filtered;
  }, [skills]);

  const getSkillsByCategory = useCallback((category: string): HardSkill[] => {
    return skills.filter(s => s.category === category);
  }, [skills]);

  const getSkillById = useCallback((id: string): HardSkill | undefined => {
    return skills.find(s => s.id === id);
  }, [skills]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  return {
    skills,
    categories,
    isLoading,
    error,
    searchSkills,
    getSkillsByCategory,
    getSkillById,
    refetch: fetchSkills,
  };
};
