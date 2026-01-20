-- Add source column to clicks table to track Smart Copy placement parameters
ALTER TABLE public.clicks ADD COLUMN source TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.clicks.source IS 'Tracking parameter from Smart Copy (e.g., ig-story, tt-bio)';