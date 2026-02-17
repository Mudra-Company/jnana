import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { OfficeDesk, OfficeRoom } from '@/types/spacesync';
import {
  calculateProximityScore,
  calculateDeskDistance,
  areDesksAdjacent,
  ADJACENCY_THRESHOLD,
  type ProximityUserData,
  type DeskProximityPair,
  type ProximityResult,
} from '@/utils/proximityEngine';

export const useProximityScoring = () => {
  const [userDataMap, setUserDataMap] = useState<Map<string, ProximityUserData>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Load all psychometric data for assigned desk users
   */
  const loadUserData = useCallback(async (desks: OfficeDesk[]) => {
    const memberIds = desks
      .filter(d => d.companyMemberId)
      .map(d => d.companyMemberId!);

    if (memberIds.length === 0) {
      setUserDataMap(new Map());
      return;
    }

    setIsLoading(true);
    try {
      // Fetch company_members with profiles
      const { data: members } = await supabase
        .from('company_members')
        .select(`
          id,
          user_id,
          job_title,
          placeholder_first_name,
          placeholder_last_name,
          profiles:user_id(id, first_name, last_name, birth_date, age)
        `)
        .in('id', memberIds);

      if (!members) { setIsLoading(false); return; }

      // Get user IDs for psychometric data
      const userIds = members.filter(m => m.user_id).map(m => m.user_id!);

      // Fetch RIASEC, Karma, role assignments, and roles with collaboration_profile in parallel
      const [riasecRes, karmaRes, assignmentsRes, rolesRes] = await Promise.all([
        userIds.length > 0
          ? supabase.from('riasec_results').select('user_id, score_r, score_i, score_a, score_s, score_e, score_c').in('user_id', userIds)
          : { data: [] },
        userIds.length > 0
          ? supabase.from('karma_sessions').select('user_id, soft_skills, primary_values, risk_factors, seniority_assessment').in('user_id', userIds)
          : { data: [] },
        supabase.from('company_role_assignments').select('company_member_id, role_id').in('company_member_id', memberIds),
        supabase.from('company_roles').select('id, collaboration_profile, title'),
      ]);

      // Build lookup maps
      const riasecMap = new Map<string, any>();
      (riasecRes.data || []).forEach((r: any) => riasecMap.set(r.user_id, r));

      const karmaMap = new Map<string, any>();
      (karmaRes.data || []).forEach((k: any) => karmaMap.set(k.user_id, k));

      const roleMap = new Map<string, string>();
      (assignmentsRes.data || []).forEach((a: any) => roleMap.set(a.company_member_id, a.role_id));

      // Build collaboration profile map keyed by role_id
      const collabMap = new Map<string, any>();
      (rolesRes.data || []).forEach((r: any) => {
        if (r.collaboration_profile) collabMap.set(r.id, r.collaboration_profile);
      });

      // Build ProximityUserData map keyed by company_member_id
      const map = new Map<string, ProximityUserData>();

      for (const member of members) {
        const profile = member.profiles as any;
        const userId = member.user_id;
        const riasec = userId ? riasecMap.get(userId) : null;
        const karma = userId ? karmaMap.get(userId) : null;

        const firstName = profile?.first_name || member.placeholder_first_name || '';
        const lastName = profile?.last_name || member.placeholder_last_name || '';

        const roleId = roleMap.get(member.id);
        const collabProfile = roleId ? collabMap.get(roleId) : undefined;

        map.set(member.id, {
          id: userId || member.id,
          memberId: member.id,
          firstName,
          lastName,
          jobTitle: member.job_title || undefined,
          roleId,
          riasecScores: riasec ? {
            R: riasec.score_r, I: riasec.score_i, A: riasec.score_a,
            S: riasec.score_s, E: riasec.score_e, C: riasec.score_c,
          } : undefined,
          softSkills: karma?.soft_skills || undefined,
          primaryValues: karma?.primary_values || undefined,
          riskFactors: karma?.risk_factors || undefined,
          birthDate: profile?.birth_date || undefined,
          age: profile?.age || undefined,
          karmaData: karma ? { softSkills: karma.soft_skills, seniorityAssessment: karma.seniority_assessment } : undefined,
          collaborationProfile: collabProfile || undefined,
        });
      }

      setUserDataMap(map);
    } catch (err) {
      console.error('Error loading proximity data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Calculate all proximity pairs for adjacent desks
   */
  const calculateAllPairs = useCallback((
    desks: OfficeDesk[],
    rooms: OfficeRoom[],
  ): DeskProximityPair[] => {
    const assignedDesks = desks.filter(d => d.companyMemberId && userDataMap.has(d.companyMemberId));
    const roomMap = new Map(rooms.map(r => [r.id, r]));
    const pairs: DeskProximityPair[] = [];

    for (let i = 0; i < assignedDesks.length; i++) {
      for (let j = i + 1; j < assignedDesks.length; j++) {
        const dA = assignedDesks[i];
        const dB = assignedDesks[j];
        const roomA = roomMap.get(dA.roomId);
        const roomB = roomMap.get(dB.roomId);

        const distance = calculateDeskDistance(
          { x: dA.x, y: dA.y, roomId: dA.roomId },
          { x: dB.x, y: dB.y, roomId: dB.roomId },
          roomA ? { x: roomA.x, y: roomA.y } : undefined,
          roomB ? { x: roomB.x, y: roomB.y } : undefined,
        );

        // Only score adjacent desks
        if (!areDesksAdjacent(distance)) continue;

        const userA = userDataMap.get(dA.companyMemberId!);
        const userB = userDataMap.get(dB.companyMemberId!);
        if (!userA || !userB) continue;

        const proximityResult = calculateProximityScore(userA, userB);

        pairs.push({
          deskA: { id: dA.id, label: dA.label, x: dA.x, y: dA.y, roomId: dA.roomId },
          deskB: { id: dB.id, label: dB.label, x: dB.x, y: dB.y, roomId: dB.roomId },
          userA,
          userB,
          distance,
          proximityResult,
        });
      }
    }

    // Sort by score descending
    pairs.sort((a, b) => b.proximityResult.score - a.proximityResult.score);
    return pairs;
  }, [userDataMap]);

  /**
   * Get desk-level scores (average score with all neighbors)
   */
  const getDeskScores = useCallback((pairs: DeskProximityPair[]): Map<string, { avgScore: number; pairCount: number }> => {
    const scoreAcc = new Map<string, { total: number; count: number }>();

    for (const pair of pairs) {
      for (const deskId of [pair.deskA.id, pair.deskB.id]) {
        const curr = scoreAcc.get(deskId) || { total: 0, count: 0 };
        curr.total += pair.proximityResult.score;
        curr.count += 1;
        scoreAcc.set(deskId, curr);
      }
    }

    const result = new Map<string, { avgScore: number; pairCount: number }>();
    scoreAcc.forEach((val, key) => {
      result.set(key, { avgScore: Math.round(val.total / val.count), pairCount: val.count });
    });
    return result;
  }, []);

  return {
    userDataMap,
    isLoading,
    loadUserData,
    calculateAllPairs,
    getDeskScores,
  };
};
