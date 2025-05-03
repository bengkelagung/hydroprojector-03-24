-- Drop existing functions
DROP FUNCTION IF EXISTS auth.email_confirm(text);
DROP FUNCTION IF EXISTS public.check_email_rate_limit(TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS public.get_email_cooldown(TEXT);

-- Create or replace the registration rate limit function
CREATE OR REPLACE FUNCTION public.check_registration_limit(user_email TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create or replace the function to handle new user registration
CREATE OR REPLACE FUNCTION auth.handle_new_user_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
    check_result jsonb;
BEGIN
    -- Check registration rate limit
    check_result := public.check_registration_limit(NEW.email);
    
    IF NOT (check_result->>'allowed')::boolean THEN
        RAISE EXCEPTION '%', check_result->>'message';
    END IF;

    RETURN NEW;
END;
$$;

-- Create the trigger for new user registration
DROP TRIGGER IF EXISTS tr_check_registration_limit ON auth.users;
CREATE TRIGGER tr_check_registration_limit
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION auth.handle_new_user_registration();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.check_registration_limit(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_registration_limit(TEXT) TO authenticated; 