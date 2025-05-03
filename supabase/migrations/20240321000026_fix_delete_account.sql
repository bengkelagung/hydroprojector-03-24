-- Drop existing function
DROP FUNCTION IF EXISTS public.delete_user_account();

-- Create improved delete_user_account function
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
BEGIN
  -- Get the ID and email of the authenticated user
  SELECT id, email INTO v_user_id, v_user_email 
  FROM auth.users 
  WHERE id = auth.uid();
  
  -- Verify the user exists
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete all pin data related to user's devices
  DELETE FROM pin_data
  WHERE pin_config_id IN (
    SELECT pc.id
    FROM pin_configs pc
    JOIN devices d ON pc.device_id = d.id
    JOIN projects p ON d.project_id = p.id
    WHERE p.user_id = v_user_id
  );

  -- Delete all pin configurations related to user's devices
  DELETE FROM pin_configs
  WHERE device_id IN (
    SELECT d.id
    FROM devices d
    JOIN projects p ON d.project_id = p.id
    WHERE p.user_id = v_user_id
  );

  -- Delete all devices related to user's projects
  DELETE FROM devices
  WHERE project_id IN (
    SELECT id FROM projects WHERE user_id = v_user_id
  );

  -- Delete all projects
  DELETE FROM projects WHERE user_id = v_user_id;

  -- Delete ALL profiles with the same email (to clean up any duplicates)
  DELETE FROM profiles WHERE email = v_user_email;
  
  -- Delete the specific user's profile
  DELETE FROM profiles WHERE user_id = v_user_id;

  -- Delete avatar from storage if exists
  BEGIN
    PERFORM storage.delete_object('avatars', v_user_id || '/*');
  EXCEPTION WHEN OTHERS THEN
    -- Log error but continue with deletion
    RAISE LOG 'Error deleting avatar: %', SQLERRM;
  END;

  -- Delete the user from auth.users
  DELETE FROM auth.users WHERE id = v_user_id;

  -- Clean up any orphaned profiles with the same email
  PERFORM public.clean_old_profiles_by_email(v_user_email);

  RETURN;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Failed to delete user account: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
REVOKE ALL ON FUNCTION public.delete_user_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;

-- Add cascade delete to profiles table
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_user_id_fkey,
ADD CONSTRAINT profiles_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE; 