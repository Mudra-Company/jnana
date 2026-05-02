
REVOKE EXECUTE ON FUNCTION public.cleanup_old_profile_views() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.profile_views_log_retention_trigger() FROM PUBLIC, anon, authenticated;
