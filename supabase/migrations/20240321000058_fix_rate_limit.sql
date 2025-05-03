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
    -- Cleanup old records
    DELETE FROM email_rate_limits
    WHERE last_sent < NOW() - INTERVAL '1 day';

    -- For new registrations, check cooldown
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
                'message', format('Please wait %s seconds before trying again', remaining_seconds)
            );
        END IF;
    END IF;

    -- Reset or create new rate limit record
    DELETE FROM email_rate_limits WHERE email = user_email;
    INSERT INTO email_rate_limits (email, last_sent, attempts_count, is_registration)
    VALUES (user_email, NOW(), 1, is_new_registration);

    RETURN jsonb_build_object(
        'can_send', true,
        'remaining_seconds', 0,
        'message', 'OK'
    );
END;
$$;

-- Create function to get remaining cooldown time
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
    SELECT last_sent
    INTO last_attempt
    FROM email_rate_limits
    WHERE email = user_email;

    IF last_attempt IS NULL THEN
        RETURN jsonb_build_object(
            'remaining_seconds', 0,
            'can_send', true,
            'message', 'OK'
        );
    END IF;

    remaining_seconds = EXTRACT(EPOCH FROM (last_attempt + rate_limit_window - NOW()));
    
    IF remaining_seconds < 0 THEN
        RETURN jsonb_build_object(
            'remaining_seconds', 0,
            'can_send', true,
            'message', 'OK'
        );
    END IF;

    RETURN jsonb_build_object(
        'remaining_seconds', remaining_seconds,
        'can_send', false,
        'message', format('Please wait %s seconds before trying again', remaining_seconds)
    );
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.check_email_rate_limit(TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_cooldown(TEXT) TO authenticated; 