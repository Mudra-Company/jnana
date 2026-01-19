-- ============================================
-- COMPLIANCE REQUIREMENTS (Master Catalog)
-- ============================================
CREATE TABLE public.compliance_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  ccnl_scope TEXT NOT NULL,
  obligation_name TEXT NOT NULL,
  description TEXT NOT NULL,
  frequency TEXT NOT NULL,
  frequency_months INTEGER,
  document_required TEXT NOT NULL,
  deadline_type TEXT DEFAULT 'recurring',
  fixed_deadline_day INTEGER,
  fixed_deadline_month INTEGER,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.compliance_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view compliance requirements"
ON public.compliance_requirements FOR SELECT
USING (true);

CREATE POLICY "Super admins can manage compliance requirements"
ON public.compliance_requirements FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

-- ============================================
-- COMPANY CCNL SELECTIONS (Multi-CCNL per Company)
-- ============================================
CREATE TABLE public.company_ccnl_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  ccnl_code TEXT NOT NULL,
  ccnl_label TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, ccnl_code)
);

ALTER TABLE public.company_ccnl_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins can manage CCNL selections"
ON public.company_ccnl_selections FOR ALL
USING (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Company members can view CCNL selections"
ON public.company_ccnl_selections FOR SELECT
USING (EXISTS (
  SELECT 1 FROM company_members cm
  WHERE cm.company_id = company_ccnl_selections.company_id
  AND cm.user_id = auth.uid()
));

CREATE POLICY "Super admins can manage all CCNL selections"
ON public.company_ccnl_selections FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

-- ============================================
-- COMPANY COMPLIANCE STATUS (Per-Company Tracking)
-- ============================================
CREATE TABLE public.company_compliance_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  requirement_id UUID NOT NULL REFERENCES compliance_requirements(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'missing',
  document_url TEXT,
  document_name TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ,
  valid_from DATE,
  valid_until DATE,
  notes TEXT,
  last_reminder_sent TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, requirement_id)
);

ALTER TABLE public.company_compliance_status ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is HR for a company
CREATE OR REPLACE FUNCTION public.is_company_hr(_user_id uuid, _company_id uuid)
RETURNS boolean
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
      AND role IN ('admin', 'hr')
  )
$$;

CREATE POLICY "Company admins and HR can manage compliance status"
ON public.company_compliance_status FOR ALL
USING (is_company_hr(auth.uid(), company_id));

CREATE POLICY "Company members can view compliance status"
ON public.company_compliance_status FOR SELECT
USING (EXISTS (
  SELECT 1 FROM company_members cm
  WHERE cm.company_id = company_compliance_status.company_id
  AND cm.user_id = auth.uid()
));

CREATE POLICY "Super admins can manage all compliance status"
ON public.company_compliance_status FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

-- Trigger for updated_at
CREATE TRIGGER update_company_compliance_status_updated_at
BEFORE UPDATE ON public.company_compliance_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- COMPANY COMPLIANCE HISTORY (Audit Trail)
-- ============================================
CREATE TABLE public.company_compliance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compliance_status_id UUID NOT NULL REFERENCES company_compliance_status(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by UUID REFERENCES profiles(id),
  old_status TEXT,
  new_status TEXT,
  document_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.company_compliance_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins and HR can view compliance history"
ON public.company_compliance_history FOR SELECT
USING (EXISTS (
  SELECT 1 FROM company_compliance_status ccs
  WHERE ccs.id = company_compliance_history.compliance_status_id
  AND is_company_hr(auth.uid(), ccs.company_id)
));

CREATE POLICY "Company admins and HR can insert compliance history"
ON public.company_compliance_history FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM company_compliance_status ccs
  WHERE ccs.id = company_compliance_history.compliance_status_id
  AND is_company_hr(auth.uid(), ccs.company_id)
));

CREATE POLICY "Super admins can manage all compliance history"
ON public.company_compliance_history FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

-- ============================================
-- STORAGE BUCKET FOR COMPLIANCE DOCUMENTS
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('compliance-docs', 'compliance-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Company HR can upload compliance docs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'compliance-docs' 
  AND is_company_hr(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Company HR can view compliance docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'compliance-docs' 
  AND is_company_hr(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Company HR can update compliance docs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'compliance-docs' 
  AND is_company_hr(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Company HR can delete compliance docs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'compliance-docs' 
  AND is_company_hr(auth.uid(), (storage.foldername(name))[1]::uuid)
);