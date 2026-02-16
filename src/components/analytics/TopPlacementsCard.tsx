import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PlatformIcon } from '@/components/ui/platform-icon';
import { useMemo, useState } from 'react';
import type { MetricKey } from './AnalyticsChart';
import { Button } from '@/components/ui/button';

export interface PlacementData {
  platform: string;
  placement: string;
  clicks: number;
  leads: number;
  sales: number;
  earnings: number;
}

const METRIC_LABELS: Record<MetricKey, string> = {
  clicks: 'clicks',
  leads: 'leads',
  sales: 'sales',
  revenue: 'revenue',
  cr: 'CR',
  epc: 'EPC'
};

interface TopPlacementsCardProps {
  placements: PlacementData[];
  activeMetric?: MetricKey;
  metricColor?: string;
}

function getMetricValue(p: PlacementData, metric: MetricKey): number {
  switch (metric) {
    case 'clicks':return p.clicks;
    case 'leads':return p.leads;
    case 'sales':return p.sales;
    case 'revenue':return p.earnings;
    case 'cr':return p.clicks > 0 ? (p.leads + p.sales) / p.clicks * 100 : 0;
    case 'epc':return p.clicks > 0 ? p.earnings / p.clicks : 0;
    default:return p.clicks;
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

export const TopPlacementsCard = ({ placements, activeMetric = 'clicks', metricColor }: TopPlacementsCardProps) => {
  const [showAll, setShowAll] = useState(false);

  const allSorted = useMemo(() => {
    const withValues = placements.map((p) => ({
      ...p,
      metricValue: getMetricValue(p, activeMetric)
    }));

    const sorted = [...withValues].
    filter((p) => p.metricValue > 0).
    sort((a, b) => b.metricValue - a.metricValue);

    const maxValue = sorted.length > 0 ? sorted[0].metricValue : 1;

    return sorted.map((p) => ({
      ...p,
      percentage: maxValue > 0 ? Math.round(p.metricValue / maxValue * 100) : 0
    }));
  }, [placements, activeMetric]);

  const topPlacements = showAll ? allSorted : allSorted.slice(0, 5);
  const hasMore = allSorted.length > 5;

  if (topPlacements.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground">
            Top Placements
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">No placement data yet</p>
        </CardContent>
      </Card>);

  }

  return (
    <Card className="bg-card border-border h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground">
          
          Top Placements by {METRIC_LABELS[activeMetric]}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex flex-col min-h-0 overflow-hidden flex-1">
        <div className="space-y-3 overflow-y-auto scrollbar-thin flex-1">
          {topPlacements.map((placement) =>
          <div key={`${placement.platform}-${placement.placement}`} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <PlatformIcon platform={placement.platform} size={16} />
                  <span className="text-foreground font-medium capitalize">
                    {placement.platform === 'direct' ? 'Direct' : placement.placement}
                  </span>
                </div>
                <span className="text-muted-foreground font-mono">
                  {formatValue(placement.metricValue, activeMetric)}
                </span>
              </div>
              <Progress value={placement.percentage} className="h-1.5 bg-muted" indicatorColor={metricColor} />
            </div>
          )}
        </div>
        {hasMore &&
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(!showAll)}
          className="w-full text-xs text-muted-foreground hover:text-foreground gap-1 h-7 mt-2 shrink-0">

            {showAll ?
          <>Show less <ChevronUp className="w-3 h-3" /></> :

          <>Show all ({allSorted.length}) <ChevronDown className="w-3 h-3" /></>
          }
          </Button>
        }
      </CardContent>
    </Card>);

};