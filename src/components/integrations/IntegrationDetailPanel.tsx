import { useState, useEffect } from 'react';
import { Copy, Check, Unplug, RefreshCw, Clock, Zap, Loader2, Trash2, ChevronRight, ExternalLink, Info, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { Integration } from './IntegrationCard';
import type { UserIntegration } from '@/hooks/useIntegrations';
import { useIntegrations } from '@/hooks/useIntegrations';

interface Link {
  id: string;
  alias: string;
}

interface IntegrationDetailPanelProps {
  open: boolean;
  onClose: () => void;
  mode: 'connect' | 'manage';
  integration: Integration | null;
  dbIntegration?: UserIntegration;
  links: Link[];
  assignedLinkIds: string[];
  onConfirmConnection: (integrationId: string, linkId: string | null, webhookToken: string) => void;
  onDisconnect: (serviceId: string) => Promise<void>;
  onUpdateLinks: (serviceId: string, linkIds: string[]) => Promise<void>;
}

// Service-specific instructions
const serviceInstructions: Record<string, {
  title: string;
  steps: string[];
  settingsPath: string;
  docsUrl?: string;
}> = {
  gumroad: { title: 'Connect Gumroad', steps: [], settingsPath: 'Settings → Advanced → Ping', docsUrl: 'https://help.gumroad.com/article/23-ping-notification' },
  stripe: { title: 'Connect Stripe', steps: [], settingsPath: 'Developers → Webhooks', docsUrl: 'https://stripe.com/docs/webhooks' },
  lemonsqueezy: { title: 'Connect Lemon Squeezy', steps: [], settingsPath: 'Settings → Webhooks', docsUrl: 'https://docs.lemonsqueezy.com/api/webhooks' },
  paddle: { title: 'Connect Paddle', steps: [], settingsPath: 'Developer Tools → Notifications', docsUrl: 'https://developer.paddle.com/webhooks/overview' },
  paypal: { title: 'Connect PayPal', steps: [], settingsPath: 'My Apps → Webhooks', docsUrl: 'https://developer.paypal.com/api/rest/webhooks/' },
  kofi: { title: 'Connect Ko-fi', steps: [], settingsPath: 'Settings → API → Webhooks', docsUrl: 'https://ko-fi.com/manage/webhooks' },
  patreon: { title: 'Connect Patreon', steps: [], settingsPath: 'Platform → App Settings → Webhooks', docsUrl: 'https://docs.patreon.com/#webhooks' },
  buymeacoffee: { title: 'Connect Buy Me a Coffee', steps: [], settingsPath: 'Settings → Integrations', docsUrl: 'https://www.buymeacoffee.com/developers' },
  shopify: { title: 'Connect Shopify', steps: [], settingsPath: 'Settings → Notifications → Webhooks', docsUrl: 'https://help.shopify.com/en/manual/orders/notifications/webhooks' },
  woocommerce: { title: 'Connect WooCommerce', steps: [], settingsPath: 'WooCommerce → Settings → Webhooks', docsUrl: 'https://woocommerce.com/document/webhooks/' },
  clickbank: { title: 'Connect ClickBank', steps: [], settingsPath: 'Settings → My Site → IPN', docsUrl: 'https://support.clickbank.com/hc/en-us/articles/220364507' },
  digistore24: { title: 'Connect Digistore24', steps: [], settingsPath: 'Account → API/IPN', docsUrl: 'https://docs.digistore24.com/knowledge-base/ipn/' },
  whop: { title: 'Connect Whop', steps: [], settingsPath: 'Settings → Webhooks', docsUrl: 'https://dev.whop.com/reference/webhooks' },
  hotmart: { title: 'Connect Hotmart', steps: [], settingsPath: 'Tools → Webhooks', docsUrl: 'https://developers.hotmart.com/docs/en/webhooks/' },
  thrivecart: { title: 'Connect ThriveCart', steps: [], settingsPath: 'Settings → API & Webhooks', docsUrl: 'https://thrivecart.com/docs/' },
  samcart: { title: 'Connect SamCart', steps: [], settingsPath: 'Settings → Integrations → Webhooks', docsUrl: 'https://help.samcart.com/en/' },
  zapier: { title: 'Connect Zapier', steps: [], settingsPath: 'Zaps → Create → Webhooks by Zapier', docsUrl: 'https://zapier.com/help/create/code-webhooks/trigger-zaps-from-webhooks' },
  make: { title: 'Connect Make', steps: [], settingsPath: 'Scenarios → Create → Webhooks', docsUrl: 'https://www.make.com/en/help/tools/webhooks' },
  gohighlevel: { title: 'Connect GoHighLevel', steps: [], settingsPath: 'Settings → Webhooks', docsUrl: 'https://help.gohighlevel.com/support/solutions/articles/155000002294-webhooks' },
  beehiiv: { title: 'Connect Beehiiv', steps: [], settingsPath: 'Settings → Integrations → Webhooks', docsUrl: 'https://developers.beehiiv.com/docs/webhooks' },
  convertkit: { title: 'Connect ConvertKit', steps: [], settingsPath: 'Settings → Advanced → Webhooks', docsUrl: 'https://help.convertkit.com/en/articles/2502494-using-webhooks' },
  substack: { title: 'Connect Substack', steps: [], settingsPath: 'Settings → Integrations', docsUrl: 'https://support.substack.com/hc/en-us/articles/360037466012-Integrations' },
};

function generatePreviewToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = 'gl_';
  for (let i = 0; i < 10; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

function ConnectContent({
  integration,
  links,
  onConfirmConnection,
  onClose,
}: {
  integration: Integration;
  links: Link[];
  onConfirmConnection: (integrationId: string, linkId: string | null, webhookToken: string) => void;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [selectedLinkId, setSelectedLinkId] = useState<string>('all');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [previewToken, setPreviewToken] = useState('');

  const supabaseProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'mlgrbwkddyrazysxrlvo';

  useEffect(() => {
    setPreviewToken(generatePreviewToken());
    setStep(1);
    setSelectedLinkId('all');
    setCopied(false);
  }, [integration?.id]);

  const webhookUrl = `https://${supabaseProjectId}.supabase.co/functions/v1/postback?token=${previewToken}`;
  const instructions = serviceInstructions[integration.id];

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
    onConfirmConnection(
      integration.id,
      selectedLinkId === 'all' ? null : selectedLinkId,
      previewToken
    );
    onClose();
    toast.success(`${integration.name} connection initiated!`, {
      description: 'Waiting for first sale data...'
    });
  };

  if (!instructions) return null;

  return (
    <div className="space-y-4">
      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-4">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={cn(
              "flex-1 h-1 rounded-full transition-colors",
              s <= step ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0 mt-0.5">1</div>
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Open {integration.name} Settings</p>
                <p className="text-xs text-muted-foreground">
                  Go to <code className="px-1.5 py-0.5 rounded bg-muted text-primary text-[11px]">{instructions.settingsPath}</code>
                </p>
                {instructions.docsUrl && (
                  <a href={instructions.docsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline">
                    View documentation <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
          <Button onClick={() => setStep(2)} variant="glow" className="w-full">
            Next: Copy Webhook URL <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0 mt-0.5">2</div>
              <p className="text-sm font-medium text-foreground">Copy this webhook URL and paste it in {integration.name}</p>
            </div>
            <div className="relative mt-3">
              <div className="p-3 pr-12 bg-background rounded-lg border border-border">
                <code className="text-xs text-muted-foreground break-all font-mono leading-relaxed">{webhookUrl}</code>
              </div>
              <button onClick={handleCopy} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-muted transition-colors">
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
              </button>
            </div>
            <div className="flex items-start gap-2 mt-3 p-2 rounded bg-primary/5 border border-primary/10">
              <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground">Paste this URL in {integration.name}. Any sale will be automatically tracked.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setStep(1)} variant="outline" className="flex-1">Back</Button>
            <Button onClick={() => setStep(3)} variant="glow" className="flex-1">Next <ChevronRight className="w-4 h-4 ml-1" /></Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0 mt-0.5">3</div>
              <p className="text-sm font-medium text-foreground">Assign sales to a tracking link</p>
            </div>
            <Select value={selectedLinkId} onValueChange={setSelectedLinkId}>
              <SelectTrigger className="w-full bg-background border-border">
                <SelectValue placeholder="Select a link" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all"><span className="flex items-center gap-2">🌐 All Links (Global)</span></SelectItem>
                {links.map(link => (
                  <SelectItem key={link.id} value={link.id}>/{link.alias}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground mt-2">Choose which link should receive credit for {integration.name} sales.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setStep(2)} variant="outline" className="flex-1">Back</Button>
            <Button onClick={handleConfirm} variant="glow" className="flex-1">
              <Check className="w-4 h-4 mr-1" /> I've Pasted It
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ManageContent({
  integration,
  dbIntegration,
  links,
  assignedLinkIds,
  onDisconnect,
  onUpdateLinks,
  onClose,
}: {
  integration: Integration;
  dbIntegration: UserIntegration;
  links: Link[];
  assignedLinkIds: string[];
  onDisconnect: (serviceId: string) => Promise<void>;
  onUpdateLinks: (serviceId: string, linkIds: string[]) => Promise<void>;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isUpdatingLinks, setIsUpdatingLinks] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDeletingTest, setIsDeletingTest] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testDetails, setTestDetails] = useState<{ type: string; link: string; timestamp: string } | null>(null);
  const [selectedLinkIds, setSelectedLinkIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedLinkIds(assignedLinkIds);
  }, [assignedLinkIds]);

  const webhookUrl = dbIntegration.webhook_url || '';
  const isGlobalMode = selectedLinkIds.length === 0;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      toast.success('Webhook URL copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error('Failed to copy'); }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await onDisconnect(integration.id);
      toast.success(`${integration.name} disconnected`);
      onClose();
    } catch { toast.error('Failed to disconnect'); }
    finally { setIsDisconnecting(false); }
  };

  const handleToggleLink = (linkId: string) => {
    setSelectedLinkIds((prev) =>
      prev.includes(linkId) ? prev.filter((id) => id !== linkId) : [...prev, linkId]
    );
  };

  const handleToggleGlobal = () => setSelectedLinkIds([]);

  const handleSaveLinks = async () => {
    setIsUpdatingLinks(true);
    try {
      await onUpdateLinks(integration.id, selectedLinkIds);
      toast.success('Link assignment updated');
    } catch { toast.error('Failed to update links'); }
    finally { setIsUpdatingLinks(false); }
  };

  const linksChanged = JSON.stringify([...selectedLinkIds].sort()) !== JSON.stringify([...assignedLinkIds].sort());

  const handleTestWebhook = async () => {
    if (!webhookUrl) return;
    setIsTesting(true);
    setTestResult(null);
    setTestDetails(null);
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'lead', value: 0, event: 'test', source: 'ghost_link_test' }),
      });
      if (res.ok) {
        setTestResult('success');
        const attributedLink = assignedLinkIds.length > 0
          ? links.find(l => assignedLinkIds.includes(l.id))?.alias || 'Assigned link'
          : links[0]?.alias || 'First link';
        setTestDetails({
          type: 'Lead',
          link: `/${attributedLink}`,
          timestamp: new Date().toLocaleString(),
        });
        toast.success('Webhook connectivity verified!');
      } else {
        setTestResult('error');
        toast.error('Webhook test failed');
      }
    } catch {
      setTestResult('error');
      toast.error('Failed to reach webhook endpoint');
    } finally { setIsTesting(false); }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="space-y-5">
      {/* Status */}
      <div className="flex items-center gap-2">
        {dbIntegration.status === 'connected' ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            Live
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Pending
          </div>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
          <Clock className="w-3 h-3" />
          {formatDate(dbIntegration.last_verified_at)}
        </div>
      </div>

      {/* Webhook URL */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Webhook URL</label>
        <div className="relative">
          <div className="p-3 pr-12 bg-background rounded-lg border border-border">
            <code className="text-xs text-muted-foreground break-all font-mono leading-relaxed">{webhookUrl}</code>
          </div>
          <button onClick={handleCopy} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-muted transition-colors">
            {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
          </button>
        </div>
      </div>

      {/* Assigned Links */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Assigned Links</label>
        <div className="bg-background rounded-lg border border-border p-3 space-y-2 max-h-48 overflow-y-auto">
          <label className="flex items-center gap-2.5 cursor-pointer py-1 px-1 rounded hover:bg-muted/50 transition-colors">
            <Checkbox checked={isGlobalMode} onCheckedChange={handleToggleGlobal} />
            <span className="text-sm text-foreground font-medium">All Links (Global)</span>
          </label>
          {links.length > 0 && (
            <div className="border-t border-border pt-2 space-y-1">
              {links.map((link) => (
                <label key={link.id} className="flex items-center gap-2.5 cursor-pointer py-1 px-1 rounded hover:bg-muted/50 transition-colors">
                  <Checkbox checked={selectedLinkIds.includes(link.id)} onCheckedChange={() => handleToggleLink(link.id)} />
                  <span className="text-sm text-foreground">{link.alias}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        {linksChanged && (
          <Button size="sm" className="mt-2 w-full" onClick={handleSaveLinks} disabled={isUpdatingLinks}>
            {isUpdatingLinks ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : null}
            Save Link Assignment
          </Button>
        )}
      </div>

      {/* Test Webhook */}
      <div>
        <Button
          variant="outline"
          className={`w-full ${
            testResult === 'success' ? 'border-success/30 text-success hover:bg-success/10'
            : testResult === 'error' ? 'border-destructive/30 text-destructive hover:bg-destructive/10'
            : 'border-border'
          }`}
          onClick={handleTestWebhook}
          disabled={isTesting}
        >
          {isTesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            : testResult === 'success' ? <Check className="w-4 h-4 mr-2" />
            : testResult === 'error' ? <Unplug className="w-4 h-4 mr-2" />
            : <Zap className="w-4 h-4 mr-2" />}
          {isTesting ? 'Sending test...' : testResult === 'success' ? 'Test passed!' : testResult === 'error' ? 'Test failed' : 'Send Test Webhook'}
        </Button>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-center">Sends a test lead ($0) to verify connectivity. Hidden from analytics.</p>

        <AnimatePresence>
          {testResult === 'success' && testDetails && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="mt-3 rounded-lg border border-success/20 bg-success/5 p-3 space-y-2 overflow-hidden"
            >
              <div className="flex items-center gap-2 text-xs font-medium text-success">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.15 }} className="w-5 h-5 rounded-full bg-success/15 flex items-center justify-center shrink-0">
                  <motion.div initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.3, delay: 0.3 }}>
                    <Check className="w-3 h-3" />
                  </motion.div>
                </motion.div>
                Webhook received successfully
              </div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25, duration: 0.3 }} className="grid grid-cols-3 gap-2 text-[11px]">
                <div><span className="text-muted-foreground block">Type</span><span className="text-foreground font-medium">{testDetails.type}</span></div>
                <div><span className="text-muted-foreground block">Link</span><span className="text-foreground font-medium truncate block">{testDetails.link}</span></div>
                <div><span className="text-muted-foreground block">Time</span><span className="text-foreground font-medium">{testDetails.timestamp}</span></div>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.25 }}>
                <Button
                  variant="ghost" size="sm"
                  className="w-full mt-1 h-7 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={async () => {
                    setIsDeletingTest(true);
                    try {
                      const { error } = await supabase.from('conversions').delete().eq('is_test', true);
                      if (error) throw error;
                      toast.success('Test data cleaned up');
                      setTestResult(null);
                      setTestDetails(null);
                    } catch { toast.error('Failed to delete test data'); }
                    finally { setIsDeletingTest(false); }
                  }}
                  disabled={isDeletingTest}
                >
                  {isDeletingTest ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Trash2 className="w-3 h-3 mr-1" />}
                  Clean up test data
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Connected At */}
      {dbIntegration.connected_at && (
        <div className="text-xs text-muted-foreground">Connected since: {formatDate(dbIntegration.connected_at)}</div>
      )}

      {/* Disconnect */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive">
            <Unplug className="w-4 h-4 mr-2" /> Disconnect {integration.name}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {integration.name}?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the webhook URL and stop tracking conversions from {integration.name}. You can reconnect anytime.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnect} disabled={isDisconnecting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function IntegrationDetailPanel({
  open,
  onClose,
  mode,
  integration,
  dbIntegration,
  links,
  assignedLinkIds,
  onConfirmConnection,
  onDisconnect,
  onUpdateLinks,
}: IntegrationDetailPanelProps) {
  return (
    <AnimatePresence mode="wait">
      {open && integration && (
        <motion.div
          key={`${integration.id}-${mode}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="h-full overflow-y-auto bg-card p-4"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted/50 border border-border overflow-hidden">
              <img src={integration.logo} alt={integration.name} className="w-6 h-6 object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-foreground">
                {mode === 'connect' ? `Connect ${integration.name}` : `Manage ${integration.name}`}
              </h2>
              <p className="text-xs text-muted-foreground">
                {mode === 'connect'
                  ? 'Follow these simple steps'
                  : dbIntegration?.status === 'connected'
                    ? 'Connected & receiving data'
                    : 'Waiting for first event'}
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          {mode === 'connect' ? (
            <ConnectContent
              integration={integration}
              links={links}
              onConfirmConnection={onConfirmConnection}
              onClose={onClose}
            />
          ) : dbIntegration ? (
            <ManageContent
              integration={integration}
              dbIntegration={dbIntegration}
              links={links}
              assignedLinkIds={assignedLinkIds}
              onDisconnect={onDisconnect}
              onUpdateLinks={onUpdateLinks}
              onClose={onClose}
            />
          ) : null}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
