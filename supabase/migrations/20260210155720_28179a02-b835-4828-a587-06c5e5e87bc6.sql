
-- =============================================
-- SpaceSync: Office Spatial Management Tables
-- =============================================

-- 1. Office Locations (buildings/floors/sites)
CREATE TABLE public.office_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  building_name TEXT,
  floor_number INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  canvas_width INTEGER NOT NULL DEFAULT 1200,
  canvas_height INTEGER NOT NULL DEFAULT 800,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.office_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view office locations"
  ON public.office_locations FOR SELECT
  USING (company_id = public.get_user_company_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Company admins can insert office locations"
  ON public.office_locations FOR INSERT
  WITH CHECK (public.is_company_admin(auth.uid(), company_id) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Company admins can update office locations"
  ON public.office_locations FOR UPDATE
  USING (public.is_company_admin(auth.uid(), company_id) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Company admins can delete office locations"
  ON public.office_locations FOR DELETE
  USING (public.is_company_admin(auth.uid(), company_id) OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_office_locations_updated_at
  BEFORE UPDATE ON public.office_locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Office Rooms (rectangles on the floor plan canvas)
CREATE TABLE public.office_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID NOT NULL REFERENCES public.office_locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Stanza',
  x DOUBLE PRECISION NOT NULL DEFAULT 0,
  y DOUBLE PRECISION NOT NULL DEFAULT 0,
  width DOUBLE PRECISION NOT NULL DEFAULT 200,
  height DOUBLE PRECISION NOT NULL DEFAULT 150,
  color TEXT DEFAULT '#e2e8f0',
  room_type TEXT NOT NULL DEFAULT 'office',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.office_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view office rooms"
  ON public.office_rooms FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.office_locations ol
    WHERE ol.id = office_rooms.location_id
    AND (ol.company_id = public.get_user_company_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  ));

CREATE POLICY "Company admins can insert office rooms"
  ON public.office_rooms FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.office_locations ol
    WHERE ol.id = office_rooms.location_id
    AND (public.is_company_admin(auth.uid(), ol.company_id) OR public.has_role(auth.uid(), 'super_admin'))
  ));

CREATE POLICY "Company admins can update office rooms"
  ON public.office_rooms FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.office_locations ol
    WHERE ol.id = office_rooms.location_id
    AND (public.is_company_admin(auth.uid(), ol.company_id) OR public.has_role(auth.uid(), 'super_admin'))
  ));

CREATE POLICY "Company admins can delete office rooms"
  ON public.office_rooms FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.office_locations ol
    WHERE ol.id = office_rooms.location_id
    AND (public.is_company_admin(auth.uid(), ol.company_id) OR public.has_role(auth.uid(), 'super_admin'))
  ));

CREATE TRIGGER update_office_rooms_updated_at
  BEFORE UPDATE ON public.office_rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Office Desks (desk positions with person/role assignment)
CREATE TABLE public.office_desks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.office_rooms(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Scrivania',
  x DOUBLE PRECISION NOT NULL DEFAULT 0,
  y DOUBLE PRECISION NOT NULL DEFAULT 0,
  company_member_id UUID REFERENCES public.company_members(id) ON DELETE SET NULL,
  company_role_id UUID REFERENCES public.company_roles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.office_desks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view office desks"
  ON public.office_desks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.office_rooms r
    JOIN public.office_locations ol ON ol.id = r.location_id
    WHERE r.id = office_desks.room_id
    AND (ol.company_id = public.get_user_company_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  ));

CREATE POLICY "Company admins can insert office desks"
  ON public.office_desks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.office_rooms r
    JOIN public.office_locations ol ON ol.id = r.location_id
    WHERE r.id = office_desks.room_id
    AND (public.is_company_admin(auth.uid(), ol.company_id) OR public.has_role(auth.uid(), 'super_admin'))
  ));

CREATE POLICY "Company admins can update office desks"
  ON public.office_desks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.office_rooms r
    JOIN public.office_locations ol ON ol.id = r.location_id
    WHERE r.id = office_desks.room_id
    AND (public.is_company_admin(auth.uid(), ol.company_id) OR public.has_role(auth.uid(), 'super_admin'))
  ));

CREATE POLICY "Company admins can delete office desks"
  ON public.office_desks FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.office_rooms r
    JOIN public.office_locations ol ON ol.id = r.location_id
    WHERE r.id = office_desks.room_id
    AND (public.is_company_admin(auth.uid(), ol.company_id) OR public.has_role(auth.uid(), 'super_admin'))
  ));

CREATE TRIGGER update_office_desks_updated_at
  BEFORE UPDATE ON public.office_desks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_office_locations_company ON public.office_locations(company_id);
CREATE INDEX idx_office_rooms_location ON public.office_rooms(location_id);
CREATE INDEX idx_office_desks_room ON public.office_desks(room_id);
CREATE INDEX idx_office_desks_member ON public.office_desks(company_member_id);
CREATE INDEX idx_office_desks_role ON public.office_desks(company_role_id);
