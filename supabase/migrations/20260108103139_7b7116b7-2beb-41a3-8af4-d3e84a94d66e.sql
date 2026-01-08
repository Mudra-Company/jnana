-- Backfill is_karma_profile for users with existing Karma data
UPDATE public.profiles
SET is_karma_profile = true
WHERE is_karma_profile = false 
  AND (
    EXISTS (SELECT 1 FROM public.riasec_results WHERE user_id = profiles.id)
    OR EXISTS (SELECT 1 FROM public.karma_sessions WHERE user_id = profiles.id)
    OR EXISTS (SELECT 1 FROM public.user_hard_skills WHERE user_id = profiles.id)
    OR EXISTS (SELECT 1 FROM public.user_portfolio_items WHERE user_id = profiles.id)
    OR EXISTS (SELECT 1 FROM public.user_social_links WHERE user_id = profiles.id)
  );