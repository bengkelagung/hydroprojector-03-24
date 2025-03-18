
-- This SQL file is no longer needed as we've redesigned the database schema
-- to use proper foreign key relationships between tables.
-- The pin_configs table now has foreign key references to all related tables.

-- For historical purposes, this was the previous approach:
-- ALTER TABLE public.pin_configs 
-- ADD COLUMN IF NOT EXISTS label TEXT;
-- 
-- CREATE INDEX IF NOT EXISTS idx_pin_configs_label ON public.pin_configs (label);
