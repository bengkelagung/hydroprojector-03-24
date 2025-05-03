-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS tr_check_registration_limit ON auth.users;
DROP FUNCTION IF EXISTS auth.handle_new_user();
DROP FUNCTION IF EXISTS auth.handle_new_user_registration();
DROP FUNCTION IF EXISTS public.check_registration_limit(TEXT);

-- Recreate the basic profile handler
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Delete any existing profile for this user
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
        NEW.raw_user_meta_data->>'avatar_url',
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$$;

-- Create the registration rate limit function
CREATE OR REPLACE FUNCTION public.check_registration_limit(user_email TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    last_attempt TIMESTAMPTZ;
    rate_limit_window INTERVAL = INTERVAL '1 minute';
    remaining_seconds INTEGER;
BEGIN
    -- Get last registration attempt
    SELECT last_sent
    INTO last_attempt
    FROM email_rate_limits
    WHERE email = user_email;

    IF last_attempt IS NOT NULL THEN
        remaining_seconds = EXTRACT(EPOCH FROM (last_attempt + rate_limit_window - NOW()));
        
        IF remaining_seconds > 0 THEN
            RETURN jsonb_build_object(
                'allowed', false,
                'remaining_seconds', remaining_seconds,
                'message', format('Mohon tunggu %s detik sebelum mencoba register ulang', remaining_seconds)
            );
        END IF;
    END IF;

    -- If we're here, either no previous attempt or cooldown expired
    -- Delete old record if exists
    DELETE FROM email_rate_limits WHERE email = user_email;
    
    -- Create new record
    INSERT INTO email_rate_limits (email, last_sent, attempts_count, is_registration)
    VALUES (user_email, NOW(), 1, true);

    RETURN jsonb_build_object(
        'allowed', true,
        'remaining_seconds', 0,
        'message', 'OK'
    );
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT ALL ON public.email_rate_limits TO authenticated;
GRANT ALL ON public.email_rate_limits TO anon;
GRANT EXECUTE ON FUNCTION public.check_registration_limit(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_registration_limit(TEXT) TO anon;

-- Reset the rate limit table
TRUNCATE TABLE public.email_rate_limits; 