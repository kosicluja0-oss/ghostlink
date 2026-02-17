import { useState } from 'react';
import { Copy, Check, Unplug, RefreshCw, Clock, Zap, Loader2 } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import type { Integration } from './IntegrationCard';
import type { UserIntegration } from '@/hooks/useIntegrations';

interface Link {
  id: string;
  alias: string;
}

interface ManageIntegrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration: Integration | null;
  dbIntegration: UserIntegration | undefined;
  links: Link[];
  onDisconnect: (serviceId: string) => Promise<void>;
  onUpdateLink: (serviceId: string, linkId: string | null) => Promise<void>;
}

export function ManageIntegrationModal({
  open,
  onOpenChange,
  integration,
  dbIntegration,
  links,
  onDisconnect,
  onUpdateLink,
}: ManageIntegrationModalProps) {
  const [copied, setCopied] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isUpdatingLink, setIsUpdatingLink] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  if (!integration || !dbIntegration) return null;

  const webhookUrl = dbIntegration.webhook_url || '';
  const currentLinkId = dbIntegration.link_id || 'all';

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

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await onDisconnect(integration.id);
      toast.success(`${integration.name} disconnected`);
      onOpenChange(false);
    } catch {
      toast.error('Failed to disconnect');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleLinkChange = async (value: string) => {
    setIsUpdatingLink(true);
    try {
      await onUpdateLink(integration.id, value === 'all' ? null : value);
      toast.success('Link assignment updated');
    } catch {
      toast.error('Failed to update link');
    } finally {
      setIsUpdatingLink(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'lead',
          value: 0,
          event: 'test',
          source: 'ghost_link_test',
        }),
      });
      if (res.ok) {
        setTestResult('success');
        toast.success('Test webhook sent successfully! Check your dashboard for the test lead.');
      } else {
        const data = await res.json().catch(() => ({}));
        setTestResult('error');
        toast.error(`Webhook test failed: ${(data as Record<string, string>).message || res.statusText}`);
      }
    } catch {
      setTestResult('error');
      toast.error('Failed to reach webhook endpoint');
    } finally {
      setIsTesting(false);
      setTimeout(() => setTestResult(null), 4000);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              <DialogTitle className="text-foreground">Manage {integration.name}</DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs">
                {dbIntegration.status === 'connected' ? 'Connected & receiving data' : 'Waiting for first event'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
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
              Last verified: {formatDate(dbIntegration.last_verified_at)}
            </div>
          </div>

          {/* Webhook URL */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Webhook URL</label>
            <div className="relative">
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
          </div>

          {/* Assigned Link */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Assigned Link</label>
            <Select
              value={currentLinkId}
              onValueChange={handleLinkChange}
              disabled={isUpdatingLink}
            >
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Select a link" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All Links (Global)</SelectItem>
                {links.map((link) => (
                  <SelectItem key={link.id} value={link.id}>
                    {link.alias}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Test Webhook */}
          <div>
            <Button
              variant="outline"
              className={`w-full ${
                testResult === 'success'
                  ? 'border-success/30 text-success hover:bg-success/10'
                  : testResult === 'error'
                  ? 'border-destructive/30 text-destructive hover:bg-destructive/10'
                  : 'border-border'
              }`}
              onClick={handleTestWebhook}
              disabled={isTesting}
            >
              {isTesting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : testResult === 'success' ? (
                <Check className="w-4 h-4 mr-2" />
              ) : testResult === 'error' ? (
                <Unplug className="w-4 h-4 mr-2" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              {isTesting
                ? 'Sending test...'
                : testResult === 'success'
                ? 'Test passed!'
                : testResult === 'error'
                ? 'Test failed'
                : 'Send Test Webhook'}
            </Button>
            <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
              Sends a test lead (value $0) to verify connectivity
            </p>
          </div>

          {/* Connected At */}
          {dbIntegration.connected_at && (
            <div className="text-xs text-muted-foreground">
              Connected since: {formatDate(dbIntegration.connected_at)}
            </div>
          )}
          {/* Disconnect */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
              >
                <Unplug className="w-4 h-4 mr-2" />
                Disconnect {integration.name}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect {integration.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove the webhook URL and stop tracking conversions from {integration.name}. 
                  You can reconnect anytime — a new webhook URL will be generated.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-muted border-border">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DialogContent>
    </Dialog>
  );
}
