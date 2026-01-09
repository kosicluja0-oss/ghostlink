import { Webhook, Upload, ChevronRight, Copy, Check, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DataIntegrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DataIntegrationModal({ open, onOpenChange }: DataIntegrationModalProps) {
  const [copied, setCopied] = useState(false);
  
  const supabaseProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'mlgrbwkddyrazysxrlvo';
  const postbackUrl = `https://${supabaseProjectId}.supabase.co/functions/v1/postback?click_id={click_id}&type={type}&value={value}`;

  const handleCopyPostback = async () => {
    try {
      await navigator.clipboard.writeText(postbackUrl);
      setCopied(true);
      toast.success('Postback URL copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg">Data Integration</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Postback/Webhook */}
          <div className="p-4 rounded-lg bg-ghost-surface border border-ghost-border-subtle">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Webhook className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Postback / Webhook</p>
                <p className="text-xs text-muted-foreground">Receive real-time conversion data</p>
              </div>
            </div>
            
            {/* Postback URL Display */}
            <div className="mt-3 p-3 bg-background rounded-md border border-border">
              <div className="flex items-start justify-between gap-2">
                <code className="text-xs text-muted-foreground break-all font-mono leading-relaxed">
                  {postbackUrl}
                </code>
                <button
                  onClick={handleCopyPostback}
                  className="flex-shrink-0 p-1.5 rounded-md hover:bg-muted transition-colors"
                  title="Copy postback URL"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
            
            {/* Instructions */}
            <div className="mt-3 text-xs text-muted-foreground space-y-1.5">
              <p className="font-medium text-foreground">Placeholders:</p>
              <ul className="list-disc list-inside space-y-1 ml-1">
                <li><code className="text-primary">{'{click_id}'}</code> — Replace with the click ID from your tracking pixel</li>
                <li><code className="text-primary">{'{type}'}</code> — Use <code className="text-warning">lead</code> or <code className="text-success">sale</code></li>
                <li><code className="text-primary">{'{value}'}</code> — Conversion value (e.g., <code>49.99</code>)</li>
              </ul>
            </div>
          </div>

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
      </DialogContent>
    </Dialog>
  );
}
