-- First, clean up any existing data issues
DO $$
BEGIN
    -- Delete orphaned profiles
    DELETE FROM profiles p
    WHERE NOT EXISTS (
        SELECT 1 FROM auth.users u 
        WHERE u.id = p.user_id
    );

    -- Delete duplicate profiles keeping only the most recent
    WITH DuplicateProfiles AS (
        SELECT user_id,
               MAX(created_at) as latest_created_at
        FROM profiles
        GROUP BY user_id
        HAVING COUNT(*) > 1
    )
    DELETE FROM profiles p
    USING DuplicateProfiles dp
    WHERE p.user_id = dp.user_id
    AND p.created_at < dp.latest_created_at;
END;
$$;

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS tr_handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS tr_process_account_deletion ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.process_account_deletion();

-- Create improved handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Delete any existing profiles for this user
    DELETE FROM profiles WHERE user_id = NEW.id;
    
    -- Insert new profile
    INSERT INTO profiles (
        user_id,
        email,
        first_name,
        last_name,
        full_name,
        avatar_url,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name',
        COALESCE(
            NULLIF(CONCAT_WS(' ', 
                NEW.raw_user_meta_data->>'first_name',
                NEW.raw_user_meta_data->>'last_name'
            ), ''),
            NEW.raw_user_meta_data->>'full_name',
            split_part(NEW.email, '@', 1)
        ),
        NULL,
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$$;

-- Create improved process_account_deletion function
CREATE OR REPLACE FUNCTION public.process_account_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    avatar_url TEXT;
BEGIN
    -- Get avatar URL before deletion
    SELECT p.avatar_url INTO avatar_url
    FROM profiles p
    WHERE p.user_id = OLD.id;

    -- Delete storage files
    IF avatar_url IS NOT NULL THEN
        BEGIN
            -- Delete all files in user's folder
            PERFORM storage.delete_object('avatars', OLD.id || '/*');
            -- Delete the folder itself
            PERFORM storage.delete_object('avatars', OLD.id || '/');
        EXCEPTION WHEN others THEN
            RAISE LOG 'Error deleting storage: %', SQLERRM;
        END;
    END IF;

    -- Delete profile
    DELETE FROM profiles WHERE user_id = OLD.id;
    
    RETURN OLD;
END;
$$;

-- Create triggers
CREATE TRIGGER tr_handle_new_user
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER tr_process_account_deletion
    BEFORE DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.process_account_deletion();

-- Update storage policies
DROP POLICY IF EXISTS "Users can manage their own files" ON storage.objects;
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
            AND avatar_url LIKE '%' || name
        )
    )
);

-- Ensure RLS is enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Update profiles table constraints
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_user_id_fkey,
ADD CONSTRAINT profiles_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE; 