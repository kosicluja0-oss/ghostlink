import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { CircleFlag } from '@/components/ui/circle-flag';
import { COUNTRIES } from '@/lib/countries';
import { useMemo, useState } from 'react';
import type { MetricKey } from './AnalyticsChart';
import { Button } from '@/components/ui/button';

export interface CountryData {
  code: string;
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

interface TopCountriesCardProps {
  countries: CountryData[];
  activeMetric?: MetricKey;
  metricColor?: string;
}

export const getCountryInfo = (code: string): {name: string;} => {
  const upperCode = code?.toUpperCase() || '';
  if (!upperCode || upperCode === 'XX' || upperCode === 'UNKNOWN') {
    return { name: 'Unknown' };
  }
  return COUNTRIES[upperCode] || { name: code };
};

function getMetricValue(country: CountryData, metric: MetricKey): number {
  switch (metric) {
    case 'clicks':return country.clicks;
    case 'leads':return country.leads;
    case 'sales':return country.sales;
    case 'revenue':return country.earnings;
    case 'cr':return country.clicks > 0 ? (country.leads + country.sales) / country.clicks * 100 : 0;
    case 'epc':return country.clicks > 0 ? country.earnings / country.clicks : 0;
    default:return country.clicks;
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

export const TopCountriesCard = ({ countries, activeMetric = 'clicks', metricColor }: TopCountriesCardProps) => {
  const [showAll, setShowAll] = useState(false);

  const allSorted = useMemo(() => {
    const withValues = countries.map((c) => ({
      ...c,
      metricValue: getMetricValue(c, activeMetric)
    }));

    const sorted = [...withValues].
    filter((c) => c.metricValue > 0).
    sort((a, b) => b.metricValue - a.metricValue);

    const maxValue = sorted.length > 0 ? sorted[0].metricValue : 1;

    return sorted.map((c) => ({
      ...c,
      percentage: maxValue > 0 ? Math.round(c.metricValue / maxValue * 100) : 0
    }));
  }, [countries, activeMetric]);

  const topCountries = showAll ? allSorted : allSorted.slice(0, 5);
  const hasMore = allSorted.length > 5;

  if (topCountries.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground">
            Top Countries
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">No country data yet</p>
        </CardContent>
      </Card>);

  }

  return (
    <Card className="bg-card border-border h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground">
          
          Top Countries by {METRIC_LABELS[activeMetric]}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex flex-col min-h-0 overflow-hidden flex-1">
        <div className="overflow-y-auto space-y-3 pr-1 flex-1">
          {topCountries.map((country) => {
            const { name } = getCountryInfo(country.code);
            return (
              <div key={country.code} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CircleFlag code={country.code} size={18} />
                    <span className="text-foreground font-medium">{name}</span>
                  </div>
                  <span className="text-muted-foreground font-mono">
                    {formatValue(country.metricValue, activeMetric)}
                  </span>
                </div>
                <Progress value={country.percentage} className="h-1.5 bg-muted" indicatorColor={metricColor} />
              </div>);
          })}
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