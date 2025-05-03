-- Drop existing email confirm function
DROP FUNCTION IF EXISTS auth.email_confirm(text);

-- Create improved email confirm function
CREATE OR REPLACE FUNCTION auth.email_confirm(token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
    -- Delete rate limit record for the user's email
    DELETE FROM public.email_rate_limits
    WHERE email = (
        SELECT email 
        FROM auth.users 
        WHERE id = (auth.jwt_decode(token)->>'sub')::uuid
    );

    -- Confirm email
    UPDATE auth.users
    SET email_confirmed_at = now(),
        updated_at = now()
    WHERE id = (auth.jwt_decode(token)->>'sub')::uuid;
END;
$$;

-- Create function to handle email sending
CREATE OR REPLACE FUNCTION auth.send_email(
    template_name text,
    to_email text,
    template_data jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
    -- Delete old rate limit records
    DELETE FROM public.email_rate_limits
    WHERE last_sent < NOW() - INTERVAL '5 minutes';

    -- Send email without additional rate limiting
    PERFORM net.http_post(
        url := current_setting('auth.email.server_url', true),
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', format('Bearer %s', current_setting('auth.email.token', true))
        ),
        body := jsonb_build_object(
            'template', template_name,
            'to', to_email,
            'data', template_data
        )
    );
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION auth.email_confirm(text) TO anon;
GRANT EXECUTE ON FUNCTION auth.send_email(text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION auth.send_email(text, text, jsonb) TO service_role;

-- Reset email rate limits
TRUNCATE TABLE public.email_rate_limits; 