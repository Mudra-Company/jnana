// Backward-compat shim: the old monolithic Header has been refactored into
// AppShell + GlobalBar + ContextBar + UserMenu + SupervisionBanner.
// This file re-exports AppShell as Header so existing imports keep working.
export { AppShell as Header } from './AppShell';
