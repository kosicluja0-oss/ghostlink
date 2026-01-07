import { LinkCard } from './LinkCard';
import type { GhostLink, TierType } from '@/types';

interface LinkKanbanProps {
  links: GhostLink[];
  userTier: TierType;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  activeLinkId?: string | null;
  onLinkSelect?: (linkId: string) => void;
}

export function LinkKanban({ 
  links, 
  userTier, 
  onArchive, 
  onRestore,
  activeLinkId,
  onLinkSelect
}: LinkKanbanProps) {
  const activeLinks = links.filter(link => link.status === 'active');
  const archivedLinks = links.filter(link => link.status === 'archived');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Active Links Column */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Active Links</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
              {activeLinks.length}
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          {activeLinks.length > 0 ? (
            activeLinks.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                userTier={userTier}
                onArchive={onArchive}
                onRestore={onRestore}
                isSelected={activeLinkId === link.id}
                onSelect={onLinkSelect}
              />
            ))
          ) : (
            <div className="text-center py-10 border border-dashed border-border rounded-lg">
              <p className="text-sm text-muted-foreground">No active links yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Archived Links Column */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Archived</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
              {archivedLinks.length}
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          {archivedLinks.length > 0 ? (
            archivedLinks.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                userTier={userTier}
                onArchive={onArchive}
                onRestore={onRestore}
                isSelected={activeLinkId === link.id}
                onSelect={onLinkSelect}
              />
            ))
          ) : (
            <div className="text-center py-10 border border-dashed border-border rounded-lg">
              <p className="text-sm text-muted-foreground">No archived links</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
