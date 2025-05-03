-- Drop existing rate limit functions
DROP FUNCTION IF EXISTS public.check_email_rate_limit(TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS public.get_email_cooldown(TEXT);

-- Create function to check if email can be sent
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
    result jsonb;
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
                'message', format('Mohon tunggu %s detik sebelum mencoba register ulang', remaining_seconds)
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
        'message', format('Mohon tunggu %s detik sebelum mencoba register ulang', remaining_seconds)
    );
END;
$$;

-- Modify the handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    rate_limit_result jsonb;
BEGIN
    -- Check rate limit for new registration
    rate_limit_result := public.check_email_rate_limit(NEW.email, true);
    
    IF NOT (rate_limit_result->>'can_send')::boolean THEN
        RAISE EXCEPTION '%', rate_limit_result->>'message';
    END IF;
    
    -- Delete any existing profile with the same email
    DELETE FROM public.profiles 
    WHERE email = NEW.email 
    AND user_id != NEW.id;
    
    -- Delete any existing profile for this user
    DELETE FROM public.profiles 
    WHERE user_id = NEW.id;
    
    -- Insert new profile
    INSERT INTO public.profiles (
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
    RAISE EXCEPTION '%', SQLERRM;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.check_email_rate_limit(TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_cooldown(TEXT) TO authenticated; 