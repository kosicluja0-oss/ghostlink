-- Remove the overly permissive public SELECT policy that exposes all links data
DROP POLICY IF EXISTS "Anyone can lookup links by alias" ON public.links;

-- The redirect Edge Function uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS,
-- so public link lookups still work for the redirect functionality.
-- Users can still view their own links via the existing "Users can view their own links" policy.