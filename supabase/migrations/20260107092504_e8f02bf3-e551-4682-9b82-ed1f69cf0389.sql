-- Make user-files bucket public for avatars and portfolio items visibility
UPDATE storage.buckets 
SET public = true 
WHERE id = 'user-files';

-- Add RLS policy for public read access (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Public read access for user-files' 
    AND tablename = 'objects' 
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Public read access for user-files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'user-files');
  END IF;
END $$;