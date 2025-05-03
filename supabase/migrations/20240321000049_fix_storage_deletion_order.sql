-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS tr_process_account_deletion ON auth.users;
DROP FUNCTION IF EXISTS public.process_account_deletion();

-- Create improved function to handle complete account deletion
CREATE OR REPLACE FUNCTION public.process_account_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    bucket_name TEXT := 'avatars';
    user_folder TEXT;
    files_to_delete TEXT[];
    file_record RECORD;
BEGIN
    -- Log start of deletion process
    RAISE LOG 'Starting complete account deletion for user: %', OLD.id;
    
    -- Store user ID for folder deletion
    user_folder := OLD.id || '/';
    
    -- Step 1: Find all files in user's folder
    FOR file_record IN 
        SELECT name 
        FROM storage.objects 
        WHERE bucket_id = bucket_name 
        AND name LIKE user_folder || '%'
    LOOP
        -- Add each file to the deletion array
        files_to_delete := array_append(files_to_delete, file_record.name);
    END LOOP;
    
    -- Step 2: Delete each file individually
    IF files_to_delete IS NOT NULL THEN
        FOREACH user_folder IN ARRAY files_to_delete
        LOOP
            BEGIN
                -- Delete individual file
                PERFORM storage.delete_object(bucket_name, user_folder);
                RAISE LOG 'Deleted file: %/%', bucket_name, user_folder;
            EXCEPTION WHEN others THEN
                RAISE LOG 'Error deleting file %/%: %', bucket_name, user_folder, SQLERRM;
            END;
        END LOOP;
    END IF;

    -- Step 3: Try to delete the folder itself
    BEGIN
        PERFORM storage.delete_object(bucket_name, user_folder);
        RAISE LOG 'Deleted folder: %/%', bucket_name, user_folder;
    EXCEPTION WHEN others THEN
        RAISE LOG 'Error deleting folder %/%: %', bucket_name, user_folder, SQLERRM;
    END;

    -- Step 4: Delete profile data (will cascade due to foreign key)
    BEGIN
        DELETE FROM profiles WHERE user_id = OLD.id;
        RAISE LOG 'Successfully deleted profile for user: %', OLD.id;
    EXCEPTION WHEN others THEN
        RAISE LOG 'Error deleting profile: %', SQLERRM;
    END;
    
    RAISE LOG 'Completed account deletion process for user: %', OLD.id;
    RETURN OLD;
END;
$$;

-- Create trigger to run before user deletion
CREATE TRIGGER tr_process_account_deletion
    BEFORE DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.process_account_deletion();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.process_account_deletion() TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Update storage policies
DROP POLICY IF EXISTS "Allow complete storage deletion" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own storage" ON storage.objects;

-- Create more permissive storage policies
CREATE POLICY "Allow storage deletion"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'avatars'
    AND (
        -- Allow deleting files in user's folder
        name LIKE auth.uid()::text || '/%'
        OR
        -- Allow deleting the folder itself
        name = auth.uid()::text || '/'
        OR
        -- Allow deleting specific files
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND avatar_url LIKE '%' || name
        )
    )
);

-- Create policy for listing files (needed for deletion)
CREATE POLICY "Allow listing own files"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'avatars'
    AND (
        name LIKE auth.uid()::text || '/%'
        OR name = auth.uid()::text || '/'
    )
);

-- Ensure RLS is enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 