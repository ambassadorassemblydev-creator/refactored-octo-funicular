import * as React from "react";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Plus, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserPlus,
  ArrowRightLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";
import { auditRepo } from "@/src/lib/audit";
import { useAuth } from "@/src/contexts/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import ShiftForm from "./forms/ShiftForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function MasterRota() {
  const { user } = useAuth();
  const [schedules, setSchedules] = React.useState<any[]>([]);
  const [workers, setWorkers] = React.useState<any[]>([]);
  const [departments, setDepartments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isAssignOpen, setIsAssignOpen] = React.useState(false);
  const [view, setView] = React.useState<'list' | 'calendar'>('list');
  const [filterDept, setFilterDept] = React.useState("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [schedulesRes, workersRes, deptsRes] = await Promise.all([
        supabase
          .from('worker_schedules')
          .select(`
            *,
            user:profiles!worker_schedules_user_id_fkey (
              id,
              first_name,
              last_name,
              avatar_url
            ),
            department:church_departments!worker_schedules_department_id_fkey (
              name
            )
          `)
          .order('schedule_date', { ascending: true }),
        supabase
          .from('church_workers')
          .select('*, profiles(first_name, last_name, avatar_url)'),
        supabase
          .from('church_departments')
          .select('id, name')
          .eq('is_active', true)
      ]);

      if (schedulesRes.error) throw schedulesRes.error;
      setSchedules(schedulesRes.data || []);
      setWorkers(workersRes.data || []);
      setDepartments(deptsRes.data || []);
    } catch (error: any) {
      toast.error("Error fetching data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleStatusToggle = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('worker_schedules')
        .update({ attended: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(`Attendance updated`);
      fetchData();

      // Audit log
      await auditRepo.logAction({
        admin_id: user?.id || 'unknown',
        action: 'UPDATE',
        table_name: 'worker_schedules',
        record_id: id,
        new_values: { attended: !currentStatus }
      });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAssignShift = async (data: any) => {
    setLoading(true);
    try {
      const worker = workers.find(w => w.user_id === data.user_id);
      const { error } = await supabase
        .from('worker_schedules')
        .insert([{
          user_id: data.user_id,
          worker_id: worker?.id,
          department_id: data.department_id,
          service_name: data.service_name,
          schedule_date: data.schedule_date.toISOString().split('T')[0],
          shift_start: data.shift_start,
          shift_end: data.shift_end,
          role_for_day: data.role_for_day,
          attended: false
        }]);

      if (error) throw error;
      toast.success("Shift assigned successfully");
      setIsAssignOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign New Shift</DialogTitle>
            <DialogDescription>Assign a worker to a specific service and department.</DialogDescription>
          </DialogHeader>
          <ShiftForm 
            workers={workers} 
            departments={departments} 
            onSubmit={handleAssignShift} 
            onCancel={() => setIsAssignOpen(false)} 
          />
        </DialogContent>
      </Dialog>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tighter">Master Rota</h1>
          <p className="text-muted-foreground font-medium">Coordinate the workforce for upcoming services and events.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsAssignOpen(true)} className="rounded-xl h-10 px-4 font-bold text-[10px] uppercase tracking-widest gap-2 bg-card border-none shadow-sm">
            <Plus className="w-4 h-4" />
            Assign Shift
          </Button>
          <Button className="rounded-xl h-10 px-4 font-bold text-[10px] uppercase tracking-widest gap-2 shadow-lg shadow-primary/20">
            <Calendar className="w-4 h-4" />
            Publish Rota
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search workers or roles..." 
            className="pl-10 h-11 bg-card/50 border-none shadow-sm focus-visible:ring-primary/20 rounded-xl" 
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterDept} onValueChange={(val) => setFilterDept(val || 'all')}>
            <SelectTrigger className="w-[180px] h-11 bg-card/50 border-none shadow-sm rounded-xl">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <SelectValue placeholder="Department" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="ushering">Ushering</SelectItem>
              <SelectItem value="media">Media & Tech</SelectItem>
              <SelectItem value="worship">Worship Team</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex bg-muted p-1 rounded-xl shadow-inner">
            <Button 
              variant={view === 'list' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setView('list')}
              className={cn("h-9 rounded-lg px-4 text-[10px] font-bold uppercase tracking-widest", view === 'list' && "bg-card shadow-sm")}
            >
              List
            </Button>
            <Button 
              variant={view === 'calendar' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setView('calendar')}
              className={cn("h-9 rounded-lg px-4 text-[10px] font-bold uppercase tracking-widest", view === 'calendar' && "bg-card shadow-sm")}
            >
              Calendar
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin relative z-10" />
            </div>
          </div>
        ) : schedules.length === 0 ? (
          <Card className="border-dashed border-2 bg-transparent">
            <CardContent className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-bold">No schedules found</p>
                <p className="text-sm text-muted-foreground">Start by assigning workers to upcoming services.</p>
              </div>
              <Button variant="outline" onClick={() => setIsAssignOpen(true)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest">
                Create First Shift
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Group by date */}
            {schedules.map((schedule) => (
              <motion.div
                key={schedule.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-none shadow-xl bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300">
                  <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-muted/50">
                    <div className="p-6 md:w-48 flex flex-col items-center justify-center text-center bg-muted/20">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">
                        {new Date(schedule.schedule_date).toLocaleDateString('en-US', { month: 'short' })}
                      </p>
                      <p className="text-4xl font-black tabular-nums">
                        {new Date(schedule.schedule_date).getDate()}
                      </p>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground mt-1">
                        {new Date(schedule.schedule_date).toLocaleDateString('en-US', { weekday: 'long' })}
                      </p>
                    </div>

                    <div className="flex-1 p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-black tracking-tight">{schedule.service_name}</h3>
                            {schedule.is_swap_requested && (
                              <Badge className="bg-amber-500/10 text-amber-600 border-none pulse-subtle">
                                <ArrowRightLeft className="w-3 h-3 mr-1" /> Swap Pending
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-primary" />
                              {schedule.shift_start} - {schedule.shift_end}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-primary" />
                              Main Sanctuary
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="rounded-full">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem className="gap-2">
                              <UserPlus className="w-4 h-4" /> Swap Personnel
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Calendar className="w-4 h-4" /> Reschedule
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive gap-2">
                              <XCircle className="w-4 h-4" /> Cancel Shift
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-background shadow-md">
                            <AvatarImage src={schedule.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${schedule.user?.id}`} />
                            <AvatarFallback>{schedule.user?.first_name?.[0]}{schedule.user?.last_name?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold">{schedule.user?.first_name} {schedule.user?.last_name}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{schedule.role_for_day || 'Volunteer'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="hidden lg:flex flex-col items-end">
                            <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Status</p>
                            <Badge className={cn("border-none text-[10px] font-black uppercase px-2 py-0.5", schedule.attended ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground")}>
                              {schedule.attended ? "Attended" : "Scheduled"}
                            </Badge>
                          </div>
                          <Button 
                            variant={schedule.attended ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => handleStatusToggle(schedule.id, schedule.attended)}
                            className={cn(
                              "rounded-xl h-9 px-4 font-bold uppercase text-[10px] tracking-widest gap-2",
                              schedule.attended && "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none"
                            )}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {schedule.attended ? "Done" : "Mark Present"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
