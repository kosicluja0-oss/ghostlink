import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link2 } from 'lucide-react';
import type { GhostLink } from '@/types';
import { useMemo } from 'react';
import type { MetricKey } from './AnalyticsChart';

const METRIC_LABELS: Record<MetricKey, string> = {
  clicks: 'clicks',
  leads: 'leads',
  sales: 'sales',
  revenue: 'revenue',
  cr: 'CR',
  epc: 'EPC'
};

interface TopLinksCardProps {
  links: GhostLink[];
  activeMetric?: MetricKey;
  metricColor?: string;
  selectedLinkId?: string | null;
  onLinkSelect?: (linkId: string | null) => void;
}

function getMetricValue(link: GhostLink, metric: MetricKey): number {
  switch (metric) {
    case 'clicks':return link.clicks;
    case 'leads':return link.leads;
    case 'sales':return link.sales;
    case 'revenue':return link.earnings;
    case 'cr':return link.clicks > 0 ? (link.leads + link.sales) / link.clicks * 100 : 0;
    case 'epc':return link.clicks > 0 ? link.earnings / link.clicks : 0;
    default:return link.clicks;
  }
}

function formatValue(value: number, metric: MetricKey): string {
  switch (metric) {
    case 'revenue':
    case 'epc':
      return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'cr':
      return `${value.toFixed(1)}%`;
    default:
      return value.toLocaleString();
  }
}

export const TopLinksCard = ({ links, activeMetric = 'clicks', metricColor, selectedLinkId, onLinkSelect }: TopLinksCardProps) => {

  const handleLinkClick = (linkId: string) => {
    if (!onLinkSelect) return;
    onLinkSelect(selectedLinkId === linkId ? null : linkId);
  };

  const allSorted = useMemo(() => {
    const withValues = links.map((l) => ({
      ...l,
      metricValue: getMetricValue(l, activeMetric)
    }));

    const sorted = [...withValues].
    filter((l) => l.metricValue > 0).
    sort((a, b) => b.metricValue - a.metricValue);

    const maxValue = sorted.length > 0 ? sorted[0].metricValue : 1;

    return sorted.map((link) => ({
      ...link,
      percentage: maxValue > 0 ? Math.round(link.metricValue / maxValue * 100) : 0
    }));
  }, [links, activeMetric]);

  const topLinks = allSorted.slice(0, 5);

  if (topLinks.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground">
            Top Links
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">No link data yet</p>
        </CardContent>
      </Card>);

  }

  return (
    <Card className="bg-card border-border h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground">
          
          Top Links by {METRIC_LABELS[activeMetric]}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex flex-col min-h-0 overflow-hidden flex-1">
        <div className="space-y-1.5 pr-1 flex-1 overflow-x-hidden">
          {topLinks.map((link) => {
            const isSelected = selectedLinkId === link.id;
            return (
              <div
                key={link.id}
                className={`space-y-1 rounded-md px-1.5 py-0.5 -mx-1.5 transition-colors cursor-pointer ${
                isSelected ?
                'bg-primary/10 ring-1 ring-primary/30' :
                'hover:bg-muted/50'}`
                }
                onClick={() => handleLinkClick(link.id)}>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Link2 className={`w-3 h-3 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`font-medium truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                      /{link.alias}
                    </span>
                  </div>
                  <span className="text-muted-foreground font-mono shrink-0 ml-2">
                    {formatValue(link.metricValue, activeMetric)}
                  </span>
                </div>
                <Progress value={link.percentage} className="h-1.5 bg-muted" indicatorColor={metricColor} />
              </div>);
          })}
        </div>
      </CardContent>
    </Card>);

};