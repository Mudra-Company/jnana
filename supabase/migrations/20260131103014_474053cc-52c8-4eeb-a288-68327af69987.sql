-- =====================================================
-- ROLE-CENTRIC ARCHITECTURE: Phase 1 - Database Schema
-- =====================================================

-- 1. Create ENUMs for role management
CREATE TYPE public.role_status AS ENUM ('active', 'vacant', 'frozen', 'planned');
CREATE TYPE public.contract_type AS ENUM ('permanent', 'fixed_term', 'apprenticeship', 'internship', 'freelance', 'consulting');
CREATE TYPE public.work_hours_type AS ENUM ('full_time', 'part_time', 'flexible');
CREATE TYPE public.remote_policy AS ENUM ('on_site', 'hybrid', 'remote', 'flexible');
CREATE TYPE public.assignment_type AS ENUM ('primary', 'interim', 'backup', 'training');

-- 2. Create company_roles table (primary entity for organizational structure)
CREATE TABLE public.company_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    org_node_id UUID REFERENCES public.org_nodes(id) ON DELETE SET NULL,
    
    -- Basic Info
    title TEXT NOT NULL,
    code TEXT,
    description TEXT,
    
    -- Mansionario (Job Description)
    responsibilities JSONB DEFAULT '[]'::jsonb,
    daily_tasks JSONB DEFAULT '[]'::jsonb,
    kpis JSONB DEFAULT '[]'::jsonb,
    
    -- Required Skills
    required_hard_skills JSONB DEFAULT '[]'::jsonb,
    required_soft_skills JSONB DEFAULT '[]'::jsonb,
    required_seniority public.seniority_level,
    required_education JSONB DEFAULT '[]'::jsonb,
    required_certifications JSONB DEFAULT '[]'::jsonb,
    required_languages JSONB DEFAULT '[]'::jsonb,
    years_experience_min INTEGER,
    years_experience_max INTEGER,
    
    -- Contractual Framework (Inquadramento)
    ccnl_level TEXT,
    ral_range_min INTEGER,
    ral_range_max INTEGER,
    contract_type public.contract_type,
    work_hours_type public.work_hours_type DEFAULT 'full_time',
    remote_policy public.remote_policy DEFAULT 'on_site',
    
    -- Hierarchy
    reports_to_role_id UUID REFERENCES public.company_roles(id) ON DELETE SET NULL,
    
    -- Status
    status public.role_status NOT NULL DEFAULT 'active',
    headcount INTEGER NOT NULL DEFAULT 1,
    is_hiring BOOLEAN NOT NULL DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create company_role_assignments table (person-role mapping)
CREATE TABLE public.company_role_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id UUID NOT NULL REFERENCES public.company_roles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    company_member_id UUID REFERENCES public.company_members(id) ON DELETE SET NULL,
    
    -- Assignment Details
    assignment_type public.assignment_type NOT NULL DEFAULT 'primary',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    fte_percentage INTEGER NOT NULL DEFAULT 100 CHECK (fte_percentage > 0 AND fte_percentage <= 100),
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Create indexes for performance
CREATE INDEX idx_company_roles_company ON public.company_roles(company_id);
CREATE INDEX idx_company_roles_org_node ON public.company_roles(org_node_id);
CREATE INDEX idx_company_roles_status ON public.company_roles(status);
CREATE INDEX idx_company_roles_is_hiring ON public.company_roles(is_hiring) WHERE is_hiring = true;
CREATE INDEX idx_role_assignments_role ON public.company_role_assignments(role_id);
CREATE INDEX idx_role_assignments_user ON public.company_role_assignments(user_id);
CREATE INDEX idx_role_assignments_active ON public.company_role_assignments(role_id) WHERE end_date IS NULL;

-- 5. Create triggers for updated_at
CREATE TRIGGER update_company_roles_updated_at
    BEFORE UPDATE ON public.company_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_role_assignments_updated_at
    BEFORE UPDATE ON public.company_role_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Enable RLS
ALTER TABLE public.company_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_role_assignments ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for company_roles
CREATE POLICY "Super admins can manage all roles"
    ON public.company_roles
    FOR ALL
    USING (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Company admins can manage company roles"
    ON public.company_roles
    FOR ALL
    USING (public.is_company_admin(auth.uid(), company_id));

CREATE POLICY "Company HR can manage company roles"
    ON public.company_roles
    FOR ALL
    USING (public.is_company_hr(auth.uid(), company_id));

CREATE POLICY "Company members can view company roles"
    ON public.company_roles
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.company_members cm
        WHERE cm.company_id = company_roles.company_id
        AND cm.user_id = auth.uid()
    ));

-- 8. RLS Policies for company_role_assignments
CREATE POLICY "Super admins can manage all assignments"
    ON public.company_role_assignments
    FOR ALL
    USING (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Company admins can manage assignments"
    ON public.company_role_assignments
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.company_roles cr
        WHERE cr.id = company_role_assignments.role_id
        AND public.is_company_admin(auth.uid(), cr.company_id)
    ));

CREATE POLICY "Company HR can manage assignments"
    ON public.company_role_assignments
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.company_roles cr
        WHERE cr.id = company_role_assignments.role_id
        AND public.is_company_hr(auth.uid(), cr.company_id)
    ));

CREATE POLICY "Users can view assignments in their company"
    ON public.company_role_assignments
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.company_roles cr
        JOIN public.company_members cm ON cm.company_id = cr.company_id
        WHERE cr.id = company_role_assignments.role_id
        AND cm.user_id = auth.uid()
    ));