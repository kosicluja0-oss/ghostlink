import { useState } from 'react';
import { Code, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function DeveloperWebhookCard() {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const supabaseProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'mlgrbwkddyrazysxrlvo';
  const postbackUrl = `https://${supabaseProjectId}.supabase.co/functions/v1/postback?click_id={click_id}&type={type}&value={value}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(postbackUrl);
      setCopied(true);
      toast.success('Full postback URL copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="border border-dashed border-border rounded-xl p-5 bg-ghost-surface/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
            <Code className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">Custom / Developers</h3>
            <p className="text-xs text-muted-foreground">Full webhook control with placeholders</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      <div className={cn(
        "overflow-hidden transition-all duration-300",
        expanded ? "max-h-[500px] opacity-100 mt-4" : "max-h-0 opacity-0"
      )}>
        {/* Full URL Display */}
        <div className="p-3 bg-background rounded-lg border border-border mb-4">
          <div className="flex items-start justify-between gap-2">
            <code className="text-xs text-muted-foreground break-all font-mono leading-relaxed">
              {postbackUrl}
            </code>
            <button
              onClick={handleCopy}
              className="flex-shrink-0 p-1.5 rounded-md hover:bg-muted transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Placeholder Docs */}
        <div className="space-y-2 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Placeholders:</p>
          <ul className="space-y-1.5 ml-1">
            <li className="flex items-start gap-2">
              <code className="px-1.5 py-0.5 rounded bg-muted text-primary text-[11px] shrink-0">
                {'{click_id}'}
              </code>
              <span>Your tracking click ID from the redirect</span>
            </li>
            <li className="flex items-start gap-2">
              <code className="px-1.5 py-0.5 rounded bg-muted text-warning text-[11px] shrink-0">
                {'{type}'}
              </code>
              <span>
                Use <code className="text-warning">lead</code> or <code className="text-success">sale</code>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <code className="px-1.5 py-0.5 rounded bg-muted text-success text-[11px] shrink-0">
                {'{value}'}
              </code>
              <span>Conversion value (e.g., 49.99)</span>
            </li>
          </ul>
        </div>

        {/* Example */}
        <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
          <p className="text-xs font-medium text-foreground mb-2">Example Request:</p>
          <code className="text-[11px] text-muted-foreground font-mono break-all">
            GET /postback?click_id=abc123&type=sale&value=49.99
          </code>
        </div>
      </div>
    </div>
  );
}
