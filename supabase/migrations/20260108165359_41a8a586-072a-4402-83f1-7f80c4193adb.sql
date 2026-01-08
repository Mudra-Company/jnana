-- Drop the previous admin policies that check for platform admin role (wrong check)
DROP POLICY IF EXISTS "Admins can view karma profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view karma profile skills" ON public.user_hard_skills;
DROP POLICY IF EXISTS "Admins can view karma portfolio" ON public.user_portfolio_items;
DROP POLICY IF EXISTS "Admins can view karma social links" ON public.user_social_links;
DROP POLICY IF EXISTS "Admins can view karma profile experiences" ON public.user_experiences;
DROP POLICY IF EXISTS "Admins can view karma profile education" ON public.user_education;
DROP POLICY IF EXISTS "Admins can view karma profile certifications" ON public.user_certifications;
DROP POLICY IF EXISTS "Admins can view karma profile languages" ON public.user_languages;

-- Create new policies that check for COMPANY ADMIN (not platform admin)
-- Company admins are users with role = 'admin' in company_members table

-- Profiles - company admins can view shared karma profiles
CREATE POLICY "Company admins can view karma profiles"
ON public.profiles
FOR SELECT
USING (
  is_karma_profile = true
  AND profile_visibility = 'subscribers_only'
  AND EXISTS (
    SELECT 1 FROM public.company_members cm
    WHERE cm.user_id = auth.uid()
    AND cm.role = 'admin'
  )
);

-- Hard skills
CREATE POLICY "Company admins can view karma skills"
ON public.user_hard_skills
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = user_hard_skills.user_id
      AND p.is_karma_profile = true
      AND p.profile_visibility = 'subscribers_only'
  )
  AND EXISTS (
    SELECT 1 FROM public.company_members cm
    WHERE cm.user_id = auth.uid()
    AND cm.role = 'admin'
  )
);

-- Portfolio
CREATE POLICY "Company admins can view karma portfolio"
ON public.user_portfolio_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = user_portfolio_items.user_id
      AND p.is_karma_profile = true
      AND p.profile_visibility = 'subscribers_only'
  )
  AND EXISTS (
    SELECT 1 FROM public.company_members cm
    WHERE cm.user_id = auth.uid()
    AND cm.role = 'admin'
  )
);

-- Social links
CREATE POLICY "Company admins can view karma social"
ON public.user_social_links
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = user_social_links.user_id
      AND p.is_karma_profile = true
      AND p.profile_visibility = 'subscribers_only'
  )
  AND EXISTS (
    SELECT 1 FROM public.company_members cm
    WHERE cm.user_id = auth.uid()
    AND cm.role = 'admin'
  )
);

-- Experiences
CREATE POLICY "Company admins can view karma experiences"
ON public.user_experiences
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = user_experiences.user_id
      AND p.is_karma_profile = true
      AND p.profile_visibility = 'subscribers_only'
  )
  AND EXISTS (
    SELECT 1 FROM public.company_members cm
    WHERE cm.user_id = auth.uid()
    AND cm.role = 'admin'
  )
);

-- Education
CREATE POLICY "Company admins can view karma education"
ON public.user_education
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = user_education.user_id
      AND p.is_karma_profile = true
      AND p.profile_visibility = 'subscribers_only'
  )
  AND EXISTS (
    SELECT 1 FROM public.company_members cm
    WHERE cm.user_id = auth.uid()
    AND cm.role = 'admin'
  )
);

-- Certifications
CREATE POLICY "Company admins can view karma certifications"
ON public.user_certifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = user_certifications.user_id
      AND p.is_karma_profile = true
      AND p.profile_visibility = 'subscribers_only'
  )
  AND EXISTS (
    SELECT 1 FROM public.company_members cm
    WHERE cm.user_id = auth.uid()
    AND cm.role = 'admin'
  )
);

-- Languages
CREATE POLICY "Company admins can view karma languages"
ON public.user_languages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = user_languages.user_id
      AND p.is_karma_profile = true
      AND p.profile_visibility = 'subscribers_only'
  )
  AND EXISTS (
    SELECT 1 FROM public.company_members cm
    WHERE cm.user_id = auth.uid()
    AND cm.role = 'admin'
  )
);