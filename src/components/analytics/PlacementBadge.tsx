import { Badge } from '@/components/ui/badge';
import { Link2 } from 'lucide-react';

// Platform icons matching SmartCopyMenu
const PLATFORM_ICONS: Record<string, string> = {
  instagram: '📸',
  tiktok: '🎵',
  youtube: '▶️',
  pinterest: '📌',
  x: '𝕏',
};

// Mapping from tracking param to platform and placement
const PLACEMENT_MAP: Record<string, { platform: string; placement: string }> = {
  'ig-reels': { platform: 'instagram', placement: 'Reels' },
  'ig-post': { platform: 'instagram', placement: 'Post' },
  'ig-story': { platform: 'instagram', placement: 'Story' },
  'ig-bio': { platform: 'instagram', placement: 'Bio' },
  'tt-video': { platform: 'tiktok', placement: 'Video' },
  'tt-story': { platform: 'tiktok', placement: 'Story' },
  'tt-bio': { platform: 'tiktok', placement: 'Bio' },
  'yt-video': { platform: 'youtube', placement: 'Video' },
  'yt-shorts': { platform: 'youtube', placement: 'Shorts' },
  'yt-bio': { platform: 'youtube', placement: 'Bio' },
  'pin': { platform: 'pinterest', placement: 'Pinterest' },
  'x-post': { platform: 'x', placement: 'Post' },
  'x-bio': { platform: 'x', placement: 'Bio' },
};

interface PlacementBadgeProps {
  source?: string | null;
}

export const PlacementBadge = ({ source }: PlacementBadgeProps) => {
  // Parse the source parameter to get platform and placement
  const placementInfo = source ? PLACEMENT_MAP[source] : null;

  if (!placementInfo) {
    // No tracking parameter - show Direct/Other
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-5 rounded bg-muted/60 flex items-center justify-center">
          <Link2 className="w-3 h-3 text-muted-foreground" />
        </div>
        <Badge variant="secondary" className="bg-muted/50 text-muted-foreground border-0 px-2 py-0.5 text-xs font-normal">
          Direct
        </Badge>
      </div>
    );
  }

  const { platform, placement } = placementInfo;
  const icon = PLATFORM_ICONS[platform] || '🔗';

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm">{icon}</span>
      <Badge 
        variant="secondary" 
        className="bg-primary/10 text-primary border-0 px-2 py-0.5 text-xs font-medium"
      >
        {placement}
      </Badge>
    </div>
  );
};

// Export utility function to parse placement from source
export const parsePlacement = (source?: string | null): { platform: string; placement: string } | null => {
  if (!source) return null;
  return PLACEMENT_MAP[source] || null;
};
