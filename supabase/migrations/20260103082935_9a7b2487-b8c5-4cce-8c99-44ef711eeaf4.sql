-- Create storage bucket for user files (avatars, CVs, portfolio)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-files', 'user-files', false);

-- RLS Policies for user-files bucket

-- Users can upload their own files
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own files
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Subscribers can view karma profile files (for viewing portfolios)
CREATE POLICY "Subscribers can view karma profile files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-files'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.company_subscriptions cs ON true
    JOIN public.company_members cm ON cm.company_id = cs.company_id
    WHERE p.id::text = (storage.foldername(name))[1]
    AND p.is_karma_profile = true
    AND p.profile_visibility = 'subscribers_only'
    AND cm.user_id = auth.uid()
    AND cs.status = 'active'
  )
);