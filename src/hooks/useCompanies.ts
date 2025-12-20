import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import type { Tables } from '../integrations/supabase/types';

type Company = Tables<'companies'>;
type OrgNode = Tables<'org_nodes'>;

export interface CompanyWithStructure extends Company {
  structure?: OrgNode[];
}

export const useCompanies = () => {
  const [companies, setCompanies] = useState<CompanyWithStructure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCompanies = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompanyWithStructure = async (companyId: string) => {
    try {
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;

      const { data: nodes, error: nodesError } = await supabase
        .from('org_nodes')
        .select('*')
        .eq('company_id', companyId)
        .order('sort_order');

      if (nodesError) throw nodesError;

      return { ...company, structure: nodes };
    } catch (err) {
      setError(err as Error);
      return null;
    }
  };

  const updateCompany = async (companyId: string, updates: Partial<Company>) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', companyId)
        .select()
        .single();

      if (error) throw error;

      setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, ...data } : c));
      return data;
    } catch (err) {
      setError(err as Error);
      return null;
    }
  };

  const createCompany = async (company: Omit<Company, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .insert(company)
        .select()
        .single();

      if (error) throw error;

      setCompanies(prev => [...prev, data]);
      return data;
    } catch (err) {
      setError(err as Error);
      return null;
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  return {
    companies,
    setCompanies,
    isLoading,
    error,
    fetchCompanies,
    fetchCompanyWithStructure,
    updateCompany,
    createCompany,
  };
};
