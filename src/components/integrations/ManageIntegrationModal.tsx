import { useState, useEffect } from 'react';
import { Copy, Check, Unplug, RefreshCw, Clock, Zap, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { Checkbox } from '@/components/ui/checkbox';
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
  assignedLinkIds: string[];
  onDisconnect: (serviceId: string) => Promise<void>;
  onUpdateLinks: (serviceId: string, linkIds: string[]) => Promise<void>;
}

export function ManageIntegrationModal({
  open,
  onOpenChange,
  integration,
  dbIntegration,
  links,
  assignedLinkIds,
  onDisconnect,
  onUpdateLinks,
}: ManageIntegrationModalProps) {
  const [copied, setCopied] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isUpdatingLinks, setIsUpdatingLinks] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDeletingTest, setIsDeletingTest] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testDetails, setTestDetails] = useState<{ type: string; link: string; timestamp: string } | null>(null);
  const [selectedLinkIds, setSelectedLinkIds] = useState<string[]>([]);

  // Sync selected links when modal opens or assignedLinkIds change
  useEffect(() => {
    setSelectedLinkIds(assignedLinkIds);
  }, [assignedLinkIds, open]);

  if (!integration || !dbIntegration) return null;

  const webhookUrl = dbIntegration.webhook_url || '';
  const isGlobalMode = selectedLinkIds.length === 0;

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

  const handleToggleLink = (linkId: string) => {
    setSelectedLinkIds((prev) =>
      prev.includes(linkId) ? prev.filter((id) => id !== linkId) : [...prev, linkId]
    );
  };

  const handleToggleGlobal = () => {
    setSelectedLinkIds([]);
  };

  const handleSaveLinks = async () => {
    setIsUpdatingLinks(true);
    try {
      await onUpdateLinks(integration.id, selectedLinkIds);
      toast.success('Link assignment updated');
    } catch {
      toast.error('Failed to update links');
    } finally {
      setIsUpdatingLinks(false);
    }
  };

  // Check if link selection changed
  const linksChanged =
    JSON.stringify([...selectedLinkIds].sort()) !== JSON.stringify([...assignedLinkIds].sort());

  const handleTestWebhook = async () => {
    if (!webhookUrl) return;
    setIsTesting(true);
    setTestResult(null);
    setTestDetails(null);
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
        // Determine which link was attributed
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
        const data = await res.json().catch(() => ({}));
        setTestResult('error');
        toast.error(`Webhook test failed: ${(data as Record<string, string>).message || res.statusText}`);
      }
    } catch {
      setTestResult('error');
      toast.error('Failed to reach webhook endpoint');
    } finally {
      setIsTesting(false);
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

          {/* Assigned Links (Multi-select) */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Assigned Links</label>
            <div className="bg-background rounded-lg border border-border p-3 space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
              {/* Global option */}
              <label className="flex items-center gap-2.5 cursor-pointer py-1 px-1 rounded hover:bg-muted/50 transition-colors">
                <Checkbox
                  checked={isGlobalMode}
                  onCheckedChange={handleToggleGlobal}
                />
                <span className="text-sm text-foreground font-medium">All Links (Global)</span>
              </label>
              {links.length > 0 && (
                <div className="border-t border-border pt-2 space-y-1">
                  {links.map((link) => (
                    <label
                      key={link.id}
                      className="flex items-center gap-2.5 cursor-pointer py-1 px-1 rounded hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedLinkIds.includes(link.id)}
                        onCheckedChange={() => handleToggleLink(link.id)}
                      />
                      <span className="text-sm text-foreground">{link.alias}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {linksChanged && (
              <Button
                size="sm"
                className="mt-2 w-full"
                onClick={handleSaveLinks}
                disabled={isUpdatingLinks}
              >
                {isUpdatingLinks ? (
                  <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                ) : null}
                Save Link Assignment
              </Button>
            )}
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
              Sends a test lead ($0) to verify connectivity. Hidden from analytics.
            </p>

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
                  {/* Animated checkmark */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.15 }}
                    className="w-5 h-5 rounded-full bg-success/15 flex items-center justify-center shrink-0"
                  >
                    <motion.div
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                    >
                      <Check className="w-3 h-3" />
                    </motion.div>
                  </motion.div>
                  Webhook received successfully
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                  className="grid grid-cols-3 gap-2 text-[11px]"
                >
                  <div>
                    <span className="text-muted-foreground block">Type</span>
                    <span className="text-foreground font-medium">{testDetails.type}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Link</span>
                    <span className="text-foreground font-medium truncate block">{testDetails.link}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Time</span>
                    <span className="text-foreground font-medium">{testDetails.timestamp}</span>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.25 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-1 h-7 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={async () => {
                      setIsDeletingTest(true);
                      try {
                        const { error } = await supabase
                          .from('conversions')
                          .delete()
                          .eq('is_test', true);
                        if (error) throw error;
                        toast.success('Test data cleaned up');
                        setTestResult(null);
                        setTestDetails(null);
                      } catch {
                        toast.error('Failed to delete test data');
                      } finally {
                        setIsDeletingTest(false);
                      }
                    }}
                    disabled={isDeletingTest}
                  >
                    {isDeletingTest ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3 mr-1" />
                    )}
                    Clean up test data
                  </Button>
                </motion.div>
              </motion.div>
            )}
            </AnimatePresence>
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
