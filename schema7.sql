-- Add charge_items JSONB column for flexible contract builder
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS charge_items JSONB DEFAULT '[]'::jsonb NOT NULL;

-- Add currency column (default USD)
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD' NOT NULL;
