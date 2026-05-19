/**
 * useMyTeam
 *
 * Dato l'utente loggato, deriva:
 *  - il proprio ruolo + nodo organizzativo
 *  - il proprio responsabile (via reports_to_role_id)
 *  - i colleghi peer (stesso org_node)
 *  - i collaboratori che riportano a me (se manager)
 *  - i ruoli/persone del dipartimento allargato (nodo padre)
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';

export interface TeamPerson {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  avatarUrl: string | null;
  roleId: string;
  roleTitle: string;
  orgNodeId: string | null;
  orgNodeName: string | null;
  isInfluencer: boolean;
  influenceType: string[];
}

export interface MyTeamData {
  myRoleId: string | null;
  myRoleTitle: string | null;
  myOrgNodeId: string | null;
  myOrgNodeName: string | null;
  manager: TeamPerson | null;
  peers: TeamPerson[];
  directReports: TeamPerson[];
  departmentSiblings: TeamPerson[]; // colleghi nello stesso parent node, esclusi peer
}

const EMPTY: MyTeamData = {
  myRoleId: null,
  myRoleTitle: null,
  myOrgNodeId: null,
  myOrgNodeName: null,
  manager: null,
  peers: [],
  directReports: [],
  departmentSiblings: [],
};

const buildPerson = (
  assignment: any,
  role: any,
  node: any | null,
  profile: any
): TeamPerson => ({
  userId: profile.id,
  firstName: profile.first_name ?? null,
  lastName: profile.last_name ?? null,
  email: profile.email,
  avatarUrl: profile.avatar_url ?? null,
  roleId: role.id,
  roleTitle: role.title,
  orgNodeId: node?.id ?? null,
  orgNodeName: node?.name ?? null,
  isInfluencer: !!assignment.is_influencer,
  influenceType: assignment.influence_type ?? [],
});

export const useMyTeam = (userId: string | null | undefined, companyId: string | null | undefined) => {
  const [data, setData] = useState<MyTeamData>(EMPTY);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId || !companyId) {
      setData(EMPTY);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // 1) my active assignment + role + node
      const { data: myAssignments, error: aErr } = await supabase
        .from('company_role_assignments')
        .select(`
          id, user_id, role_id, is_influencer, influence_type, end_date,
          company_roles:role_id (
            id, title, org_node_id, reports_to_role_id, company_id,
            org_nodes:org_node_id ( id, name, parent_node_id )
          )
        `)
        .eq('user_id', userId)
        .is('end_date', null);
      if (aErr) throw aErr;

      const mine = (myAssignments ?? []).find(
        (a: any) => a.company_roles?.company_id === companyId
      ) ?? (myAssignments ?? [])[0];

      if (!mine || !mine.company_roles) {
        setData(EMPTY);
        return;
      }

      const myRole: any = mine.company_roles;
      const myNode = myRole.org_nodes;
      const myRoleId = myRole.id as string;
      const myNodeId = myNode?.id as string | undefined;
      const myParentNodeId = myNode?.parent_node_id as string | undefined;
      const myReportsTo = myRole.reports_to_role_id as string | null;

      // 2) Fetch all assignments in company with roles + nodes + profile
      const { data: allAssignments, error: bErr } = await supabase
        .from('company_role_assignments')
        .select(`
          id, user_id, role_id, is_influencer, influence_type, end_date,
          profiles:user_id ( id, first_name, last_name, email, avatar_url ),
          company_roles:role_id (
            id, title, org_node_id, reports_to_role_id, company_id,
            org_nodes:org_node_id ( id, name, parent_node_id )
          )
        `)
        .is('end_date', null);
      if (bErr) throw bErr;

      const list = (allAssignments ?? []).filter(
        (a: any) => a.company_roles?.company_id === companyId && a.profiles && a.user_id
      );

      let manager: TeamPerson | null = null;
      const peers: TeamPerson[] = [];
      const directReports: TeamPerson[] = [];
      const siblings: TeamPerson[] = [];

      for (const a of list as any[]) {
        if (a.user_id === userId) continue;
        const role = a.company_roles;
        const node = role.org_nodes;
        const person = buildPerson(a, role, node, a.profiles);

        // manager
        if (myReportsTo && role.id === myReportsTo) {
          manager = person;
          continue;
        }
        // direct reports
        if (role.reports_to_role_id === myRoleId) {
          directReports.push(person);
          continue;
        }
        // peers: same org node
        if (myNodeId && node?.id === myNodeId) {
          peers.push(person);
          continue;
        }
        // department siblings: same parent node, different node
        if (myParentNodeId && node?.parent_node_id === myParentNodeId) {
          siblings.push(person);
        }
      }

      setData({
        myRoleId,
        myRoleTitle: myRole.title,
        myOrgNodeId: myNodeId ?? null,
        myOrgNodeName: myNode?.name ?? null,
        manager,
        peers,
        directReports,
        departmentSiblings: siblings,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento team');
      setData(EMPTY);
    } finally {
      setIsLoading(false);
    }
  }, [userId, companyId]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, error, refresh: load };
};
