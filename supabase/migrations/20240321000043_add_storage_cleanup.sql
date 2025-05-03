-- Create function to delete avatar from storage
CREATE OR REPLACE FUNCTION public.delete_storage_objects()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    avatar_path TEXT;
BEGIN
    -- Construct the path pattern for all files in user's folder
    avatar_path := OLD.id || '/*';
    
    -- Delete all files in the user's folder
    BEGIN
        PERFORM storage.delete_object('avatars', avatar_path);
    EXCEPTION WHEN others THEN
        RAISE LOG 'Error deleting storage objects: %', SQLERRM;
    END;
    
    RETURN OLD;
END;
$$;

-- Create trigger to delete storage objects when user is deleted
DROP TRIGGER IF EXISTS tr_delete_storage ON auth.users;

CREATE TRIGGER tr_delete_storage
    BEFORE DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.delete_storage_objects();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.delete_storage_objects() TO authenticated; 