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
BEGIN
    -- Get the specific file path from profiles
    SELECT avatar_url INTO file_path
    FROM profiles
    WHERE user_id = OLD.id;

    IF file_path IS NOT NULL THEN
        -- Extract just the filename from the full URL
        file_path := OLD.id || '/' || split_part(file_path, '/', -1);
        
        -- Delete the specific file
        BEGIN
            PERFORM storage.delete_object('avatars', file_path);
        EXCEPTION WHEN others THEN
            RAISE LOG 'Error deleting storage object: %', SQLERRM;
        END;
    END IF;

    -- Also try to delete the entire folder just to be safe
    BEGIN
        PERFORM storage.delete_object('avatars', OLD.id || '/*');
    EXCEPTION WHEN others THEN
        RAISE LOG 'Error deleting storage folder: %', SQLERRM;
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

-- Add storage policies for deletion
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
); 