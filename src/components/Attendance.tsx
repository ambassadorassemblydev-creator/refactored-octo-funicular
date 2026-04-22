import * as React from "react";
import { 
  Users, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Download,
  Filter,
  Save,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";

interface AttendanceEvent {
  id: string;
  title: string;
  start_date: string;
}

interface AttendanceProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url?: string | null;
  member_id?: string | null;
}

export default function Attendance() {
  const [events, setEvents] = React.useState<AttendanceEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = React.useState<string>("");
  const [members, setMembers] = React.useState<AttendanceProfile[]>([]);
  const [attendance, setAttendance] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    fetchEvents();
  }, []);

  React.useEffect(() => {
    if (selectedEvent) {
      fetchMembersAndAttendance(selectedEvent);
    } else {
      setMembers([]);
      setAttendance({});
    }
  }, [selectedEvent]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, start_date')
        .order('start_date', { ascending: false })
        .limit(20);

      if (error) throw error;
      setEvents(data || []);
      if (data && data.length > 0) {
        setSelectedEvent(data[0].id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load events");
      setLoading(false);
    }
  };

  const fetchMembersAndAttendance = async (eventId: string) => {
    setLoading(true);
    try {
      // Fetch all active members
      const { data: membersData, error: membersError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, member_id')
        .eq('status', 'active')
        .order('last_name');

      if (membersError) throw membersError;

      const event = events.find(e => e.id === eventId);
      if (!event) return;

      // Fetch existing attendance for this event
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('user_id, attendance')
        .eq('service_date', event.start_date.split('T')[0])
        .eq('service_name', event.title);

      if (attendanceError) throw attendanceError;

      const attendanceMap: Record<string, string> = {};
      attendanceData?.forEach(record => {
        if (record.user_id && record.attendance) {
          attendanceMap[record.user_id] = record.attendance;
        }
      });

      setMembers(membersData || []);
      setAttendance(attendanceMap);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      toast.error("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (memberId: string, status: string) => {
    setAttendance(prev => ({
      ...prev,
      [memberId]: prev[memberId] === status ? 'absent' : status // Toggle off if clicked again
    }));
  };

  const saveAttendance = async () => {
    if (!selectedEvent) return;
    setSaving(true);
    try {
      const event = events.find(e => e.id === selectedEvent);
      if (!event) return;

      const serviceDate = event.start_date.split('T')[0];
      const serviceName = event.title;

      // Prepare records for insert
      const userResponse = await supabase.auth.getUser();
      const records = Object.entries(attendance).map(([memberId, status]) => ({
        user_id: memberId,
        service_date: serviceDate,
        service_name: serviceName,
        attendance: (status === 'present' ? 'in_person' : status) as 'in_person' | 'online' | 'absent',
        checked_in_by: userResponse.data.user?.id,
        checked_in_at: new Date().toISOString()
      }));

      if (records.length === 0) {
        toast.info("No attendance changes to save");
        setSaving(false);
        return;
      }

      // Delete existing records for this event to avoid duplicates
      await supabase
        .from('attendance_records')
        .delete()
        .eq('service_date', serviceDate)
        .eq('service_name', serviceName);

      // Insert new attendance records
      const { error } = await supabase
        .from('attendance_records')
        .insert(records);

      if (error) throw error;
      toast.success("Attendance saved successfully");
    } catch (error: any) {
      console.error("Error saving attendance:", error);
      toast.error(error.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const event = events.find(e => e.id === selectedEvent);
    if (!event) return;

    const headers = ["Member ID", "First Name", "Last Name", "Status"];
    const csvContent = [
      headers.join(","),
      ...members.map(m => [m.member_id, m.first_name, m.last_name, attendance[m.id] || 'N/A'].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_${event.title.replace(/\s+/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported successfully!");
  };

  const markAllPresent = () => {
    const newAttendance = { ...attendance };
    members.forEach(m => {
      newAttendance[m.id] = 'present';
    });
    setAttendance(newAttendance);
    toast.success("Marked all as present");
  };

  const filteredMembers = members.filter(m => 
    `${m.first_name} ${m.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    m.member_id?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    present: Object.values(attendance).filter(v => v === 'present').length,
    absent: Object.values(attendance).filter(v => v === 'absent').length,
    excused: Object.values(attendance).filter(v => v === 'excused').length,
    total: members.length
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Attendance Tracking</h1>
          <p className="text-muted-foreground">Record and monitor attendance for services and events.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Export Report
          </Button>
          <Button onClick={saveAttendance} disabled={saving || !selectedEvent} className="gap-2 shadow-lg shadow-primary/20">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Attendance
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-emerald-500/5 border-emerald-500/10 rounded-2xl border-none shadow-sm">
          <CardContent className="p-4">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Present</p>
            <p className="text-2xl font-bold">{stats.present}</p>
          </CardContent>
        </Card>
        <Card className="bg-rose-500/5 border-rose-500/10 rounded-2xl border-none shadow-sm">
          <CardContent className="p-4">
            <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-1">Absent</p>
            <p className="text-2xl font-bold">{stats.absent}</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/10 rounded-2xl border-none shadow-sm">
          <CardContent className="p-4">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Excused</p>
            <p className="text-2xl font-bold">{stats.excused}</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/10 rounded-2xl border-none shadow-sm">
          <CardContent className="p-4">
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border-none shadow-md bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Select Event
            </CardTitle>
            <CardDescription>Choose an event to track attendance for.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Select value={selectedEvent} onValueChange={(val: string | null) => setSelectedEvent(val || "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select an event..." />
              </SelectTrigger>
              <SelectContent>
                {events.map(event => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title} - {new Date(event.start_date).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedEvent && (
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Summary</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-primary/10 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-primary">{stats.present}</p>
                    <p className="text-xs font-medium text-muted-foreground uppercase mt-1">Present</p>
                  </div>
                  <div className="bg-amber-500/10 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-amber-500">{stats.excused}</p>
                    <p className="text-xs font-medium text-muted-foreground uppercase mt-1">Excused</p>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold">{members.length}</p>
                  <p className="text-xs font-medium text-muted-foreground uppercase mt-1">Total Members</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-none shadow-md bg-card/50 backdrop-blur-sm flex flex-col h-[calc(100vh-220px)] min-h-[500px]">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Member Roster
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search members..." 
                    className="pl-9 h-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest" onClick={markAllPresent}>
                  Mark All Present
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : !selectedEvent ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
                <Calendar className="w-12 h-12 mb-4 opacity-20" />
                <p>Please select an event to view the roster.</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
                <Users className="w-12 h-12 mb-4 opacity-20" />
                <p>No members found matching your search.</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredMembers.map((member) => {
                  const status = attendance[member.id] || 'absent';
                  return (
                    <div key={member.id} className="flex flex-col xs:flex-row xs:items-center justify-between p-4 hover:bg-muted/30 transition-colors gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border shrink-0">
                          <AvatarImage src={member.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`} />
                          <AvatarFallback>{member.first_name?.[0]}{member.last_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{member.first_name} {member.last_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{member.member_id || 'Member'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full xs:w-auto justify-end">
                        <Button
                          variant={status === 'present' ? 'default' : 'outline'}
                          size="sm"
                          className={cn("flex-1 xs:flex-none h-8 rounded-full px-4 text-xs font-bold", status === 'present' && "bg-emerald-500 hover:bg-emerald-600")}
                          onClick={() => handleStatusChange(member.id, 'present')}
                        >
                          Present
                        </Button>
                        <Button
                          variant={status === 'excused' ? 'secondary' : 'outline'}
                          size="sm"
                          className={cn("flex-1 xs:flex-none h-8 rounded-full px-4 text-xs font-bold", status === 'excused' && "bg-amber-500 text-white hover:bg-amber-600")}
                          onClick={() => handleStatusChange(member.id, 'excused')}
                        >
                          Excused
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
