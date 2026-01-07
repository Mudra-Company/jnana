-- Table for work experiences
CREATE TABLE public.user_experiences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  location TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table for education
CREATE TABLE public.user_education (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution TEXT NOT NULL,
  degree TEXT NOT NULL,
  field_of_study TEXT,
  start_year INTEGER,
  end_year INTEGER,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table for certifications
CREATE TABLE public.user_certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuing_organization TEXT,
  issue_date DATE,
  expiry_date DATE,
  credential_id TEXT,
  credential_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table for languages
CREATE TABLE public.user_languages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  proficiency TEXT DEFAULT 'intermediate',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_languages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_experiences
CREATE POLICY "Users can manage own experiences" 
ON public.user_experiences FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Subscribers can view karma profile experiences" 
ON public.user_experiences FOR SELECT 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN company_subscriptions cs ON true
    JOIN company_members cm ON cm.company_id = cs.company_id
    WHERE p.id = user_experiences.user_id 
    AND p.is_karma_profile = true 
    AND p.profile_visibility = 'subscribers_only'
    AND cm.user_id = auth.uid() 
    AND cs.status = 'active'
  )
);

-- RLS Policies for user_education
CREATE POLICY "Users can manage own education" 
ON public.user_education FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Subscribers can view karma profile education" 
ON public.user_education FOR SELECT 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN company_subscriptions cs ON true
    JOIN company_members cm ON cm.company_id = cs.company_id
    WHERE p.id = user_education.user_id 
    AND p.is_karma_profile = true 
    AND p.profile_visibility = 'subscribers_only'
    AND cm.user_id = auth.uid() 
    AND cs.status = 'active'
  )
);

-- RLS Policies for user_certifications
CREATE POLICY "Users can manage own certifications" 
ON public.user_certifications FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Subscribers can view karma profile certifications" 
ON public.user_certifications FOR SELECT 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN company_subscriptions cs ON true
    JOIN company_members cm ON cm.company_id = cs.company_id
    WHERE p.id = user_certifications.user_id 
    AND p.is_karma_profile = true 
    AND p.profile_visibility = 'subscribers_only'
    AND cm.user_id = auth.uid() 
    AND cs.status = 'active'
  )
);

-- RLS Policies for user_languages
CREATE POLICY "Users can manage own languages" 
ON public.user_languages FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Subscribers can view karma profile languages" 
ON public.user_languages FOR SELECT 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN company_subscriptions cs ON true
    JOIN company_members cm ON cm.company_id = cs.company_id
    WHERE p.id = user_languages.user_id 
    AND p.is_karma_profile = true 
    AND p.profile_visibility = 'subscribers_only'
    AND cm.user_id = auth.uid() 
    AND cs.status = 'active'
  )
);