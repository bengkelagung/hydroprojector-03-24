-- Drop existing function and trigger
DROP TRIGGER IF EXISTS tr_delete_storage ON auth.users;
DROP FUNCTION IF EXISTS public.delete_storage_objects();

-- Create improved function to delete avatar from storage
CREATE OR REPLACE FUNCTION public.delete_storage_objects()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    file_path TEXT;
    bucket_name TEXT := 'avatars';
BEGIN
    -- Get the specific file path from profiles
    SELECT avatar_url INTO file_path
    FROM profiles
    WHERE user_id = OLD.id;

    RAISE LOG 'Deleting storage for user: %, avatar_url: %', OLD.id, file_path;

    IF file_path IS NOT NULL THEN
        -- Handle both full URLs and relative paths
        IF position('storage/v1/object/public/' in file_path) > 0 THEN
            -- Extract from full Supabase URL
            file_path := substring(file_path from '/avatars/([^?]+)');
        ELSE
            -- Already a relative path
            file_path := replace(file_path, '/avatars/', '');
        END IF;

        RAISE LOG 'Attempting to delete file: %/%', bucket_name, file_path;
        
        -- Delete the specific file
        BEGIN
            PERFORM storage.delete_object(bucket_name, file_path);
            RAISE LOG 'Successfully deleted file: %/%', bucket_name, file_path;
        EXCEPTION WHEN others THEN
            RAISE LOG 'Error deleting specific file: %', SQLERRM;
        END;
    END IF;

    -- Also try to delete the entire user folder
    BEGIN
        PERFORM storage.delete_object(bucket_name, OLD.id || '/*');
        RAISE LOG 'Successfully deleted user folder: %/%/*', bucket_name, OLD.id;
    EXCEPTION WHEN others THEN
        RAISE LOG 'Error deleting user folder: %', SQLERRM;
    END;
    
    RETURN OLD;
END;
$$;

-- Recreate trigger
CREATE TRIGGER tr_delete_storage
    BEFORE DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.delete_storage_objects();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.delete_storage_objects() TO authenticated;

-- Update storage policies for deletion
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'avatars' 
    AND (
        -- Allow deleting files in user's own folder
        (storage.foldername(name))[1] = auth.uid()::text
        OR
        -- Allow deleting specific files owned by user
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND (
                avatar_url ILIKE '%' || name
                OR avatar_url ILIKE '%/' || name
            )
        )
    )
); 