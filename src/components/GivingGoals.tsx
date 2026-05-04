import * as React from "react";
import {
  Target,
  TrendingUp,
  Users,
  Calendar,
  Plus,
  Heart,
  DollarSign,
  Activity,
  ChevronRight,
  MoreVertical,
  Trash2,
  Edit2,
  Eye,
  CreditCard,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "motion/react";
import { toast } from "sonner";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/contexts/AuthContext";

export default function GivingGoals() {
  const { user, role } = useAuth();
  const [goals, setGoals] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  if (role !== 'admin' && role !== 'super_admin' && role !== 'pastor') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
        <Heart className="w-16 h-16 text-muted-foreground/30" />
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground">You do not have permission to view giving goals.</p>
      </div>
    );
  }
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingGoal, setEditingGoal] = React.useState<any>(null);
  const [viewingDonors, setViewingDonors] = React.useState<any>(null);
  const [donors, setDonors] = React.useState<any[]>([]);
  const [donorsLoading, setDonorsLoading] = React.useState(false);

  const [form, setForm] = React.useState({
    name: "",
    description: "",
    goal_amount: "",
    deadline: "",
    is_active: true,
    show_progress: true,
    is_building_fund: false,
  });
  const [saving, setSaving] = React.useState(false);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      // Fetch all active categories that have a goal amount or show progress
      const { data, error } = await supabase
        .from("donation_categories")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setGoals(data || []);
    } catch (err) {
      console.error("Error fetching goals:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchGoals();
  }, []);

  const fetchDonors = async (goal: any) => {
    setDonorsLoading(true);
    setDonors([]);
    try {
      const { data } = await supabase
        .from("donations")
        .select("*")
        .eq("category_id", goal.id)
        .order("created_at", { ascending: false });
      setDonors(data || []);
    } catch (err) {
      console.error("Error fetching donors:", err);
    } finally {
      setDonorsLoading(false);
    }
  };

  const openDonors = (goal: any) => {
    setViewingDonors(goal);
    fetchDonors(goal);
  };

  const openEdit = (goal: any) => {
    setEditingGoal(goal);
    setForm({
      name: goal.name || "",
      description: goal.description || "",
      goal_amount: goal.goal_amount?.toString() || "",
      deadline: goal.deadline || "",
      is_active: goal.is_active ?? true,
      show_progress: goal.show_progress ?? true,
      is_building_fund: goal.is_building_fund ?? false,
    });
  };

  const resetForm = () => {
    setForm({ 
      name: "", 
      description: "", 
      goal_amount: "", 
      deadline: "", 
      is_active: true, 
      show_progress: true,
      is_building_fund: false 
    });
    setEditingGoal(null);
    setIsCreateOpen(false);
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  };

  const handleSave = async () => {
    if (!form.name || !form.goal_amount) {
      toast.error("Name and goal amount are required");
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name: form.name,
        description: form.description || null,
        goal_amount: parseFloat(form.goal_amount),
        deadline: form.deadline || null,
        is_active: form.is_active,
        show_progress: form.show_progress,
        is_building_fund: form.is_building_fund,
        updated_at: new Date().toISOString()
      };

      if (editingGoal) {
        const { error } = await supabase
          .from("donation_categories")
          .update(payload)
          .eq("id", editingGoal.id);
        if (error) throw error;
        toast.success("Campaign updated ✅");
      } else {
        payload.slug = generateSlug(form.name);
        const { error } = await supabase
          .from("donation_categories")
          .insert(payload);
        if (error) throw error;
        toast.success("Campaign created 🎯");
      }
      resetForm();
      fetchGoals();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this donation campaign? This may affect existing donations.")) return;
    const { error } = await supabase.from("donation_categories").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Campaign deleted");
    fetchGoals();
  };

  const totalRaised = goals.reduce((s, g) => s + (Number(g.current_amount) || 0), 0);
  const activeCount = goals.filter(g => g.is_active).length;
  const completedCount = goals.filter(g => (Number(g.current_amount) || 0) >= (Number(g.goal_amount) || 1)).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/20">
            <Target className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter">Fundraising Campaigns</h1>
            <p className="text-muted-foreground text-sm font-medium">Manage giving goals from donation categories.</p>
          </div>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-2xl h-12 px-6 font-bold uppercase tracking-widest text-[10px] gap-2 shadow-xl shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="w-4 h-4" /> New Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Total Collected", value: `₦${totalRaised.toLocaleString()}`, icon: Heart, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Active Campaigns", value: activeCount, icon: Activity, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Goals Met", value: completedCount, icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-500/10" },
        ].map(stat => (
          <Card key={stat.label} className="border-none shadow-xl bg-card/50 backdrop-blur-xl rounded-3xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-3 ${stat.bg} rounded-2xl ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black">{stat.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Goals Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse bg-muted/40 rounded-3xl" />
          ))
        ) : goals.length === 0 ? (
          <div className="col-span-full py-20 text-center space-y-4 bg-muted/20 rounded-3xl border-2 border-dashed">
            <Target className="w-14 h-14 text-muted-foreground mx-auto opacity-40" />
            <div>
              <h3 className="font-bold text-xl">No campaigns yet</h3>
              <p className="text-muted-foreground text-sm">Create your first donation category to start tracking goals.</p>
            </div>
            <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl mt-2">
              <Plus className="w-4 h-4 mr-2" /> Create First Campaign
            </Button>
          </div>
        ) : goals.map((goal) => {
          const current = Number(goal.current_amount || 0);
          const target = Number(goal.goal_amount || 0);
          const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
          
          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative bg-card/50 backdrop-blur-xl p-7 rounded-3xl shadow-xl border border-border/40 hover:shadow-2xl transition-all duration-500"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="space-y-1.5">
                  {goal.deadline && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      <Calendar className="w-3 h-3" />
                      Deadline: {new Date(goal.deadline).toLocaleDateString()}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black tracking-tight">{goal.name}</h3>
                    {goal.is_building_fund && (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[8px] font-bold uppercase tracking-widest">
                        Building Fund
                      </Badge>
                    )}
                  </div>
                  {goal.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{goal.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-[9px] font-bold border-none ${goal.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                    {goal.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-full hover:bg-muted outline-none">
                      <MoreVertical className="w-4 h-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => openDonors(goal)}>
                        <Eye className="w-4 h-4 mr-2" /> See Donors
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEdit(goal)}>
                        <Edit2 className="w-4 h-4 mr-2" /> Edit Campaign
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-destructive-foreground" onClick={() => handleDelete(goal.id)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-muted-foreground uppercase tracking-widest">Progress</span>
                  <span className="text-emerald-600">{pct}%</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                  />
                </div>
                <div className="flex items-center justify-between text-sm font-bold">
                  <span>₦{current.toLocaleString()}</span>
                  <span className="text-muted-foreground">of ₦{target.toLocaleString()}</span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => openDonors(goal)}
                className="w-full mt-4 rounded-xl h-9 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500/10 hover:text-emerald-600 justify-between group/btn"
              >
                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> View Contributions</span>
                <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          );
        })}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={isCreateOpen || !!editingGoal} onOpenChange={open => !open && resetForm()}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGoal ? "Edit Campaign" : "Create Campaign"}</DialogTitle>
            <DialogDescription>Manage donation categories and their fundraising goals.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Campaign Name *</label>
              <Input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Building Fund 2025"
                className="rounded-xl h-11 bg-muted/30 border-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Description</label>
              <Textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="What is this campaign for?"
                className="rounded-xl bg-muted/30 border-none resize-none min-h-[80px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Goal Amount (₦) *</label>
                <Input
                  type="number"
                  value={form.goal_amount}
                  onChange={e => setForm(p => ({ ...p, goal_amount: e.target.value }))}
                  placeholder="e.g. 5000000"
                  className="rounded-xl h-11 bg-muted/30 border-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Deadline</label>
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                  className="rounded-xl h-11 bg-muted/30 border-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest">Active</p>
                  <p className="text-[8px] text-muted-foreground">Accepting donations</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={form.is_active} 
                  onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                  className="accent-emerald-500"
                />
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest">Progress</p>
                  <p className="text-[8px] text-muted-foreground">Show progress bar</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={form.show_progress} 
                  onChange={e => setForm(p => ({ ...p, show_progress: e.target.checked }))}
                  className="accent-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Building Fund</p>
                <p className="text-[8px] text-emerald-600/70">Main dashboard featured goal</p>
              </div>
              <input 
                type="checkbox" 
                checked={form.is_building_fund} 
                onChange={e => setForm(p => ({ ...p, is_building_fund: e.target.checked }))}
                className="accent-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={resetForm} className="rounded-xl h-11">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="rounded-xl h-11 px-8 shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white">
                {saving ? "Saving..." : editingGoal ? "Update Campaign" : "Create Campaign"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Donors Panel Dialog */}
      <Dialog open={!!viewingDonors} onOpenChange={open => !open && setViewingDonors(null)}>
        <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-emerald-500" />
              Contributions — {viewingDonors?.name}
            </DialogTitle>
            <DialogDescription>
              {donorsLoading ? "Loading..." : `${donors.length} transaction${donors.length !== 1 ? 's' : ''} recorded`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {donorsLoading ? (
              [1, 2, 3].map(i => <div key={i} className="h-14 bg-muted/30 rounded-xl animate-pulse" />)
            ) : donors.length === 0 ? (
              <div className="py-14 text-center space-y-3">
                <CreditCard className="w-12 h-12 text-muted-foreground mx-auto opacity-30" />
                <p className="text-muted-foreground font-semibold">No donations recorded yet</p>
                <p className="text-xs text-muted-foreground">Transactions are pulled from the <span className="font-bold text-emerald-600 uppercase tracking-tighter">{viewingDonors?.name}</span> category.</p>
              </div>
            ) : donors.map((d: any) => (
              <div key={d.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/40">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 font-bold text-emerald-600 text-sm">
                  {(d.donor_name || d.donor_email || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{d.is_anonymous ? 'Anonymous' : (d.donor_name || d.donor_email || 'Unknown')}</p>
                  <p className="text-xs text-muted-foreground">{d.created_at ? new Date(d.created_at).toLocaleDateString() : ''}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-emerald-600">₦{(d.amount || 0).toLocaleString()}</p>
                  <Badge className={`text-[9px] border-none ${d.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                    {d.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
