-- =============================================
-- KARMA PLATFORM: DATABASE FOUNDATION
-- =============================================

-- 1. Hard Skills Catalog (predefined skills database)
CREATE TABLE public.hard_skills_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.hard_skills_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view hard skills catalog"
ON public.hard_skills_catalog FOR SELECT
USING (true);

CREATE POLICY "Super admins can manage hard skills catalog"
ON public.hard_skills_catalog FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- 2. User Hard Skills
CREATE TABLE public.user_hard_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id uuid REFERENCES public.hard_skills_catalog(id) ON DELETE CASCADE,
  custom_skill_name text,
  proficiency_level int NOT NULL DEFAULT 3 CHECK (proficiency_level BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_catalog_skill UNIQUE(user_id, skill_id),
  CONSTRAINT unique_user_custom_skill UNIQUE(user_id, custom_skill_name),
  CONSTRAINT skill_source_check CHECK (
    (skill_id IS NOT NULL AND custom_skill_name IS NULL) OR
    (skill_id IS NULL AND custom_skill_name IS NOT NULL)
  )
);

ALTER TABLE public.user_hard_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own hard skills"
ON public.user_hard_skills FOR ALL
USING (auth.uid() = user_id);

-- 3. User Portfolio Items
CREATE TABLE public.user_portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('cv', 'certificate', 'project', 'image')),
  title text NOT NULL,
  description text,
  file_url text,
  external_url text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own portfolio items"
ON public.user_portfolio_items FOR ALL
USING (auth.uid() = user_id);

-- 4. User Social Links
CREATE TABLE public.user_social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('linkedin', 'github', 'portfolio', 'twitter', 'dribbble', 'behance', 'other')),
  url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, platform)
);

ALTER TABLE public.user_social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own social links"
ON public.user_social_links FOR ALL
USING (auth.uid() = user_id);

-- 5. Subscription Plans
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE CHECK (name IN ('basic', 'pro', 'enterprise')),
  display_name text NOT NULL,
  description text,
  features jsonb DEFAULT '[]'::jsonb,
  monthly_price_cents int NOT NULL DEFAULT 0,
  annual_price_cents int NOT NULL DEFAULT 0,
  max_profile_views_monthly int DEFAULT 10,
  can_invite_candidates boolean DEFAULT false,
  can_access_matching boolean DEFAULT false,
  can_export_data boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active subscription plans"
ON public.subscription_plans FOR SELECT
USING (is_active = true);

CREATE POLICY "Super admins can manage subscription plans"
ON public.subscription_plans FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- 6. Company Subscriptions
CREATE TABLE public.company_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL DEFAULT (now() + interval '1 month'),
  profile_views_used int DEFAULT 0,
  stripe_subscription_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.company_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins can view own subscription"
ON public.company_subscriptions FOR SELECT
USING (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Super admins can manage all subscriptions"
ON public.company_subscriptions FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- 7. Profile Views Log (simpler unique constraint)
CREATE TABLE public.profile_views_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  viewed_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_profile_views_company ON public.profile_views_log(viewer_company_id);
CREATE INDEX idx_profile_views_profile ON public.profile_views_log(viewed_profile_id);
CREATE INDEX idx_profile_views_date ON public.profile_views_log(viewed_at);

ALTER TABLE public.profile_views_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins can view own view log"
ON public.profile_views_log FOR SELECT
USING (is_company_admin(auth.uid(), viewer_company_id));

CREATE POLICY "Company admins can log views"
ON public.profile_views_log FOR INSERT
WITH CHECK (is_company_admin(auth.uid(), viewer_company_id));

-- 8. Extend profiles table for Karma features
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS headline text,
ADD COLUMN IF NOT EXISTS is_karma_profile boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS profile_visibility text DEFAULT 'private',
ADD COLUMN IF NOT EXISTS looking_for_work boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS preferred_work_type text,
ADD COLUMN IF NOT EXISTS years_experience int;

-- 9. RLS for Karma profiles - subscribers can view public profiles
CREATE POLICY "Subscribers can view karma profiles"
ON public.profiles FOR SELECT
USING (
  auth.uid() = id
  OR
  (
    is_karma_profile = true 
    AND profile_visibility = 'subscribers_only'
    AND EXISTS (
      SELECT 1 FROM public.company_subscriptions cs
      JOIN public.company_members cm ON cm.company_id = cs.company_id
      WHERE cm.user_id = auth.uid()
      AND cs.status = 'active'
    )
  )
);

-- 10. RLS for portfolio/skills visible to subscribers
CREATE POLICY "Subscribers can view karma profile skills"
ON public.user_hard_skills FOR SELECT
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.company_subscriptions cs ON true
    JOIN public.company_members cm ON cm.company_id = cs.company_id
    WHERE p.id = user_hard_skills.user_id
    AND p.is_karma_profile = true
    AND p.profile_visibility = 'subscribers_only'
    AND cm.user_id = auth.uid()
    AND cs.status = 'active'
  )
);

CREATE POLICY "Subscribers can view karma portfolio"
ON public.user_portfolio_items FOR SELECT
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.company_subscriptions cs ON true
    JOIN public.company_members cm ON cm.company_id = cs.company_id
    WHERE p.id = user_portfolio_items.user_id
    AND p.is_karma_profile = true
    AND p.profile_visibility = 'subscribers_only'
    AND cm.user_id = auth.uid()
    AND cs.status = 'active'
  )
);

CREATE POLICY "Subscribers can view karma social links"
ON public.user_social_links FOR SELECT
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.company_subscriptions cs ON true
    JOIN public.company_members cm ON cm.company_id = cs.company_id
    WHERE p.id = user_social_links.user_id
    AND p.is_karma_profile = true
    AND p.profile_visibility = 'subscribers_only'
    AND cm.user_id = auth.uid()
    AND cs.status = 'active'
  )
);

-- 11. Insert default subscription plans
INSERT INTO public.subscription_plans (name, display_name, description, features, monthly_price_cents, annual_price_cents, max_profile_views_monthly, can_invite_candidates, can_access_matching, can_export_data)
VALUES 
  ('basic', 'Basic', 'Accesso base ai profili Karma', '["Visualizza fino a 10 profili/mese", "Ricerca base candidati"]', 4900, 49000, 10, false, false, false),
  ('pro', 'Professional', 'Funzionalità complete per il recruiting', '["Visualizza fino a 50 profili/mese", "Matching automatico", "Invita candidati", "Ricerca avanzata"]', 14900, 149000, 50, true, true, false),
  ('enterprise', 'Enterprise', 'Soluzione completa per grandi aziende', '["Profili illimitati", "Matching avanzato", "Inviti illimitati", "Export dati", "API access", "Supporto dedicato"]', 49900, 499000, -1, true, true, true);

-- 12. Insert initial hard skills catalog
INSERT INTO public.hard_skills_catalog (name, category) VALUES
  ('JavaScript', 'Programming'),
  ('TypeScript', 'Programming'),
  ('Python', 'Programming'),
  ('Java', 'Programming'),
  ('C#', 'Programming'),
  ('Go', 'Programming'),
  ('Rust', 'Programming'),
  ('PHP', 'Programming'),
  ('Ruby', 'Programming'),
  ('Swift', 'Programming'),
  ('Kotlin', 'Programming'),
  ('React', 'Programming'),
  ('Vue.js', 'Programming'),
  ('Angular', 'Programming'),
  ('Node.js', 'Programming'),
  ('Django', 'Programming'),
  ('Spring Boot', 'Programming'),
  ('SQL', 'Programming'),
  ('NoSQL', 'Programming'),
  ('GraphQL', 'Programming'),
  ('Figma', 'Design'),
  ('Adobe XD', 'Design'),
  ('Sketch', 'Design'),
  ('Photoshop', 'Design'),
  ('Illustrator', 'Design'),
  ('UI Design', 'Design'),
  ('UX Design', 'Design'),
  ('Motion Graphics', 'Design'),
  ('3D Modeling', 'Design'),
  ('Branding', 'Design'),
  ('Data Analysis', 'Data'),
  ('Machine Learning', 'Data'),
  ('Deep Learning', 'Data'),
  ('TensorFlow', 'Data'),
  ('PyTorch', 'Data'),
  ('Pandas', 'Data'),
  ('Power BI', 'Data'),
  ('Tableau', 'Data'),
  ('Excel Advanced', 'Data'),
  ('R', 'Data'),
  ('SEO', 'Marketing'),
  ('SEM', 'Marketing'),
  ('Google Analytics', 'Marketing'),
  ('Social Media Marketing', 'Marketing'),
  ('Content Marketing', 'Marketing'),
  ('Email Marketing', 'Marketing'),
  ('Copywriting', 'Marketing'),
  ('Brand Strategy', 'Marketing'),
  ('Agile', 'Project Management'),
  ('Scrum', 'Project Management'),
  ('Jira', 'Project Management'),
  ('Asana', 'Project Management'),
  ('Project Planning', 'Project Management'),
  ('Risk Management', 'Project Management'),
  ('Financial Modeling', 'Finance'),
  ('Accounting', 'Finance'),
  ('Budgeting', 'Finance'),
  ('Financial Analysis', 'Finance'),
  ('SAP', 'Finance'),
  ('English', 'Languages'),
  ('Italian', 'Languages'),
  ('Spanish', 'Languages'),
  ('French', 'Languages'),
  ('German', 'Languages'),
  ('Chinese', 'Languages'),
  ('AWS', 'Cloud & DevOps'),
  ('Azure', 'Cloud & DevOps'),
  ('Google Cloud', 'Cloud & DevOps'),
  ('Docker', 'Cloud & DevOps'),
  ('Kubernetes', 'Cloud & DevOps'),
  ('CI/CD', 'Cloud & DevOps'),
  ('Terraform', 'Cloud & DevOps'),
  ('Linux', 'Cloud & DevOps');