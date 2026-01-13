import { Check, ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Integration {
  id: string;
  name: string;
  description: string;
  logo: string;
  status: 'connected' | 'not_connected' | 'pending';
  category: 'payment' | 'ecommerce' | 'developer';
}

interface IntegrationCardProps {
  integration: Integration;
  onConnect: (id: string) => void;
}

export function IntegrationCard({ integration, onConnect }: IntegrationCardProps) {
  const isConnected = integration.status === 'connected';
  const isPending = integration.status === 'pending';

  return (
    <div
      className={cn(
        "group relative flex flex-col p-5 rounded-xl border transition-all duration-300",
        "bg-card hover:bg-ghost-surface-hover",
        isConnected 
          ? "border-success/50 shadow-[0_0_20px_-8px_hsl(var(--success)/0.3)]" 
          : isPending
          ? "border-warning/50 shadow-[0_0_20px_-8px_hsl(var(--warning)/0.3)]"
          : "border-border hover:border-primary/30"
      )}
    >
      {/* Status Badge */}
      {isConnected && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          Active
        </div>
      )}
      {isPending && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium">
          <Loader2 className="w-3 h-3 animate-spin" />
          Waiting for events...
        </div>
      )}

      {/* Logo */}
      <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-ghost-surface border border-ghost-border-subtle mb-4 overflow-hidden">
        <img 
          src={integration.logo} 
          alt={`${integration.name} logo`}
          className="w-8 h-8 object-contain"
        />
      </div>

      {/* Content */}
      <h3 className="text-base font-semibold text-foreground mb-1">
        {integration.name}
      </h3>
      <p className="text-sm text-muted-foreground mb-4 flex-1">
        {integration.description}
      </p>

      {/* Pending notification */}
      {isPending && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-warning/5 border border-warning/20 text-xs text-warning">
          Waiting for first sale data...
        </div>
      )}

      {/* Action */}
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
    </div>
  );
}
