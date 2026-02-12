
-- Create billing_data table for sensitive payment information
CREATE TABLE public.billing_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text,
  subscription_id text,
  subscription_status text DEFAULT 'inactive',
  billing_cycle text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.billing_data ENABLE ROW LEVEL SECURITY;

-- Strict RLS: only authenticated users can view their own billing data
CREATE POLICY "Users can view own billing data"
ON public.billing_data FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- No direct INSERT/UPDATE/DELETE from client - only via edge functions using service role
-- This is the defense-in-depth: even if profiles RLS is bypassed, billing data is separate

-- Migrate existing data from profiles to billing_data
INSERT INTO public.billing_data (user_id, stripe_customer_id, subscription_id, subscription_status, billing_cycle)
SELECT id, stripe_customer_id, subscription_id, subscription_status, billing_cycle
FROM public.profiles
WHERE stripe_customer_id IS NOT NULL 
   OR subscription_id IS NOT NULL 
   OR subscription_status != 'inactive'
   OR billing_cycle IS NOT NULL;

-- Remove sensitive columns from profiles
ALTER TABLE public.profiles DROP COLUMN stripe_customer_id;
ALTER TABLE public.profiles DROP COLUMN subscription_id;
ALTER TABLE public.profiles DROP COLUMN subscription_status;
ALTER TABLE public.profiles DROP COLUMN billing_cycle;

-- Add updated_at trigger for billing_data
CREATE TRIGGER update_billing_data_updated_at
BEFORE UPDATE ON public.billing_data
FOR EACH ROW
EXECUTE FUNCTION public.update_profiles_updated_at();
