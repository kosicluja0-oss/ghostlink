import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupportTickets, SupportTicket } from '@/hooks/useSupportTickets';

interface CreateTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ticketTypes: { value: SupportTicket['type']; label: string }[] = [
  { value: 'question', label: 'Otázka' },
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Návrh funkce' },
  { value: 'integration_request', label: 'Žádost o integraci' },
];

const priorityOptions: { value: SupportTicket['priority']; label: string }[] = [
  { value: 'low', label: 'Nízká' },
  { value: 'medium', label: 'Střední' },
  { value: 'high', label: 'Vysoká' },
];

export function CreateTicketModal({ open, onOpenChange }: CreateTicketModalProps) {
  const { createTicket, isCreatingTicket } = useSupportTickets();
  
  const [type, setType] = useState<SupportTicket['type']>('question');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<SupportTicket['priority']>('medium');
  const [platformName, setPlatformName] = useState('');
  const [platformUrl, setPlatformUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createTicket(
      {
        type,
        subject,
        description,
        priority,
        platform_name: type === 'integration_request' ? platformName : undefined,
        platform_url: type === 'integration_request' ? platformUrl : undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          // Reset form
          setType('question');
          setSubject('');
          setDescription('');
          setPriority('medium');
          setPlatformName('');
          setPlatformUrl('');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nový Ticket</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Typ *</Label>
            <Select value={type} onValueChange={(v) => setType(v as SupportTicket['type'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ticketTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priorita</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as SupportTicket['priority'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Předmět *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Stručný popis problému"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Popis *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailní popis vašeho problému nebo požadavku..."
              rows={4}
              required
            />
          </div>

          {type === 'integration_request' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="platformName">Název platformy</Label>
                <Input
                  id="platformName"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  placeholder="např. TikTok Ads, Taboola..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="platformUrl">URL platformy</Label>
                <Input
                  id="platformUrl"
                  value={platformUrl}
                  onChange={(e) => setPlatformUrl(e.target.value)}
                  placeholder="https://..."
                  type="url"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Zrušit
            </Button>
            <Button type="submit" disabled={isCreatingTicket}>
              {isCreatingTicket ? 'Odesílám...' : 'Odeslat'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
