import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Filter, Users, Ticket, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { SettingsDrawer } from '@/components/layout/SettingsDrawer';
import { DataIntegrationModal } from '@/components/modals/DataIntegrationModal';
import { TicketCard } from '@/components/support/TicketCard';
import { TicketDetail } from '@/components/support/TicketDetail';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useUserRole } from '@/hooks/useUserRole';
import { useSupportTickets, SupportTicket } from '@/hooks/useSupportTickets';
import { cn } from '@/lib/utils';

export default function AdminSupport() {
  const navigate = useNavigate();
  const { user, signOut, isLoading: isAuthLoading } = useAuth();
  const { profile } = useProfile();
  const { isAdmin, isLoading: isRoleLoading } = useUserRole();
  const { tickets, isLoadingTickets } = useSupportTickets(true);
  
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dataIntegrationOpen, setDataIntegrationOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Redirect non-admins
  useEffect(() => {
    if (!isAuthLoading && !isRoleLoading && !isAdmin) {
      navigate('/support');
    }
  }, [isAdmin, isAuthLoading, isRoleLoading, navigate]);

  // Show loading while checking auth/role
  if (isAuthLoading || isRoleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse text-muted-foreground">Ověřuji oprávnění...</div>
      </div>
    );
  }

  // Don't render if not admin
  if (!isAdmin) {
    return null;
  }

  const filteredTickets = tickets.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    return true;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
  };

  if (selectedTicketId) {
    return (
      <SidebarProvider defaultOpen>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar
            userEmail={user?.email}
            userTier="free"
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenDataIntegration={() => setDataIntegrationOpen(true)}
            onSignOut={signOut}
          />
          <SidebarInset className="flex-1">
            <main className="flex-1 p-6">
              <TicketDetail 
                ticketId={selectedTicketId} 
                isAdmin={true}
                onBack={() => setSelectedTicketId(null)} 
              />
            </main>
          </SidebarInset>
        </div>
        <SettingsDrawer open={settingsOpen} onOpenChange={setSettingsOpen} userTier="free" onChangeTier={() => {}} />
        <DataIntegrationModal open={dataIntegrationOpen} onOpenChange={setDataIntegrationOpen} />
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar
          userEmail={user?.email}
          userTier="free"
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenDataIntegration={() => setDataIntegrationOpen(true)}
          onSignOut={signOut}
        />
          <SidebarInset className="flex-1">
            <main className="flex-1 p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Shield className="w-6 h-6 text-primary" />
                  Admin Support
                </h1>
                <p className="text-muted-foreground mt-1">
                  Správa všech support ticketů
                </p>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary">
                <Shield className="w-3 h-3 mr-1" />
                Admin View
              </Badge>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Ticket className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-sm text-muted-foreground">Celkem</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-yellow-500/10">
                    <Clock className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.open}</p>
                    <p className="text-sm text-muted-foreground">Čekajících</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.inProgress}</p>
                    <p className="text-sm text-muted-foreground">V řešení</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-green-500/10">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.resolved}</p>
                    <p className="text-sm text-muted-foreground">Vyřešených</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tickets List */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <CardTitle className="text-lg">Všechny Tickety</CardTitle>
                  <div className="flex items-center gap-3">
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Typ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Všechny typy</SelectItem>
                        <SelectItem value="question">Otázky</SelectItem>
                        <SelectItem value="bug">Bug Reports</SelectItem>
                        <SelectItem value="feature">Návrhy</SelectItem>
                        <SelectItem value="integration_request">Integrace</SelectItem>
                      </SelectContent>
                    </Select>
                    <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                      <TabsList>
                        <TabsTrigger value="all">Všechny</TabsTrigger>
                        <TabsTrigger value="open">Otevřené</TabsTrigger>
                        <TabsTrigger value="in_progress">V řešení</TabsTrigger>
                        <TabsTrigger value="resolved">Vyřešené</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingTickets ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Načítám tickety...
                  </div>
                ) : filteredTickets.length === 0 ? (
                  <div className="text-center py-12">
                    <Ticket className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Žádné tickety v této kategorii
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTickets.map((ticket) => (
                      <TicketCard
                        key={ticket.id}
                        ticket={ticket}
                        onClick={() => setSelectedTicketId(ticket.id)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </SidebarInset>
      </div>

      <SettingsDrawer open={settingsOpen} onOpenChange={setSettingsOpen} userTier="free" onChangeTier={() => {}} />
      <DataIntegrationModal open={dataIntegrationOpen} onOpenChange={setDataIntegrationOpen} />
    </SidebarProvider>
  );
}
