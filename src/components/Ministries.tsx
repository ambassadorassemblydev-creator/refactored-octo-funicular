import * as React from "react";
import {
  ShieldCheck, Users, Calendar, ChevronRight, Plus, Search,
  MapPin, Clock, MoreVertical, Edit2, Trash2, UserPlus,
  Heart, ArrowLeft, Crown, Star
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/src/lib/supabase";
import MinistryForm from "./forms/MinistryForm";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";
import { auditRepo } from "@/src/lib/audit";
import { useAuth } from "@/src/contexts/AuthContext";

interface MinistriesProps {
  type?: "ministry" | "department";
  onTabChange?: (tab: string) => void;
}

const MINISTRY_ROLES = [
  "Team Leader",
  "Co-Leader",
  "Team Member",
  "Worship Leader",
  "Coordinator",
  "Prayer Lead",
  "Secretary",
  "Treasurer",
  "Media Lead",
];

export default function Ministries({ type = "ministry", onTabChange }: MinistriesProps) {
  const { user } = useAuth();
  const isDepartment = type === "department";
  const title = isDepartment ? "Departments" : "Ministries";
  const description = isDepartment
    ? "Operational and internal functional units supporting the church."
    : "Outward-facing spiritual groups focused on outreach and community.";

  const [ministries, setMinistries] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [editingMinistry, setEditingMinistry] = React.useState<any>(null);
  const [selectedMinistry, setSelectedMinistry] = React.useState<any>(null);
  const [ministryMembers, setMinistryMembers] = React.useState<any[]>([]);
  const [membersLoading, setMembersLoading] = React.useState(false);
  const [positions, setPositions] = React.useState<any[]>([]);

  const fetchPositions = async () => {
    const { data } = await supabase.from('church_positions').select('*').order('title');
    setPositions(data || []);
  };

  React.useEffect(() => {
    if (isDepartment) fetchPositions();
  }, [isDepartment]);

  const fetchMinistries = async () => {
    setLoading(true);
    try {
      const targetTable = isDepartment ? 'church_departments' : 'ministries';
      const leaderCol = isDepartment ? 'head_id' : 'leader_id';
      const coLeaderCol = isDepartment ? 'deputy_head_id' : 'co_leader_id';
      
      let query = supabase
        .from(targetTable)
        .select(`
          *,
          leader:profiles!${leaderCol} (
            id, first_name, last_name, avatar_url, email
          ),
          co_leader:profiles!${coLeaderCol} (
            id, first_name, last_name, avatar_url
          ),
          ${isDepartment ? 'workers:church_workers(count)' : 'members:ministry_members(count)'}
        `);

      if (search) query = query.ilike('name', `%${search}%`);
      if (statusFilter !== "all") query = query.eq('is_active', statusFilter === 'active');

      const { data, error } = await query;
      if (error) throw error;
      setMinistries(data || []);
    } catch (error) {
      console.error("Error fetching ministries:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const debounce = setTimeout(fetchMinistries, 500);
    return () => clearTimeout(debounce);
  }, [search, statusFilter]);

  const handleViewMinistry = async (ministry: any) => {
    setSelectedMinistry(ministry);
    setMembersLoading(true);
    try {
      const memberTable = isDepartment ? 'church_workers' : 'ministry_members';
      const idColumn = isDepartment ? 'department_id' : 'ministry_id';
      
      const selectQuery = `
        *,
        profiles!user_id (
          id, first_name, last_name, avatar_url, email, phone, title
        )${isDepartment ? ', church_positions!position_id ( title )' : ''}
      `;

      const { data, error } = await (supabase
        .from(memberTable as any)
        .select(selectQuery) as any)
        .eq(idColumn as any, ministry.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error(`Error loading members for ${memberTable}:`, error);
        throw error;
      }
      
      setMinistryMembers(data || []);
    } catch (err: any) {
      console.error("Ministry Members Fetch Error:", err);
      toast.error(`Failed to load ${isDepartment ? 'department' : 'ministry'} members: ${err.message}`);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRoleOrPositionId: string) => {
    try {
      const memberTable = isDepartment ? 'church_workers' : 'ministry_members';
      const updateData = isDepartment ? { position_id: newRoleOrPositionId } : { role: newRoleOrPositionId };
      
      const { error } = await supabase
        .from(memberTable)
        .update(updateData)
        .eq('id', memberId);
      if (error) throw error;

      await auditRepo.logAction({
        admin_id: user?.id || 'unknown',
        action: 'UPDATE',
        table_name: memberTable,
        record_id: memberId,
        new_values: updateData
      });

      toast.success("Role updated");
      handleViewMinistry(selectedMinistry);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdateMemberStatus = async (memberId: string, newStatus: string) => {
    try {
      const memberTable = isDepartment ? 'church_workers' : 'ministry_members';
      const updateData = isDepartment ? { status: newStatus } : { is_active: newStatus === 'active' };

      const { error } = await supabase
        .from(memberTable)
        .update(updateData)
        .eq('id', memberId);
      if (error) throw error;

      // High IQ: If approved, clear the interest fields on the profile to sync dashboard
      if (newStatus === 'active') {
        const member = ministryMembers.find(m => m.id === memberId);
        if (member && member.user_id) {
          await supabase.from('profiles').update({
            department_interest: null,
            department_claim: null,
            position_interest: null
          }).eq('id', member.user_id);
        }
      }

      await auditRepo.logAction({
        admin_id: user?.id || 'unknown',
        action: 'UPDATE',
        table_name: memberTable,
        record_id: memberId,
        new_values: updateData
      });

      toast.success("Status updated");
      handleViewMinistry(selectedMinistry);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      const targetTable = isDepartment ? 'church_departments' : 'ministries';
      const { error } = await supabase.from(targetTable).delete().eq('id', id);
      if (error) throw error;
      await auditRepo.logAction({
        admin_id: user?.id || 'unknown',
        action: 'DELETE',
        table_name: targetTable,
        record_id: id
      });
      toast.success(`${isDepartment ? 'Department' : 'Ministry'} deleted successfully`);
      fetchMinistries();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/10 text-emerald-600 border-none';
      case 'pending': return 'bg-amber-500/10 text-amber-600 border-none';
      case 'rejected': return 'bg-rose-500/10 text-rose-600 border-none';
      default: return 'bg-muted/50 text-muted-foreground border-none';
    }
  };

  // ── DETAIL VIEW ──────────────────────────────────────────────────────────
  if (selectedMinistry) {
    const leader = selectedMinistry.leader;
    const coLeader = selectedMinistry.co_leader;
    const leaderIds = new Set([leader?.id, coLeader?.id].filter(Boolean));

    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 shrink-0"
            onClick={() => { setSelectedMinistry(null); setMinistryMembers([]); }}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-black tracking-tight">{selectedMinistry.name}</h1>
            <p className="text-muted-foreground">{selectedMinistry.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn("text-[10px] font-bold uppercase tracking-widest px-3 py-1 border-none",
              selectedMinistry.is_active ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground")}>
              {selectedMinistry.is_active ? "Active" : "Inactive"}
            </Badge>
            <Button variant="outline" size="sm" className="gap-2 rounded-xl border-none bg-card/50 shadow-sm"
              onClick={() => setEditingMinistry(selectedMinistry)}>
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </Button>
          </div>
        </div>

        {/* Leadership + Meta */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-md bg-card/50 rounded-2xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
              <Crown className="w-3 h-3 text-amber-500" /> Ministry Leader
            </p>
            {leader ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-amber-200 shadow">
                  <AvatarImage src={leader.avatar_url} />
                  <AvatarFallback className="bg-amber-50 text-amber-600 font-bold">{leader.first_name?.[0]}{leader.last_name?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-sm">{leader.first_name} {leader.last_name}</p>
                  <p className="text-xs text-muted-foreground">{leader.email}</p>
                </div>
              </div>
            ) : <p className="text-sm text-muted-foreground italic">No leader assigned</p>}
          </Card>

          <Card className="border-none shadow-md bg-card/50 rounded-2xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
              <Star className="w-3 h-3 text-blue-500" /> Co-Leader
            </p>
            {coLeader ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-blue-200 shadow">
                  <AvatarImage src={coLeader.avatar_url} />
                  <AvatarFallback className="bg-blue-50 text-blue-600 font-bold">{coLeader.first_name?.[0]}{coLeader.last_name?.[0]}</AvatarFallback>
                </Avatar>
                <p className="font-bold text-sm">{coLeader.first_name} {coLeader.last_name}</p>
              </div>
            ) : <p className="text-sm text-muted-foreground italic">No co-leader assigned</p>}
          </Card>

          <Card className="border-none shadow-md bg-card/50 rounded-2xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
              <Users className="w-3 h-3" /> Total Members
            </p>
            <p className="text-4xl font-black">{ministryMembers.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {ministryMembers.filter(m => isDepartment ? m.status === 'active' : m.is_active).length} active · {ministryMembers.filter(m => isDepartment ? m.status === 'pending' : !m.is_active).length} pending
            </p>
          </Card>
        </div>

        {/* Members Table */}
        <Card className="border-none shadow-xl bg-card/50 rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Ministry Members
            </CardTitle>
            <CardDescription>All members of this ministry and their roles within it.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {membersLoading ? (
              <div className="p-8 space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />)}</div>
            ) : ministryMembers.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8 text-muted-foreground/30" />
                </div>
                <p className="font-bold text-muted-foreground">No members in this ministry yet</p>
                <p className="text-sm text-muted-foreground/60">Members join via the main website — approve them in the Approvals Center.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-6 py-3 bg-muted/10">
                  {["Member", "Role in Ministry", "Status", "Joined"].map(h => (
                    <p key={h} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{h}</p>
                  ))}
                </div>
                {ministryMembers.map((member) => {
                  const profile = member.profiles || {};
                  const isLeader = leaderIds.has(profile.id);
                  return (
                    <motion.div key={member.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-6 py-4 hover:bg-muted/20 transition-colors items-center">
                      {/* Member */}
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

                      {/* Role — editable */}
                      <Select 
                        value={isDepartment ? member.position_id || "" : member.role || ""} 
                        onValueChange={(val) => handleUpdateMemberRole(member.id, val)}
                      >
                        <SelectTrigger className="h-8 text-xs rounded-lg border-none bg-muted/50 w-full max-w-[160px]">
                          <SelectValue placeholder={isDepartment ? "Set Position" : "Set Role"} />
                        </SelectTrigger>
                        <SelectContent>
                          {isDepartment ? (
                            positions
                              .filter(p => !['Unit Leader', 'Volunteer'].includes(p.title))
                              .map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                              ))
                          ) : (
                            MINISTRY_ROLES.map(r => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>

                      {/* Status — editable */}
                      <Select 
                        value={isDepartment ? member.status || "pending" : (member.is_active ? "active" : "pending")} 
                        onValueChange={(val) => handleUpdateMemberStatus(member.id, val)}
                      >
                        <SelectTrigger className={cn("h-8 text-[10px] font-bold uppercase rounded-lg border-none w-full max-w-[120px]", 
                          statusColor(isDepartment ? member.status : (member.is_active ? "active" : "pending")))}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Joined */}
                      <p className="text-xs text-muted-foreground">
                        {new Date(member.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!editingMinistry} onOpenChange={(open) => !open && setEditingMinistry(null)}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Ministry</DialogTitle>
              <DialogDescription>Update the details for {editingMinistry?.name}.</DialogDescription>
            </DialogHeader>
            {editingMinistry && (
              <MinistryForm type={type} initialData={editingMinistry}
                onSuccess={() => { setEditingMinistry(null); fetchMinistries(); handleViewMinistry(editingMinistry); }}
                onCancel={() => setEditingMinistry(null)} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ── GRID VIEW ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={
            <Button className="shadow-lg shadow-primary/20 gap-2">
              <Plus className="w-4 h-4" />
              Create {isDepartment ? 'Department' : 'Ministry'}
            </Button>
          } />
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New {isDepartment ? 'Department' : 'Ministry'}</DialogTitle>
              <DialogDescription>Define a new area of {isDepartment ? 'operation' : 'service'} for the church.</DialogDescription>
            </DialogHeader>
            <MinistryForm type={type}
              onSuccess={() => { setIsAddOpen(false); fetchMinistries(); }}
              onCancel={() => setIsAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={`Search ${type}s...`} className="pl-10 h-11 bg-card/50 border-none shadow-sm focus-visible:ring-primary/20"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          {["all", "active", "inactive"].map(f => (
            <Button key={f} variant={statusFilter === f ? 'default' : 'outline'} size="sm"
              onClick={() => setStatusFilter(f)}
              className="rounded-xl text-[10px] font-bold uppercase tracking-widest h-11 px-6">
              {f}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <Card key={i} className="h-96 animate-pulse bg-muted/50 rounded-2xl border-none" />)}
        </div>
      ) : ministries.length === 0 ? (
        <div className="py-20 text-center space-y-4 bg-muted/20 rounded-3xl border-2 border-dashed">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="font-bold text-xl">No {type}s found</h3>
          <p className="text-muted-foreground">Try adjusting your search or create a new {type}.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {ministries.map((ministry, i) => (
            <motion.div key={ministry.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}>
              <Card
                className="overflow-hidden border-none shadow-md bg-card/50 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 group rounded-2xl flex flex-col h-full relative cursor-pointer"
                onClick={() => handleViewMinistry(ministry)}
              >
                <div className="absolute top-4 right-4 z-10" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-background/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <MoreVertical className="w-4 h-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Ministry Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setEditingMinistry(ministry)}>
                        <Edit2 className="w-4 h-4 mr-2" /> Edit Ministry
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                        onClick={() => handleDelete(ministry.id)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete Ministry
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="relative h-56 overflow-hidden">
                  <img src={ministry.cover_image_url || `https://picsum.photos/seed/${ministry.id}/800/400`}
                    alt={ministry.name} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <Badge className="bg-primary/90 hover:bg-primary border-none shadow-lg uppercase tracking-widest text-[10px] font-bold mb-2">
                      {ministry.type || 'Ministry'}
                    </Badge>
                    <h3 className="text-3xl font-bold text-white tracking-tight">{ministry.name}</h3>
                  </div>
                </div>

                <CardHeader className="p-6">
                  <CardDescription className="text-sm line-clamp-3 leading-relaxed">
                    {ministry.description || 'Serving the Ambassadors Assembly community through dedicated service and faith.'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6 pt-0 space-y-6 flex-1">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <Clock className="w-3 h-3" /> Meeting Time
                      </div>
                      <p className="text-sm font-medium">{ministry.meeting_time || 'TBD'}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <MapPin className="w-3 h-3" /> Location
                      </div>
                      <p className="text-sm font-medium truncate">{ministry.meeting_location || 'Church Hall'}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <Users className="w-3 h-3" /> Members
                      </div>
                      <p className="text-sm font-medium">
                        {(isDepartment ? ministry.workers?.[0]?.count : ministry.members?.[0]?.count) || 0}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <ShieldCheck className="w-3 h-3" /> Leader
                      </div>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={ministry.leader?.avatar_url} />
                          <AvatarFallback className="text-[8px]">{ministry.leader?.first_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <p className="text-sm font-medium truncate">
                          {ministry.leader ? `${ministry.leader.first_name} ${ministry.leader.last_name}` : 'TBD'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-6 pt-0 border-t bg-muted/5 mt-auto">
                  <Button variant="ghost" className="w-full justify-between group/btn px-0 hover:bg-transparent">
                    <span className="text-xs font-bold uppercase tracking-widest">View Members & Roles</span>
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={!!editingMinistry} onOpenChange={(open) => !open && setEditingMinistry(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Ministry</DialogTitle>
            <DialogDescription>Update the details for the {editingMinistry?.name}.</DialogDescription>
          </DialogHeader>
          {editingMinistry && (
            <MinistryForm type={type} initialData={editingMinistry}
              onSuccess={() => { setEditingMinistry(null); fetchMinistries(); }}
              onCancel={() => setEditingMinistry(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
