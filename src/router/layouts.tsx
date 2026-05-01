import { ReactNode } from 'react';

/**
 * Layout wrappers — Phase 2 of routing refactor.
 *
 * Thin presentational shells used by guarded routes. Today App.tsx still
 * renders the global Header inline (because it needs the full callback
 * surface from App-scope state). These layouts are kept intentionally
 * minimal so they can be adopted incrementally in Phase 3 without
 * fighting the existing chrome.
 */

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

/** Standard authenticated app shell — no header (Header stays in App.tsx for now). */
export function AppLayout({ children, className = '' }: LayoutProps) {
  return <main className={`animate-fade-in ${className}`}>{children}</main>;
}

/** Layout for unauthenticated screens (login, landing, password reset). */
export function AuthLayout({ children, className = '' }: LayoutProps) {
  return (
    <main className={`min-h-screen bg-jnana-bg dark:bg-gray-900 ${className}`}>
      {children}
    </main>
  );
}

/** Centered loading shell — matches the inline loading state in App.tsx. */
export function LoadingLayout({ message = 'Caricamento...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-jnana-bg dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-jnana-charcoal border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-jnana-text dark:text-gray-300">{message}</p>
      </div>
    </div>
  );
}
