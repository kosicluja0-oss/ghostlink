-- Create function to check if user can create links based on their tier
CREATE OR REPLACE FUNCTION public.can_create_link(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_tier text;
  link_count integer;
  max_links integer;
BEGIN
  -- Get user's tier from profiles
  SELECT COALESCE(tier, 'free') INTO user_tier
  FROM profiles
  WHERE id = p_user_id;
  
  -- If no profile found, treat as free tier
  IF user_tier IS NULL THEN
    user_tier := 'free';
  END IF;
  
  -- Set max links based on tier
  CASE user_tier
    WHEN 'business' THEN max_links := 175;
    WHEN 'pro' THEN max_links := 100;
    ELSE max_links := 25; -- free tier
  END CASE;
  
  -- Count user's existing links
  SELECT COUNT(*) INTO link_count
  FROM links
  WHERE user_id = p_user_id;
  
  -- Return whether user can create more links
  RETURN link_count < max_links;
END;
$$;

-- Create function to get user's link limit info
CREATE OR REPLACE FUNCTION public.get_link_limit_info(p_user_id uuid)
RETURNS TABLE(current_count integer, max_links integer, tier text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_tier text;
  user_max_links integer;
BEGIN
  -- Get user's tier from profiles
  SELECT COALESCE(p.tier, 'free') INTO user_tier
  FROM profiles p
  WHERE p.id = p_user_id;
  
  -- If no profile found, treat as free tier
  IF user_tier IS NULL THEN
    user_tier := 'free';
  END IF;
  
  -- Set max links based on tier
  CASE user_tier
    WHEN 'business' THEN user_max_links := 175;
    WHEN 'pro' THEN user_max_links := 100;
    ELSE user_max_links := 25; -- free tier
  END CASE;
  
  -- Return the info
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::integer FROM links WHERE links.user_id = p_user_id) as current_count,
    user_max_links as max_links,
    user_tier as tier;
END;
$$;

-- Update the RLS policy for links INSERT to check link limits
DROP POLICY IF EXISTS "Users can create their own links" ON public.links;

CREATE POLICY "Users can create their own links with limit check"
ON public.links
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND can_create_link(auth.uid())
);