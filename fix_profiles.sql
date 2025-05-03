-- Drop existing triggers
DROP TRIGGER IF EXISTS tr_handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Clean up profiles table
DELETE FROM profiles p1 
USING profiles p2
WHERE p1.user_id = p2.user_id 
AND p1.created_at < p2.created_at;

DELETE FROM profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users u 
    WHERE u.id = p.user_id
);

-- Drop and recreate constraints
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_user_id_key,
DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

ALTER TABLE profiles
ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id),
ADD CONSTRAINT profiles_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE; 