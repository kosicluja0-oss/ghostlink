import { useState } from 'react';
import { Copy, Check, ChevronRight, ExternalLink, Info } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Integration } from './IntegrationCard';

interface Link {
  id: string;
  alias: string;
}

interface ConnectServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration: Integration | null;
  links: Link[];
  onConfirmConnection: (integrationId: string, linkId: string | null) => void;
}

// Service-specific instructions
const serviceInstructions: Record<string, { 
  title: string; 
  steps: string[]; 
  settingsPath: string;
  docsUrl?: string;
}> = {
  gumroad: {
    title: 'Connect Gumroad',
    steps: [
      'Go to your Gumroad Settings',
      'Navigate to Settings → Advanced → Ping',
      'Paste the webhook URL below',
      'Save your settings'
    ],
    settingsPath: 'Settings → Advanced → Ping',
    docsUrl: 'https://help.gumroad.com/article/23-ping-notification'
  },
  stripe: {
    title: 'Connect Stripe',
    steps: [
      'Go to your Stripe Dashboard',
      'Navigate to Developers → Webhooks',
      'Click "Add endpoint" and paste the URL below',
      'Select events: checkout.session.completed, payment_intent.succeeded'
    ],
    settingsPath: 'Developers → Webhooks',
    docsUrl: 'https://stripe.com/docs/webhooks'
  },
  lemonsqueezy: {
    title: 'Connect Lemon Squeezy',
    steps: [
      'Go to your Lemon Squeezy Dashboard',
      'Navigate to Settings → Webhooks',
      'Add a new webhook with the URL below',
      'Enable "order_created" event'
    ],
    settingsPath: 'Settings → Webhooks',
    docsUrl: 'https://docs.lemonsqueezy.com/api/webhooks'
  },
  shopify: {
    title: 'Connect Shopify',
    steps: [
      'Go to your Shopify Admin',
      'Navigate to Settings → Notifications',
      'Scroll to Webhooks section',
      'Add webhook for "Order creation" with URL below'
    ],
    settingsPath: 'Settings → Notifications → Webhooks',
    docsUrl: 'https://help.shopify.com/en/manual/orders/notifications/webhooks'
  }
};

export function ConnectServiceModal({
  open,
  onOpenChange,
  integration,
  links,
  onConfirmConnection,
}: ConnectServiceModalProps) {
  const [copied, setCopied] = useState(false);
  const [selectedLinkId, setSelectedLinkId] = useState<string>('all');
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const supabaseProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'mlgrbwkddyrazysxrlvo';
  
  // Simplified webhook URL for beginners (no placeholders visible)
  const webhookUrl = `https://${supabaseProjectId}.supabase.co/functions/v1/postback`;

  const instructions = integration ? serviceInstructions[integration.id] : null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      toast.success('Webhook URL copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleConfirm = () => {
    if (integration) {
      onConfirmConnection(integration.id, selectedLinkId === 'all' ? null : selectedLinkId);
      onOpenChange(false);
      setStep(1);
      toast.success(`${integration.name} connection initiated!`, {
        description: 'Waiting for first sale data...'
      });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep(1);
  };

  if (!integration || !instructions) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-ghost-surface border border-ghost-border-subtle overflow-hidden">
              <img 
                src={integration.logo} 
                alt={integration.name}
                className="w-6 h-6 object-contain"
              />
            </div>
            <div>
              <DialogTitle className="text-foreground">{instructions.title}</DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs">
                Follow these simple steps
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  "w-8 h-1 rounded-full transition-colors",
                  s <= step ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>

          {/* Step 1: Instructions */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-ghost-surface border border-ghost-border-subtle">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">
                      Open {integration.name} Settings
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Go to <code className="px-1.5 py-0.5 rounded bg-muted text-primary text-[11px]">
                        {instructions.settingsPath}
                      </code>
                    </p>
                    {instructions.docsUrl && (
                      <a 
                        href={instructions.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
                      >
                        View documentation <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => setStep(2)} 
                className="w-full"
                variant="glow"
              >
                Next: Copy Webhook URL
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Step 2: Copy URL */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-ghost-surface border border-ghost-border-subtle">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0 mt-0.5">
                    2
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    Copy this webhook URL and paste it in {integration.name}
                  </p>
                </div>

                {/* URL Display */}
                <div className="relative mt-3">
                  <div className="p-3 pr-12 bg-background rounded-lg border border-border">
                    <code className="text-xs text-muted-foreground break-all font-mono leading-relaxed">
                      {webhookUrl}
                    </code>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-muted transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>

                {/* Tip */}
                <div className="flex items-start gap-2 mt-3 p-2 rounded bg-primary/5 border border-primary/10">
                  <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground">
                    This URL automatically tracks sales and leads from {integration.name}.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => setStep(1)} 
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(3)} 
                  variant="glow"
                  className="flex-1"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Assign Link */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-ghost-surface border border-ghost-border-subtle">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0 mt-0.5">
                    3
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    Assign sales to a tracking link (optional)
                  </p>
                </div>

                <Select value={selectedLinkId} onValueChange={setSelectedLinkId}>
                  <SelectTrigger className="w-full bg-background border-border">
                    <SelectValue placeholder="Select a link" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="flex items-center gap-2">
                        🌐 All Links (Global)
                      </span>
                    </SelectItem>
                    {links.map(link => (
                      <SelectItem key={link.id} value={link.id}>
                        /{link.alias}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <p className="text-[11px] text-muted-foreground mt-2">
                  Choose which link should receive credit for {integration.name} sales.
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => setStep(2)} 
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleConfirm} 
                  variant="glow"
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-1" />
                  I've Pasted It
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
