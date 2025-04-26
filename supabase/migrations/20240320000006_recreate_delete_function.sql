-- Drop the function if it exists
DROP FUNCTION IF EXISTS public.delete_user_account();

-- Create the function
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the ID of the authenticated user
  v_user_id := auth.uid();
  
  -- Verify the user exists
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Clean up user data first
  PERFORM clean_up_user_data(v_user_id);

  -- Delete the user from auth.users
  -- This will cascade to delete the profile and other related data
  DELETE FROM auth.users WHERE id = v_user_id;

  -- If we get here, the deletion was successful
  RETURN;
EXCEPTION WHEN OTHERS THEN
  -- Log the error and re-raise it
  RAISE EXCEPTION 'Failed to delete user account: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
REVOKE ALL ON FUNCTION public.delete_user_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION public.delete_user_account() IS 'Deletes the currently authenticated user account and all associated data';

-- Force schema cache refresh
NOTIFY pgrst, 'reload schema'; 