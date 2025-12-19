-- Drop existing restrictive policies on companies
DROP POLICY IF EXISTS "Super admins can view all companies" ON public.companies;
DROP POLICY IF EXISTS "Company members can view own company" ON public.companies;
DROP POLICY IF EXISTS "Super admins can manage companies" ON public.companies;
DROP POLICY IF EXISTS "Company admins can update company" ON public.companies;

-- Recreate as PERMISSIVE policies (default behavior)
CREATE POLICY "Super admins can view all companies" 
ON public.companies 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Company members can view own company" 
ON public.companies 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM company_members cm
  WHERE cm.company_id = companies.id AND cm.user_id = auth.uid()
));

CREATE POLICY "Super admins can manage companies" 
ON public.companies 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Company admins can update company" 
ON public.companies 
FOR UPDATE 
TO authenticated
USING (is_company_admin(auth.uid(), id));