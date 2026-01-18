import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, format } from 'date-fns';
import { ArrowLeft, Send, Clock, User, Shield, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useSupportTickets, SupportTicket, SupportMessage } from '@/hooks/useSupportTickets';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

interface TicketDetailProps {
  ticketId: string;
  isAdmin?: boolean;
  onBack: () => void;
}

const statusConfig: Record<SupportTicket['status'], { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-yellow-500/20 text-yellow-500' },
  in_progress: { label: 'In Progress', className: 'bg-blue-500/20 text-blue-500' },
  resolved: { label: 'Resolved', className: 'bg-green-500/20 text-green-500' },
  closed: { label: 'Closed', className: 'bg-muted text-muted-foreground' },
};

const typeLabels: Record<SupportTicket['type'], string> = {
  question: 'Question',
  bug: 'Bug Report',
  feature: 'Feature Request',
  integration_request: 'Integration Request',
};

export function TicketDetail({ ticketId, isAdmin = false, onBack }: TicketDetailProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { fetchTicket, fetchMessages, createMessage, isCreatingMessage, updateTicketStatus, isUpdatingStatus } = useSupportTickets(isAdmin);
  const { markAsRead } = useUnreadMessages();
  
  const [newMessage, setNewMessage] = useState('');

  // Mark messages as read when viewing the ticket
  useEffect(() => {
    if (ticketId && user?.id) {
      markAsRead(ticketId);
    }
  }, [ticketId, user?.id, markAsRead]);

  // Fetch ticket
  const { data: ticket, isLoading: isLoadingTicket } = useQuery({
    queryKey: ['support-ticket', ticketId],
    queryFn: () => fetchTicket(ticketId),
    enabled: !!ticketId,
  });

  // Fetch messages
  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['support-messages', ticketId],
    queryFn: () => fetchMessages(ticketId),
    enabled: !!ticketId,
  });

  // Realtime subscription for messages
  useEffect(() => {
    const channel = supabase
      .channel(`ticket-messages-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${ticketId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['support-messages', ticketId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, queryClient]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    createMessage(
      {
        ticket_id: ticketId,
        message: newMessage,
        is_admin: isAdmin,
      },
      {
        onSuccess: () => {
          setNewMessage('');
        },
      }
    );
  };

  const handleStatusChange = (status: SupportTicket['status']) => {
    updateTicketStatus({ ticketId, status });
  };

  if (isLoadingTicket) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading ticket...</div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Ticket not found</p>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>
    );
  }

  const status = statusConfig[ticket.status];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-semibold">{ticket.subject}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className={status.className}>
              {status.label}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {typeLabels[ticket.type]}
            </span>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
        
        {isAdmin && (
          <Select value={ticket.status} onValueChange={handleStatusChange} disabled={isUpdatingStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Ticket Info Card */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Ticket Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-foreground">{ticket.description}</p>
          
          {ticket.type === 'integration_request' && (
            <>
              <Separator />
              <div className="space-y-2">
                {ticket.platform_name && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Platform:</span>{' '}
                    <span className="font-medium">{ticket.platform_name}</span>
                  </p>
                )}
                {ticket.platform_url && (
                  <p className="text-sm flex items-center gap-1">
                    <span className="text-muted-foreground">URL:</span>{' '}
                    <a 
                      href={ticket.platform_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      {ticket.platform_url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Messages */}
      <div className="flex-1 flex flex-col min-h-0">
        <h3 className="text-sm font-medium mb-3">Conversation</h3>
        
        <ScrollArea className="flex-1 border rounded-lg p-4 mb-4">
          {isLoadingMessages ? (
            <div className="text-center text-muted-foreground py-4">Loading messages...</div>
          ) : messages && messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3',
                    message.is_admin ? 'flex-row' : 'flex-row-reverse'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                    message.is_admin ? 'bg-primary/20' : 'bg-muted'
                  )}>
                    {message.is_admin ? (
                      <Shield className="w-4 h-4 text-primary" />
                    ) : (
                      <User className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className={cn(
                    'flex-1 max-w-[80%]',
                    message.is_admin ? 'text-left' : 'text-right'
                  )}>
                    <div className={cn(
                      'inline-block rounded-lg px-4 py-2',
                      message.is_admin ? 'bg-primary/10' : 'bg-muted'
                    )}>
                      <p className="text-sm">{message.message}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(message.created_at), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No messages yet. Write the first message.
            </div>
          )}
        </ScrollArea>

        {/* Message Input */}
        {ticket.status !== 'closed' && (
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Write a message..."
              className="min-h-[80px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleSendMessage();
                }
              }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isCreatingMessage}
              className="self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
