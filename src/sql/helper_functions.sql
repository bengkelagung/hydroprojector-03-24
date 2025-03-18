
-- Helper functions for database structure checking

-- Function to get all tables in the public schema
CREATE OR REPLACE FUNCTION public.get_tables()
RETURNS TABLE (table_name text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT tablename::text
  FROM pg_catalog.pg_tables
  WHERE schemaname = 'public';
END;
$$;

-- Function to get all columns in a specific table
CREATE OR REPLACE FUNCTION public.get_columns(table_name text)
RETURNS TABLE (column_name text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT column_name::text
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = get_columns.table_name;
END;
$$;

-- Function to get pins with their names and numbers
CREATE OR REPLACE FUNCTION public.get_pins_with_info()
RETURNS TABLE (
  id uuid,
  pin_name text,
  pin_number integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.pin_name, p.pin_number
  FROM public.pins p
  ORDER BY p.pin_number;
END;
$$;

-- Function to get data types
CREATE OR REPLACE FUNCTION public.get_data_types()
RETURNS TABLE (
  id integer,
  name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT dt.id, dt.name
  FROM public.data_types dt
  ORDER BY dt.name;
END;
$$;

-- Function to get signal types
CREATE OR REPLACE FUNCTION public.get_signal_types()
RETURNS TABLE (
  id integer,
  name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT st.id, st.name
  FROM public.signal_types st
  ORDER BY st.name;
END;
$$;

-- Function to get pin modes
CREATE OR REPLACE FUNCTION public.get_modes()
RETURNS TABLE (
  id integer,
  type text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.type
  FROM public.modes m
  ORDER BY m.type;
END;
$$;

-- Function to get labels
CREATE OR REPLACE FUNCTION public.get_labels()
RETURNS TABLE (
  id integer,
  name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT l.id, l.name
  FROM public.label l
  ORDER BY l.name;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'The label table does not exist yet.';
    RETURN;
END;
$$;

-- Function to get pin configurations with related data
CREATE OR REPLACE FUNCTION public.get_pin_configs_with_relations(user_uuid uuid)
RETURNS TABLE (
  id uuid,
  device_id uuid,
  pin_id uuid,
  pin_number integer,
  pin_name text,
  data_type_id integer,
  data_type_name text,
  signal_type_id integer,
  signal_type_name text,
  mode_id integer,
  mode_type text,
  label_id integer,
  label_name text,
  name text,
  unit text,
  value text,
  last_updated timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if all required tables exist
  PERFORM 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pin_configs';
  PERFORM 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pins';
  PERFORM 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'data_types';
  PERFORM 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'signal_types';
  PERFORM 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'modes';
  PERFORM 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'devices';
  PERFORM 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'projects';
  
  RETURN QUERY
  SELECT 
    pc.id, 
    pc.device_id,
    pc.pin_id,
    p.pin_number,
    p.pin_name,
    pc.data_type_id,
    dt.name AS data_type_name,
    pc.signal_type_id,
    st.name AS signal_type_name,
    pc.mode_id,
    m.type AS mode_type,
    pc.label_id,
    l.name AS label_name,
    pc.name,
    pc.unit,
    pc.value,
    pc.last_updated,
    pc.created_at
  FROM 
    public.pin_configs pc
    JOIN public.pins p ON pc.pin_id = p.id
    JOIN public.data_types dt ON pc.data_type_id = dt.id
    JOIN public.signal_types st ON pc.signal_type_id = st.id
    JOIN public.modes m ON pc.mode_id = m.id
    LEFT JOIN public.label l ON pc.label_id = l.id
    JOIN public.devices d ON pc.device_id = d.id
    JOIN public.projects pr ON d.project_id = pr.id
  WHERE 
    pr.user_id = user_uuid
  ORDER BY 
    pc.device_id, p.pin_number;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'One or more tables do not exist yet.';
    RETURN;
END;
$$;

-- Grant execute permissions on these functions
GRANT EXECUTE ON FUNCTION public.get_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tables() TO anon;
GRANT EXECUTE ON FUNCTION public.get_columns(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_columns(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_pins_with_info() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pins_with_info() TO anon;
GRANT EXECUTE ON FUNCTION public.get_data_types() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_data_types() TO anon;
GRANT EXECUTE ON FUNCTION public.get_signal_types() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_signal_types() TO anon;
GRANT EXECUTE ON FUNCTION public.get_modes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_modes() TO anon;
GRANT EXECUTE ON FUNCTION public.get_labels() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_labels() TO anon;
GRANT EXECUTE ON FUNCTION public.get_pin_configs_with_relations(uuid) TO authenticated;

-- Set security definer for RLS bypassing
ALTER FUNCTION public.get_tables() SET search_path = public;
ALTER FUNCTION public.get_columns(text) SET search_path = public;
ALTER FUNCTION public.get_pins_with_info() SET search_path = public;
ALTER FUNCTION public.get_data_types() SET search_path = public;
ALTER FUNCTION public.get_signal_types() SET search_path = public;
ALTER FUNCTION public.get_modes() SET search_path = public;
ALTER FUNCTION public.get_labels() SET search_path = public;
ALTER FUNCTION public.get_pin_configs_with_relations(uuid) SET search_path = public;
