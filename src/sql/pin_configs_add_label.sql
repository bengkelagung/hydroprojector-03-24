
-- Add the 'label' column to the pin_configs table if it doesn't exist
ALTER TABLE public.pin_configs 
ADD COLUMN IF NOT EXISTS label TEXT;

-- Create an index on the label column for faster lookups
CREATE INDEX IF NOT EXISTS idx_pin_configs_label ON public.pin_configs (label);
