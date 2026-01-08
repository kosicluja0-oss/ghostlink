-- Create links table
CREATE TABLE public.links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_url TEXT NOT NULL,
  custom_alias TEXT NOT NULL UNIQUE,
  has_bridge_page BOOLEAN DEFAULT false,
  bridge_page_config JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clicks table for tracking
CREATE TABLE public.clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id UUID NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_links_custom_alias ON public.links(custom_alias);
CREATE INDEX idx_clicks_link_id ON public.clicks(link_id);
CREATE INDEX idx_clicks_created_at ON public.clicks(created_at);

-- Enable RLS on both tables
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clicks ENABLE ROW LEVEL SECURITY;

-- Links policies: owners can manage their links
CREATE POLICY "Users can view their own links"
ON public.links FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own links"
ON public.links FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own links"
ON public.links FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own links"
ON public.links FOR DELETE
USING (auth.uid() = user_id);

-- Public read policy for redirect lookups (needed for edge function)
CREATE POLICY "Anyone can lookup links by alias"
ON public.links FOR SELECT
USING (true);

-- Clicks policies: public insert (for tracking), owner read
CREATE POLICY "Anyone can insert clicks"
ON public.clicks FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view clicks for their own links"
ON public.clicks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.links
    WHERE links.id = clicks.link_id
    AND links.user_id = auth.uid()
  )
);

-- Enable realtime for clicks table
ALTER PUBLICATION supabase_realtime ADD TABLE public.clicks;