
-- Function to check if the labels table exists
CREATE OR REPLACE FUNCTION public.check_labels_table_exists()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'labels'
  );
END;
$$;

-- Function to create the check_labels_table_exists function
CREATE OR REPLACE FUNCTION public.create_check_labels_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Drop the function if it exists to recreate it
  DROP FUNCTION IF EXISTS public.check_labels_table_exists();
  
  -- Create the function
  EXECUTE $FUNC$
  CREATE OR REPLACE FUNCTION public.check_labels_table_exists()
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $INNER$
  BEGIN
    RETURN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name = 'labels'
    );
  END;
  $INNER$;
  $FUNC$;
END;
$$;

-- Function to create the labels table and insert default values
CREATE OR REPLACE FUNCTION public.create_labels_table_with_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create labels table if it doesn't exist
  CREATE TABLE IF NOT EXISTS public.labels (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Insert default values if the table is empty
  INSERT INTO public.labels (name)
  VALUES 
    ('pH'),
    ('Suhu'),
    ('Kelembaban'),
    ('Pompa'),
    ('Lampu'),
    ('Level Air')
  ON CONFLICT (name) DO NOTHING;
  
  -- Set up RLS policies
  ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;
  
  -- Allow all authenticated users to read labels
  DROP POLICY IF EXISTS "Allow all users to read labels" ON public.labels;
  CREATE POLICY "Allow all users to read labels" ON public.labels
    FOR SELECT
    TO authenticated
    USING (true);
END;
$$;

-- Function to get all labels
CREATE OR REPLACE FUNCTION public.get_labels()
RETURNS SETOF text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT name FROM public.labels ORDER BY name;
END;
$$;
