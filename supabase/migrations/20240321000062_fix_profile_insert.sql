-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS tr_handle_new_user ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to handle new user registration
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

    -- Delete any existing profile for this user
    DELETE FROM profiles WHERE user_id = NEW.id;
    
    -- Create profile with SECURITY DEFINER privileges
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

-- Create trigger
CREATE TRIGGER tr_handle_new_user
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Drop and recreate RLS policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable insert for everyone" ON profiles;
DROP POLICY IF EXISTS "Enable select for users own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update for users own profile" ON profiles;
DROP POLICY IF EXISTS "Enable delete for users own profile" ON profiles;

-- Create comprehensive RLS policies
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

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role; 