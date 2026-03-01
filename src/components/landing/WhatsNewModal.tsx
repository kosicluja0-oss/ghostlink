import { useState } from 'react';
import { Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';

const entries = [
  {
    version: 'v1.0',
    label: 'Launch',
    date: 'Feb 2026',
    items: [
      'Real-time analytics with millisecond precision',
      'Postback conversion tracking (Leads & Sales)',
      'Geographic insights & device breakdown',
      'Native integrations: Whop, ThriveCart, SamCart & more',
    ],
  },
  {
    version: 'v1.1',
    label: 'Upcoming Features',
    date: '',
    items: [
      'Email notifications on Sales conversions',
      'Refferal system',
      'Advanced link customization & branding',
    ],
  },
];

export function WhatsNewModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs font-semibold h-7 px-3 gap-1.5 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary">
          <Rocket className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">What's New</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Rocket className="h-4 w-4 text-primary" />
            What's New
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Latest updates and upcoming features.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {entries.map((entry) => (
            <div key={entry.version} className="relative pl-6">
              {/* Timeline dot */}
              <div className="absolute left-0 top-1 h-3 w-3 rounded-full border-2 border-primary bg-background" />
              {/* Timeline line */}
              <div className="absolute left-[5px] top-4 bottom-0 w-px bg-border" />

              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-sm font-bold text-primary">{entry.version}</span>
                <span className="text-sm font-medium text-foreground">{entry.label}</span>
                {entry.date && (
                  <span className="text-[10px] text-muted-foreground ml-auto">{entry.date}</span>
                )}
              </div>

              <ul className="space-y-1">
                {entry.items.map((item) => (
                  <li key={item} className="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
                    <span className="text-primary mt-1 shrink-0">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
