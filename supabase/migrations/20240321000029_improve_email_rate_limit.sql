-- Drop existing rate limit functions
DROP FUNCTION IF EXISTS public.check_email_rate_limit(TEXT);
DROP FUNCTION IF EXISTS public.get_email_cooldown(TEXT);
DROP FUNCTION IF EXISTS public.reset_email_rate_limit(TEXT);

-- Create improved rate limit table
DROP TABLE IF EXISTS email_rate_limits;
CREATE TABLE IF NOT EXISTS email_rate_limits (
    email TEXT PRIMARY KEY,
    last_sent TIMESTAMPTZ,
    attempts_count INTEGER DEFAULT 0,
    is_registration BOOLEAN DEFAULT false
);

-- Create function to check if email can be sent
CREATE OR REPLACE FUNCTION public.check_email_rate_limit(
    user_email TEXT,
    is_new_registration BOOLEAN DEFAULT false
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    last_attempt TIMESTAMPTZ;
    current_count INTEGER;
    rate_limit_window INTERVAL = INTERVAL '5 minutes';
    max_attempts INTEGER = 5;
BEGIN
    -- Cleanup old records
    DELETE FROM email_rate_limits
    WHERE last_sent < NOW() - INTERVAL '1 day';

    -- For new registrations, reset the rate limit
    IF is_new_registration THEN
        DELETE FROM email_rate_limits WHERE email = user_email;
        INSERT INTO email_rate_limits (email, last_sent, attempts_count, is_registration)
        VALUES (user_email, NOW(), 1, true);
        RETURN true;
    END IF;

    -- Get or create rate limit record
    INSERT INTO email_rate_limits (email, last_sent, attempts_count, is_registration)
    VALUES (user_email, NOW() - rate_limit_window, 0, false)
    ON CONFLICT (email) DO NOTHING;

    -- Get current status
    SELECT last_sent, attempts_count
    INTO last_attempt, current_count
    FROM email_rate_limits
    WHERE email = user_email;

    -- Reset counter if outside window
    IF NOW() - last_attempt > rate_limit_window THEN
        UPDATE email_rate_limits
        SET attempts_count = 1,
            last_sent = NOW(),
            is_registration = false
        WHERE email = user_email;
        RETURN true;
    END IF;

    -- Check if within limits
    IF current_count < max_attempts THEN
        UPDATE email_rate_limits
        SET attempts_count = attempts_count + 1,
            last_sent = NOW(),
            is_registration = false
        WHERE email = user_email;
        RETURN true;
    END IF;

    RETURN false;
END;
$$;

-- Create function to get remaining cooldown time
CREATE OR REPLACE FUNCTION public.get_email_cooldown(user_email TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    last_attempt TIMESTAMPTZ;
    rate_limit_window INTERVAL = INTERVAL '5 minutes';
    remaining_seconds INTEGER;
BEGIN
    SELECT last_sent
    INTO last_attempt
    FROM email_rate_limits
    WHERE email = user_email;

    IF last_attempt IS NULL THEN
        RETURN 0;
    END IF;

    remaining_seconds = EXTRACT(EPOCH FROM (last_attempt + rate_limit_window - NOW()));
    
    IF remaining_seconds < 0 THEN
        RETURN 0;
    END IF;

    RETURN remaining_seconds;
END;
$$;

-- Modify the handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check and reset rate limit for new registration
  IF NOT public.check_email_rate_limit(NEW.email, true) THEN
    RAISE EXCEPTION 'Email rate limit exceeded. Please wait before trying again.';
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
  RETURN NEW;
END;
$$;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON email_rate_limits TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_email_rate_limit(TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_cooldown(TEXT) TO authenticated; 