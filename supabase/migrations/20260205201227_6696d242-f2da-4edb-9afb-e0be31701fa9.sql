
-- Add webhook_token and link_id columns to integrations table
ALTER TABLE public.integrations
  ADD COLUMN IF NOT EXISTS webhook_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS link_id UUID REFERENCES public.links(id) ON DELETE SET NULL;

-- Create index on webhook_token for fast lookups in postback function
CREATE INDEX IF NOT EXISTS idx_integrations_webhook_token ON public.integrations(webhook_token);
