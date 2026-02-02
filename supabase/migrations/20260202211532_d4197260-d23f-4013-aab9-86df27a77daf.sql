-- 1. Add UPDATE policy for support_messages (admins only for read_at)
CREATE POLICY "Admins can update message read status"
ON public.support_messages FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- 2. Add DELETE policy for support_tickets (admins only)
CREATE POLICY "Only admins can delete tickets"
ON public.support_tickets FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));