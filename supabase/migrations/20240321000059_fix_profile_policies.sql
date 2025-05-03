-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable insert for everyone" ON profiles;

-- Create comprehensive policies for profiles table
CREATE POLICY "Enable insert for authenticated users only"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable select for users own profile"
ON profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Enable update for users own profile"
ON profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users own profile"
ON profiles FOR DELETE
USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON profiles TO authenticated; 