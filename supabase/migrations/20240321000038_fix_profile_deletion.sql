-- Drop existing constraints and triggers first
DROP TRIGGER IF EXISTS tr_handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate the profiles table constraints
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_user_id_fkey,
ADD CONSTRAINT profiles_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Create improved handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Ensure any existing profile is deleted first
    DELETE FROM profiles WHERE user_id = NEW.id;
    DELETE FROM profiles WHERE email = NEW.email;
    
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
        NEW.raw_user_meta_data->>'avatar_url',
        NOW(),
        NOW()
    );
    
    RETURN NEW;
EXCEPTION WHEN others THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER tr_handle_new_user
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Clean up any duplicate profiles
DO $$
BEGIN
    -- Delete profiles without users
    DELETE FROM profiles p
    WHERE NOT EXISTS (
        SELECT 1 FROM auth.users u WHERE u.id = p.user_id
    );
    
    -- Delete duplicate profiles keeping only the most recent one
    DELETE FROM profiles p1
    USING profiles p2
    WHERE p1.user_id = p2.user_id
    AND p1.created_at < p2.created_at;
END;
$$; 