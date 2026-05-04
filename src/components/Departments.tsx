import * as React from "react";
import { 
  Building2, 
  Users, 
  Settings, 
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Activity,
  Briefcase,
  Share2,
  ChevronRight,
  Crown,
  Star,
  Shield,
  UserPlus,
  X,
  Phone,
  Mail,
  ArrowLeft,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/src/lib/supabase";
import DepartmentForm from "./forms/DepartmentForm";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";
import { auditRepo } from "@/src/lib/audit";
import { useAuth } from "@/src/contexts/AuthContext";

export default function Departments({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const { user } = useAuth();
  const [departments, setDepartments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [editingDepartment, setEditingDepartment] = React.useState<any>(null);
  const [selectedDept, setSelectedDept] = React.useState<any>(null);
  const [deptMembers, setDeptMembers] = React.useState<any[]>([]);
  const [deptLoading, setDeptLoading] = React.useState(false);
  const [positions, setPositions] = React.useState<any[]>([]);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('church_departments')
        .select(`
          *,
          head:profiles!head_id (
            id,
            first_name,
            last_name,
            avatar_url,
            email
          ),
          deputy:profiles!deputy_head_id (
            id,
            first_name,
            last_name,
            avatar_url
          ),
          workers:church_workers(count)
        `);

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      if (statusFilter !== "all") {
        query = query.eq('is_active', statusFilter === 'active');
      }

      const { data, error } = await query;
      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error("Error fetching departments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPositions = async () => {
    const { data } = await supabase.from('church_positions').select('id, title, is_leadership');
    setPositions(data || []);
  };

  React.useEffect(() => {
    const debounce = setTimeout(fetchDepartments, 500);
    return () => clearTimeout(debounce);
  }, [search, statusFilter]);

  React.useEffect(() => { fetchPositions(); }, []);

  // When a department card is clicked — load its members
  const handleViewDept = async (dept: any) => {
    setSelectedDept(dept);
    setDeptLoading(true);
    try {
      const { data, error } = await supabase
        .from('church_workers')
        .select(`
          *,
          profiles:profiles!church_workers_user_id_fkey (
            id,
            first_name,
            last_name,
            avatar_url,
            email,
            phone,
            title
          ),
          church_positions (
            id,
            title,
            is_leadership
          )
        `)
        .eq('department_id', dept.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setDeptMembers(data || []);
    } catch (err: any) {
      toast.error("Failed to load department members");
    } finally {
      setDeptLoading(false);
    }
  };

  // Update a member's position (role) within the department
  const handleUpdateMemberRole = async (workerId: string, newPositionId: string) => {
    try {
      const { error } = await supabase
        .from('church_workers')
        .update({ position_id: newPositionId })
        .eq('id', workerId);

      if (error) throw error;

      await auditRepo.logAction({
        admin_id: user?.id || 'unknown',
        action: 'UPDATE',
        table_name: 'church_workers',
        record_id: workerId,
        new_values: { position_id: newPositionId }
      });

      toast.success("Member role updated");
      // Refresh members list
      handleViewDept(selectedDept);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Update member status (active/inactive/probation)
  const handleUpdateMemberStatus = async (workerId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('church_workers')
        .update({ status: newStatus })
        .eq('id', workerId);

      if (error) throw error;
      toast.success("Member status updated");
      handleViewDept(selectedDept);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    try {
      const { error } = await supabase.from('church_departments').delete().eq('id', id);
      if (error) throw error;

      await auditRepo.logAction({
        admin_id: user?.id || 'unknown',
        action: 'DELETE',
        table_name: 'church_departments',
        record_id: id
      });

      toast.success("Department deleted successfully");
      fetchDepartments();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/10 text-emerald-600 border-none';
      case 'probation': return 'bg-amber-500/10 text-amber-600 border-none';
      case 'inactive': return 'bg-muted/50 text-muted-foreground border-none';
      default: return 'bg-muted/50 text-muted-foreground border-none';
    }
  };

  // --- DETAIL VIEW ---
  if (selectedDept) {
    const head = selectedDept.head;
    const deputy = selectedDept.deputy;
    const leaderIds = new Set([head?.id, deputy?.id].filter(Boolean));

    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Back + Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl h-10 w-10 shrink-0"
            onClick={() => { setSelectedDept(null); setDeptMembers([]); }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-black tracking-tight">{selectedDept.name}</h1>
            <p className="text-muted-foreground">{selectedDept.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn("text-[10px] font-bold uppercase tracking-widest px-3 py-1 border-none", selectedDept.is_active ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground")}>
              {selectedDept.is_active ? "Active" : "Inactive"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl border-none bg-card/50 shadow-sm"
              onClick={() => setEditingDepartment(selectedDept)}
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit Dept
            </Button>
          </div>
        </div>

        {/* Department Leadership Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Head */}
          <Card className="border-none shadow-md bg-card/50 rounded-2xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
              <Crown className="w-3 h-3 text-amber-500" /> Department Head
            </p>
            {head ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-amber-200 shadow">
                  <AvatarImage src={head.avatar_url} />
                  <AvatarFallback className="bg-amber-50 text-amber-600 font-bold">{head.first_name?.[0]}{head.last_name?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-sm">{head.first_name} {head.last_name}</p>
                  <p className="text-xs text-muted-foreground">{head.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No head assigned</p>
            )}
          </Card>

          {/* Deputy */}
          <Card className="border-none shadow-md bg-card/50 rounded-2xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
              <Star className="w-3 h-3 text-blue-500" /> Deputy Head
            </p>
            {deputy ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-blue-200 shadow">
                  <AvatarImage src={deputy.avatar_url} />
                  <AvatarFallback className="bg-blue-50 text-blue-600 font-bold">{deputy.first_name?.[0]}{deputy.last_name?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-sm">{deputy.first_name} {deputy.last_name}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No deputy assigned</p>
            )}
          </Card>

          {/* Stats */}
          <Card className="border-none shadow-md bg-card/50 rounded-2xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
              <Users className="w-3 h-3" /> Total Members
            </p>
            <p className="text-4xl font-black">{deptMembers.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {deptMembers.filter(m => m.status === 'active').length} active · {deptMembers.filter(m => m.status === 'probation').length} in probation
            </p>
          </Card>
        </div>

        {/* Members List */}
        <Card className="border-none shadow-xl bg-card/50 rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Department Members
            </CardTitle>
            <CardDescription>All workers assigned to this department and their roles.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {deptLoading ? (
              <div className="p-8 space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />)}
              </div>
            ) : deptMembers.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8 text-muted-foreground/30" />
                </div>
                <p className="font-bold text-muted-foreground">No members in this department yet</p>
                <p className="text-sm text-muted-foreground/60">Approve volunteer applications to add members here.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {/* Table header */}
                <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 bg-muted/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Member</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Role / Position</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Joined</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actions</p>
                </div>
                {deptMembers.map((member) => {
                  const profile = member.profiles || {};
                  const pos = member.church_positions;
                  const isLeader = leaderIds.has(profile.id);
                  return (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 hover:bg-muted/20 transition-colors items-center"
                    >
                      {/* Member Info */}
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                            <AvatarImage src={profile.avatar_url} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                              {profile.first_name?.[0]}{profile.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          {isLeader && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                              <Crown className="w-2.5 h-2.5 text-white" />
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm">
                            {profile.title && <span className="text-muted-foreground mr-1">{profile.title}</span>}
                            {profile.first_name} {profile.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">{profile.email}</p>
                        </div>
                      </div>

                      {/* Role / Position — editable */}
                      <div>
                        <Select
                          value={member.position_id || ""}
                          onValueChange={(val) => handleUpdateMemberRole(member.id, val)}
                        >
                          <SelectTrigger className="h-8 text-xs rounded-lg border-none bg-muted/50 w-full max-w-[160px]">
                            <SelectValue placeholder="No role set" />
                          </SelectTrigger>
                          <SelectContent>
                            {positions.map(p => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.is_leadership ? "⭐ " : ""}{p.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Status — editable */}
                      <div>
                        <Select
                          value={member.status || "inactive"}
                          onValueChange={(val) => handleUpdateMemberStatus(member.id, val)}
                        >
                          <SelectTrigger className={cn("h-8 text-[10px] font-bold uppercase rounded-lg border-none w-full max-w-[120px]", statusColor(member.status))}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="probation">Probation</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Joined date */}
                      <p className="text-xs text-muted-foreground">
                        {member.start_date
                          ? new Date(member.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                          : new Date(member.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>

                      {/* Hours */}
                      <p className="text-xs font-bold text-muted-foreground">{member.total_hours || 0}h</p>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Department Dialog */}
        <Dialog open={!!editingDepartment} onOpenChange={(open) => !open && setEditingDepartment(null)}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Outreach Team</DialogTitle>
              <DialogDescription>Update the details for this outreach team.</DialogDescription>
            </DialogHeader>
            {editingDepartment && (
              <DepartmentForm
                initialData={editingDepartment}
                onSuccess={() => {
                  setEditingDepartment(null);
                  fetchDepartments();
                  handleViewDept(editingDepartment);
                }}
                onCancel={() => setEditingDepartment(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // --- GRID VIEW (default) ---
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Community Outreach & Impact</h1>
          <p className="text-muted-foreground">Teams and initiatives dedicated to church outreach and community transformation.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={
            <Button className="shadow-lg shadow-primary/20 gap-2">
              <Plus className="w-4 h-4" />
              Create Outreach Team
            </Button>
          } />
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Outreach Team</DialogTitle>
              <DialogDescription>Define a new team for community outreach and impact.</DialogDescription>
            </DialogHeader>
            <DepartmentForm
              onSuccess={() => {
                setIsAddOpen(false);
                fetchDepartments();
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
            placeholder="Search outreach teams..."
            className="pl-10 h-11 bg-card/50 border-none shadow-sm focus-visible:ring-primary/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {["all", "active", "inactive"].map(f => (
            <Button
              key={f}
              variant={statusFilter === f ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter(f)}
              className="rounded-xl text-[10px] font-bold uppercase tracking-widest h-11 px-6"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-[280px] animate-pulse bg-muted/50 border-none" />
          ))}
        </div>
      ) : departments.length === 0 ? (
        <div className="py-24 text-center space-y-4 bg-muted/10 rounded-[2rem] border-2 border-dashed border-muted">
          <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto">
            <Building2 className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <h3 className="font-bold text-xl text-muted-foreground">No outreach teams found</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {departments.map((dept) => (
              <motion.div
                key={dept.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm cursor-pointer"
                  onClick={() => handleViewDept(dept)}
                >
                  <div className="h-1.5 w-full bg-primary/20 group-hover:bg-primary transition-colors duration-500" />
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            />
                          }
                        >
                          <MoreVertical className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingDepartment(dept); }}>
                            <Edit2 className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => { e.stopPropagation(); handleDelete(dept.id); }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardTitle className="mt-4 text-xl">{dept.name}</CardTitle>
                    <CardDescription className="line-clamp-2 min-h-[40px]">
                      {dept.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>Workers</span>
                        </div>
                        <span className="font-semibold">{dept.workers?.[0]?.count || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Activity className="w-4 h-4" />
                          <span>Status</span>
                        </div>
                        <Badge variant={dept.is_active ? 'default' : 'secondary'} className="capitalize">
                          {dept.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-4 border-t border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8 border-2 border-background shadow-sm">
                        <AvatarImage src={dept.head?.avatar_url} />
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {dept.head ? `${dept.head.first_name[0]}${dept.head.last_name[0]}` : <Settings className="w-3 h-3" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold leading-none">
                          {dept.head ? `${dept.head.first_name} ${dept.head.last_name}` : "No Head Assigned"}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">Team Lead</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Edit Department Dialog */}
      <Dialog open={!!editingDepartment} onOpenChange={(open) => !open && setEditingDepartment(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Outreach Team</DialogTitle>
            <DialogDescription>Update the details for this department.</DialogDescription>
          </DialogHeader>
          <DepartmentForm
            initialData={editingDepartment}
            onSuccess={() => {
              setEditingDepartment(null);
              fetchDepartments();
            }}
            onCancel={() => setEditingDepartment(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
