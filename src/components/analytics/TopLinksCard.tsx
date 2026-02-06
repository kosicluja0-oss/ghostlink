import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link2 } from 'lucide-react';
import type { GhostLink } from '@/types';
import { useMemo } from 'react';

interface TopLinksCardProps {
  links: GhostLink[];
}

export const TopLinksCard = ({ links }: TopLinksCardProps) => {
  // Rank links by total clicks (primary), then earnings (secondary)
  const topLinks = useMemo(() => {
    const sorted = [...links]
      .filter((l) => l.clicks > 0 || l.earnings > 0)
      .sort((a, b) => {
        if (b.clicks !== a.clicks) return b.clicks - a.clicks;
        return b.earnings - a.earnings;
      })
      .slice(0, 5);

    const maxClicks = sorted.length > 0 ? sorted[0].clicks : 1;

    return sorted.map((link) => ({
      ...link,
      percentage: maxClicks > 0 ? Math.round((link.clicks / maxClicks) * 100) : 0,
    }));
  }, [links]);

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
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground">
          <Link2 className="w-4 h-4 text-primary" />
          Top Links
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {topLinks.map((link) => (
          <div key={link.id} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 rounded bg-muted flex items-center justify-center shrink-0">
                  <Link2 className="w-3 h-3 text-muted-foreground" />
                </div>
                <span className="text-foreground font-medium truncate">
                  /{link.alias}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-2">
                <span className="text-muted-foreground font-mono">
                  {link.clicks.toLocaleString()} clicks
                </span>
                {link.earnings > 0 && (
                  <span className="text-success font-mono font-medium">
                    ${link.earnings.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
            <Progress value={link.percentage} className="h-1.5 bg-muted" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
