DELETE FROM public.riasec_results
WHERE user_id = 'e2f87c8c-6660-4ebe-af3e-d7e2788b02ca'
  AND id NOT IN (
    SELECT id FROM public.riasec_results
    WHERE user_id = 'e2f87c8c-6660-4ebe-af3e-d7e2788b02ca'
    ORDER BY submitted_at DESC LIMIT 1
  );

DELETE FROM public.climate_responses
WHERE user_id = 'e2f87c8c-6660-4ebe-af3e-d7e2788b02ca'
  AND id NOT IN (
    SELECT id FROM public.climate_responses
    WHERE user_id = 'e2f87c8c-6660-4ebe-af3e-d7e2788b02ca'
    ORDER BY submitted_at DESC LIMIT 1
  );