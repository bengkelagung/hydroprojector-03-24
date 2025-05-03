-- Drop existing rate limit functions
DROP FUNCTION IF EXISTS public.check_email_rate_limit(TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS public.get_email_cooldown(TEXT);

-- Create improved rate limit function
CREATE OR REPLACE FUNCTION public.check_email_rate_limit(
    user_email TEXT,
    is_new_registration BOOLEAN DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    last_attempt TIMESTAMPTZ;
    current_count INTEGER;
    rate_limit_window INTERVAL = INTERVAL '1 minute';
    max_attempts INTEGER = 1;
    remaining_seconds INTEGER;
BEGIN
    -- For new registrations, always check cooldown first
    SELECT last_sent, attempts_count
    INTO last_attempt, current_count
    FROM email_rate_limits
    WHERE email = user_email;

    IF last_attempt IS NOT NULL THEN
        remaining_seconds = EXTRACT(EPOCH FROM (last_attempt + rate_limit_window - NOW()));
        
        IF remaining_seconds > 0 THEN
            RETURN jsonb_build_object(
                'can_send', false,
                'remaining_seconds', remaining_seconds,
                'message', format('Email rate limit exceeded. Please wait %s seconds.', remaining_seconds)
            );
        END IF;
    END IF;

    -- If we're here, either no previous attempt or cooldown expired
    -- Delete old record if exists
    DELETE FROM email_rate_limits WHERE email = user_email;
    
    -- Create new record
    INSERT INTO email_rate_limits (email, last_sent, attempts_count, is_registration)
    VALUES (user_email, NOW(), 1, is_new_registration);

    RETURN jsonb_build_object(
        'can_send', true,
        'remaining_seconds', 0,
        'message', 'OK'
    );
END;
$$;

-- Create improved cooldown check function
CREATE OR REPLACE FUNCTION public.get_email_cooldown(user_email TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    last_attempt TIMESTAMPTZ;
    rate_limit_window INTERVAL = INTERVAL '1 minute';
    remaining_seconds INTEGER;
BEGIN
    -- Get last attempt
    SELECT last_sent
    INTO last_attempt
    FROM email_rate_limits
    WHERE email = user_email;

    IF last_attempt IS NULL THEN
        RETURN jsonb_build_object(
            'can_send', true,
            'remaining_seconds', 0,
            'message', 'OK'
        );
    END IF;

    -- Calculate remaining time
    remaining_seconds = EXTRACT(EPOCH FROM (last_attempt + rate_limit_window - NOW()));
    
    IF remaining_seconds <= 0 THEN
        -- Clean up expired record
        DELETE FROM email_rate_limits WHERE email = user_email;
        
        RETURN jsonb_build_object(
            'can_send', true,
            'remaining_seconds', 0,
            'message', 'OK'
        );
    END IF;

    -- Still in cooldown
    RETURN jsonb_build_object(
        'can_send', false,
        'remaining_seconds', remaining_seconds,
        'message', format('Email rate limit exceeded. Please wait %s seconds.', remaining_seconds)
    );
END;
$$;

-- Modify auth.email_confirm to handle rate limits
CREATE OR REPLACE FUNCTION auth.email_confirm(token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
    _user_id uuid;
    _email text;
    rate_limit_result jsonb;
BEGIN
    -- Get user info from token
    SELECT sub, email INTO _user_id, _email
    FROM auth.jwt_decode(token) AS jwt;

    -- Check rate limit
    rate_limit_result := public.check_email_rate_limit(_email, true);
    
    IF NOT (rate_limit_result->>'can_send')::boolean THEN
        RAISE EXCEPTION '%', rate_limit_result->>'message';
    END IF;

    -- Proceed with confirmation
    UPDATE auth.users
    SET email_confirmed_at = now(),
        updated_at = now()
    WHERE id = _user_id;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.check_email_rate_limit(TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_cooldown(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION auth.email_confirm(TEXT) TO anon; 