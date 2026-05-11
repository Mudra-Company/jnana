/**
 * useOrgChartUIState
 *
 * Client-side UI state for the Organigramma evolution:
 * - collapsed nodes (per company, sessionStorage)
 * - panel collapsed flag (per company, sessionStorage)
 * - current selection: company | node | position
 *
 * Pure UI state, no DB writes.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { UnifiedPosition } from '../types/unified-org';

export type OrgSelection =
  | { kind: 'company' }
  | { kind: 'node'; nodeId: string }
  | { kind: 'position'; nodeId: string | null; position: UnifiedPosition };

const COLLAPSED_KEY = (cid: string) => `orgchart:collapsed:${cid}`;
const PANEL_KEY = (cid: string) => `orgchart:panel:${cid}`;

const readSet = (key: string): Set<string> => {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

const writeSet = (key: string, set: Set<string>) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch {
    /* noop */
  }
};

export function useOrgChartUIState(companyId: string) {
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(() =>
    typeof window !== 'undefined' ? readSet(COLLAPSED_KEY(companyId)) : new Set()
  );
  const [panelCollapsed, setPanelCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(PANEL_KEY(companyId)) === '1';
  });
  const [selection, setSelection] = useState<OrgSelection>({ kind: 'company' });

  // Persist collapsed set
  useEffect(() => {
    writeSet(COLLAPSED_KEY(companyId), collapsedNodes);
  }, [collapsedNodes, companyId]);

  useEffect(() => {
    try {
      sessionStorage.setItem(PANEL_KEY(companyId), panelCollapsed ? '1' : '0');
    } catch {
      /* noop */
    }
  }, [panelCollapsed, companyId]);

  const toggleNodeCollapsed = useCallback((nodeId: string) => {
    setCollapsedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  const isNodeCollapsed = useCallback(
    (nodeId: string) => collapsedNodes.has(nodeId),
    [collapsedNodes]
  );

  const collapseAll = useCallback((ids: string[]) => {
    setCollapsedNodes(new Set(ids));
  }, []);

  const expandAll = useCallback(() => {
    setCollapsedNodes(new Set());
  }, []);

  const selectCompany = useCallback(() => setSelection({ kind: 'company' }), []);
  const selectNode = useCallback(
    (nodeId: string) => setSelection({ kind: 'node', nodeId }),
    []
  );
  const selectPosition = useCallback(
    (position: UnifiedPosition, nodeId: string | null) =>
      setSelection({ kind: 'position', position, nodeId }),
    []
  );

  const togglePanel = useCallback(() => setPanelCollapsed(p => !p), []);

  return useMemo(
    () => ({
      collapsedNodes,
      isNodeCollapsed,
      toggleNodeCollapsed,
      collapseAll,
      expandAll,
      panelCollapsed,
      togglePanel,
      selection,
      selectCompany,
      selectNode,
      selectPosition,
    }),
    [
      collapsedNodes,
      isNodeCollapsed,
      toggleNodeCollapsed,
      collapseAll,
      expandAll,
      panelCollapsed,
      togglePanel,
      selection,
      selectCompany,
      selectNode,
      selectPosition,
    ]
  );
}
