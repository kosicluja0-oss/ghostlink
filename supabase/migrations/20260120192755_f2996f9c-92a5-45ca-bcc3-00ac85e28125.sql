-- Add country column to clicks table for IP geolocation
ALTER TABLE public.clicks ADD COLUMN country TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.clicks.country IS 'Two-letter country code detected from visitor IP (e.g., US, GB, DE)';