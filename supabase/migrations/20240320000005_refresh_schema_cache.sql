-- Verify the function exists and recreate if needed
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'delete_user_account' 
    AND pronamespace = 'public'::regnamespace
  ) THEN
    -- Recreate the function if it doesn't exist
    CREATE OR REPLACE FUNCTION public.delete_user_account()
    RETURNS void AS $$
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
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Grant execute permission to authenticated users
    GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
  END IF;
END $$;

-- Force a schema cache refresh
SELECT pg_notify('pgrst', 'reload schema');

-- Additional schema cache refresh commands
ALTER FUNCTION public.delete_user_account() SET search_path = public;
COMMENT ON FUNCTION public.delete_user_account() IS 'Deletes the currently authenticated user account and all associated data';

-- Verify the function is callable by authenticated users
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.routine_privileges 
    WHERE routine_name = 'delete_user_account'
    AND grantee = 'authenticated'
    AND privilege_type = 'EXECUTE'
  ) THEN
    GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
  END IF;
END $$; 