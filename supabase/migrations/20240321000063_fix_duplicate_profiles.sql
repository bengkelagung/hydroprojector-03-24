-- Temporarily disable RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop existing triggers first
DROP TRIGGER IF EXISTS tr_handle_new_user ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Clean up duplicate profiles
DELETE FROM profiles p1 
USING profiles p2
WHERE p1.user_id = p2.user_id 
AND p1.created_at < p2.created_at;

-- Delete orphaned profiles
DELETE FROM profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users u 
    WHERE u.id = p.user_id
);

-- Create improved function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    last_attempt TIMESTAMPTZ;
    cooldown_period INTERVAL = INTERVAL '60 seconds';
    remaining_seconds INTEGER;
    existing_profile_id uuid;
BEGIN
    -- Check cooldown
    SELECT ec.last_attempt INTO last_attempt
    FROM email_cooldowns ec
    WHERE ec.email = NEW.email;

    IF last_attempt IS NOT NULL THEN
        remaining_seconds = EXTRACT(EPOCH FROM (last_attempt + cooldown_period - NOW()));
        IF remaining_seconds > 0 THEN
            RAISE EXCEPTION 'Please wait % seconds before trying again', remaining_seconds;
        END IF;
    END IF;

    -- Update last attempt time
    INSERT INTO email_cooldowns (email, last_attempt)
    VALUES (NEW.email, NOW())
    ON CONFLICT (email) DO UPDATE
    SET last_attempt = NOW();

    -- Check for existing profile
    SELECT id INTO existing_profile_id
    FROM profiles
    WHERE user_id = NEW.id;

    -- If profile exists, update it instead of creating new one
    IF existing_profile_id IS NOT NULL THEN
        UPDATE profiles
        SET 
            email = NEW.email,
            first_name = NEW.raw_user_meta_data->>'first_name',
            last_name = NEW.raw_user_meta_data->>'last_name',
            full_name = COALESCE(
                NULLIF(CONCAT_WS(' ', 
                    NEW.raw_user_meta_data->>'first_name',
                    NEW.raw_user_meta_data->>'last_name'
                ), ''),
                NEW.raw_user_meta_data->>'full_name',
                split_part(NEW.email, '@', 1)
            ),
            updated_at = NOW()
        WHERE id = existing_profile_id;
    ELSE
        -- Create new profile
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
    END IF;

    RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER tr_handle_new_user
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies
DROP POLICY IF EXISTS "Enable insert for service role" ON profiles;
DROP POLICY IF EXISTS "Enable select for users own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update for users own profile" ON profiles;
DROP POLICY IF EXISTS "Enable delete for users own profile" ON profiles;

CREATE POLICY "Enable insert for service role"
    ON profiles FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Enable select for users own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Enable update for users own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users own profile"
    ON profiles FOR DELETE
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role; 