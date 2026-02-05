import { useState, useEffect } from 'react';
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
import { useIntegrations } from '@/hooks/useIntegrations';

interface Link {
  id: string;
  alias: string;
}

interface ConnectServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration: Integration | null;
  links: Link[];
  onConfirmConnection: (integrationId: string, linkId: string | null, webhookToken: string) => void;
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
  paddle: {
    title: 'Connect Paddle',
    steps: [
      'Go to your Paddle Dashboard',
      'Navigate to Developer Tools → Notifications',
      'Add a new webhook destination',
      'Select "transaction.completed" event'
    ],
    settingsPath: 'Developer Tools → Notifications',
    docsUrl: 'https://developer.paddle.com/webhooks/overview'
  },
  paypal: {
    title: 'Connect PayPal',
    steps: [
      'Go to PayPal Developer Dashboard',
      'Navigate to My Apps & Credentials',
      'Select your app and go to Webhooks',
      'Add webhook URL for "Payment sale completed"'
    ],
    settingsPath: 'My Apps → Webhooks',
    docsUrl: 'https://developer.paypal.com/api/rest/webhooks/'
  },
  kofi: {
    title: 'Connect Ko-fi',
    steps: [
      'Go to your Ko-fi Settings',
      'Navigate to API tab',
      'Scroll to Webhooks section',
      'Paste the webhook URL and save'
    ],
    settingsPath: 'Settings → API → Webhooks',
    docsUrl: 'https://ko-fi.com/manage/webhooks'
  },
  patreon: {
    title: 'Connect Patreon',
    steps: [
      'Go to Patreon Platform Dashboard',
      'Navigate to your app settings',
      'Add webhook URL in the Webhooks section',
      'Select "pledge:create" trigger'
    ],
    settingsPath: 'Platform → App Settings → Webhooks',
    docsUrl: 'https://docs.patreon.com/#webhooks'
  },
  buymeacoffee: {
    title: 'Connect Buy Me a Coffee',
    steps: [
      'Go to your Buy Me a Coffee Dashboard',
      'Navigate to Settings → Integrations',
      'Find the Webhooks section',
      'Add the webhook URL below'
    ],
    settingsPath: 'Settings → Integrations',
    docsUrl: 'https://www.buymeacoffee.com/developers'
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
  },
  woocommerce: {
    title: 'Connect WooCommerce',
    steps: [
      'Go to your WordPress Admin',
      'Navigate to WooCommerce → Settings → Advanced → Webhooks',
      'Add new webhook with URL below',
      'Select "Order created" topic'
    ],
    settingsPath: 'WooCommerce → Settings → Webhooks',
    docsUrl: 'https://woocommerce.com/document/webhooks/'
  },
  clickbank: {
    title: 'Connect ClickBank',
    steps: [
      'Go to your ClickBank account',
      'Navigate to Settings → My Site',
      'Find the Instant Notification URL section',
      'Paste the webhook URL and save'
    ],
    settingsPath: 'Settings → My Site → IPN',
    docsUrl: 'https://support.clickbank.com/hc/en-us/articles/220364507'
  },
  digistore24: {
    title: 'Connect Digistore24',
    steps: [
      'Go to your Digistore24 account',
      'Navigate to Account → API/IPN',
      'Add new IPN URL',
      'Paste the webhook URL below'
    ],
    settingsPath: 'Account → API/IPN',
    docsUrl: 'https://docs.digistore24.com/knowledge-base/ipn/'
  },
  whop: {
    title: 'Connect Whop',
    steps: [
      'Go to your Whop Dashboard',
      'Navigate to Settings → Webhooks',
      'Click "Add Webhook" button',
      'Paste the URL and select "payment.completed" event'
    ],
    settingsPath: 'Settings → Webhooks',
    docsUrl: 'https://dev.whop.com/reference/webhooks'
  },
  hotmart: {
    title: 'Connect Hotmart',
    steps: [
      'Go to your Hotmart Dashboard',
      'Navigate to Tools → Webhooks (Hottok)',
      'Click "Add New Webhook"',
      'Paste the URL and select purchase events'
    ],
    settingsPath: 'Tools → Webhooks',
    docsUrl: 'https://developers.hotmart.com/docs/en/webhooks/'
  },
  thrivecart: {
    title: 'Connect ThriveCart',
    steps: [
      'Go to your ThriveCart Dashboard',
      'Navigate to Settings → API & Webhooks',
      'Add new webhook notification',
      'Paste URL for "Successful purchase" event'
    ],
    settingsPath: 'Settings → API & Webhooks',
    docsUrl: 'https://thrivecart.com/docs/'
  },
  samcart: {
    title: 'Connect SamCart',
    steps: [
      'Go to your SamCart Dashboard',
      'Navigate to Settings → Integrations → Webhooks',
      'Click "Add Webhook"',
      'Paste URL and select "Order completed" trigger'
    ],
    settingsPath: 'Settings → Integrations → Webhooks',
    docsUrl: 'https://help.samcart.com/en/'
  },
  zapier: {
    title: 'Connect Zapier',
    steps: [
      'Go to Zapier and create a new Zap',
      'Choose "Webhooks by Zapier" as trigger',
      'Select "Catch Hook" event',
      'Copy your unique Zapier webhook URL and paste below'
    ],
    settingsPath: 'Zaps → Create → Webhooks by Zapier',
    docsUrl: 'https://zapier.com/help/create/code-webhooks/trigger-zaps-from-webhooks'
  },
  make: {
    title: 'Connect Make',
    steps: [
      'Go to Make and create a new Scenario',
      'Add "Webhooks" module as trigger',
      'Select "Custom webhook" and create new hook',
      'Copy your Make webhook URL and paste below'
    ],
    settingsPath: 'Scenarios → Create → Webhooks',
    docsUrl: 'https://www.make.com/en/help/tools/webhooks'
  },
  discord: {
    title: 'Connect Discord',
    steps: [
      'Open Discord and go to your server',
      'Navigate to Server Settings → Integrations → Webhooks',
      'Click "New Webhook" and choose the channel',
      'Copy the webhook URL and paste below'
    ],
    settingsPath: 'Server Settings → Integrations → Webhooks',
    docsUrl: 'https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks'
  },
  telegram: {
    title: 'Connect Telegram',
    steps: [
      'Open Telegram and message @BotFather',
      'Create a new bot with /newbot command',
      'Copy your bot token',
      'Get your chat ID and configure notifications'
    ],
    settingsPath: '@BotFather → /newbot',
    docsUrl: 'https://core.telegram.org/bots#how-do-i-create-a-bot'
  },
  slack: {
    title: 'Connect Slack',
    steps: [
      'Go to Slack API and create a new app',
      'Enable Incoming Webhooks feature',
      'Add webhook to your desired channel',
      'Copy the webhook URL and paste below'
    ],
    settingsPath: 'Slack API → Your Apps → Webhooks',
    docsUrl: 'https://api.slack.com/messaging/webhooks'
  },
  gohighlevel: {
    title: 'Connect GoHighLevel',
    steps: [
      'Go to your GoHighLevel account',
      'Navigate to Settings → Webhooks',
      'Click "Add Webhook" button',
      'Paste the URL and select trigger events'
    ],
    settingsPath: 'Settings → Webhooks',
    docsUrl: 'https://help.gohighlevel.com/support/solutions/articles/155000002294-webhooks'
  },
  beehiiv: {
    title: 'Connect Beehiiv',
    steps: [
      'Go to your Beehiiv Dashboard',
      'Navigate to Settings → Integrations → Webhooks',
      'Click "Add Webhook"',
      'Paste URL and select subscription events'
    ],
    settingsPath: 'Settings → Integrations → Webhooks',
    docsUrl: 'https://developers.beehiiv.com/docs/webhooks'
  },
  convertkit: {
    title: 'Connect ConvertKit',
    steps: [
      'Go to your ConvertKit account',
      'Navigate to Settings → Advanced → Webhooks',
      'Add new webhook URL',
      'Select "Subscriber activated" trigger'
    ],
    settingsPath: 'Settings → Advanced → Webhooks',
    docsUrl: 'https://help.convertkit.com/en/articles/2502494-using-webhooks'
  },
  substack: {
    title: 'Connect Substack',
    steps: [
      'Go to your Substack Dashboard',
      'Navigate to Settings → Integrations',
      'Look for Webhook or Zapier integration',
      'Configure with the webhook URL below'
    ],
    settingsPath: 'Settings → Integrations',
    docsUrl: 'https://support.substack.com/hc/en-us/articles/360037466012-Integrations'
  },
};

// Generate a preview token (gl_ + 10 random chars) for display before saving
function generatePreviewToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = 'gl_';
  for (let i = 0; i < 10; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

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
  const [previewToken, setPreviewToken] = useState('');

  const supabaseProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'mlgrbwkddyrazysxrlvo';

  // Generate a new preview token each time the modal opens with a new integration
  useEffect(() => {
    if (open && integration) {
      setPreviewToken(generatePreviewToken());
      setStep(1);
      setSelectedLinkId('all');
      setCopied(false);
    }
  }, [open, integration?.id]);
  
  // Build the unique webhook URL with this token
  const webhookUrl = `https://${supabaseProjectId}.supabase.co/functions/v1/postback?token=${previewToken}`;

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
      onConfirmConnection(
        integration.id, 
        selectedLinkId === 'all' ? null : selectedLinkId,
        previewToken
      );
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
                    Paste this URL in {integration.name}. Any sale will be automatically tracked.
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
                    Assign sales to a tracking link
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
