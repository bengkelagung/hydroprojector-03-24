
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

-- Grant execute permissions on these functions
GRANT EXECUTE ON FUNCTION public.get_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tables() TO anon;
GRANT EXECUTE ON FUNCTION public.get_columns(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_columns(text) TO anon;

-- Set security definer for RLS bypassing
ALTER FUNCTION public.get_tables() SET search_path = public;
ALTER FUNCTION public.get_columns(text) SET search_path = public;
