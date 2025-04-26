-- Create a secure function to delete a user that can only be called by the user themselves
CREATE OR REPLACE FUNCTION delete_user_account()
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated; 