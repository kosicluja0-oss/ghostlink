import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Clock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SupportTicket } from '@/hooks/useSupportTickets';

interface TicketCardProps {
  ticket: SupportTicket;
  onClick: () => void;
  unreadCount?: number;
}

const statusConfig: Record<SupportTicket['status'], { label: string; icon: typeof CheckCircle2; className: string }> = {
  open: { label: 'Open', icon: AlertCircle, className: 'bg-yellow-500/20 text-yellow-500' },
  in_progress: { label: 'In Progress', icon: Loader2, className: 'bg-blue-500/20 text-blue-500' },
  resolved: { label: 'Resolved', icon: CheckCircle2, className: 'bg-green-500/20 text-green-500' },
  closed: { label: 'Closed', icon: CheckCircle2, className: 'bg-muted text-muted-foreground' },
};

const typeConfig: Record<SupportTicket['type'], { label: string; className: string }> = {
  question: { label: 'Question', className: 'bg-primary/20 text-primary' },
  bug: { label: 'Bug', className: 'bg-red-500/20 text-red-500' },
  feature: { label: 'Feature', className: 'bg-purple-500/20 text-purple-500' },
  integration_request: { label: 'Integration', className: 'bg-cyan-500/20 text-cyan-500' },
};

const priorityConfig: Record<SupportTicket['priority'], { label: string; className: string }> = {
  low: { label: 'Low', className: 'text-muted-foreground' },
  medium: { label: 'Medium', className: 'text-yellow-500' },
  high: { label: 'High', className: 'text-red-500' },
};

export function TicketCard({ ticket, onClick, unreadCount = 0 }: TicketCardProps) {
  const status = statusConfig[ticket.status];
  const type = typeConfig[ticket.type];
  const priority = priorityConfig[ticket.priority];
  const StatusIcon = status.icon;

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:bg-accent/50 hover:border-primary/30",
        unreadCount > 0 && "border-primary/50 bg-primary/5"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={cn('text-xs', status.className)}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {status.label}
              </Badge>
              <Badge variant="outline" className={cn('text-xs', type.className)}>
                {type.label}
              </Badge>
              {ticket.priority === 'high' && (
                <Badge variant="outline" className="text-xs bg-red-500/20 text-red-500">
                  High Priority
                </Badge>
              )}
              {unreadCount > 0 && (
                <Badge className="bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5 min-w-[20px] flex items-center justify-center">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  {unreadCount}
                </Badge>
              )}
            </div>
            
            <h3 className="font-medium text-foreground truncate mb-1">
              {ticket.subject}
            </h3>
            
            <p className="text-sm text-muted-foreground line-clamp-2">
              {ticket.description}
            </p>

            {ticket.type === 'integration_request' && ticket.platform_name && (
              <p className="text-xs text-primary mt-2">
                Platform: {ticket.platform_name}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
