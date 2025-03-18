
-- Add the 'label' column to the pin_configs table
ALTER TABLE public.pin_configs 
ADD COLUMN IF NOT EXISTS label TEXT;
