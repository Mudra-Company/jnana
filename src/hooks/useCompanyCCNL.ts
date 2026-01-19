/**
 * Hook for managing company CCNL selections
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { CompanyCCNLSelection, CCNLCode, CCNL_OPTIONS } from '../types/compliance';

interface UseCompanyCCNLReturn {
  selections: CompanyCCNLSelection[];
  isLoading: boolean;
  error: string | null;
  addCCNL: (ccnlCode: CCNLCode, isPrimary?: boolean) => Promise<void>;
  removeCCNL: (ccnlCode: CCNLCode) => Promise<void>;
  setPrimaryCCNL: (ccnlCode: CCNLCode) => Promise<void>;
  hasConfigured: boolean;
  refetch: () => Promise<void>;
}

export function useCompanyCCNL(companyId: string | undefined): UseCompanyCCNLReturn {
  const [selections, setSelections] = useState<CompanyCCNLSelection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSelections = useCallback(async () => {
    if (!companyId) {
      setSelections([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('company_ccnl_selections')
        .select('*')
        .eq('company_id', companyId)
        .order('is_primary', { ascending: false });

      if (fetchError) throw fetchError;

      const mapped: CompanyCCNLSelection[] = (data || []).map(row => ({
        id: row.id,
        companyId: row.company_id,
        ccnlCode: row.ccnl_code as CCNLCode,
        ccnlLabel: row.ccnl_label,
        isPrimary: row.is_primary || false,
        createdAt: row.created_at,
      }));

      setSelections(mapped);
    } catch (err) {
      console.error('Error fetching CCNL selections:', err);
      setError('Errore nel caricamento delle selezioni CCNL');
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchSelections();
  }, [fetchSelections]);

  const addCCNL = useCallback(async (ccnlCode: CCNLCode, isPrimary = false) => {
    if (!companyId) throw new Error('Company ID is required');

    const ccnlOption = CCNL_OPTIONS.find(o => o.code === ccnlCode);
    if (!ccnlOption) throw new Error('Invalid CCNL code');

    const { error: insertError } = await supabase
      .from('company_ccnl_selections')
      .insert({
        company_id: companyId,
        ccnl_code: ccnlCode,
        ccnl_label: ccnlOption.label,
        is_primary: isPrimary,
      });

    if (insertError) {
      if (insertError.code === '23505') {
        throw new Error('Questo CCNL è già stato selezionato');
      }
      throw insertError;
    }

    await fetchSelections();
  }, [companyId, fetchSelections]);

  const removeCCNL = useCallback(async (ccnlCode: CCNLCode) => {
    if (!companyId) throw new Error('Company ID is required');

    // Don't allow removing 'Universale' as it's always required
    if (ccnlCode === 'Universale') {
      throw new Error('Gli obblighi universali non possono essere rimossi');
    }

    const { error: deleteError } = await supabase
      .from('company_ccnl_selections')
      .delete()
      .eq('company_id', companyId)
      .eq('ccnl_code', ccnlCode);

    if (deleteError) throw deleteError;

    await fetchSelections();
  }, [companyId, fetchSelections]);

  const setPrimaryCCNL = useCallback(async (ccnlCode: CCNLCode) => {
    if (!companyId) throw new Error('Company ID is required');

    // First, set all to non-primary
    await supabase
      .from('company_ccnl_selections')
      .update({ is_primary: false })
      .eq('company_id', companyId);

    // Then set the selected one as primary
    const { error: updateError } = await supabase
      .from('company_ccnl_selections')
      .update({ is_primary: true })
      .eq('company_id', companyId)
      .eq('ccnl_code', ccnlCode);

    if (updateError) throw updateError;

    await fetchSelections();
  }, [companyId, fetchSelections]);

  return {
    selections,
    isLoading,
    error,
    addCCNL,
    removeCCNL,
    setPrimaryCCNL,
    hasConfigured: selections.length > 0,
    refetch: fetchSelections,
  };
}
