-- Drop existing function and trigger
DROP TRIGGER IF EXISTS tr_delete_storage ON auth.users;
DROP FUNCTION IF EXISTS public.delete_storage_objects();
DROP FUNCTION IF EXISTS public.process_auth_user_delete();

-- Create function to handle all cleanup when a user is deleted
CREATE OR REPLACE FUNCTION public.process_auth_user_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    avatar_url TEXT;
    bucket_name TEXT := 'avatars';
    user_folder TEXT;
    storage_file TEXT;
BEGIN
    -- Get user's avatar URL before profile is deleted
    SELECT p.avatar_url INTO avatar_url
    FROM profiles p
    WHERE p.user_id = OLD.id;

    -- Log the deletion process
    RAISE LOG 'Starting deletion process for user: %, avatar_url: %', OLD.id, avatar_url;

    -- Construct user folder path
    user_folder := OLD.id || '/';

    IF avatar_url IS NOT NULL THEN
        -- Extract filename from avatar_url
        IF position('storage/v1/object/public/avatars/' in avatar_url) > 0 THEN
            storage_file := substring(avatar_url from 'avatars/(.*)');
        ELSE
            storage_file := replace(avatar_url, '/avatars/', '');
        END IF;

        -- Delete specific avatar file
        BEGIN
            RAISE LOG 'Attempting to delete avatar file: %/%', bucket_name, storage_file;
            PERFORM storage.delete_object(bucket_name, storage_file);
            RAISE LOG 'Successfully deleted avatar file';
        EXCEPTION WHEN others THEN
            RAISE LOG 'Error deleting avatar file: %', SQLERRM;
        END;
    END IF;

    -- Delete user's folder and all contents
    BEGIN
        RAISE LOG 'Attempting to delete user folder: %/%', bucket_name, user_folder;
        PERFORM storage.delete_object(bucket_name, user_folder);
        RAISE LOG 'Successfully deleted user folder';
    EXCEPTION WHEN others THEN
        RAISE LOG 'Error deleting user folder: %', SQLERRM;
    END;

    -- Delete profile (this will cascade to other related data)
    DELETE FROM profiles WHERE user_id = OLD.id;
    
    RAISE LOG 'Completed deletion process for user: %', OLD.id;
    
    RETURN OLD;
END;
$$;

-- Create trigger to run before user deletion
CREATE TRIGGER tr_process_auth_user_delete
    BEFORE DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.process_auth_user_delete();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.process_auth_user_delete() TO authenticated;

-- Update storage policies
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own storage" ON storage.objects;

-- Allow users to delete their own storage objects
CREATE POLICY "Users can delete their own storage"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'avatars' 
    AND (
        -- File is in user's folder
        position(auth.uid()::text || '/' in name) = 1
        OR
        -- File matches user's avatar
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

-- Ensure storage bucket has RLS enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 