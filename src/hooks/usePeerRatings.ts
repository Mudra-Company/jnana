/**
 * usePeerRatings
 *
 * Gestisce i voti di compatibilità collaborativa che l'utente loggato
 * dà ai propri colleghi. Privacy by design: il singolo voto non è
 * visibile al destinatario; gli aggregati sono in `peer_affinity_aggregates`
 * (esposti solo con count >= 3).
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';

export interface PeerRating {
  id: string;
  ratedUserId: string;
  raterUserId: string;
  companyId: string;
  rating: number; // 1-5
  tags: string[];
  note: string | null;
  updatedAt: string;
}

export interface PeerAffinityAggregate {
  ratedUserId: string;
  avgRating: number;
  ratingCount: number;
}

export const PEER_RATING_TAGS = [
  'Ci capiamo al volo',
  'Ci completiamo',
  'Preferisco async',
  'Ottimo nelle riunioni',
  'Comunicazione fluida',
  'Da migliorare',
] as const;

export interface UsePeerRatingsResult {
  myRatings: PeerRating[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  upsertRating: (input: {
    ratedUserId: string;
    companyId: string;
    rating: number;
    tags?: string[];
    note?: string | null;
  }) => Promise<{ success: boolean; error?: string }>;
  deleteRating: (ratedUserId: string) => Promise<{ success: boolean; error?: string }>;
  getRatingFor: (ratedUserId: string) => PeerRating | undefined;
}

const mapRow = (row: any): PeerRating => ({
  id: row.id,
  ratedUserId: row.rated_user_id,
  raterUserId: row.rater_user_id,
  companyId: row.company_id,
  rating: row.rating,
  tags: row.tags ?? [],
  note: row.note ?? null,
  updatedAt: row.updated_at,
});

export const usePeerRatings = (raterUserId: string | null | undefined): UsePeerRatingsResult => {
  const [myRatings, setMyRatings] = useState<PeerRating[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!raterUserId) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: e } = await supabase
        .from('peer_collaboration_ratings')
        .select('*')
        .eq('rater_user_id', raterUserId);
      if (e) throw e;
      setMyRatings((data ?? []).map(mapRow));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento voti');
    } finally {
      setIsLoading(false);
    }
  }, [raterUserId]);

  useEffect(() => {
    if (raterUserId) refresh();
  }, [raterUserId, refresh]);

  const upsertRating: UsePeerRatingsResult['upsertRating'] = useCallback(async (input) => {
    if (!raterUserId) return { success: false, error: 'Utente non loggato' };
    if (input.rating < 1 || input.rating > 5) return { success: false, error: 'Voto non valido' };
    if (input.ratedUserId === raterUserId) return { success: false, error: 'Non puoi votare te stesso' };

    // Optimistic local update
    const optimistic: PeerRating = {
      id: `tmp-${input.ratedUserId}`,
      ratedUserId: input.ratedUserId,
      raterUserId,
      companyId: input.companyId,
      rating: input.rating,
      tags: input.tags ?? [],
      note: input.note ?? null,
      updatedAt: new Date().toISOString(),
    };
    setMyRatings(prev => {
      const others = prev.filter(r => r.ratedUserId !== input.ratedUserId);
      return [...others, optimistic];
    });

    try {
      const { data, error: e } = await supabase
        .from('peer_collaboration_ratings')
        .upsert(
          {
            rater_user_id: raterUserId,
            rated_user_id: input.ratedUserId,
            company_id: input.companyId,
            rating: input.rating,
            tags: input.tags ?? [],
            note: input.note ?? null,
          },
          { onConflict: 'rater_user_id,rated_user_id' }
        )
        .select()
        .single();
      if (e) throw e;
      if (data) {
        const mapped = mapRow(data);
        setMyRatings(prev => {
          const others = prev.filter(r => r.ratedUserId !== input.ratedUserId);
          return [...others, mapped];
        });
      }
      return { success: true };
    } catch (err) {
      // revert
      await refresh();
      return { success: false, error: err instanceof Error ? err.message : 'Errore salvataggio voto' };
    }
  }, [raterUserId, refresh]);

  const deleteRating: UsePeerRatingsResult['deleteRating'] = useCallback(async (ratedUserId) => {
    if (!raterUserId) return { success: false, error: 'Utente non loggato' };
    const prev = myRatings;
    setMyRatings(p => p.filter(r => r.ratedUserId !== ratedUserId));
    try {
      const { error: e } = await supabase
        .from('peer_collaboration_ratings')
        .delete()
        .eq('rater_user_id', raterUserId)
        .eq('rated_user_id', ratedUserId);
      if (e) throw e;
      return { success: true };
    } catch (err) {
      setMyRatings(prev);
      return { success: false, error: err instanceof Error ? err.message : 'Errore eliminazione' };
    }
  }, [raterUserId, myRatings]);

  const getRatingFor = useCallback(
    (ratedUserId: string) => myRatings.find(r => r.ratedUserId === ratedUserId),
    [myRatings]
  );

  return { myRatings, isLoading, error, refresh, upsertRating, deleteRating, getRatingFor };
};
