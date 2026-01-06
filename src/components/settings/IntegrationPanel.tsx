import { Webhook, Upload, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function IntegrationPanel() {
  return (
    <div className="bg-card rounded-lg border border-border p-5">
      <h3 className="text-lg font-semibold text-foreground mb-4">Data Integration</h3>
      
      <div className="space-y-3">
        {/* Postback/Webhook */}
        <button className="w-full flex items-center justify-between p-4 rounded-lg bg-ghost-surface border border-ghost-border-subtle transition-ghost hover:bg-ghost-surface-hover group">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Webhook className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">Postback / Webhook</p>
              <p className="text-xs text-muted-foreground">Receive real-time conversion data</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-ghost" />
        </button>

        {/* CSV Import */}
        <button className="w-full flex items-center justify-between p-4 rounded-lg bg-ghost-surface border border-ghost-border-subtle transition-ghost hover:bg-ghost-surface-hover group">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-chart-leads/10">
              <Upload className="h-5 w-5 text-chart-leads" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">Manual CSV Import</p>
              <p className="text-xs text-muted-foreground">Bulk import sales & leads data</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-ghost" />
        </button>
      </div>
    </div>
  );
}
