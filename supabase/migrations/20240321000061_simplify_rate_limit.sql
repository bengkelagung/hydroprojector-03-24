-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS tr_handle_new_user ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.check_registration_rate_limit(TEXT);

-- Create table for tracking registration attempts
CREATE TABLE IF NOT EXISTS email_cooldowns (
    email TEXT PRIMARY KEY,
    last_attempt TIMESTAMPTZ DEFAULT now()
);

-- Create function to handle new user registration with rate limiting
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

    -- Create profile
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

-- Grant permissions
GRANT ALL ON email_cooldowns TO authenticated;
GRANT ALL ON email_cooldowns TO anon;

-- Clean up old cooldown records
DELETE FROM email_cooldowns
WHERE last_attempt < NOW() - INTERVAL '1 day'; 