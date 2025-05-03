-- Drop existing functions and triggers
DROP TRIGGER IF EXISTS tr_handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS tr_process_account_deletion ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.process_account_deletion();
DROP FUNCTION IF EXISTS public.delete_user();

-- Clean up any orphaned or duplicate profiles
DELETE FROM profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users u 
    WHERE u.id = p.user_id
);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Delete any existing profiles for this user or email
    DELETE FROM profiles 
    WHERE user_id = NEW.id 
    OR email = NEW.email;
    
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

-- Create function to handle account deletion
CREATE OR REPLACE FUNCTION public.process_account_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_folder TEXT;
    avatar_url TEXT;
BEGIN
    -- Get user's avatar URL before deletion
    SELECT p.avatar_url INTO avatar_url
    FROM profiles p
    WHERE p.user_id = OLD.id;

    -- Delete storage files if avatar exists
    IF avatar_url IS NOT NULL THEN
        -- Delete specific avatar file
        BEGIN
            PERFORM storage.delete_object('avatars', OLD.id || '/*');
        EXCEPTION WHEN others THEN
            RAISE LOG 'Error deleting avatar: %', SQLERRM;
        END;
    END IF;

    -- Delete profile (will cascade to other data)
    DELETE FROM profiles WHERE user_id = OLD.id;
    
    RETURN OLD;
END;
$$;

-- Create function for user-initiated account deletion
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Delete user (this will trigger process_account_deletion)
    DELETE FROM auth.users WHERE id = v_user_id;
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
            AND (
                avatar_url LIKE '%' || name
                OR avatar_url LIKE '%/' || name
            )
        )
    )
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;

-- Ensure RLS is enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Update profiles table constraints
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_user_id_fkey,
ADD CONSTRAINT profiles_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE; 