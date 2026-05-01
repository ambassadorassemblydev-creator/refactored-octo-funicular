import * as React from "react";
import { Users, Calendar, CheckCircle2, XCircle, Search, Download, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";
import { motion } from "motion/react";

export default function EventRegistrations() {
  const [events, setEvents] = React.useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = React.useState<string>("all");
  const [registrations, setRegistrations] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [stats, setStats] = React.useState({ total: 0, confirmed: 0, checkedIn: 0 });

  // Fetch events list for the selector
  const fetchEvents = async () => {
    const { data } = await supabase
      .from("events")
      .select("id, title, start_date, max_attendees, registrations:event_registrations(count)")
      .order("start_date", { ascending: false });
    setEvents(data || []);
  };

  // Fetch registrations
  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("event_registrations")
        .select(`
          *,
          events ( id, title, start_date, location_name ),
          profiles ( first_name, last_name, title, avatar_url, phone, email )
        `)
        .order("created_at", { ascending: false });

      if (selectedEventId !== "all") {
        query = query.eq("event_id", selectedEventId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const filtered = (data || []).filter((r: any) => {
        if (!search) return true;
        const name = r.profiles
          ? `${r.profiles.first_name} ${r.profiles.last_name}`.toLowerCase()
          : (r.guest_name || "").toLowerCase();
        return name.includes(search.toLowerCase()) || (r.guest_email || "").toLowerCase().includes(search.toLowerCase());
      });

      setRegistrations(filtered);
      setStats({
        total: filtered.length,
        confirmed: filtered.filter((r: any) => r.is_confirmed).length,
        checkedIn: filtered.filter((r: any) => r.checked_in).length,
      });
    } catch (err: any) {
      toast.error("Failed to load registrations: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { fetchEvents(); }, []);
  React.useEffect(() => { fetchRegistrations(); }, [selectedEventId, search]);

  const handleCheckIn = async (id: string) => {
    const { error } = await supabase
      .from("event_registrations")
      .update({ checked_in: true, checked_in_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Attendee checked in!");
    fetchRegistrations();
  };

  const handleExport = () => {
    const csv = [
      ["Name", "Email", "Phone", "Event", "Registered At", "Confirmed", "Checked In", "Guests"].join(","),
      ...registrations.map(r => {
        const name = r.profiles
          ? `${r.profiles.title || ""} ${r.profiles.first_name || ""} ${r.profiles.last_name || ""}`.trim()
          : r.guest_name || "Guest";
        const email = r.profiles?.email || r.guest_email || "";
        const phone = r.profiles?.phone || r.guest_phone || "";
        const event = r.events?.title || "";
        return [name, email, phone, event, new Date(r.created_at).toLocaleDateString(), r.is_confirmed ? "Yes" : "No", r.checked_in ? "Yes" : "No", r.number_of_guests || 1].join(",");
      })
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `event-registrations-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to CSV");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Event Registrations</h1>
          <p className="text-muted-foreground">See who has signed up for church events. Check in attendees on the day.</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Registrations", value: stats.total, icon: Users, color: "text-blue-500" },
          { label: "Confirmed", value: stats.confirmed, icon: CheckCircle2, color: "text-emerald-500" },
          { label: "Checked In", value: stats.checkedIn, icon: UserCheck, color: "text-primary" },
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-card/50">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-10 h-11 bg-card/50 border-none shadow-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={selectedEventId} onValueChange={setSelectedEventId}>
          <SelectTrigger className="w-full md:w-64 h-11 bg-card/50 border-none shadow-sm">
            <SelectValue placeholder="Filter by event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {events.map(e => (
              <SelectItem key={e.id} value={e.id}>
                {e.title} ({e.registrations?.[0]?.count || 0} registered)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Registrations Table */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : registrations.length === 0 ? (
        <div className="py-20 text-center space-y-4 bg-muted/20 rounded-3xl border-2 border-dashed">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
            <Users className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="font-bold text-xl">No registrations found</h3>
          <p className="text-muted-foreground">No one has signed up yet for this event.</p>
        </div>
      ) : (
        <Card className="border-none shadow-sm bg-card/50 overflow-hidden">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              {registrations.length} Registration{registrations.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {registrations.map((reg, i) => {
                const profile = reg.profiles;
                const name = profile
                  ? `${profile.title || ""} ${profile.first_name || ""} ${profile.last_name || ""}`.trim()
                  : reg.guest_name || "Guest";
                const email = profile?.email || reg.guest_email || "—";
                const phone = profile?.phone || reg.guest_phone || "—";
                const eventName = reg.events?.title || "—";
                const eventDate = reg.events?.start_date
                  ? new Date(reg.events.start_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                  : "—";

                return (
                  <motion.div
                    key={reg.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-muted/20 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary overflow-hidden">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        name.charAt(0).toUpperCase()
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{name}</p>
                      <p className="text-xs text-muted-foreground truncate">{email} {phone !== "—" ? `• ${phone}` : ""}</p>
                    </div>

                    {/* Event */}
                    <div className="hidden md:flex flex-col items-end text-right mr-4">
                      <p className="text-xs font-semibold truncate max-w-[180px]">{eventName}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {eventDate}
                      </p>
                    </div>

                    {/* Guests */}
                    <div className="hidden lg:block text-xs text-muted-foreground font-medium mr-4">
                      +{(reg.number_of_guests || 1)} guest{(reg.number_of_guests || 1) > 1 ? "s" : ""}
                    </div>

                    {/* Status badges */}
                    <div className="flex items-center gap-2 shrink-0">
                      {reg.checked_in ? (
                        <Badge variant="outline" className="text-[9px] h-5 gap-1 border-emerald-500/20 text-emerald-600 bg-emerald-500/5">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Checked In
                        </Badge>
                      ) : reg.is_confirmed ? (
                        <Badge variant="outline" className="text-[9px] h-5 gap-1 border-blue-500/20 text-blue-600 bg-blue-500/5">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Confirmed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] h-5 uppercase tracking-tighter text-muted-foreground">
                          Pending
                        </Badge>
                      )}

                      {!reg.checked_in && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-3"
                          onClick={() => handleCheckIn(reg.id)}
                        >
                          Check In
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
