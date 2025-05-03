-- Drop all existing rate limit related functions and tables
DROP FUNCTION IF EXISTS auth.email_confirm(text);
DROP FUNCTION IF EXISTS auth.send_email(text, text, jsonb);
DROP TABLE IF EXISTS public.email_rate_limits;

-- Create basic email confirm function
CREATE OR REPLACE FUNCTION auth.email_confirm(token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
    UPDATE auth.users
    SET email_confirmed_at = now(),
        updated_at = now()
    WHERE id = (auth.jwt_decode(token)->>'sub')::uuid;
END;
$$;

-- Create basic email sending function without rate limiting
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
    -- Send email directly without rate limiting
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