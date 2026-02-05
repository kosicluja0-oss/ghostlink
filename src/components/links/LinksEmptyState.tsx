import { Link2, Play, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LinksEmptyStateProps {
  onCreateLink: () => void;
  className?: string;
}

export function LinksEmptyState({ onCreateLink, className }: LinksEmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-16 px-6 border-2 border-dashed border-border/60 rounded-2xl bg-gradient-to-b from-card/80 to-card/40",
      className
    )}>
      {/* Icon */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Link2 className="w-10 h-10 text-primary" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-success" />
        </div>
      </div>

      {/* Title & Description */}
      <h3 className="text-xl font-bold text-foreground mb-2">
        Create Your First Tracking Link
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-md mb-8 leading-relaxed">
        Transform any URL into a powerful tracking link. Monitor clicks, leads, and sales 
        in real-time across all your marketing channels.
      </p>

      {/* Feature Pills */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {['Real-time Analytics', 'Platform Tracking', 'Conversion Metrics'].map((feature) => (
          <span
            key={feature}
            className="px-3 py-1 text-xs font-medium rounded-full bg-muted/60 text-muted-foreground border border-border/50"
          >
            {feature}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Button 
          variant="glow" 
          size="lg" 
          onClick={onCreateLink}
          className="gap-2 min-w-[180px]"
        >
          <Link2 className="w-4 h-4" />
          Create Link
          <ArrowRight className="w-4 h-4" />
        </Button>
        
        <Button 
          variant="outline" 
          size="lg"
          className="gap-2 min-w-[180px]"
          onClick={() => window.open('https://docs.ghostlink.dev/getting-started', '_blank')}
        >
          <Play className="w-4 h-4" />
          Watch Tutorial
        </Button>
      </div>

      {/* Quick tip */}
      <p className="mt-8 text-xs text-muted-foreground/70 text-center max-w-sm">
        💡 Pro tip: Use our Smart Copy feature to automatically track which platform 
        each click comes from (Instagram, TikTok, YouTube, etc.)
      </p>
    </div>
  );
}
