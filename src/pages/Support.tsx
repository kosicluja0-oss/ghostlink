import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, HelpCircle, Filter, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { SettingsDrawer } from '@/components/layout/SettingsDrawer';
import { DataIntegrationModal } from '@/components/modals/DataIntegrationModal';
import { CreateTicketModal } from '@/components/support/CreateTicketModal';
import { TicketCard } from '@/components/support/TicketCard';
import { TicketDetail } from '@/components/support/TicketDetail';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useSupportTickets, SupportTicket } from '@/hooks/useSupportTickets';
import { useUserRole } from '@/hooks/useUserRole';
import { useOpenTicketsCount } from '@/hooks/useOpenTicketsCount';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { cn } from '@/lib/utils';
export default function Support() {
  const {
    ticketId
  } = useParams();
  const navigate = useNavigate();
  const {
    user,
    signOut
  } = useAuth();
  const {
    profile
  } = useProfile();
  const {
    tickets,
    isLoadingTickets
  } = useSupportTickets();
  const {
    isAdmin
  } = useUserRole();
  const openTicketsCount = useOpenTicketsCount();
  const { getUnreadCountForTicket } = useUnreadMessages();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dataIntegrationOpen, setDataIntegrationOpen] = useState(false);
  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const filteredTickets = statusFilter === 'all' ? tickets : tickets.filter(t => t.status === statusFilter);
  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
  if (ticketId) {
    return <SidebarProvider defaultOpen>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar userEmail={user?.email} userTier="free" onOpenSettings={() => setSettingsOpen(true)} onOpenDataIntegration={() => setDataIntegrationOpen(true)} onSignOut={signOut} openTicketsCount={openTicketsCount} />
          <SidebarInset className="flex-1">
          <main className="flex-1 p-6">
            <TicketDetail ticketId={ticketId} isAdmin={isAdmin} onBack={() => navigate('/support')} />
          </main>
        </SidebarInset>
      </div>
      <SettingsDrawer open={settingsOpen} onOpenChange={setSettingsOpen} userTier="free" onChangeTier={() => {}} />
      <DataIntegrationModal open={dataIntegrationOpen} onOpenChange={setDataIntegrationOpen} />
      </SidebarProvider>;
  }
  return <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar userEmail={user?.email} userTier="free" onOpenSettings={() => setSettingsOpen(true)} onOpenDataIntegration={() => setDataIntegrationOpen(true)} onSignOut={signOut} openTicketsCount={openTicketsCount} />
        <SidebarInset className="flex-1">
          <main className="flex-1 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <HelpCircle className="w-6 h-6 text-primary" />
                  Support
                </h1>
                <p className="text-muted-foreground mt-1">
                  ​Do you have questions or problems? We are here for you.
                </p>
              </div>
              <Button onClick={() => setCreateTicketOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Ticket
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Ticket className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{tickets.length}</p>
                    <p className="text-sm text-muted-foreground">Total Tickets</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-yellow-500/10">
                    <Ticket className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{openTickets}</p>
                    <p className="text-sm text-muted-foreground">Open</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-green-500/10">
                    <Ticket className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{resolvedTickets}</p>
                    <p className="text-sm text-muted-foreground">Resolved</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tickets List */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">My Tickets</CardTitle>
                  <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                    <TabsList>
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="open">Open</TabsTrigger>
                      <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                      <TabsTrigger value="resolved">Resolved</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingTickets ? <div className="text-center py-8 text-muted-foreground">
                    Loading tickets...
                  </div> : filteredTickets.length === 0 ? <div className="text-center py-12">
                    <HelpCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      {statusFilter === 'all' ? "You don't have any tickets yet" : 'No tickets in this category'}
                    </p>
                    <Button variant="outline" onClick={() => setCreateTicketOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create first ticket
                    </Button>
                  </div> : <div className="space-y-3">
                    {filteredTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} onClick={() => navigate(`/support/${ticket.id}`)} unreadCount={getUnreadCountForTicket(ticket.id)} />)}
                  </div>}
              </CardContent>
            </Card>
          </main>
        </SidebarInset>
      </div>

      <SettingsDrawer open={settingsOpen} onOpenChange={setSettingsOpen} userTier="free" onChangeTier={() => {}} />
      <DataIntegrationModal open={dataIntegrationOpen} onOpenChange={setDataIntegrationOpen} />
      <CreateTicketModal open={createTicketOpen} onOpenChange={setCreateTicketOpen} />
    </SidebarProvider>;
}