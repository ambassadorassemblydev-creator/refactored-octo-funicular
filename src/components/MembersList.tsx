import * as React from "react";
import { 
  Search, 
  UserPlus, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  Users,
  Loader2,
  ShieldCheck,
  ShieldX,
  Clock,
  BadgeCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/src/lib/supabase";
import type { Database } from "@/src/types/database.types";
import { toast } from "sonner";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { motion, AnimatePresence } from "motion/react";
import MemberForm from "./forms/MemberForm";
import { auditRepo } from "@/src/lib/audit";
import MemberAssignmentDialog from "./MemberAssignmentDialog";
import MemberView from "./MemberView";
import { cn } from "@/src/lib/utils";

import { useAuth } from "@/src/contexts/AuthContext";

export default function MembersList({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const { user, loading: authLoading } = useAuth();
  const [members, setMembers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [totalCount, setTotalCount] = React.useState(0);
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [editingMember, setEditingMember] = React.useState<any>(null);
  const [selectedMembers, setSelectedMembers] = React.useState<Set<string>>(new Set());
  const [viewingMember, setViewingMember] = React.useState<any>(null);
  const pageSize = 8;

  const [memberNotes, setMemberNotes] = React.useState<any[]>([]);
  const [isNoteAdding, setIsNoteAdding] = React.useState(false);
  const [newNote, setNewNote] = React.useState("");

  const [pendingApprovals, setPendingApprovals] = React.useState<any[]>([]);
  const [approvingId, setApprovingId] = React.useState<string | null>(null);
  const [assigningMember, setAssigningMember] = React.useState<any>(null);
  const [viewMode, setViewMode] = React.useState<'list' | 'detail'>('list');

  const { role } = useAuth();
  const canViewNotes = role === 'pastor' || role === 'super_admin';
  const canApprove = role === 'super_admin' || role === 'admin' || role === 'pastor';
  const canViewDetails = role === 'super_admin' || role === 'admin' || role === 'pastor';

  const fetchPendingApprovals = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, avatar_url, title, role_claim, department_claim, already_serving, created_at')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: true });
    setPendingApprovals(data || []);
  };

  const handleApprove = async (profile: any, targetRole: string) => {
    setApprovingId(profile.id);
    try {
      // 1. Get role id
      const { data: roleData } = await supabase.from('roles').select('id, name').eq('name', targetRole).single();
      if (!roleData) throw new Error(`Role '${targetRole}' not found`);

      // 2. Upsert user_roles
      await supabase.from('user_roles').upsert({ 
        user_id: profile.id, 
        role_id: roleData.id,
        is_active: true
      }, { onConflict: 'user_id' });

      const updateData: any = {
        approval_status: 'approved',
        is_member: true,
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
      };

      // 3. Handle Department Claim
      if (profile.department_claim) {
        const { data: departments } = await supabase.from('church_departments').select('id, name');
        const matchedDept = (departments || []).find(d => 
          d.name.toLowerCase().includes(profile.department_claim.toLowerCase()) ||
          profile.department_claim.toLowerCase().includes(d.name.toLowerCase())
        );
        
        if (matchedDept) {
          await (supabase.from('church_workers') as any).upsert({
            user_id: profile.id,
            department_id: matchedDept.id,
            status: 'active'
          }, { onConflict: 'user_id' });
          
          updateData.department = matchedDept.name;
        }
      }

      // 4. Set Title if claiming pastoral role
      if (profile.role_claim && ['Pastor','Bishop','Apostle','Prophet','Evangelist'].includes(profile.role_claim)) {
        updateData.title = profile.role_claim;
      }

      // 5. Update profile
      await supabase.from('profiles').update(updateData).eq('id', profile.id);

      toast.success(`${profile.first_name} has been approved as ${targetRole}! ✅`);
      fetchPendingApprovals();
      fetchMembers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (profile: any) => {
    setApprovingId(profile.id);
    try {
      await supabase.from('profiles').update({ approval_status: 'rejected' }).eq('id', profile.id);
      toast.success(`${profile.first_name}'s request has been declined.`);
      fetchPendingApprovals();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setApprovingId(null);
    }
  };

  const fetchMembers = async (retries = 3) => {
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,member_id.ilike.%${search}%`);
      }

      if (statusFilter !== "all") {
        type Member = Database["public"]["Tables"]["profiles"]["Row"];
        query = query.eq('status', statusFilter as NonNullable<Member["status"]>);
      }

      const { data, error, count } = await query
        .range((page - 1) * pageSize, page * pageSize - 1)
        .order('last_name', { ascending: true });

      if (error) throw error;
      setMembers(data || []);
      setTotalCount(count || 0);
    } catch (error: any) {
      if (error?.message?.includes("Lock") && retries > 0) {
        setTimeout(() => fetchMembers(retries - 1), 500);
        return;
      }
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async (memberId: string) => {
    if (!canViewNotes) return;
    try {
      const { data, error } = await supabase
        .from('member_notes')
        .select(`
          *,
          author:author_id (
            first_name,
            last_name
          )
        `)
        .eq('member_id', memberId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setMemberNotes(data || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  const handleAddNote = async (memberId: string) => {
    if (!newNote.trim() || !user) return;
    setIsNoteAdding(true);
    try {
      const { error } = await supabase
        .from('member_notes')
        .insert({
          member_id: memberId,
          author_id: user.id,
          note: newNote,
          is_confidential: true,
          category: 'Pastoral'
        });
      
      if (error) throw error;
      
      toast.success("Note added successfully");
      setNewNote("");
      fetchNotes(memberId);

      // Audit log
      await auditRepo.logAction({
        admin_id: user.id,
        action: 'INSERT',
        table_name: 'member_notes',
        record_id: memberId,
        new_values: { note: newNote, category: 'Pastoral' }
      });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsNoteAdding(false);
    }
  };

  React.useEffect(() => {
    if (!authLoading) {
      const debounce = setTimeout(fetchMembers, 500);
      fetchPendingApprovals();
      return () => clearTimeout(debounce);
    }
  }, [search, page, statusFilter, authLoading]);

  const handleExport = () => {
    const headers = ["First Name", "Last Name", "Email", "Phone", "Status"];
    const csvContent = [
      headers.join(","),
      ...members.map(m => [m.first_name, m.last_name, m.email, m.phone, m.status].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "members_export.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported successfully!");
  };

  const toggleMemberSelection = (id: string) => {
    const newSelection = new Set(selectedMembers);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedMembers(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedMembers.size === members.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(members.map(m => m.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedMembers.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedMembers.size} members?`)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .in('id', Array.from(selectedMembers));

      if (error) throw error;

      // Log bulk delete action
      await auditRepo.logAction({
        admin_id: user?.id || 'unknown',
        action: 'DELETE',
        table_name: 'profiles',
        record_id: 'bulk_delete',
        new_values: { count: selectedMembers.size, ids: Array.from(selectedMembers) }
      });

      toast.success(`${selectedMembers.size} members deleted successfully`);
      setSelectedMembers(new Set());
      fetchMembers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this member?")) return;
    
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;

      // Log delete action
      await auditRepo.logAction({
        admin_id: user?.id || 'unknown',
        action: 'DELETE',
        table_name: 'profiles',
        record_id: id
      });

      toast.success("Member deleted successfully");
      fetchMembers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const calculateCompleteness = (member: any) => {
    const fields = ['first_name', 'last_name', 'email', 'phone', 'address_line_1', 'city', 'occupation', 'avatar_url'];
    const filled = fields.filter(f => !!member[f]).length;
    return Math.round((filled / fields.length) * 100);
  };

  if (viewMode === 'detail' && viewingMember) {
    return (
      <MemberView 
        member={viewingMember} 
        onBack={() => {
          setViewMode('list');
          setViewingMember(null);
        }}
        canViewFinancials={canViewDetails}
        canViewNotes={canViewNotes}
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Church Members</h1>
          <p className="text-muted-foreground">Manage and connect with the Ambassadors Assembly community.</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedMembers.size > 0 && (
            <Button 
              variant="destructive" 
              size="sm" 
              className="gap-2 rounded-xl h-9 px-4 shadow-lg shadow-destructive/20 animate-in slide-in-from-right-4"
              onClick={handleBulkDelete}
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedMembers.size})
            </Button>
          )}
          <Button variant="outline" className="gap-2 h-9 px-4" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 shadow-lg shadow-primary/20">
              <UserPlus className="w-4 h-4" />
              Add Member
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Member</DialogTitle>
                <DialogDescription>Enter the details of the new church member here.</DialogDescription>
              </DialogHeader>
              <MemberForm 
                onSuccess={() => {
                  setIsAddOpen(false);
                  fetchMembers();
                }} 
                onCancel={() => setIsAddOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── PENDING APPROVALS PANEL ── */}
      {canApprove && pendingApprovals.length > 0 && (
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-amber-600">Pending Approvals</h2>
              <p className="text-xs text-muted-foreground">{pendingApprovals.length} member{pendingApprovals.length !== 1 ? 's' : ''} flagged themselves as existing workers or pastors</p>
            </div>
          </div>

          <div className="space-y-3">
            {pendingApprovals.map(p => (
              <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-background/60 border border-amber-500/10">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-amber-500/20">
                    <AvatarImage src={p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`} />
                    <AvatarFallback>{p.first_name?.[0]}{p.last_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-bold">{p.title} {p.first_name} {p.last_name}</p>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {p.already_serving && <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-600">Already Serving</Badge>}
                      {p.role_claim && <Badge variant="outline" className="text-[9px] border-blue-500/30 text-blue-600">Claims: {p.role_claim}</Badge>}
                      {p.department_claim && <Badge variant="outline" className="text-[9px] border-purple-500/30 text-purple-600">{p.department_claim}</Badge>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Role to assign */}
                  <Select
                    defaultValue={p.role_claim && ['Pastor','Bishop','Apostle','Prophet','Evangelist'].includes(p.role_claim) ? 'pastor' :
                      ['Elder','Deacon','Deaconess','Minister'].includes(p.role_claim) ? 'leader' : 'worker'}
                    onValueChange={(v) => {
                      // Store selected role per card
                      p._selectedRole = v;
                    }}
                  >
                    <SelectTrigger className="h-9 w-32 text-xs bg-background/50 border-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="worker">Worker</SelectItem>
                      <SelectItem value="leader">Leader</SelectItem>
                      <SelectItem value="pastor">Pastor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member (no upgrade)</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    size="sm"
                    disabled={approvingId === p.id}
                    onClick={() => handleApprove(p, p._selectedRole || 'worker')}
                    className="gap-1.5 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                  >
                    {approvingId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={approvingId === p.id}
                    onClick={() => handleReject(p)}
                    className="gap-1.5 h-9 rounded-xl border-red-500/20 text-red-500 hover:bg-red-500/10 text-xs"
                  >
                    <ShieldX className="w-3 h-3" /> Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, email, or ID..." 
            className="pl-10 h-11 bg-card/50 border-none shadow-sm focus-visible:ring-primary/20" 
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-11 px-4 rounded-xl border-none bg-card/50 shadow-sm text-[10px] font-bold uppercase tracking-widest"
            onClick={toggleAllSelection}
          >
            {selectedMembers.size === members.length && members.length > 0 ? 'Deselect All' : 'Select All'}
          </Button>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v || "all"); setPage(1); }}>
          <SelectTrigger className="w-[180px] h-11 bg-card/50 border-none shadow-sm">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <SelectValue placeholder="Filter Status" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="pending_verification">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-4">
        <AnimatePresence mode="popLayout">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-muted/50 animate-pulse" />
            ))
          ) : members.length === 0 ? (
            <div className="col-span-full py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Users className="w-10 h-10 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-xl">No members found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters.</p>
              </div>
            </div>
          ) : (
            members.map((member, i) => {
              const completeness = calculateCompleteness(member);
              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="group border-none shadow-md bg-card/50 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden">
                    <CardContent className="p-2 sm:p-6">
                      <div className="flex items-start gap-2 sm:gap-4">
                        <div className="flex items-center pt-7">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-muted bg-background/50 text-primary focus:ring-primary/20"
                            checked={selectedMembers.has(member.id)}
                            onChange={() => toggleMemberSelection(member.id)}
                          />
                        </div>
                        <div className="relative shrink-0">
                          <Avatar className="h-10 w-10 sm:h-20 sm:w-20 border-2 sm:border-4 border-background shadow-lg group-hover:scale-105 transition-transform">
                            <AvatarImage src={member.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`} />
                            <AvatarFallback className="text-[10px] sm:text-base">{member.first_name?.[0]}{member.last_name?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-6 sm:h-6 rounded-full border border-background flex items-center justify-center shadow-sm",
                            member.status === 'active' ? "bg-emerald-500" : "bg-amber-500"
                          )}>
                            <CheckCircle2 className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between">
                            <button 
                              onClick={() => {
                                setViewingMember(member);
                                if (canViewDetails) {
                                  setViewMode('detail');
                                }
                                fetchNotes(member.id);
                              }}
                              className="font-bold text-[11px] sm:text-lg truncate hover:text-primary hover:underline transition-colors text-left"
                            >
                              {member.first_name} {member.last_name}
                            </button>
                            <DropdownMenu>
                              <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                <MoreHorizontal className="w-4 h-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setEditingMember(member)}>
                                  <Edit2 className="w-4 h-4 mr-2" /> Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setAssigningMember(member)}>
                                  <ShieldCheck className="w-4 h-4 mr-2" /> Manage Assignments
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setViewingMember(member);
                                  setViewMode('detail');
                                }}>
                                  <ExternalLink className="w-4 h-4 mr-2" /> View Full Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onTabChange?.("attendance")}>
                                  <Calendar className="w-4 h-4 mr-2" /> View Attendance
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-destructive-foreground" onClick={() => handleDelete(member.id)}>
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete Member
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row flex-wrap gap-x-4 gap-y-1 text-[10px] sm:text-sm text-muted-foreground">
                            <div className="flex items-center gap-1 min-w-0">
                              <Mail className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 shrink-0" />
                              <span className="truncate">{member.email}</span>
                            </div>
                            <div className="flex items-center gap-1 min-w-0">
                              <Phone className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 shrink-0" />
                              <span className="truncate">{member.phone || 'N/A'}</span>
                            </div>
                          </div>

                            <div className="pt-3 flex items-center justify-between">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[8px] sm:text-[10px] font-bold uppercase tracking-wider">
                                  {member.member_id || 'MEMBER'}
                                </Badge>
                                {canViewDetails && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => {
                                      setViewingMember(member);
                                      setViewMode('detail');
                                    }}
                                    className="h-6 px-2 text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary/5"
                                  >
                                    View Full Profile
                                  </Button>
                                )}
                              </div>
                              <div className="hidden sm:flex items-center gap-2">
                              <div className="text-[10px] font-bold text-muted-foreground uppercase">Profile</div>
                              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${completeness}%` }}
                                  className={cn(
                                    "h-full rounded-full",
                                    completeness > 80 ? "bg-emerald-500" : completeness > 50 ? "bg-amber-500" : "bg-primary"
                                  )}
                                />
                              </div>
                              <span className="text-[10px] font-bold">{completeness}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>Update the details for {editingMember?.first_name}.</DialogDescription>
          </DialogHeader>
          {editingMember && (
            <MemberForm 
              initialData={editingMember}
              onSuccess={() => {
                setEditingMember(null);
                fetchMembers();
              }} 
              onCancel={() => setEditingMember(null)} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Profile Sheet */}
      <Sheet open={!!viewingMember} onOpenChange={(open) => !open && setViewingMember(null)}>
        <SheetContent side="right" className="sm:max-w-[600px] w-full h-full overflow-y-auto p-0 border-none shadow-2xl">
          {viewingMember && (
            <div className="h-full flex flex-col bg-background">
            <div className="p-6 border-b bg-card/30 backdrop-blur-md sticky top-0 z-20">
              <SheetHeader>
                <SheetTitle className="text-2xl font-black uppercase tracking-tight">Member Profile</SheetTitle>
                <SheetDescription>Detailed record and pastoral history.</SheetDescription>
              </SheetHeader>
            </div>
            
            <div className="flex-1 px-6 pb-20">
              <div className="flex flex-col items-center text-center space-y-4 pt-6">
                <div className="relative">
                  <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-xl">
                    <AvatarImage src={viewingMember.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${viewingMember.id}`} />
                    <AvatarFallback className="text-2xl sm:text-4xl">{viewingMember.first_name?.[0]}{viewingMember.last_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-background flex items-center justify-center shadow-sm",
                    viewingMember.status === 'active' ? "bg-emerald-500" : "bg-amber-500"
                  )}>
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">{viewingMember.first_name} {viewingMember.last_name}</h2>
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none uppercase tracking-wider text-[10px]">
                      {viewingMember.member_id || 'MEMBER'}
                    </Badge>
                    <Badge variant={viewingMember.status === 'active' ? 'default' : 'secondary'} className="uppercase tracking-wider text-[10px]">
                      {viewingMember.status}
                    </Badge>
                    {viewingMember.title && (
                      <Badge variant="outline" className="uppercase tracking-wider text-[10px] border-primary/20 text-primary">
                        {viewingMember.title}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <UserPlus className="w-4 h-4" /> Contact Information
                  </h3>
                  <div className="grid gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Mail className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Email Address</p>
                        <p className="text-sm text-muted-foreground">{viewingMember.email || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Phone className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Phone Number</p>
                        <p className="text-sm text-muted-foreground">{viewingMember.phone || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <MapPin className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Address</p>
                        <p className="text-sm text-muted-foreground">
                          {[viewingMember.address_line_1, viewingMember.city, viewingMember.state, viewingMember.postal_code].filter(Boolean).join(', ') || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Personal Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs font-medium text-muted-foreground">Gender</p>
                      <p className="text-sm font-semibold capitalize">{viewingMember.gender || 'Not specified'}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs font-medium text-muted-foreground">Marital Status</p>
                      <p className="text-sm font-semibold capitalize">{viewingMember.marital_status || 'Not specified'}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs font-medium text-muted-foreground">Occupation</p>
                      <p className="text-sm font-semibold">{viewingMember.occupation || 'Not specified'}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs font-medium text-muted-foreground">Date of Birth</p>
                      <p className="text-sm font-semibold">
                        {viewingMember.date_of_birth ? new Date(viewingMember.date_of_birth).toLocaleDateString() : 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>

                {viewingMember.bio && (
                  <div>
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Edit2 className="w-4 h-4" /> Biography
                    </h3>
                    <div className="p-4 rounded-lg bg-muted/50 text-sm leading-relaxed whitespace-pre-wrap">
                      {viewingMember.bio}
                    </div>
                  </div>
                )}

                {/* Pastoral Notes Section - Restricted */}
                {canViewNotes && (
                  <div className="pt-6 border-t space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Pastoral Notes
                      </h3>
                      <Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-500">Confidential</Badge>
                    </div>

                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Add a confidential pastoral note..." 
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          className="bg-muted/30 border-none h-10 text-sm"
                        />
                        <Button 
                          size="sm" 
                          onClick={() => handleAddNote(viewingMember.id)}
                          disabled={isNoteAdding || !newNote.trim()}
                          className="bg-emerald-600 hover:bg-emerald-700 h-10 px-4"
                        >
                          {isNoteAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                        </Button>
                      </div>

                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {memberNotes.length > 0 ? memberNotes.map((note) => (
                          <div key={note.id} className="p-3 rounded-xl bg-card border border-muted shadow-sm space-y-2 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              <span>Pastor {note.author?.last_name || 'Admin'}</span>
                              <span>{new Date(note.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs leading-relaxed">{note.note}</p>
                          </div>
                        )) : (
                          <div className="text-center py-6 text-muted-foreground italic text-xs">
                            No pastoral notes recorded.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="pt-6 border-t flex justify-end gap-3">
                <Button variant="outline" onClick={() => setViewingMember(null)}>Close</Button>
                <Button variant="outline" onClick={() => setEditingMember(viewingMember)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <Button variant="secondary" onClick={() => {
                  setAssigningMember(viewingMember);
                  setViewingMember(null);
                }}>
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Assignments
                </Button>
              </div>
            </div>
          </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-4">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(page * pageSize, totalCount)}</span> of <span className="font-medium">{totalCount}</span> members
        </p>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setPage(p => p + 1)}
            disabled={page * pageSize >= totalCount}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <MemberAssignmentDialog 
        member={assigningMember}
        open={!!assigningMember}
        onOpenChange={(open) => !open && setAssigningMember(null)}
        onSuccess={() => {
          fetchMembers();
          fetchPendingApprovals();
        }}
      />
    </div>
  );
}
