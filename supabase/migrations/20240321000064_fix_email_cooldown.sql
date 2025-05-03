-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS tr_handle_new_user ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved function to handle new user registration with 60-second cooldown
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
    -- Check if email already exists in auth.users
    IF EXISTS (
        SELECT 1 FROM auth.users 
        WHERE email = NEW.email 
        AND id != NEW.id
    ) THEN
        -- Check cooldown for existing email
        SELECT ec.last_attempt INTO last_attempt
        FROM email_cooldowns ec
        WHERE ec.email = NEW.email;

        IF last_attempt IS NOT NULL THEN
            remaining_seconds = EXTRACT(EPOCH FROM (last_attempt + cooldown_period - NOW()));
            IF remaining_seconds > 0 THEN
                RAISE EXCEPTION 'This email was recently used. Please wait % seconds before trying again', remaining_seconds;
            END IF;
        END IF;

        -- Update last attempt time
        INSERT INTO email_cooldowns (email, last_attempt)
        VALUES (NEW.email, NOW())
        ON CONFLICT (email) DO UPDATE
        SET last_attempt = NOW();
    END IF;

    -- Check for existing profile
    SELECT id INTO existing_profile_id
    FROM profiles
    WHERE user_id = NEW.id;

    -- If profile exists, update it
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

-- Clean up old cooldown records
DELETE FROM email_cooldowns
WHERE last_attempt < NOW() - INTERVAL '1 day'; 