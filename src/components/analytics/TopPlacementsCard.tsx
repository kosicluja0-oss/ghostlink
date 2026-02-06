import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { PlatformIcon } from '@/components/ui/platform-icon';

interface PlacementData {
  platform: string;
  placement: string;
  count: number;
  percentage: number;
}

interface TopPlacementsCardProps {
  placements: PlacementData[];
}

export const TopPlacementsCard = ({ placements }: TopPlacementsCardProps) => {
  // Get top 3 placements
  const topPlacements = placements.slice(0, 3);

  if (topPlacements.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground">
            <BarChart3 className="w-4 h-4 text-primary" />
            Top Placements
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">No placement data yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground">
          <BarChart3 className="w-4 h-4 text-primary" />
          Top Placements
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {topPlacements.map((placement, index) => (
          <div key={`${placement.platform}-${placement.placement}`} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <PlatformIcon platform={placement.platform} size={16} />
                <span className="text-foreground font-medium capitalize">
                  {placement.platform === 'direct' ? 'Direct' : placement.placement}
                </span>
              </div>
              <span className="text-muted-foreground font-mono">{placement.percentage}%</span>
            </div>
            <Progress 
              value={placement.percentage} 
              className="h-1.5 bg-muted"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
