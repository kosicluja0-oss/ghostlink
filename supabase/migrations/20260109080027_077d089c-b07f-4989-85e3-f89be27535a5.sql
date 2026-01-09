-- Create conversions table
CREATE TABLE public.conversions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  click_id UUID NOT NULL REFERENCES public.clicks(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('lead', 'sale')),
  value NUMERIC NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for high-performance aggregation
CREATE INDEX idx_conversions_click_id ON public.conversions(click_id);
CREATE INDEX idx_conversions_type ON public.conversions(type);
CREATE INDEX idx_conversions_created_at ON public.conversions(created_at);

-- Enable Row Level Security
ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;

-- Allow public inserts for S2S postback API
CREATE POLICY "Anyone can insert conversions via postback"
ON public.conversions
FOR INSERT
WITH CHECK (true);

-- Owner-only select: users can only view conversions for their own links
CREATE POLICY "Users can view conversions for their own links"
ON public.conversions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clicks
    JOIN public.links ON links.id = clicks.link_id
    WHERE clicks.id = conversions.click_id
    AND links.user_id = auth.uid()
  )
);

-- Enable Supabase Realtime for conversions
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversions;