-- Create a table to track email sending attempts
CREATE TABLE IF NOT EXISTS email_rate_limits (
    email TEXT PRIMARY KEY,
    last_sent TIMESTAMPTZ,
    attempts_count INTEGER DEFAULT 0
);

-- Create function to handle email rate limiting
CREATE OR REPLACE FUNCTION public.check_email_rate_limit(user_email TEXT)
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
    -- Cleanup old records first
    DELETE FROM email_rate_limits
    WHERE last_sent < NOW() - INTERVAL '1 day';

    -- Get or create rate limit record
    INSERT INTO email_rate_limits (email, last_sent, attempts_count)
    VALUES (user_email, NOW() - rate_limit_window, 0)
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
            last_sent = NOW()
        WHERE email = user_email;
        RETURN true;
    END IF;

    -- Check if within limits
    IF current_count < max_attempts THEN
        UPDATE email_rate_limits
        SET attempts_count = attempts_count + 1,
            last_sent = NOW()
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

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON email_rate_limits TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_email_rate_limit(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_cooldown(TEXT) TO authenticated; 