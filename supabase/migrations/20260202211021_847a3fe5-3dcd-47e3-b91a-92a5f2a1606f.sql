-- Fix overly permissive RLS policy on clicks table
-- Instead of allowing any insert, validate that the link actually exists
DROP POLICY IF EXISTS "Anyone can insert clicks" ON public.clicks;

CREATE POLICY "Insert clicks for valid links only"
ON public.clicks FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.links WHERE id = link_id
  )
);

-- Fix overly permissive RLS policy on conversions table
-- Instead of allowing any insert, validate that the click actually exists
DROP POLICY IF EXISTS "Anyone can insert conversions via postback" ON public.conversions;

CREATE POLICY "Insert conversions for valid clicks only"
ON public.conversions FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clicks WHERE id = click_id
  )
);