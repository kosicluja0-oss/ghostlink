-- Add read_at column to support_messages for tracking read status
ALTER TABLE public.support_messages 
ADD COLUMN read_at timestamp with time zone DEFAULT NULL;

-- Create index for efficient unread message queries
CREATE INDEX idx_support_messages_read_at ON public.support_messages(ticket_id, read_at) WHERE read_at IS NULL;

-- Function to mark messages as read for a specific ticket
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(p_ticket_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- For regular users: mark admin messages as read
  -- For admins: mark non-admin messages as read
  UPDATE support_messages
  SET read_at = now()
  WHERE ticket_id = p_ticket_id
    AND read_at IS NULL
    AND (
      -- If user is admin, mark non-admin messages as read
      (has_role(p_user_id, 'admin') AND is_admin = false)
      OR
      -- If user is not admin (ticket owner), mark admin messages as read
      (NOT has_role(p_user_id, 'admin') AND is_admin = true)
    );
END;
$$;