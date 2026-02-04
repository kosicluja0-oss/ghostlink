-- Add notification preference columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS marketing_emails boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS security_alerts boolean DEFAULT true;