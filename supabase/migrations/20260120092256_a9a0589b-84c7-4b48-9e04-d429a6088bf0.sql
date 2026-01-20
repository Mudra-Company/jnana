-- Fix RLS policies for compliance-docs storage bucket to include super_admin

-- Recreate with super_admin fallback (correct function signature: user_id first, then role)
CREATE POLICY "Company HR or Super Admin can upload compliance docs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'compliance-docs' 
  AND (
    public.has_role(auth.uid(), 'super_admin'::public.app_role) 
    OR public.is_company_hr((storage.foldername(name))[1]::uuid, auth.uid())
  )
);

CREATE POLICY "Company HR or Super Admin can view compliance docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'compliance-docs' 
  AND (
    public.has_role(auth.uid(), 'super_admin'::public.app_role) 
    OR public.is_company_hr((storage.foldername(name))[1]::uuid, auth.uid())
  )
);

CREATE POLICY "Company HR or Super Admin can update compliance docs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'compliance-docs' 
  AND (
    public.has_role(auth.uid(), 'super_admin'::public.app_role) 
    OR public.is_company_hr((storage.foldername(name))[1]::uuid, auth.uid())
  )
);

CREATE POLICY "Company HR or Super Admin can delete compliance docs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'compliance-docs' 
  AND (
    public.has_role(auth.uid(), 'super_admin'::public.app_role) 
    OR public.is_company_hr((storage.foldername(name))[1]::uuid, auth.uid())
  )
);