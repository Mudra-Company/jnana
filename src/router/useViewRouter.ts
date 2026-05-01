import { useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ViewState } from '../../types';
import { viewToPath, pathToView } from './viewPathMap';

/**
 * Bridge between the legacy ViewState-as-state pattern in App.tsx and
 * a real URL-based router.
 *
 * - When `view` changes (via setView) → URL is updated.
 * - When the URL changes (back/forward, deep link, manual refresh) → setView is called.
 * - Idempotent: avoids feedback loops by remembering the last sync direction.
 *
 * IMPORTANT: this hook is purely additive. It does NOT change any rendering
 * logic; the existing switch in App.tsx keeps deciding what to show based on
 * `view`. This only mirrors `view` ↔ `location.pathname`.
 */
export function useViewRouter(
  view: ViewState,
  setView: (v: ViewState) => void,
) {
  const navigate = useNavigate();
  const location = useLocation();
  const lastSyncedPath = useRef<string | null>(null);
  const lastSyncedViewKey = useRef<string | null>(null);

  // view → URL
  useEffect(() => {
    // Don't push URLs while we are still in transient bootstrap states.
    if (view.type === 'LOADING') return;

    const targetPath = viewToPath(view);
    const currentFull = location.pathname + location.search;
    if (targetPath === currentFull) return;
    if (lastSyncedPath.current === targetPath) return;

    lastSyncedPath.current = targetPath;
    lastSyncedViewKey.current = JSON.stringify(view);
    navigate(targetPath, { replace: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // URL → view (back/forward, deep link)
  useEffect(() => {
    const fullPath = location.pathname + location.search;

    // We just pushed this URL ourselves — skip to avoid loops.
    if (lastSyncedPath.current === fullPath) return;

    const parsed = pathToView(location.pathname, location.search);
    if (!parsed) return;

    const parsedKey = JSON.stringify(parsed);
    if (parsedKey === lastSyncedViewKey.current) return;

    lastSyncedViewKey.current = parsedKey;
    lastSyncedPath.current = fullPath;
    setView(parsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  /** Programmatic navigation that mirrors setView semantics. */
  const navigateTo = useCallback(
    (next: ViewState) => {
      setView(next);
    },
    [setView],
  );

  return { navigateTo };
}
