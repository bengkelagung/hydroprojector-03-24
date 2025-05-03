-- Drop all existing triggers that might depend on the function
DROP TRIGGER IF EXISTS tr_handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Drop existing RLS policies that might interfere
DROP POLICY IF EXISTS "Enable insert for everyone" ON profiles;
DROP POLICY IF EXISTS "Enable read for users own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update for users own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;

-- Now we can safely drop and recreate the function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved trigger function that handles duplicate emails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete any existing profile with the same email
  DELETE FROM public.profiles 
  WHERE email = NEW.email 
  AND user_id != NEW.id;
  
  -- Delete any existing profile for this user (shouldn't happen, but just in case)
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
  -- Log error but don't fail
  RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER tr_handle_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Recreate RLS policies
CREATE POLICY "Enable insert for everyone"
ON profiles FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable read for users own profile"
ON profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Enable update for users own profile"
ON profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Add function to clean old profiles by email
CREATE OR REPLACE FUNCTION public.clean_old_profiles_by_email(target_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete all profiles with the target email except the most recent one
  DELETE FROM public.profiles
  WHERE email = target_email
  AND id NOT IN (
    SELECT id
    FROM public.profiles
    WHERE email = target_email
    ORDER BY created_at DESC
    LIMIT 1
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.clean_old_profiles_by_email(text) TO authenticated; 