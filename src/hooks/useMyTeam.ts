/**
 * useMyTeam
 *
 * Risolve, per l'utente:
 *  - il proprio ruolo (assignment esplicito → fallback company_members → ruolo "implicito")
 *  - il proprio org node + responsabile (reports_to_role_id o lead del nodo padre)
 *  - colleghi peer (stesso nodo), direct reports e department siblings
 *
 * Combina sia company_role_assignments (modello nuovo) sia company_members (legacy)
 * per allinearsi alla logica dell'organigramma (useUnifiedOrgData.buildMergedPositions).
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import type { CompanyRole } from '../types/roles';

export interface TeamPerson {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  avatarUrl: string | null;
  roleId: string | null;
  roleTitle: string;
  orgNodeId: string | null;
  orgNodeName: string | null;
  isInfluencer: boolean;
  influenceType: string[];
  /** true se proviene solo da company_members (legacy), false se ha un assignment esplicito */
  isLegacy?: boolean;
}

export interface MyTeamData {
  myRole: CompanyRole | null;
  /** true se myRole è stato costruito implicitamente dal job_title (no riga in company_roles) */
  myRoleIsImplicit: boolean;
  myRoleId: string | null;
  myRoleTitle: string | null;
  myOrgNodeId: string | null;
  myOrgNodeName: string | null;
  manager: TeamPerson | null;
  peers: TeamPerson[];
  directReports: TeamPerson[];
  departmentSiblings: TeamPerson[];
}

const EMPTY: MyTeamData = {
  myRole: null,
  myRoleIsImplicit: false,
  myRoleId: null,
  myRoleTitle: null,
  myOrgNodeId: null,
  myOrgNodeName: null,
  manager: null,
  peers: [],
  directReports: [],
  departmentSiblings: [],
};

const mapRoleRow = (row: any): CompanyRole => ({
  id: row.id,
  companyId: row.company_id,
  orgNodeId: row.org_node_id,
  title: row.title,
  code: row.code,
  description: row.description,
  responsibilities: row.responsibilities ?? [],
  dailyTasks: row.daily_tasks ?? [],
  kpis: row.kpis ?? [],
  requiredHardSkills: row.required_hard_skills ?? [],
  requiredSoftSkills: row.required_soft_skills ?? [],
  requiredSeniority: row.required_seniority,
  requiredEducation: row.required_education ?? [],
  requiredCertifications: row.required_certifications ?? [],
  requiredLanguages: row.required_languages ?? [],
  yearsExperienceMin: row.years_experience_min,
  yearsExperienceMax: row.years_experience_max,
  ccnlLevel: row.ccnl_level,
  ralRangeMin: row.ral_range_min,
  ralRangeMax: row.ral_range_max,
  contractType: row.contract_type,
  workHoursType: row.work_hours_type,
  remotePolicy: row.remote_policy,
  reportsToRoleId: row.reports_to_role_id,
  status: row.status,
  headcount: row.headcount,
  isHiring: row.is_hiring,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const titleMatches = (a?: string | null, b?: string | null) => {
  if (!a || !b) return false;
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  if (!x || !y) return false;
  return x === y || x.includes(y) || y.includes(x);
};

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
      // === Fetch in parallelo: assignments, members, ruoli e nodi della company ===
      const [assignmentsRes, membersRes, rolesRes, nodesRes] = await Promise.all([
        supabase
          .from('company_role_assignments')
          .select(`
            id, user_id, role_id, is_influencer, influence_type, end_date,
            profiles:user_id ( id, first_name, last_name, email, avatar_url ),
            company_roles:role_id (
              id, title, org_node_id, reports_to_role_id, company_id
            )
          `)
          .is('end_date', null),
        supabase
          .from('company_members')
          .select(`
            id, user_id, company_id, department_id, role, job_title, status,
            profiles:user_id ( id, first_name, last_name, email, avatar_url )
          `)
          .eq('company_id', companyId),
        supabase
          .from('company_roles')
          .select('*')
          .eq('company_id', companyId),
        supabase
          .from('org_nodes')
          .select('id, name, parent_node_id, company_id')
          .eq('company_id', companyId),
      ]);

      if (assignmentsRes.error) throw assignmentsRes.error;
      if (membersRes.error) throw membersRes.error;
      if (rolesRes.error) throw rolesRes.error;
      if (nodesRes.error) throw nodesRes.error;

      const allAssignments = (assignmentsRes.data ?? []).filter(
        (a: any) => a.company_roles?.company_id === companyId
      );
      const allMembers = (membersRes.data ?? []) as any[];
      const allRoles = (rolesRes.data ?? []).map(mapRoleRow);
      const allNodes = (nodesRes.data ?? []) as any[];

      const nodeById = new Map<string, any>();
      allNodes.forEach(n => nodeById.set(n.id, n));
      const roleById = new Map<string, CompanyRole>();
      allRoles.forEach(r => roleById.set(r.id, r));

      // === Risolvi MIO ruolo ===
      let myRole: CompanyRole | null = null;
      let myRoleIsImplicit = false;

      // 1) Assignment esplicito
      const myAssignment = allAssignments.find((a: any) => a.user_id === userId);
      if (myAssignment?.company_roles) {
        myRole = roleById.get(myAssignment.company_roles.id) ?? null;
      }

      // 2) Fallback: company_members → matching ruolo nello stesso nodo
      const myMember = allMembers.find(m => m.user_id === userId);

      if (!myRole && myMember) {
        const sameNodeRoles = allRoles.filter(r => r.orgNodeId === myMember.department_id);
        const matched = sameNodeRoles.find(r => titleMatches(r.title, myMember.job_title));
        if (matched) {
          myRole = matched;
        } else if (myMember.department_id) {
          // 3) Ruolo implicito (no riga in company_roles, ma so dipartimento + job_title)
          myRole = {
            id: `implicit-${userId}`,
            companyId,
            orgNodeId: myMember.department_id,
            title: myMember.job_title || 'Posizione',
            code: null,
            description: null,
            responsibilities: [],
            dailyTasks: [],
            kpis: [],
            requiredHardSkills: [],
            requiredSoftSkills: [],
            requiredSeniority: null,
            requiredEducation: [],
            requiredCertifications: [],
            requiredLanguages: [],
            yearsExperienceMin: null,
            yearsExperienceMax: null,
            ccnlLevel: null,
            ralRangeMin: null,
            ralRangeMax: null,
            contractType: null,
            workHoursType: undefined,
            remotePolicy: undefined,
            reportsToRoleId: null,
            status: 'active',
            headcount: 1,
            isHiring: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          myRoleIsImplicit = true;
        }
      }

      if (!myRole) {
        setData(EMPTY);
        return;
      }

      const myNodeId = myRole.orgNodeId ?? null;
      const myNode = myNodeId ? nodeById.get(myNodeId) : null;
      const myParentNodeId = myNode?.parent_node_id ?? null;
      const myReportsTo = myRole.reportsToRoleId ?? null;

      // === Costruisci indice persone (assignments + members) con dedup ===
      const peopleByUser = new Map<string, TeamPerson>();

      // 1) prima gli assignment (più ricchi)
      for (const a of allAssignments as any[]) {
        if (!a.profiles || !a.user_id || a.user_id === userId) continue;
        const role = a.company_roles;
        const node = role?.org_node_id ? nodeById.get(role.org_node_id) : null;
        peopleByUser.set(a.user_id, {
          userId: a.user_id,
          firstName: a.profiles.first_name ?? null,
          lastName: a.profiles.last_name ?? null,
          email: a.profiles.email,
          avatarUrl: a.profiles.avatar_url ?? null,
          roleId: role?.id ?? null,
          roleTitle: role?.title ?? '',
          orgNodeId: role?.org_node_id ?? null,
          orgNodeName: node?.name ?? null,
          isInfluencer: !!a.is_influencer,
          influenceType: a.influence_type ?? [],
          isLegacy: false,
        });
      }

      // 2) poi i company_members (solo se non già coperti)
      for (const m of allMembers) {
        if (!m.user_id || m.user_id === userId) continue;
        if (peopleByUser.has(m.user_id)) continue;
        if (!m.profiles) continue;
        const node = m.department_id ? nodeById.get(m.department_id) : null;
        // prova a matchare un ruolo nello stesso nodo per esporre roleId
        const matchedRole = m.department_id
          ? allRoles.find(r => r.orgNodeId === m.department_id && titleMatches(r.title, m.job_title))
          : null;
        peopleByUser.set(m.user_id, {
          userId: m.user_id,
          firstName: m.profiles.first_name ?? null,
          lastName: m.profiles.last_name ?? null,
          email: m.profiles.email,
          avatarUrl: m.profiles.avatar_url ?? null,
          roleId: matchedRole?.id ?? null,
          roleTitle: matchedRole?.title ?? m.job_title ?? '',
          orgNodeId: m.department_id ?? null,
          orgNodeName: node?.name ?? null,
          isInfluencer: false,
          influenceType: [],
          isLegacy: true,
        });
      }

      // === Smista in manager / peers / direct reports / siblings ===
      let manager: TeamPerson | null = null;
      const peers: TeamPerson[] = [];
      const directReports: TeamPerson[] = [];
      const siblings: TeamPerson[] = [];

      for (const p of peopleByUser.values()) {
        // manager esplicito
        if (myReportsTo && p.roleId === myReportsTo) {
          manager = p;
          continue;
        }
        // direct report: il loro ruolo punta al mio
        if (!myRoleIsImplicit && p.roleId) {
          const theirRole = roleById.get(p.roleId);
          if (theirRole?.reportsToRoleId === myRole.id) {
            directReports.push(p);
            continue;
          }
        }
        // peer: stesso nodo
        if (myNodeId && p.orgNodeId === myNodeId) {
          peers.push(p);
          continue;
        }
        // sibling: stesso parent
        if (myParentNodeId && p.orgNodeId) {
          const theirNode = nodeById.get(p.orgNodeId);
          if (theirNode?.parent_node_id === myParentNodeId) {
            siblings.push(p);
          }
        }
      }

      // === Fallback manager: lead del nodo padre ===
      if (!manager && myParentNodeId) {
        // qualcuno nei peers/siblings del parent il cui ruolo non riporta a nessuno (top del parent)
        const parentRoles = allRoles.filter(r => r.orgNodeId === myParentNodeId);
        const topParentRole = parentRoles.find(r => !r.reportsToRoleId) ?? parentRoles[0];
        if (topParentRole) {
          for (const p of peopleByUser.values()) {
            if (p.roleId === topParentRole.id) { manager = p; break; }
          }
        }
        // ultimo fallback: un admin/manager nel parent node
        if (!manager) {
          for (const p of peopleByUser.values()) {
            if (p.orgNodeId === myParentNodeId && p.isLegacy) {
              manager = p;
              break;
            }
          }
        }
      }

      setData({
        myRole,
        myRoleIsImplicit,
        myRoleId: myRoleIsImplicit ? null : myRole.id,
        myRoleTitle: myRole.title,
        myOrgNodeId: myNodeId,
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
