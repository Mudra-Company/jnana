-- =============================================
-- JNANA PLATFORM DATABASE SCHEMA
-- =============================================

-- 1. Create custom types
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'user');
CREATE TYPE public.member_status AS ENUM ('pending', 'invited', 'test_completed', 'completed');
CREATE TYPE public.seniority_level AS ENUM ('Junior', 'Mid', 'Senior', 'Lead', 'C-Level');
CREATE TYPE public.org_node_type AS ENUM ('root', 'department', 'team');
CREATE TYPE public.gender_type AS ENUM ('M', 'F');

-- 2. Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL,
  gender gender_type,
  age INTEGER,
  job_title TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create user_roles table for security
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 4. Create companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  industry TEXT,
  size_range TEXT,
  vat_number TEXT,
  logo_url TEXT,
  foundation_year INTEGER,
  website TEXT,
  address TEXT,
  description TEXT,
  culture_values TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create org_nodes table (organizational structure)
CREATE TABLE public.org_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  parent_node_id UUID REFERENCES public.org_nodes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type org_node_type NOT NULL DEFAULT 'department',
  is_cultural_driver BOOLEAN DEFAULT false,
  target_profile JSONB DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Create company_members table (user-company association)
CREATE TABLE public.company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.org_nodes(id) ON DELETE SET NULL,
  role app_role NOT NULL DEFAULT 'user',
  status member_status NOT NULL DEFAULT 'pending',
  invited_at TIMESTAMPTZ DEFAULT now(),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, company_id)
);

-- 7. Create riasec_results table
CREATE TABLE public.riasec_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  score_r INTEGER NOT NULL DEFAULT 0,
  score_i INTEGER NOT NULL DEFAULT 0,
  score_a INTEGER NOT NULL DEFAULT 0,
  score_s INTEGER NOT NULL DEFAULT 0,
  score_e INTEGER NOT NULL DEFAULT 0,
  score_c INTEGER NOT NULL DEFAULT 0,
  profile_code TEXT,
  raw_answers JSONB DEFAULT '{}',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Create karma_sessions table
CREATE TABLE public.karma_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  transcript JSONB DEFAULT '[]',
  summary TEXT,
  soft_skills TEXT[] DEFAULT '{}',
  primary_values TEXT[] DEFAULT '{}',
  risk_factors TEXT[] DEFAULT '{}',
  seniority_assessment seniority_level,
  completed_at TIMESTAMPTZ
);

-- 9. Create climate_responses table
CREATE TABLE public.climate_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  raw_scores JSONB DEFAULT '{}',
  section_averages JSONB DEFAULT '{}',
  overall_average DECIMAL(3,2),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Create job_suggestions table
CREATE TABLE public.job_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  riasec_code TEXT NOT NULL,
  title TEXT NOT NULL,
  sector TEXT,
  ideal_score JSONB DEFAULT '{}',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- SECURITY DEFINER FUNCTIONS
-- =============================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is admin of a company
CREATE OR REPLACE FUNCTION public.is_company_admin(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_members
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND role = 'admin'
  )
$$;

-- Function to get user's company id
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM public.company_members
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riasec_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.karma_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.climate_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_suggestions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- PROFILES POLICIES
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Super admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Company admins can view company profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.user_id = profiles.id
        AND public.is_company_admin(auth.uid(), cm.company_id)
    )
  );

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- USER_ROLES POLICIES
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- COMPANIES POLICIES
CREATE POLICY "Super admins can view all companies" ON public.companies
  FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage companies" ON public.companies
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Company members can view own company" ON public.companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.company_id = companies.id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company admins can update company" ON public.companies
  FOR UPDATE USING (public.is_company_admin(auth.uid(), id));

-- ORG_NODES POLICIES
CREATE POLICY "Super admins can manage all org nodes" ON public.org_nodes
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Company members can view org nodes" ON public.org_nodes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.company_id = org_nodes.company_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company admins can manage org nodes" ON public.org_nodes
  FOR ALL USING (public.is_company_admin(auth.uid(), company_id));

-- COMPANY_MEMBERS POLICIES
CREATE POLICY "Super admins can manage all members" ON public.company_members
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view own membership" ON public.company_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Company admins can view company members" ON public.company_members
  FOR SELECT USING (public.is_company_admin(auth.uid(), company_id));

CREATE POLICY "Company admins can manage members" ON public.company_members
  FOR ALL USING (public.is_company_admin(auth.uid(), company_id));

-- RIASEC_RESULTS POLICIES
CREATE POLICY "Users can view own results" ON public.riasec_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own results" ON public.riasec_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Company admins can view company results" ON public.riasec_results
  FOR SELECT USING (public.is_company_admin(auth.uid(), company_id));

CREATE POLICY "Super admins can view all results" ON public.riasec_results
  FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));

-- KARMA_SESSIONS POLICIES
CREATE POLICY "Users can view own karma sessions" ON public.karma_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own karma sessions" ON public.karma_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own karma sessions" ON public.karma_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Company admins can view company karma sessions" ON public.karma_sessions
  FOR SELECT USING (public.is_company_admin(auth.uid(), company_id));

CREATE POLICY "Super admins can view all karma sessions" ON public.karma_sessions
  FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));

-- CLIMATE_RESPONSES POLICIES
CREATE POLICY "Users can view own climate responses" ON public.climate_responses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own climate responses" ON public.climate_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Company admins can view company climate responses" ON public.climate_responses
  FOR SELECT USING (public.is_company_admin(auth.uid(), company_id));

CREATE POLICY "Super admins can view all climate responses" ON public.climate_responses
  FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));

-- JOB_SUGGESTIONS POLICIES
CREATE POLICY "Anyone can view job suggestions" ON public.job_suggestions
  FOR SELECT USING (true);

CREATE POLICY "Super admins can manage job suggestions" ON public.job_suggestions
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_org_nodes_updated_at
  BEFORE UPDATE ON public.org_nodes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();