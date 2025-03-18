
-- Add the 'label' column to the pin_configs table if it doesn't exist
ALTER TABLE public.pin_configs 
ADD COLUMN IF NOT EXISTS label TEXT;

-- Create an index on the label column for faster lookups
CREATE INDEX IF NOT EXISTS idx_pin_configs_label ON public.pin_configs (label);

-- Add foreign key constraint to ensure labels exist in the label table
-- (disabled for now to avoid breaking existing data)
-- ALTER TABLE public.pin_configs
-- ADD CONSTRAINT fk_pin_configs_label
-- FOREIGN KEY (label) REFERENCES public.label(name)
-- ON DELETE SET NULL
-- ON UPDATE CASCADE;
