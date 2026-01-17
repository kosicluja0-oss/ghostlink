import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface SupportTicket {
  id: string;
  user_id: string;
  type: 'question' | 'bug' | 'feature' | 'integration_request';
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  platform_name: string | null;
  platform_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
}

interface CreateTicketInput {
  type: SupportTicket['type'];
  subject: string;
  description: string;
  priority?: SupportTicket['priority'];
  platform_name?: string;
  platform_url?: string;
}

interface CreateMessageInput {
  ticket_id: string;
  message: string;
  is_admin?: boolean;
}

export function useSupportTickets(isAdmin: boolean = false) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch tickets (user's own or all for admin)
  const { data: tickets, isLoading: isLoadingTickets } = useQuery({
    queryKey: ['support-tickets', user?.id, isAdmin],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tickets:', error);
        throw error;
      }

      return data as SupportTicket[];
    },
    enabled: !!user?.id,
  });

  // Fetch single ticket
  const fetchTicket = async (ticketId: string) => {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching ticket:', error);
      throw error;
    }

    return data as SupportTicket | null;
  };

  // Fetch messages for a ticket
  const fetchMessages = async (ticketId: string) => {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }

    return data as SupportMessage[];
  };

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (input: CreateTicketInput) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          type: input.type,
          subject: input.subject,
          description: input.description,
          priority: input.priority || 'medium',
          platform_name: input.platform_name || null,
          platform_url: input.platform_url || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Ticket byl úspěšně vytvořen');
    },
    onError: (error) => {
      console.error('Error creating ticket:', error);
      toast.error('Nepodařilo se vytvořit ticket');
    },
  });

  // Create message mutation
  const createMessageMutation = useMutation({
    mutationFn: async (input: CreateMessageInput) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: input.ticket_id,
          user_id: user.id,
          message: input.message,
          is_admin: input.is_admin || false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['support-messages', variables.ticket_id] });
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast.error('Nepodařilo se odeslat zprávu');
    },
  });

  // Update ticket status mutation (admin only)
  const updateTicketStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: SupportTicket['status'] }) => {
      const { data, error } = await supabase
        .from('support_tickets')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Status ticketu byl aktualizován');
    },
    onError: (error) => {
      console.error('Error updating ticket status:', error);
      toast.error('Nepodařilo se aktualizovat status');
    },
  });

  return {
    tickets: tickets || [],
    isLoadingTickets,
    fetchTicket,
    fetchMessages,
    createTicket: createTicketMutation.mutate,
    isCreatingTicket: createTicketMutation.isPending,
    createMessage: createMessageMutation.mutate,
    isCreatingMessage: createMessageMutation.isPending,
    updateTicketStatus: updateTicketStatusMutation.mutate,
    isUpdatingStatus: updateTicketStatusMutation.isPending,
  };
}
