-- =============================================
-- POSITION SHORTLIST SYSTEM
-- =============================================

-- Table: position_shortlists
-- Stores shortlists for open positions
CREATE TABLE public.position_shortlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID NOT NULL REFERENCES public.company_members(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  notes TEXT
);

-- Table: shortlist_candidates
-- Stores candidates added to shortlists (both internal and external)
CREATE TABLE public.shortlist_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shortlist_id UUID NOT NULL REFERENCES public.position_shortlists(id) ON DELETE CASCADE,
  candidate_type TEXT NOT NULL CHECK (candidate_type IN ('internal', 'external')),
  -- For internal candidates (user_id from company_members)
  internal_user_id UUID,
  -- For external candidates (from Karma profiles)
  external_profile_id UUID,
  -- Match data (stored for historical reference)
  match_score INTEGER,
  match_details JSONB DEFAULT '{}'::jsonb,
  -- Evaluation data
  status TEXT DEFAULT 'shortlisted' CHECK (status IN ('shortlisted', 'interviewing', 'offered', 'rejected', 'hired')),
  hr_notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  added_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.position_shortlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shortlist_candidates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for position_shortlists
CREATE POLICY "Company admins can manage shortlists"
ON public.position_shortlists FOR ALL
USING (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Super admins can manage all shortlists"
ON public.position_shortlists FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for shortlist_candidates
CREATE POLICY "Company admins can manage shortlist candidates"
ON public.shortlist_candidates FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.position_shortlists ps
    WHERE ps.id = shortlist_candidates.shortlist_id
    AND is_company_admin(auth.uid(), ps.company_id)
  )
);

CREATE POLICY "Super admins can manage all shortlist candidates"
ON public.shortlist_candidates FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Indexes for performance
CREATE INDEX idx_position_shortlists_position ON public.position_shortlists(position_id);
CREATE INDEX idx_position_shortlists_company ON public.position_shortlists(company_id);
CREATE INDEX idx_shortlist_candidates_shortlist ON public.shortlist_candidates(shortlist_id);
CREATE INDEX idx_shortlist_candidates_internal ON public.shortlist_candidates(internal_user_id) WHERE internal_user_id IS NOT NULL;
CREATE INDEX idx_shortlist_candidates_external ON public.shortlist_candidates(external_profile_id) WHERE external_profile_id IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER update_position_shortlists_updated_at
BEFORE UPDATE ON public.position_shortlists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shortlist_candidates_updated_at
BEFORE UPDATE ON public.shortlist_candidates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();