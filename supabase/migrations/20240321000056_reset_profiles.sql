-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can manage their own files" ON storage.objects;

-- Drop all existing triggers and functions
DROP TRIGGER IF EXISTS tr_handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS tr_process_account_deletion ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.process_account_deletion();

-- Drop and recreate profiles table
DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email text,
    first_name text,
    last_name text,
    full_name text,
    avatar_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert new profile
    INSERT INTO profiles (
        user_id,
        email,
        first_name,
        last_name,
        full_name,
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
BEGIN
    -- Delete storage files
    BEGIN
        PERFORM storage.delete_object('avatars', OLD.id || '/*');
    EXCEPTION WHEN others THEN
        RAISE LOG 'Error deleting storage: %', SQLERRM;
    END;
    
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

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON profiles TO authenticated;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated; 