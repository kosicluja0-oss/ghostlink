import { useState } from 'react';
import { Share2, ChevronRight, Check } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Platform {
  id: string;
  name: string;
  icon: string;
  placements: { id: string; name: string; param: string }[];
}

const PLATFORMS: Platform[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    placements: [
      { id: 'reels', name: 'Reels', param: 'ig-reels' },
      { id: 'post', name: 'Post', param: 'ig-post' },
      { id: 'story', name: 'Story', param: 'ig-story' },
      { id: 'bio', name: 'Bio', param: 'ig-bio' },
    ],
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    placements: [
      { id: 'video', name: 'Video', param: 'tt-video' },
      { id: 'story', name: 'Story', param: 'tt-story' },
      { id: 'bio', name: 'Bio', param: 'tt-bio' },
    ],
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: '▶️',
    placements: [
      { id: 'video', name: 'Video', param: 'yt-video' },
      { id: 'shorts', name: 'Shorts', param: 'yt-shorts' },
      { id: 'bio', name: 'Bio', param: 'yt-bio' },
    ],
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    icon: '📌',
    placements: [
      { id: 'pin', name: 'Pinterest', param: 'pin' },
    ],
  },
  {
    id: 'x',
    name: 'X',
    icon: '𝕏',
    placements: [
      { id: 'post', name: 'Post', param: 'x-post' },
      { id: 'bio', name: 'Bio', param: 'x-bio' },
    ],
  },
];

interface SmartCopyMenuProps {
  trackingUrl: string;
  className?: string;
  isVisible?: boolean;
}

export function SmartCopyMenu({ trackingUrl, className, isVisible = true }: SmartCopyMenuProps) {
  const [open, setOpen] = useState(false);
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [copiedParam, setCopiedParam] = useState<string | null>(null);

  const handleCopy = (platform: Platform, placement: { id: string; name: string; param: string }) => {
    const urlWithParam = `${trackingUrl}${trackingUrl.includes('?') ? '&' : '?'}s=${placement.param}`;
    navigator.clipboard.writeText(urlWithParam);
    
    setCopiedParam(placement.param);
    toast.success(`Link copied for ${platform.name} ${placement.name} tracking!`);
    
    setTimeout(() => {
      setCopiedParam(null);
      setOpen(false);
      setExpandedPlatform(null);
    }, 600);
  };

  const handlePlatformClick = (platformId: string) => {
    const platform = PLATFORMS.find(p => p.id === platformId);
    
    // Single placement platforms copy directly
    if (platform && platform.placements.length === 1) {
      handleCopy(platform, platform.placements[0]);
      return;
    }
    
    // Toggle expansion for multi-placement platforms
    setExpandedPlatform(prev => prev === platformId ? null : platformId);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className={cn(
            "h-7 px-2.5 text-[11px] gap-1.5 transition-opacity",
            !isVisible && "opacity-0 group-hover:opacity-100",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Share2 className="h-3 w-3" />
          <span>Share</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-56 p-0 bg-popover border-border shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-3 py-2 border-b border-border/50">
          <p className="text-xs font-medium text-foreground">Where are you posting this?</p>
        </div>
        
        <div className="py-1">
          {PLATFORMS.map((platform) => (
            <div key={platform.id}>
              {/* Platform Row */}
              <button
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm transition-colors",
                  "hover:bg-muted/60 focus:bg-muted/60 focus:outline-none",
                  expandedPlatform === platform.id && "bg-muted/40"
                )}
                onClick={() => handlePlatformClick(platform.id)}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base w-5 text-center">{platform.icon}</span>
                  <span className="text-foreground font-medium">{platform.name}</span>
                </div>
                {platform.placements.length > 1 && (
                  <ChevronRight 
                    className={cn(
                      "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                      expandedPlatform === platform.id && "rotate-90"
                    )} 
                  />
                )}
              </button>

              {/* Sub-options */}
              {platform.placements.length > 1 && expandedPlatform === platform.id && (
                <div className="bg-muted/30 border-y border-border/30">
                  {platform.placements.map((placement) => (
                    <button
                      key={placement.id}
                      className={cn(
                        "w-full flex items-center justify-between pl-10 pr-3 py-1.5 text-xs transition-colors",
                        "hover:bg-muted/60 focus:bg-muted/60 focus:outline-none text-muted-foreground hover:text-foreground",
                        copiedParam === placement.param && "text-primary"
                      )}
                      onClick={() => handleCopy(platform, placement)}
                    >
                      <span>{placement.name}</span>
                      {copiedParam === placement.param && (
                        <Check className="h-3 w-3 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
