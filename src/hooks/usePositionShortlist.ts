import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import type { 
  PositionShortlist, 
  ShortlistCandidate, 
  CandidateType, 
  CandidateStatus,
  StoredMatchDetails,
  UnifiedCandidate,
  ShortlistUser
} from '../types/shortlist';
import type { CandidateMatch } from '../types/karma';

export interface InternalMatchData {
  matchScore: number;
  skillsOverlap: string[];
  missingSkills: string[];
  seniorityMatch: boolean;
}

export const usePositionShortlist = (positionId: string, companyId: string) => {
  const [shortlist, setShortlist] = useState<PositionShortlist | null>(null);
  const [candidates, setCandidates] = useState<ShortlistCandidate[]>([]);
  const [unifiedCandidates, setUnifiedCandidates] = useState<UnifiedCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get or create shortlist for the position
  const getOrCreateShortlist = useCallback(async (): Promise<PositionShortlist | null> => {
    if (!positionId || !companyId) return null;

    try {
      // First try to get existing active shortlist
      // FIX: Use .limit(1) instead of .maybeSingle() to handle potential duplicates gracefully
      const { data: existingList, error: fetchError } = await supabase
        .from('position_shortlists')
        .select('*')
        .eq('position_id', positionId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      // Take the first (most recent) if exists
      const existing = existingList?.[0];

      if (existing) {
        const mapped: PositionShortlist = {
          id: existing.id,
          positionId: existing.position_id,
          companyId: existing.company_id,
          createdAt: existing.created_at,
          updatedAt: existing.updated_at,
          status: existing.status as PositionShortlist['status'],
          notes: existing.notes || undefined
        };
        setShortlist(mapped);
        return mapped;
      }

      // Create new shortlist
      const { data: created, error: createError } = await supabase
        .from('position_shortlists')
        .insert({
          position_id: positionId,
          company_id: companyId,
          status: 'active'
        })
        .select()
        .single();

      if (createError) throw createError;

      const mapped: PositionShortlist = {
        id: created.id,
        positionId: created.position_id,
        companyId: created.company_id,
        createdAt: created.created_at,
        updatedAt: created.updated_at,
        status: created.status as PositionShortlist['status'],
        notes: created.notes || undefined
      };
      setShortlist(mapped);
      return mapped;
    } catch (err) {
      console.error('Error getting/creating shortlist:', err);
      setError('Failed to load shortlist');
      return null;
    }
  }, [positionId, companyId]);

  // Fetch candidates for the shortlist
  const fetchCandidates = useCallback(async (shortlistId: string) => {
    setIsLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('shortlist_candidates')
        .select('*')
        .eq('shortlist_id', shortlistId)
        .order('added_at', { ascending: false });

      if (fetchError) throw fetchError;

      const mapped: ShortlistCandidate[] = (data || []).map(c => ({
        id: c.id,
        shortlistId: c.shortlist_id,
        candidateType: c.candidate_type as CandidateType,
        internalUserId: c.internal_user_id || undefined,
        externalProfileId: c.external_profile_id || undefined,
        matchScore: c.match_score || undefined,
        matchDetails: (c.match_details as StoredMatchDetails) || {},
        status: c.status as CandidateStatus,
        hrNotes: c.hr_notes || undefined,
        rating: c.rating || undefined,
        addedAt: c.added_at,
        updatedAt: c.updated_at
      }));

      setCandidates(mapped);
      return mapped;
    } catch (err) {
      console.error('Error fetching candidates:', err);
      setError('Failed to load candidates');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add internal candidate to shortlist
  const addInternalCandidate = useCallback(async (
    user: ShortlistUser,
    matchData: InternalMatchData
  ): Promise<boolean> => {
    try {
      let currentShortlist = shortlist;
      if (!currentShortlist) {
        currentShortlist = await getOrCreateShortlist();
        if (!currentShortlist) return false;
      }

      // Check if already in shortlist
      const existing = candidates.find(c => 
        c.candidateType === 'internal' && c.internalUserId === user.id
      );
      if (existing) {
        setError('Candidate already in shortlist');
        return false;
      }

      const matchDetails: StoredMatchDetails = {
        skillsOverlap: matchData.skillsOverlap,
        missingSkills: matchData.missingSkills,
        seniorityMatch: matchData.seniorityMatch,
        riasecScore: user.riasecScore,
        profileCode: user.profileCode
      };

      const { data, error: insertError } = await supabase
        .from('shortlist_candidates')
        .insert({
          shortlist_id: currentShortlist.id,
          candidate_type: 'internal',
          internal_user_id: user.id,
          match_score: matchData.matchScore,
          match_details: JSON.parse(JSON.stringify(matchDetails)),
          status: 'shortlisted'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const newCandidate: ShortlistCandidate = {
        id: data.id,
        shortlistId: data.shortlist_id,
        candidateType: 'internal',
        internalUserId: data.internal_user_id || undefined,
        matchScore: data.match_score || undefined,
        matchDetails,
        status: 'shortlisted',
        addedAt: data.added_at,
        updatedAt: data.updated_at,
        internalUser: user
      };

      setCandidates(prev => [newCandidate, ...prev]);
      return true;
    } catch (err) {
      console.error('Error adding internal candidate:', err);
      setError('Failed to add candidate');
      return false;
    }
  }, [shortlist, candidates, getOrCreateShortlist]);

  // Add external candidate to shortlist
  const addExternalCandidate = useCallback(async (
    match: CandidateMatch
  ): Promise<boolean> => {
    try {
      let currentShortlist = shortlist;
      if (!currentShortlist) {
        currentShortlist = await getOrCreateShortlist();
        if (!currentShortlist) return false;
      }

      // Check if already in shortlist
      const existing = candidates.find(c => 
        c.candidateType === 'external' && c.externalProfileId === match.profile.id
      );
      if (existing) {
        setError('Candidate already in shortlist');
        return false;
      }

      const matchDetails: StoredMatchDetails = {
        riasecMatch: match.riasecMatch,
        skillsMatch: match.skillsMatch,
        skillsOverlap: match.skillsOverlap,
        missingSkills: match.missingSkills,
        softSkillsMatch: match.softSkillsMatch,
        seniorityMatch: match.seniorityMatch,
        riasecScore: match.profile.riasecScore,
        profileCode: match.profile.profileCode
      };

      const { data, error: insertError } = await supabase
        .from('shortlist_candidates')
        .insert({
          shortlist_id: currentShortlist.id,
          candidate_type: 'external',
          external_profile_id: match.profile.id,
          match_score: match.matchScore,
          match_details: JSON.parse(JSON.stringify(matchDetails)),
          status: 'shortlisted'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const newCandidate: ShortlistCandidate = {
        id: data.id,
        shortlistId: data.shortlist_id,
        candidateType: 'external',
        externalProfileId: data.external_profile_id || undefined,
        matchScore: data.match_score || undefined,
        matchDetails,
        status: 'shortlisted',
        addedAt: data.added_at,
        updatedAt: data.updated_at,
        externalMatch: match
      };

      setCandidates(prev => [newCandidate, ...prev]);
      return true;
    } catch (err) {
      console.error('Error adding external candidate:', err);
      setError('Failed to add candidate');
      return false;
    }
  }, [shortlist, candidates, getOrCreateShortlist]);

  // Remove candidate from shortlist
  const removeCandidate = useCallback(async (candidateId: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('shortlist_candidates')
        .delete()
        .eq('id', candidateId);

      if (deleteError) throw deleteError;

      setCandidates(prev => prev.filter(c => c.id !== candidateId));
      return true;
    } catch (err) {
      console.error('Error removing candidate:', err);
      setError('Failed to remove candidate');
      return false;
    }
  }, []);

  // Update candidate (rating, notes, status)
  const updateCandidate = useCallback(async (
    candidateId: string,
    updates: {
      status?: CandidateStatus;
      hrNotes?: string;
      rating?: number;
    }
  ): Promise<boolean> => {
    try {
      const updateData: Record<string, unknown> = {};
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.hrNotes !== undefined) updateData.hr_notes = updates.hrNotes;
      if (updates.rating !== undefined) updateData.rating = updates.rating;

      const { error: updateError } = await supabase
        .from('shortlist_candidates')
        .update(updateData)
        .eq('id', candidateId);

      if (updateError) throw updateError;

      setCandidates(prev => prev.map(c => 
        c.id === candidateId 
          ? { ...c, ...updates, updatedAt: new Date().toISOString() }
          : c
      ));
      return true;
    } catch (err) {
      console.error('Error updating candidate:', err);
      setError('Failed to update candidate');
      return false;
    }
  }, []);

  // Finalize selection (hire candidate and complete shortlist)
  const finalizeSelection = useCallback(async (candidateId: string): Promise<boolean> => {
    try {
      // Update candidate status to hired
      await updateCandidate(candidateId, { status: 'hired' });

      // Mark other candidates as rejected
      const otherCandidates = candidates.filter(c => c.id !== candidateId);
      for (const c of otherCandidates) {
        if (c.status !== 'rejected') {
          await supabase
            .from('shortlist_candidates')
            .update({ status: 'rejected' })
            .eq('id', c.id);
        }
      }

      // Complete the shortlist
      if (shortlist) {
        await supabase
          .from('position_shortlists')
          .update({ status: 'completed' })
          .eq('id', shortlist.id);
      }

      return true;
    } catch (err) {
      console.error('Error finalizing selection:', err);
      setError('Failed to finalize selection');
      return false;
    }
  }, [shortlist, candidates, updateCandidate]);

  // Build unified candidates list for comparison
  const buildUnifiedCandidates = useCallback((
    candidatesList: ShortlistCandidate[],
    internalUsers: ShortlistUser[]
  ): UnifiedCandidate[] => {
    return candidatesList.map(c => {
      if (c.candidateType === 'internal') {
        const user = c.internalUser || internalUsers.find(u => u.id === c.internalUserId);
        return {
          id: c.id,
          type: 'internal' as CandidateType,
          name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
          email: user?.email,
          avatarUrl: user?.avatarUrl,
          jobTitle: user?.jobTitle,
          matchScore: c.matchScore || 0,
          riasecScore: c.matchDetails.riasecScore || user?.riasecScore,
          profileCode: c.matchDetails.profileCode || user?.profileCode,
          skills: [], // Could be populated from user data
          matchedSkills: c.matchDetails.skillsOverlap || [],
          missingSkills: c.matchDetails.missingSkills || [],
          softSkills: user?.karmaData?.softSkills,
          seniority: user?.seniority,
          seniorityMatch: c.matchDetails.seniorityMatch,
          yearsExperience: user?.yearsExperience,
          location: user?.location,
          status: c.status,
          hrNotes: c.hrNotes,
          rating: c.rating,
          internalUserId: c.internalUserId
        };
      } else {
        const profile = c.externalMatch?.profile;
        return {
          id: c.id,
          type: 'external' as CandidateType,
          name: profile ? `${profile.firstName} ${profile.lastName}` : 'External Candidate',
          email: profile?.email,
          avatarUrl: profile?.avatarUrl,
          jobTitle: profile?.jobTitle || profile?.headline,
          matchScore: c.matchScore || 0,
          riasecScore: c.matchDetails.riasecScore || profile?.riasecScore,
          profileCode: c.matchDetails.profileCode || profile?.profileCode,
          skills: profile?.hardSkills?.map(s => s.skill?.name || s.customSkillName || '').filter(Boolean) || [],
          matchedSkills: c.matchDetails.skillsOverlap || [],
          missingSkills: c.matchDetails.missingSkills || [],
          softSkills: profile?.karmaData?.softSkills,
          seniority: undefined,
          seniorityMatch: c.matchDetails.seniorityMatch,
          yearsExperience: profile?.yearsExperience,
          location: profile?.location,
          status: c.status,
          hrNotes: c.hrNotes,
          rating: c.rating,
          externalProfileId: c.externalProfileId
        };
      }
    });
  }, []);

  // Check if a candidate is in the shortlist
  const isInShortlist = useCallback((candidateId: string, type: CandidateType): boolean => {
    return candidates.some(c => 
      type === 'internal' 
        ? c.candidateType === 'internal' && c.internalUserId === candidateId
        : c.candidateType === 'external' && c.externalProfileId === candidateId
    );
  }, [candidates]);

  // Initialize on mount
  useEffect(() => {
    if (positionId && companyId) {
      getOrCreateShortlist().then(sl => {
        if (sl) {
          fetchCandidates(sl.id);
        }
      });
    }
  }, [positionId, companyId, getOrCreateShortlist, fetchCandidates]);

  return {
    shortlist,
    candidates,
    unifiedCandidates,
    isLoading,
    error,
    addInternalCandidate,
    addExternalCandidate,
    removeCandidate,
    updateCandidate,
    finalizeSelection,
    buildUnifiedCandidates,
    isInShortlist,
    refreshCandidates: () => shortlist && fetchCandidates(shortlist.id),
    clearError: () => setError(null)
  };
};
