import * as React from "react";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Plus,
  Search,
  Filter,
  ChevronRight,
  Video,
  Globe,
  MoreVertical,
  Edit2,
  Trash2,
  Share2,
  CheckCircle2,
  ClipboardList,
  X
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/src/lib/supabase";
import EventForm from "./forms/EventForm";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";
import { auditRepo } from "@/src/lib/audit";

import { useAuth } from "@/src/contexts/AuthContext";

export default function Events() {
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [tab, setTab] = React.useState<"upcoming" | "past">("upcoming");
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<any>(null);
  const [viewingRegistrations, setViewingRegistrations] = React.useState<any>(null);
  const [registrations, setRegistrations] = React.useState<any[]>([]);
  const [regsLoading, setRegsLoading] = React.useState(false);

  const fetchEvents = async (retries = 3) => {
    setLoading(true);
    try {
      let query = supabase
        .from('events')
        .select('*, event_registrations(count)');

      if (tab === "upcoming") {
        query = query.gte('start_date', new Date().toISOString()).order('start_date', { ascending: true });
      } else {
        query = query.lt('start_date', new Date().toISOString()).order('start_date', { ascending: false });
      }

      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      if (error?.message?.includes("Lock") && retries > 0) {
        setTimeout(() => fetchEvents(retries - 1), 500);
        return;
      }
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!authLoading) {
      const debounce = setTimeout(fetchEvents, 500);
      return () => clearTimeout(debounce);
    }
  }, [search, tab, authLoading]);

  const fetchRegistrations = async (eventId: string) => {
    setRegsLoading(true);
    const { data } = await supabase
      .from('event_registrations')
      .select('*, profiles:user_id(first_name, last_name, email, avatar_url, role_claim, department_claim)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });
    setRegistrations(data || []);
    setRegsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;

      // Log delete action
      await auditRepo.logAction({
        admin_id: user?.id || 'unknown',
        action: 'DELETE',
        table_name: 'events',
        record_id: id
      });

      toast.success("Event deleted successfully");
      fetchEvents();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Upcoming Events</h1>
          <p className="text-muted-foreground">Stay connected with our church calendar and special activities.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" />
            Create Event
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>Fill in the details for the new church event.</DialogDescription>
            </DialogHeader>
            <EventForm 
              onSuccess={() => {
                setIsAddOpen(false);
                fetchEvents();
              }} 
              onCancel={() => setIsAddOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search events..." 
            className="pl-10 h-11 bg-card/50 border-none shadow-sm focus-visible:ring-primary/20" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-2xl">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsCalendarOpen(true)}
            className="rounded-xl text-[10px] font-bold uppercase tracking-widest h-9 px-6"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Calendar
          </Button>
          <Button 
            variant={tab === 'upcoming' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setTab('upcoming')}
            className="rounded-xl text-[10px] font-bold uppercase tracking-widest h-9 px-6"
          >
            Upcoming
          </Button>
          <Button 
            variant={tab === 'past' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setTab('past')}
            className="rounded-xl text-[10px] font-bold uppercase tracking-widest h-9 px-6"
          >
            Past
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="h-64 animate-pulse bg-muted/50 rounded-2xl border-none" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="py-20 text-center space-y-4 bg-muted/20 rounded-3xl border-2 border-dashed">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
            <Calendar className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-xl">No events found</h3>
            <p className="text-muted-foreground">Try adjusting your search or create a new event.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="overflow-hidden border-none shadow-md bg-card/50 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 group flex flex-col md:flex-row h-full rounded-2xl relative">
                <div className="absolute top-4 right-4 z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-background/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <MoreVertical className="w-4 h-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Event Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setEditingEvent(event)}>
                        <Edit2 className="w-4 h-4 mr-2" /> Edit Event
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setViewingRegistrations(event);
                        fetchRegistrations(event.id);
                      }}>
                        <ClipboardList className="w-4 h-4 mr-2" /> View Registrations
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        const url = `${window.location.origin}/events/${event.id}`;
                        navigator.clipboard.writeText(url);
                        toast.success("Event link copied to clipboard");
                        
                        auditRepo.logAction({
                          admin_id: user?.id || 'unknown',
                          action: 'UPDATE',
                          table_name: 'events',
                          record_id: event.id,
                          new_values: { action: 'share_event' }
                        });
                      }}>
                        <Share2 className="w-4 h-4 mr-2" /> Share Event
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-destructive-foreground" onClick={() => handleDelete(event.id)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete Event
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="relative w-full md:w-48 lg:w-64 h-48 md:h-auto overflow-hidden shrink-0">
                  <img 
                    src={event.cover_image_url || `https://picsum.photos/seed/${event.id}/800/400`} 
                    alt={event.title}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden" />
                  <div className="absolute bottom-3 left-3 md:top-3 md:bottom-auto">
                    <Badge className="bg-primary/90 hover:bg-primary border-none shadow-lg">
                      {event.category || 'Event'}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-col flex-1">
                  <CardHeader className="p-6 pb-2">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest">
                        <Calendar className="w-3 h-3" />
                        {event.start_date ? new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                      </div>
                      {event.status === 'published' ? (
                        <Badge variant="outline" className="text-[9px] h-5 gap-1 border-emerald-500/20 text-emerald-600 bg-emerald-500/5 uppercase tracking-tighter">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Live
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] h-5 uppercase tracking-tighter">{event.status}</Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors leading-tight">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                      {event.description || 'Join us for this special church event at Ambassadors Assembly.'}
                    </p>
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2.5 text-xs font-medium text-muted-foreground">
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                        {event.start_date ? new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                      </div>
                      <div className="flex items-center gap-2.5 text-xs font-medium text-muted-foreground">
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <MapPin className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate">{event.location_name || 'Ambassadors Assembly'}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs font-medium text-muted-foreground">
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Users className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col">
                          <span>{(event.event_registrations?.[0]?.count ?? event.current_attendees) || 0} Registered</span>
                          {event.max_attendees > 0 && (
                            <div className="w-24 h-1 bg-muted rounded-full mt-1 overflow-hidden">
                              <div 
                                className="h-full bg-primary" 
                                style={{ width: `${Math.min(100, ((event.current_attendees || 0) / event.max_attendees) * 100)}%` }} 
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-6 pt-0 border-t bg-muted/5 mt-auto">
                    <Button variant="ghost" className="w-full justify-between group/btn px-0 hover:bg-transparent" onClick={() => { setViewingRegistrations(event); fetchRegistrations(event.id); }}>
                      <span className="text-xs font-bold uppercase tracking-widest">View Registrations ({(event.event_registrations?.[0]?.count ?? event.current_attendees) || 0})</span>
                      <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </CardFooter>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>Update the details for {editingEvent?.title}.</DialogDescription>
          </DialogHeader>
          {editingEvent && (
            <EventForm 
              initialData={editingEvent}
              onSuccess={() => {
                setEditingEvent(null);
                fetchEvents();
              }} 
              onCancel={() => setEditingEvent(null)} 
            />
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Calendar</DialogTitle>
            <DialogDescription>A chronological view of all church events.</DialogDescription>
          </DialogHeader>
          <div className="space-y-8 py-4">
            {Object.entries(
              events.reduce((acc: any, event) => {
                const month = new Date(event.start_date).toLocaleString('default', { month: 'long', year: 'numeric' });
                if (!acc[month]) acc[month] = [];
                acc[month].push(event);
                return acc;
              }, {})
            ).map(([month, monthEvents]: [string, any]) => (
              <div key={month} className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary border-b pb-2">{month}</h3>
                <div className="grid gap-2">
                  {monthEvents.map((event: any) => (
                    <div key={event.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-background flex flex-col items-center justify-center text-primary shadow-sm">
                          <span className="text-[10px] font-bold leading-none">{new Date(event.start_date).getDate()}</span>
                          <span className="text-[8px] font-medium uppercase">{new Date(event.start_date).toLocaleString('default', { weekday: 'short' })}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold">{event.title}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {event.location_name}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[8px] uppercase tracking-tighter">{event.category || 'General'}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Registrations Dialog */}
      <Dialog open={!!viewingRegistrations} onOpenChange={(open) => !open && setViewingRegistrations(null)}>
        <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Registrations — {viewingRegistrations?.title}
            </DialogTitle>
            <DialogDescription>
              {registrations.length} people registered for this event.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {regsLoading ? (
              [1,2,3].map(i => <div key={i} className="h-14 animate-pulse bg-muted/40 rounded-xl" />)
            ) : registrations.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">No registrations yet</p>
              </div>
            ) : registrations.map((reg: any) => (
              <div key={reg.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 font-bold text-primary text-sm">
                  {(reg.profiles?.first_name || reg.guest_name || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">
                    {reg.profiles ? `${reg.profiles.first_name} ${reg.profiles.last_name}` : reg.guest_name || 'Guest'}
                  </p>
                  <p className="text-xs text-muted-foreground">{reg.profiles?.email || reg.guest_email}</p>
                  <div className="flex gap-1 mt-1">
                    {reg.profiles?.role_claim && <Badge className="text-[8px] h-3 px-1.5 bg-primary/5 text-primary border-none">{reg.profiles.role_claim}</Badge>}
                    {reg.profiles?.department_claim && <Badge className="text-[8px] h-3 px-1.5 bg-purple-500/5 text-purple-600 border-none">{reg.profiles.department_claim}</Badge>}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  {reg.checked_in ? (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">Checked In</span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">Registered</span>
                  )}
                  <p className="text-[10px] text-muted-foreground">{reg.created_at ? new Date(reg.created_at).toLocaleDateString() : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
