-- Add billing columns to profiles table for Stripe integration
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE,
ADD COLUMN IF NOT EXISTS subscription_id text UNIQUE,
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS tier text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS billing_cycle text;

-- Create index for efficient Stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.stripe_customer_id IS 'Stripe customer ID (cus_xxx)';
COMMENT ON COLUMN public.profiles.subscription_id IS 'Active Stripe subscription ID (sub_xxx)';
COMMENT ON COLUMN public.profiles.subscription_status IS 'Subscription status: inactive, active, past_due, canceled';
COMMENT ON COLUMN public.profiles.tier IS 'User tier: free, pro, business';
COMMENT ON COLUMN public.profiles.billing_cycle IS 'Billing cycle: monthly, yearly';