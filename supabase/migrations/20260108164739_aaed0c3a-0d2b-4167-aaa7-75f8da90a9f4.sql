-- Enable admins (company admins) to view shared Karma candidate data without requiring an active subscription.
-- We add additional SELECT policies (policies are OR'ed), leaving existing subscriber policies intact.

-- Profiles
CREATE POLICY "Admins can view karma profiles"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND is_karma_profile = true
  AND profile_visibility = 'subscribers_only'
);

-- Hard skills
CREATE POLICY "Admins can view karma profile skills"
ON public.user_hard_skills
FOR SELECT
USING (
  (auth.uid() = user_id)
  OR (
    has_role(auth.uid(), 'admin'::app_role)
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = user_hard_skills.user_id
        AND p.is_karma_profile = true
        AND p.profile_visibility = 'subscribers_only'
    )
  )
);

-- Portfolio
CREATE POLICY "Admins can view karma portfolio"
ON public.user_portfolio_items
FOR SELECT
USING (
  (auth.uid() = user_id)
  OR (
    has_role(auth.uid(), 'admin'::app_role)
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = user_portfolio_items.user_id
        AND p.is_karma_profile = true
        AND p.profile_visibility = 'subscribers_only'
    )
  )
);

-- Social links
CREATE POLICY "Admins can view karma social links"
ON public.user_social_links
FOR SELECT
USING (
  (auth.uid() = user_id)
  OR (
    has_role(auth.uid(), 'admin'::app_role)
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = user_social_links.user_id
        AND p.is_karma_profile = true
        AND p.profile_visibility = 'subscribers_only'
    )
  )
);

-- Experiences
CREATE POLICY "Admins can view karma profile experiences"
ON public.user_experiences
FOR SELECT
USING (
  (auth.uid() = user_id)
  OR (
    has_role(auth.uid(), 'admin'::app_role)
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = user_experiences.user_id
        AND p.is_karma_profile = true
        AND p.profile_visibility = 'subscribers_only'
    )
  )
);

-- Education
CREATE POLICY "Admins can view karma profile education"
ON public.user_education
FOR SELECT
USING (
  (auth.uid() = user_id)
  OR (
    has_role(auth.uid(), 'admin'::app_role)
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = user_education.user_id
        AND p.is_karma_profile = true
        AND p.profile_visibility = 'subscribers_only'
    )
  )
);

-- Certifications
CREATE POLICY "Admins can view karma profile certifications"
ON public.user_certifications
FOR SELECT
USING (
  (auth.uid() = user_id)
  OR (
    has_role(auth.uid(), 'admin'::app_role)
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = user_certifications.user_id
        AND p.is_karma_profile = true
        AND p.profile_visibility = 'subscribers_only'
    )
  )
);

-- Languages
CREATE POLICY "Admins can view karma profile languages"
ON public.user_languages
FOR SELECT
USING (
  (auth.uid() = user_id)
  OR (
    has_role(auth.uid(), 'admin'::app_role)
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = user_languages.user_id
        AND p.is_karma_profile = true
        AND p.profile_visibility = 'subscribers_only'
    )
  )
);