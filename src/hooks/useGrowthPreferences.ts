/**
 * useGrowthPreferences
 *
 * Gestisce le preferenze di crescita dell'utente loggato:
 * ruoli interni che lo interessano, skill da sviluppare,
 * apertura a job rotation/relocation.
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';

export interface GrowthPreferences {
  id?: string;
  userId: string;
  companyId: string | null;
  interestedRoleIds: string[];
  interestedRoleTitlesFree: string[];
  skillsToDevelop: string[];
  rotationOpen: boolean;
  relocationOpen: boolean;
  targetSeniority: string | null;
  notes: string | null;
}

const EMPTY: Omit<GrowthPreferences, 'userId' | 'companyId'> = {
  interestedRoleIds: [],
  interestedRoleTitlesFree: [],
  skillsToDevelop: [],
  rotationOpen: false,
  relocationOpen: false,
  targetSeniority: null,
  notes: null,
};

const mapRow = (row: any): GrowthPreferences => ({
  id: row.id,
  userId: row.user_id,
  companyId: row.company_id ?? null,
  interestedRoleIds: row.interested_role_ids ?? [],
  interestedRoleTitlesFree: row.interested_role_titles_free ?? [],
  skillsToDevelop: row.skills_to_develop ?? [],
  rotationOpen: !!row.rotation_open,
  relocationOpen: !!row.relocation_open,
  targetSeniority: row.target_seniority ?? null,
  notes: row.notes ?? null,
});

export const useGrowthPreferences = (
  userId: string | null | undefined,
  companyId: string | null | undefined
) => {
  const [prefs, setPrefs] = useState<GrowthPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: e } = await supabase
        .from('user_growth_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (e) throw e;
      if (data) {
        setPrefs(mapRow(data));
      } else {
        setPrefs({ ...EMPTY, userId, companyId: companyId ?? null });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento preferenze');
    } finally {
      setIsLoading(false);
    }
  }, [userId, companyId]);

  useEffect(() => {
    if (userId) refresh();
  }, [userId, refresh]);

  const save = useCallback(
    async (next: Partial<Omit<GrowthPreferences, 'id' | 'userId'>>) => {
      if (!userId) return { success: false, error: 'Utente non loggato' };
      const merged: GrowthPreferences = {
        ...(prefs ?? { ...EMPTY, userId, companyId: companyId ?? null }),
        ...next,
        userId,
      };
      setPrefs(merged);
      try {
        const { error: e } = await supabase
          .from('user_growth_preferences')
          .upsert(
            {
              user_id: userId,
              company_id: merged.companyId,
              interested_role_ids: merged.interestedRoleIds,
              interested_role_titles_free: merged.interestedRoleTitlesFree,
              skills_to_develop: merged.skillsToDevelop,
              rotation_open: merged.rotationOpen,
              relocation_open: merged.relocationOpen,
              target_seniority: merged.targetSeniority,
              notes: merged.notes,
            },
            { onConflict: 'user_id' }
          );
        if (e) throw e;
        return { success: true };
      } catch (err) {
        await refresh();
        return { success: false, error: err instanceof Error ? err.message : 'Errore salvataggio' };
      }
    },
    [userId, companyId, prefs, refresh]
  );

  return { prefs, isLoading, error, refresh, save };
};
