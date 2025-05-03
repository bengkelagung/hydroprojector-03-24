-- Drop existing function and trigger
DROP TRIGGER IF EXISTS tr_delete_storage ON auth.users;
DROP TRIGGER IF EXISTS tr_process_auth_user_delete ON auth.users;
DROP FUNCTION IF EXISTS public.delete_storage_objects();
DROP FUNCTION IF EXISTS public.process_auth_user_delete();

-- Create function to handle storage cleanup
CREATE OR REPLACE FUNCTION public.process_auth_user_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    bucket_name TEXT := 'avatars';
BEGIN
    -- Log start of deletion
    RAISE LOG 'Starting storage cleanup for user: %', OLD.id;
    
    -- Delete the entire user folder and its contents
    BEGIN
        -- Delete user folder with wildcard
        PERFORM storage.delete_object(bucket_name, OLD.id || '/%');
        RAISE LOG 'Successfully deleted user folder and contents: %/%/*', bucket_name, OLD.id;
    EXCEPTION WHEN others THEN
        RAISE LOG 'Error deleting user folder: %', SQLERRM;
    END;

    -- Delete profile (which will cascade to other data)
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
        -- Allow deleting any file in user's folder
        name LIKE auth.uid()::text || '/%'
    )
);

-- Ensure storage bucket has RLS enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 