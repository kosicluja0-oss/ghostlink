import { useState } from 'react';
import { Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Simple Icons CDN slug + fallback label for each platform */
const PLATFORM_META: Record<string, { slug: string; label: string }> = {
  instagram: { slug: 'instagram', label: 'IG' },
  tiktok:    { slug: 'tiktok',    label: 'TT' },
  youtube:   { slug: 'youtube',   label: 'YT' },
  pinterest: { slug: 'pinterest', label: 'PI' },
  x:         { slug: 'x',         label: 'X'  },
};

interface PlatformIconProps {
  platform: string;
  /** px size (width & height), default 16 */
  size?: number;
  className?: string;
}

/**
 * Renders a monochrome Simple-Icons SVG for a given social platform.
 * Falls back to a Lucide Link2 icon for unknown / "direct" platforms.
 */
export function PlatformIcon({ platform, size = 16, className }: PlatformIconProps) {
  const [imgError, setImgError] = useState(false);
  const meta = PLATFORM_META[platform];

  if (!meta || imgError) {
    return <Link2 style={{ width: size, height: size }} className={cn('text-muted-foreground', className)} />;
  }

  return (
    <img
      src={`https://cdn.simpleicons.org/${meta.slug}/888888`}
      alt={meta.label}
      width={size}
      height={size}
      className={cn('object-contain', className)}
      onError={() => setImgError(true)}
      loading="lazy"
    />
  );
}

/** Re-export the platform list so consumers can iterate */
export const PLATFORM_IDS = Object.keys(PLATFORM_META);
