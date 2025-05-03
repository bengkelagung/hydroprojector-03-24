-- Drop existing trigger and function
DROP TRIGGER IF EXISTS tr_handle_new_user ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Delete any existing profile for this user
    DELETE FROM profiles 
    WHERE user_id = NEW.id;
    
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

-- Create trigger for new user registration
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