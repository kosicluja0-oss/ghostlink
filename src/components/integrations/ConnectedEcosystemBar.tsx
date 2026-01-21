import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Integration } from './IntegrationCard';

interface ConnectedEcosystemBarProps {
  integrations: Integration[];
}

export function ConnectedEcosystemBar({ integrations }: ConnectedEcosystemBarProps) {
  const activeIntegrations = integrations.filter(i => i.status === 'connected');
  
  // Don't render if no active integrations
  if (activeIntegrations.length === 0) return null;

  return (
    <div className="mb-8 p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left side - Label and Icons */}
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Your Active Stack
          </span>
          
          <div className="flex items-center -space-x-2">
            {activeIntegrations.map((integration) => (
              <IntegrationIcon key={integration.id} integration={integration} />
            ))}
          </div>
        </div>
        
        {/* Right side - Counter Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-medium text-success">
            {activeIntegrations.length} {activeIntegrations.length === 1 ? 'Platform' : 'Platforms'} Active
          </span>
        </div>
      </div>
    </div>
  );
}

function IntegrationIcon({ integration }: { integration: Integration }) {
  const [imgError, setImgError] = useState(false);
  
  const initials = integration.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div 
      className={cn(
        "relative flex items-center justify-center w-9 h-9 rounded-full",
        "bg-ghost-surface border-2 border-background",
        "shadow-sm transition-transform hover:scale-110 hover:z-10"
      )}
      title={integration.name}
    >
      {imgError ? (
        <span className="text-[10px] font-bold text-muted-foreground">{initials}</span>
      ) : (
        <img 
          src={integration.logo} 
          alt={integration.name}
          className="w-4 h-4 object-contain"
          onError={() => setImgError(true)}
        />
      )}
    </div>
  );
}
