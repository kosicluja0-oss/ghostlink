import { Check, ExternalLink, Loader2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export interface Integration {
  id: string;
  name: string;
  description: string;
  logo: string;
  status: 'connected' | 'not_connected' | 'pending';
  category: 'payment' | 'ecommerce' | 'creator' | 'affiliate' | 'automation' | 'developer';
  comingSoon?: boolean;
}

interface IntegrationCardProps {
  integration: Integration;
  onConnect: (id: string) => void;
}

export function IntegrationCard({ integration, onConnect }: IntegrationCardProps) {
  const [imgError, setImgError] = useState(false);
  const isConnected = integration.status === 'connected';
  const isPending = integration.status === 'pending';
  const isComingSoon = integration.comingSoon;

  // Generate initials for fallback
  const initials = integration.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "group relative flex flex-col p-5 rounded-xl border transition-all duration-300",
        "bg-card",
        isComingSoon 
          ? "opacity-60 border-border cursor-not-allowed"
          : isConnected 
          ? "border-success/50 shadow-[0_0_20px_-8px_hsl(var(--success)/0.3)] hover:bg-ghost-surface-hover" 
          : isPending
          ? "border-warning/50 shadow-[0_0_20px_-8px_hsl(var(--warning)/0.3)] hover:bg-ghost-surface-hover"
          : "border-border hover:border-primary/30 hover:bg-ghost-surface-hover hover:shadow-[0_0_25px_-10px_hsl(var(--primary)/0.2)]"
      )}
    >
      {/* Status Badge */}
      {isComingSoon && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
          <Clock className="w-3 h-3" />
          Coming Soon
        </div>
      )}
      {isConnected && !isComingSoon && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          Active
        </div>
      )}
      {isPending && !isComingSoon && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium">
          <Loader2 className="w-3 h-3 animate-spin" />
          Waiting for events...
        </div>
      )}

      {/* Logo */}
      <div className={cn(
        "flex items-center justify-center w-14 h-14 rounded-xl bg-ghost-surface border border-ghost-border-subtle mb-4 overflow-hidden transition-transform duration-300",
        !isComingSoon && "group-hover:scale-105"
      )}>
        {imgError ? (
          <span className="text-lg font-bold text-muted-foreground">{initials}</span>
        ) : (
          <img 
            src={integration.logo} 
            alt={`${integration.name} logo`}
            className="w-8 h-8 object-contain"
            onError={() => setImgError(true)}
          />
        )}
      </div>

      {/* Content */}
      <h3 className="text-base font-semibold text-foreground mb-1">
        {integration.name}
      </h3>
      <p className="text-sm text-muted-foreground mb-4 flex-1">
        {integration.description}
      </p>

      {/* Pending notification */}
      {isPending && !isComingSoon && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-warning/5 border border-warning/20 text-xs text-warning">
          Waiting for first sale data...
        </div>
      )}

      {/* Action */}
      {isComingSoon ? (
        <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-muted text-muted-foreground">
          <Clock className="w-4 h-4" />
          Notify Me
        </div>
      ) : (
        <button
          onClick={() => onConnect(integration.id)}
          disabled={isConnected}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
            isConnected
              ? "bg-success/10 text-success cursor-default"
              : isPending
              ? "bg-warning/10 text-warning hover:bg-warning/20"
              : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_20px_-5px_hsl(var(--primary)/0.5)]"
          )}
        >
          {isConnected ? (
            <>
              <Check className="w-4 h-4" />
              Connected
            </>
          ) : isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Awaiting Data
            </>
          ) : (
            <>
              Connect
              <ExternalLink className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
