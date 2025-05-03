-- Drop existing storage policies
DROP POLICY IF EXISTS "Allow complete storage deletion" ON storage.objects;
DROP POLICY IF EXISTS "Allow storage deletion" ON storage.objects;
DROP POLICY IF EXISTS "Allow listing own files" ON storage.objects;

-- Create more permissive storage policies
CREATE POLICY "Users can manage their own files"
ON storage.objects
FOR ALL
USING (
    bucket_id = 'avatars'
    AND (
        -- Allow access to files in user's folder
        (storage.foldername(name))[1] = auth.uid()::text
        OR
        -- Allow access to specific avatar file
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND (
                avatar_url LIKE '%' || name
                OR avatar_url LIKE '%/' || name
            )
        )
    )
);

-- Ensure storage permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Ensure RLS is enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Update profiles table to handle deletion properly
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_user_id_fkey,
ADD CONSTRAINT profiles_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;

-- Clean up any orphaned profiles
DELETE FROM profiles
WHERE user_id NOT IN (SELECT id FROM auth.users); 