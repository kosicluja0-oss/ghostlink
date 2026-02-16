import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MousePointerClick, User, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTimezone } from '@/hooks/useTimezone';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

type EventType = 'click' | 'lead' | 'sale';

interface ActivityEvent {
  id: string;
  type: EventType;
  date: Date;
  source: string | null;
  country: string | null;
  amount: number | null;
}

interface LinkRecentActivityProps {
  linkId: string;
}

function useRecentLinkActivity(linkId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['link-recent-activity', linkId, user?.id],
    queryFn: async () => {
      // Fetch recent clicks for this link
      const { data: clicks, error: clicksErr } = await supabase
        .from('clicks')
        .select('id, created_at, source, country')
        .eq('link_id', linkId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (clicksErr) throw clicksErr;
      if (!clicks || clicks.length === 0) return [];

      const clickIds = clicks.map(c => c.id);

      // Fetch conversions for these clicks
      const { data: conversions, error: convErr } = await supabase
        .from('conversions')
        .select('id, click_id, type, value, created_at')
        .in('click_id', clickIds);

      if (convErr) throw convErr;

      // Build a map of click_id -> conversions
      const convMap = new Map<string, { type: string; value: number; id: string; created_at: string }[]>();
      (conversions || []).forEach(c => {
        const arr = convMap.get(c.click_id) || [];
        arr.push(c);
        convMap.set(c.click_id, arr);
      });

      // Build unified event list
      const events: ActivityEvent[] = [];

      for (const click of clicks) {
        const clickConversions = convMap.get(click.id) || [];

        // Add conversion events
        for (const conv of clickConversions) {
          events.push({
            id: conv.id,
            type: conv.type as EventType,
            date: new Date(conv.created_at),
            source: click.source,
            country: click.country,
            amount: conv.type === 'sale' && conv.value > 0 ? conv.value : null,
          });
        }

        // Add click event
        events.push({
          id: click.id,
          type: 'click',
          date: new Date(click.created_at),
          source: click.source,
          country: click.country,
          amount: null,
        });
      }

      // Sort by date descending
      events.sort((a, b) => b.date.getTime() - a.date.getTime());

      return events;
    },
    enabled: !!linkId && !!user?.id,
    staleTime: 1000 * 30,
  });
}

function getTypeBadge(type: EventType) {
  switch (type) {
    case 'sale':
      return (
        <Badge className="bg-[hsl(var(--chart-sales))]/15 text-[hsl(var(--chart-sales))] border-[hsl(var(--chart-sales))]/30 hover:bg-[hsl(var(--chart-sales))]/25 px-2 py-0.5 rounded-full text-[10px]">
          <DollarSign className="w-2.5 h-2.5 mr-0.5" />
          Sale
        </Badge>
      );
    case 'lead':
      return (
        <Badge className="bg-[hsl(var(--chart-leads))]/15 text-[hsl(var(--chart-leads))] border-[hsl(var(--chart-leads))]/30 hover:bg-[hsl(var(--chart-leads))]/25 px-2 py-0.5 rounded-full text-[10px]">
          <User className="w-2.5 h-2.5 mr-0.5" />
          Lead
        </Badge>
      );
    case 'click':
      return (
        <Badge className="bg-[hsl(var(--chart-clicks))]/15 text-[hsl(var(--chart-clicks))] border-[hsl(var(--chart-clicks))]/30 hover:bg-[hsl(var(--chart-clicks))]/25 px-2 py-0.5 rounded-full text-[10px]">
          <MousePointerClick className="w-2.5 h-2.5 mr-0.5" />
          Click
        </Badge>
      );
  }
}

function getDescription(type: EventType): string {
  switch (type) {
    case 'sale': return 'Purchase completed';
    case 'lead': return 'New subscriber';
    case 'click': return 'Link clicked';
  }
}

export function LinkRecentActivity({ linkId }: LinkRecentActivityProps) {
  const [showAll, setShowAll] = useState(false);
  const { formatInTimezone } = useTimezone();
  const { data: events, isLoading } = useRecentLinkActivity(linkId);

  const displayEvents = useMemo(() => {
    if (!events) return [];
    return showAll ? events : events.slice(0, 7);
  }, [events, showAll]);

  const hasMore = (events?.length || 0) > 7;

  if (isLoading) {
    return <Skeleton className="h-[200px] rounded-xl" />;
  }

  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 border border-dashed border-border rounded-xl bg-card/50">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
          <MousePointerClick className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-xs font-semibold text-foreground mb-0.5">No activity yet</h3>
        <p className="text-[10px] text-muted-foreground text-center">
          Clicks and conversions will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card flex flex-col">
      <div className={`flex-1 min-h-0 ${showAll ? 'overflow-y-auto max-h-[300px]' : 'overflow-hidden'}`}>
        <Table>
          <TableBody>
            {displayEvents.map(ev => (
              <TableRow key={ev.id} className="border-border hover:bg-muted/50 transition-colors">
                <TableCell className="py-1.5 px-2">{getTypeBadge(ev.type)}</TableCell>
                <TableCell className="py-1.5 px-2">
                  <span className="text-[11px] text-foreground truncate max-w-[80px] block">
                    {getDescription(ev.type)}
                  </span>
                </TableCell>
                <TableCell className="text-right py-1.5 px-2 font-mono text-[11px]">
                  {ev.amount !== null ? (
                    <span className="text-[hsl(var(--chart-sales))] font-medium">${ev.amount.toFixed(2)}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right py-1.5 px-1.5">
                  <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">
                    {formatInTimezone(ev.date, 'MMM d, HH:mm')}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {hasMore && (
        <div className="border-t border-border px-3 py-1 backdrop-blur-xl bg-background/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="w-full text-[10px] text-muted-foreground hover:text-foreground gap-1 h-6"
          >
            {showAll ? (
              <>Show less <ChevronUp className="w-3 h-3" /></>
            ) : (
              <>Show all ({events.length}) <ChevronDown className="w-3 h-3" /></>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
