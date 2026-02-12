
-- Explicitly deny all client-side INSERT/UPDATE/DELETE on billing_data
-- Only service role (edge functions) can modify this table

CREATE POLICY "Deny client inserts on billing_data"
ON public.billing_data FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Deny client updates on billing_data"
ON public.billing_data FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Deny client deletes on billing_data"
ON public.billing_data FOR DELETE
TO authenticated
USING (false);

-- Also add explicit immutability policies for clicks table
CREATE POLICY "Clicks are immutable - no updates"
ON public.clicks FOR UPDATE
USING (false);

CREATE POLICY "Users can delete clicks for their own links"
ON public.clicks FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.links
    WHERE links.id = clicks.link_id
    AND links.user_id = auth.uid()
  )
);
