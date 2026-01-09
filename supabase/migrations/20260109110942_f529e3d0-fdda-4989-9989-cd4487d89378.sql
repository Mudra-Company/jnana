-- Add Super Admin RLS policies for viewing all user data

-- user_experiences
CREATE POLICY "Super admins can view all experiences" 
ON public.user_experiences 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- user_education
CREATE POLICY "Super admins can view all education" 
ON public.user_education 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- user_certifications
CREATE POLICY "Super admins can view all certifications" 
ON public.user_certifications 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- user_hard_skills
CREATE POLICY "Super admins can view all hard skills" 
ON public.user_hard_skills 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- user_languages
CREATE POLICY "Super admins can view all languages" 
ON public.user_languages 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- user_portfolio_items
CREATE POLICY "Super admins can view all portfolio items" 
ON public.user_portfolio_items 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- user_social_links
CREATE POLICY "Super admins can view all social links" 
ON public.user_social_links 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role));