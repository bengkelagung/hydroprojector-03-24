
-- Create the label table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.label (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);

-- Insert default values if they don't exist
INSERT INTO public.label (name) 
VALUES 
  ('pH'),
  ('Suhu'),
  ('Kelembaban'),
  ('Pompa'),
  ('Lampu'),
  ('Level Air')
ON CONFLICT (name) DO NOTHING;

-- Set up RLS policies for the label table
ALTER TABLE public.label ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
DROP POLICY IF EXISTS "Allow authenticated users to read labels" ON public.label;
CREATE POLICY "Allow authenticated users to read labels" 
  ON public.label
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow access to anonymous users too (for demo purposes)
DROP POLICY IF EXISTS "Allow anonymous users to read labels" ON public.label;
CREATE POLICY "Allow anonymous users to read labels" 
  ON public.label
  FOR SELECT
  TO anon
  USING (true);

-- Grant select permission on the label table
GRANT SELECT ON public.label TO authenticated;
GRANT SELECT ON public.label TO anon;
