-- Create table for tracking registration attempts if it doesn't exist
CREATE TABLE IF NOT EXISTS registration_rate_limits (
    email TEXT PRIMARY KEY,
    attempts_count INTEGER DEFAULT 1,
    last_attempt TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Drop existing rate limit functions if they exist
DROP FUNCTION IF EXISTS public.check_registration_rate_limit(TEXT);
DROP FUNCTION IF EXISTS public.reset_registration_rate_limit(TEXT);

-- Create function to check registration rate limit
CREATE OR REPLACE FUNCTION public.check_registration_rate_limit(user_email TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    rate_limit_window INTERVAL = INTERVAL '1 minute';
    max_attempts INTEGER = 5;
    current_count INTEGER;
    last_attempt TIMESTAMPTZ;
    remaining_seconds INTEGER;
BEGIN
    -- Clean up old records
    DELETE FROM registration_rate_limits
    WHERE last_attempt < NOW() - INTERVAL '1 day';

    -- Get current attempts count and last attempt time
    SELECT attempts_count, last_attempt
    INTO current_count, last_attempt
    FROM registration_rate_limits
    WHERE email = user_email;

    IF last_attempt IS NOT NULL THEN
        -- Check if within cooldown period
        remaining_seconds = EXTRACT(EPOCH FROM (last_attempt + INTERVAL '60 seconds' - NOW()));
        
        IF remaining_seconds > 0 THEN
            RETURN jsonb_build_object(
                'allowed', false,
                'remaining_seconds', remaining_seconds,
                'message', format('Please wait %s seconds before trying again', remaining_seconds)
            );
        END IF;

        -- Check if exceeded max attempts within window
        IF current_count >= max_attempts AND last_attempt + rate_limit_window > NOW() THEN
            remaining_seconds = EXTRACT(EPOCH FROM (last_attempt + rate_limit_window - NOW()));
            RETURN jsonb_build_object(
                'allowed', false,
                'remaining_seconds', remaining_seconds,
                'message', format('Maximum registration attempts reached. Please wait %s seconds', remaining_seconds)
            );
        END IF;
    END IF;

    -- Update or insert rate limit record
    INSERT INTO registration_rate_limits (email, attempts_count, last_attempt)
    VALUES (user_email, 1, NOW())
    ON CONFLICT (email) DO UPDATE
    SET attempts_count = 
        CASE 
            WHEN registration_rate_limits.last_attempt + rate_limit_window < NOW() THEN 1
            ELSE registration_rate_limits.attempts_count + 1
        END,
        last_attempt = NOW();

    RETURN jsonb_build_object(
        'allowed', true,
        'remaining_seconds', 0,
        'message', 'OK'
    );
END;
$$;

-- Modify the handle_new_user trigger function to include rate limiting
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    rate_limit_result jsonb;
BEGIN
    -- Check registration rate limit
    rate_limit_result := public.check_registration_rate_limit(NEW.email);
    
    IF NOT (rate_limit_result->>'allowed')::boolean THEN
        RAISE EXCEPTION '%', rate_limit_result->>'message';
    END IF;

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
        NULL,
        NOW(),
        NOW()
    );
    
    RETURN NEW;
EXCEPTION WHEN others THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RAISE EXCEPTION '%', SQLERRM;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS tr_handle_new_user ON auth.users;
CREATE TRIGGER tr_handle_new_user
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT ALL ON registration_rate_limits TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_registration_rate_limit(TEXT) TO authenticated; 