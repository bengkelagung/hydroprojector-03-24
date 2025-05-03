-- Create function to reset email rate limit
CREATE OR REPLACE FUNCTION public.reset_email_rate_limit(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM email_rate_limits
    WHERE email = user_email;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.reset_email_rate_limit(TEXT) TO authenticated;

-- Modify the handle_new_user trigger function to reset rate limit
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Reset email rate limit for new registration
  PERFORM public.reset_email_rate_limit(NEW.email);
  
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