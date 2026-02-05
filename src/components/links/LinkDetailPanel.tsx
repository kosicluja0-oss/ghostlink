import { ExternalLink, TrendingUp, MousePointerClick, Users, DollarSign, Percent } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { MiniAreaChart } from '@/components/analytics/MiniAreaChart';
import { TopPlacementsCard } from '@/components/analytics/TopPlacementsCard';
import { TopCountriesCard } from '@/components/analytics/TopCountriesCard';
import { ConversionFunnel } from '@/components/analytics/ConversionFunnel';
import { useLinkAnalytics } from '@/hooks/useLinkAnalytics';
import { getDisplayUrl } from '@/lib/trackingUrl';
import type { GhostLink } from '@/types';

interface LinkDetailPanelProps {
  link: GhostLink | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Favicon with fallback
function Favicon({ url }: { url: string }) {
  try {
    const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    return (
      <img
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
        alt=""
        className="w-5 h-5 rounded shrink-0"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  } catch {
    return null;
  }
}

interface KpiItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  dimmed?: boolean;
}

function KpiItem({ icon, label, value, dimmed }: KpiItemProps) {
  return (
    <div className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg bg-muted/20 ${dimmed ? 'opacity-50' : ''}`}>
      <div className="text-muted-foreground">{icon}</div>
      <span className="text-sm font-bold text-foreground tabular-nums">{value}</span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 p-1">
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-[120px] rounded-lg" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-[140px] rounded-lg" />
        <Skeleton className="h-[140px] rounded-lg" />
      </div>
      <Skeleton className="h-[100px] rounded-lg" />
    </div>
  );
}

export function LinkDetailPanel({ link, open, onOpenChange }: LinkDetailPanelProps) {
  const { dailyClicks, placements, countries, funnel, isLoading } = useLinkAnalytics(
    open && link ? link.id : null
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
        {link && (
          <>
            {/* Header */}
            <SheetHeader className="pb-4 border-b border-border mb-4">
              <div className="flex items-center gap-2.5">
                <Favicon url={link.targetUrl} />
                <div className="min-w-0 flex-1">
                  <SheetTitle className="text-base truncate">
                    {getDisplayUrl(link.alias)}
                  </SheetTitle>
                  <SheetDescription className="truncate text-xs">
                    <a
                      href={link.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground transition-colors inline-flex items-center gap-1"
                    >
                      {link.targetUrl}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            {isLoading ? (
              <LoadingSkeleton />
            ) : (
              <div className="space-y-5">
                {/* KPI Strip */}
                <div className="grid grid-cols-5 gap-1.5">
                  <KpiItem
                    icon={<MousePointerClick className="w-3.5 h-3.5" />}
                    label="Clicks"
                    value={funnel.totalClicks.toLocaleString()}
                  />
                  <KpiItem
                    icon={<Users className="w-3.5 h-3.5" />}
                    label="Leads"
                    value={funnel.totalLeads.toLocaleString()}
                  />
                  <KpiItem
                    icon={<DollarSign className="w-3.5 h-3.5" />}
                    label="Sales"
                    value={funnel.totalSales.toLocaleString()}
                  />
                  <KpiItem
                    icon={<TrendingUp className="w-3.5 h-3.5" />}
                    label="EPC"
                    value={`$${funnel.epc.toFixed(2)}`}
                  />
                  <KpiItem
                    icon={<Percent className="w-3.5 h-3.5" />}
                    label="CR"
                    value={`${funnel.conversionRate.toFixed(1)}%`}
                  />
                </div>

                {/* 30-Day Chart */}
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    30-Day Clicks
                  </h3>
                  <div className="bg-muted/10 rounded-lg p-2 border border-border/50">
                    <MiniAreaChart data={dailyClicks} />
                  </div>
                </div>

                {/* Placements & Countries side-by-side */}
                <div className="grid grid-cols-2 gap-3">
                  <TopPlacementsCard placements={placements} />
                  <TopCountriesCard countries={countries} />
                </div>

                {/* Conversion Funnel */}
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Conversion Funnel
                  </h3>
                  <div className="bg-card rounded-lg p-3 border border-border">
                    <ConversionFunnel
                      clicks={funnel.totalClicks}
                      leads={funnel.totalLeads}
                      sales={funnel.totalSales}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
