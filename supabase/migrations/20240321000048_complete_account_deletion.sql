-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS tr_delete_storage ON auth.users;
DROP TRIGGER IF EXISTS tr_process_auth_user_delete ON auth.users;
DROP FUNCTION IF EXISTS public.delete_storage_objects();
DROP FUNCTION IF EXISTS public.process_auth_user_delete();

-- Create function to handle complete account deletion
CREATE OR REPLACE FUNCTION public.process_account_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    bucket_name TEXT := 'avatars';
    user_folder TEXT;
BEGIN
    -- Log start of deletion process
    RAISE LOG 'Starting complete account deletion for user: %', OLD.id;
    
    -- Store user ID for folder deletion
    user_folder := OLD.id || '/';
    
    -- Step 1: Delete storage folder and all its contents
    BEGIN
        -- First attempt: Delete all files in user's folder
        PERFORM storage.delete_object(bucket_name, user_folder || '*');
        -- Second attempt: Delete the folder itself
        PERFORM storage.delete_object(bucket_name, user_folder);
        RAISE LOG 'Successfully deleted storage folder and contents for user: %', OLD.id;
    EXCEPTION WHEN others THEN
        RAISE LOG 'Error deleting storage: %', SQLERRM;
    END;

    -- Step 2: Delete profile data (will cascade due to foreign key)
    BEGIN
        DELETE FROM profiles WHERE user_id = OLD.id;
        RAISE LOG 'Successfully deleted profile for user: %', OLD.id;
    EXCEPTION WHEN others THEN
        RAISE LOG 'Error deleting profile: %', SQLERRM;
    END;

    -- Step 3: Delete any other related data here
    -- Add more DELETE statements for other tables if needed
    
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

-- Update storage policies
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own storage" ON storage.objects;

-- Create comprehensive storage deletion policy
CREATE POLICY "Allow complete storage deletion"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'avatars'
    AND (
        -- Allow deleting anything in user's folder
        name LIKE auth.uid()::text || '/%'
        OR name = auth.uid()::text || '/'
    )
);

-- Ensure RLS is enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Verify cascade delete is set up correctly
DO $$
BEGIN
    -- Check and update profiles foreign key if needed
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.referential_constraints
        WHERE constraint_name = 'profiles_user_id_fkey'
        AND delete_rule = 'CASCADE'
    ) THEN
        ALTER TABLE profiles
        DROP CONSTRAINT IF EXISTS profiles_user_id_fkey,
        ADD CONSTRAINT profiles_user_id_fkey 
            FOREIGN KEY (user_id) 
            REFERENCES auth.users(id) 
            ON DELETE CASCADE;
    END IF;
END;
$$; 