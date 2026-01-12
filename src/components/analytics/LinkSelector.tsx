import { useState, useMemo } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, Plus, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GhostLink } from '@/types';

interface LinkSelectorProps {
  links: GhostLink[];
  selectedLinkIds: string[];
  onToggleLink: (linkId: string) => void;
}

export function LinkSelector({ links, selectedLinkIds, onToggleLink }: LinkSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const activeLinks = useMemo(() => 
    links.filter(link => link.status === 'active'),
    [links]
  );

  const filteredLinks = useMemo(() => {
    if (!search) return activeLinks;
    const lowerSearch = search.toLowerCase();
    return activeLinks.filter(link => 
      link.alias.toLowerCase().includes(lowerSearch) ||
      link.targetUrl.toLowerCase().includes(lowerSearch)
    );
  }, [activeLinks, search]);

  const isGlobal = selectedLinkIds.length === 0;

  return (
    <div className="space-y-2">
      {/* Current state display */}
      <div className="flex flex-wrap gap-1.5">
        {isGlobal ? (
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 border border-primary/20">
            <Globe className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-medium text-primary">Global (All Links)</span>
          </div>
        ) : (
          selectedLinkIds.map(linkId => {
            const link = links.find(l => l.id === linkId);
            if (!link) return null;
            return (
              <button
                key={linkId}
                onClick={() => onToggleLink(linkId)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/50 border border-border/50 hover:bg-destructive/10 hover:border-destructive/30 transition-colors group"
              >
                <span className="text-[10px] font-medium text-foreground truncate max-w-[100px]">
                  {link.alias}
                </span>
                <span className="text-[10px] text-muted-foreground group-hover:text-destructive">×</span>
              </button>
            );
          })
        )}
      </div>

      {/* Add link button with command palette */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-dashed border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-primary">
            <Plus className="w-3 h-3" />
            <span className="text-[10px] font-medium">Connect Link</span>
          </button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[240px] p-0 bg-card/95 backdrop-blur-md" 
          align="start"
          side="bottom"
        >
          <Command className="bg-transparent">
            <CommandInput 
              placeholder="Search links..." 
              value={search}
              onValueChange={setSearch}
              className="h-9 text-sm"
            />
            <CommandList className="max-h-[200px]">
              <CommandEmpty className="py-3 text-center text-xs text-muted-foreground">
                No links found.
              </CommandEmpty>
              <CommandGroup>
                {filteredLinks.map(link => {
                  const isSelected = selectedLinkIds.includes(link.id);
                  return (
                    <CommandItem
                      key={link.id}
                      value={link.alias}
                      onSelect={() => {
                        onToggleLink(link.id);
                        setSearch('');
                      }}
                      className={cn(
                        "flex items-center gap-2 cursor-pointer px-2 py-1.5",
                        isSelected && "bg-primary/15"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                        isSelected 
                          ? "bg-primary border-primary" 
                          : "border-muted-foreground/40 bg-transparent"
                      )}>
                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {link.alias}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {new URL(link.targetUrl).hostname}
                        </p>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
          <div className="border-t border-border/30 px-2 py-1.5">
            <span className="text-[9px] text-muted-foreground">
              {selectedLinkIds.length === 0 
                ? 'Select links or leave empty for global' 
                : `${selectedLinkIds.length} link${selectedLinkIds.length > 1 ? 's' : ''} selected`
              }
            </span>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
