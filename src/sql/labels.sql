
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

-- Function to get all labels
CREATE OR REPLACE FUNCTION public.get_all_labels()
RETURNS SETOF public.label
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM public.label ORDER BY name;
$$;
