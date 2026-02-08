-- Enum per tipo di azione audit
CREATE TYPE public.role_audit_action AS ENUM ('created', 'updated', 'deleted', 'assigned', 'unassigned');

-- Tabella audit log per tracciare modifiche ai ruoli
CREATE TABLE public.company_role_audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id UUID NOT NULL REFERENCES public.company_roles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action public.role_audit_action NOT NULL,
    changes JSONB, -- { before: {...}, after: {...}, changedFields: [...] }
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indici per query veloci
CREATE INDEX idx_role_audit_role ON public.company_role_audit_logs(role_id);
CREATE INDEX idx_role_audit_user ON public.company_role_audit_logs(user_id);
CREATE INDEX idx_role_audit_created ON public.company_role_audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.company_role_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: admin/HR possono vedere i log della propria azienda
CREATE POLICY "Company admins can view role audit logs"
    ON public.company_role_audit_logs
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.company_roles cr
        WHERE cr.id = company_role_audit_logs.role_id
        AND (public.is_company_admin(auth.uid(), cr.company_id) 
             OR public.is_company_hr(auth.uid(), cr.company_id))
    ));

-- Policy: utenti autenticati possono inserire log
CREATE POLICY "Authenticated users can insert audit logs"
    ON public.company_role_audit_logs
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Super admin può vedere tutti i log
CREATE POLICY "Super admins can view all audit logs"
    ON public.company_role_audit_logs
    FOR ALL
    USING (public.has_role(auth.uid(), 'super_admin'::app_role));