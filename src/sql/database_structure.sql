
-- Database Structure Documentation
-- This file documents the complete database structure of the application

-- =========================================================
-- TABLE: profiles
-- Stores user profile information
-- =========================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  profile_id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  full_name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  last_active TIMESTAMP WITH TIME ZONE
);

-- =========================================================
-- TABLE: projects
-- Stores project information
-- =========================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_name TEXT NOT NULL,
  description TEXT NOT NULL,
  profile_id UUID REFERENCES public.profiles(profile_id),
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================
-- TABLE: devices
-- Stores device information
-- =========================================================
CREATE TABLE IF NOT EXISTS public.devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_name TEXT NOT NULL,
  description TEXT NOT NULL,
  device_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'inactive',
  project_id UUID REFERENCES public.projects(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE,
  last_seen TIMESTAMP WITH TIME ZONE,
  is_connected BOOLEAN DEFAULT FALSE,
  uptime JSONB
);

-- =========================================================
-- TABLE: device_logs
-- Stores device activity logs
-- =========================================================
CREATE TABLE IF NOT EXISTS public.device_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID REFERENCES public.devices(id),
  status TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================
-- TABLE: label
-- Stores sensor/actuator type labels
-- =========================================================
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

-- =========================================================
-- TABLE: pin_configs
-- Stores pin configuration details
-- =========================================================
CREATE TABLE IF NOT EXISTS public.pin_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID REFERENCES public.devices(id),
  pin_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  mode TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  data_type TEXT NOT NULL,
  unit TEXT,
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on the label column for faster lookups
CREATE INDEX IF NOT EXISTS idx_pin_configs_label ON public.pin_configs (label);

-- =========================================================
-- TABLE: pin_data
-- Stores data readings from pins
-- =========================================================
CREATE TABLE IF NOT EXISTS public.pin_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pin_config_id UUID REFERENCES public.pin_configs(id),
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================
-- TABLE: data_types
-- Stores available data types
-- =========================================================
CREATE TABLE IF NOT EXISTS public.data_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  type TEXT NOT NULL
);

-- =========================================================
-- TABLE: modes
-- Stores available pin modes
-- =========================================================
CREATE TABLE IF NOT EXISTS public.modes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL
);

-- =========================================================
-- TABLE: pins
-- Stores available pins
-- =========================================================
CREATE TABLE IF NOT EXISTS public.pins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pin_name TEXT NOT NULL,
  pin_number INTEGER NOT NULL
);

-- =========================================================
-- TABLE: pin_configuration
-- Stores advanced pin configuration
-- =========================================================
CREATE TABLE IF NOT EXISTS public.pin_configuration (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID REFERENCES public.devices(id),
  pin_id UUID REFERENCES public.pins(id),
  data_type_id UUID REFERENCES public.data_types(id),
  signal_type_id UUID REFERENCES public.signal_types(id),
  mode_id UUID REFERENCES public.modes(id),
  state BOOLEAN,
  status TEXT NOT NULL
);

-- =========================================================
-- TABLE: pin_logs
-- Stores pin activity logs
-- =========================================================
CREATE TABLE IF NOT EXISTS public.pin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID REFERENCES public.devices(id),
  pin_id UUID REFERENCES public.pins(id),
  description TEXT NOT NULL,
  status TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================
-- TABLE: pin_modes
-- Stores available pin modes
-- =========================================================
CREATE TABLE IF NOT EXISTS public.pin_modes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL
);

-- =========================================================
-- TABLE: signal_types
-- Stores available signal types
-- =========================================================
CREATE TABLE IF NOT EXISTS public.signal_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  type TEXT NOT NULL
);

-- =========================================================
-- TABLE: setting
-- Stores user settings
-- =========================================================
CREATE TABLE IF NOT EXISTS public.setting (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(user_id),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- =========================================================
-- TABLE: target_setting
-- Stores target values for hydroponics
-- =========================================================
CREATE TABLE IF NOT EXISTS public.target_setting (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(user_id),
  target_ph NUMERIC NOT NULL,
  target_suhu NUMERIC NOT NULL,
  target_kelembaban NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- =========================================================
-- TABLE: user_setting
-- Stores user profile settings
-- =========================================================
CREATE TABLE IF NOT EXISTS public.user_setting (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(user_id),
  nama_lengkap TEXT NOT NULL,
  email TEXT NOT NULL,
  nomor_hp TEXT NOT NULL,
  foto_user TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT user_setting_user_id_key UNIQUE (user_id)
);

-- =========================================================
-- TABLE: webhook_setting
-- Stores webhook configuration
-- =========================================================
CREATE TABLE IF NOT EXISTS public.webhook_setting (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(user_id),
  webhook_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- =========================================================
-- TABLE PERMISSIONS
-- Set up RLS policies and permissions
-- =========================================================

-- Enable RLS on the label table
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

-- Grant permissions
GRANT SELECT ON public.label TO authenticated;
GRANT SELECT ON public.label TO anon;

-- NOTE: Additional RLS policies for other tables would be added here
-- based on the application's security requirements.
