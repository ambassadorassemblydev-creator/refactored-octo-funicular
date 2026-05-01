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

  // Form state
  const [form, setForm] = React.useState({
    title: "",
    description: "",
    target_amount: "",
    start_date: "",
    end_date: "",
    donation_type: "tithe",
  });
  const [saving, setSaving] = React.useState(false);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("giving_goals" as any)
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
        .eq("donation_type", goal.donation_type)
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
      title: goal.title || "",
      description: goal.description || "",
      target_amount: goal.target_amount?.toString() || "",
      start_date: goal.start_date || "",
      end_date: goal.end_date || "",
      donation_type: goal.donation_type || "tithe",
    });
  };

  const resetForm = () => {
    setForm({ title: "", description: "", target_amount: "", start_date: "", end_date: "", donation_type: "tithe" });
    setEditingGoal(null);
    setIsCreateOpen(false);
  };

  const handleSave = async () => {
    if (!form.title || !form.target_amount) {
      toast.error("Title and target amount are required");
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        title: form.title,
        description: form.description || null,
        target_amount: parseFloat(form.target_amount),
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        donation_type: form.donation_type,
        is_active: true,
      };

      if (editingGoal) {
        const { error } = await (supabase.from("giving_goals" as any) as any)
          .update(payload)
          .eq("id", editingGoal.id);
        if (error) throw error;
        toast.success("Goal updated ✅");
      } else {
        payload.created_by = user?.id;
        const { error } = await (supabase.from("giving_goals" as any) as any).insert(payload);
        if (error) throw error;
        toast.success("Goal created 🎯");
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
    if (!confirm("Delete this giving goal?")) return;
    const { error } = await (supabase.from("giving_goals" as any) as any).delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Goal deleted");
    fetchGoals();
  };

  const totalRaised = goals.reduce((s, g) => s + (g.current_amount || 0), 0);
  const active = goals.filter(g => g.is_active).length;
  const completed = goals.filter(g => (g.current_amount || 0) >= (g.target_amount || 1)).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
            <Target className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter">Giving Goals</h1>
            <p className="text-muted-foreground text-sm font-medium">Track fundraising campaigns and see who's contributing.</p>
          </div>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-2xl h-12 px-6 font-bold uppercase tracking-widest text-[10px] gap-2 shadow-xl shadow-primary/20"
        >
          <Plus className="w-4 h-4" /> New Goal
        </Button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Total Raised", value: `₦${totalRaised.toLocaleString()}`, icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
          { label: "Active Campaigns", value: active, icon: Activity, color: "text-amber-600", bg: "bg-amber-500/10" },
          { label: "Goals Completed", value: completed, icon: Heart, color: "text-purple-600", bg: "bg-purple-500/10" },
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
              <h3 className="font-bold text-xl">No giving goals yet</h3>
              <p className="text-muted-foreground text-sm">Create your first campaign to start tracking progress.</p>
            </div>
            <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl mt-2">
              <Plus className="w-4 h-4 mr-2" /> Create First Goal
            </Button>
          </div>
        ) : goals.map((goal) => {
          const pct = Math.min(100, Math.round(((goal.current_amount || 0) / (goal.target_amount || 1)) * 100));
          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative bg-card/50 backdrop-blur-xl p-7 rounded-3xl shadow-xl border border-border/40 hover:shadow-2xl transition-all duration-500"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="space-y-1.5">
                  {goal.end_date && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      <Calendar className="w-3 h-3" />
                      Ends {new Date(goal.end_date).toLocaleDateString()}
                    </div>
                  )}
                  <h3 className="text-lg font-black tracking-tight">{goal.title}</h3>
                  {goal.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{goal.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-[9px] font-bold border-none ${goal.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                    {goal.is_active ? 'ACTIVE' : 'CLOSED'}
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
                        <Edit2 className="w-4 h-4 mr-2" /> Edit Goal
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
                  <span className="text-primary">{pct}%</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
                <div className="flex items-center justify-between text-sm font-bold">
                  <span>₦{(goal.current_amount || 0).toLocaleString()}</span>
                  <span className="text-muted-foreground">of ₦{(goal.target_amount || 0).toLocaleString()}</span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => openDonors(goal)}
                className="w-full mt-4 rounded-xl h-9 text-[10px] font-bold uppercase tracking-widest hover:bg-primary/10 hover:text-primary justify-between group/btn"
              >
                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> View Donors</span>
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
            <DialogTitle>{editingGoal ? "Edit Goal" : "Create Giving Goal"}</DialogTitle>
            <DialogDescription>Set a fundraising target for a campaign or project.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Title *</label>
              <Input
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Building Fund 2025"
                className="rounded-xl h-11 bg-muted/30 border-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Description</label>
              <Textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="What is this goal for?"
                className="rounded-xl bg-muted/30 border-none resize-none min-h-[80px]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Link to Fund Type *</label>
              <Select value={form.donation_type} onValueChange={(v: string | null) => setForm(p => ({ ...p, donation_type: v || 'tithe' }))}>
                <SelectTrigger className="rounded-xl h-11 bg-muted/30 border-none">
                  <SelectValue placeholder="Select fund type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tithe">Tithe</SelectItem>
                  <SelectItem value="offering">Offering</SelectItem>
                  <SelectItem value="building_fund">Building Fund</SelectItem>
                  <SelectItem value="special">Special Seed</SelectItem>
                  <SelectItem value="welfare">Welfare Fund</SelectItem>
                  <SelectItem value="missions">Missions</SelectItem>
                  <SelectItem value="other">General / Other</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[9px] text-muted-foreground italic">Contributions to this fund type will automatically count towards this goal.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Target Amount (₦) *</label>
              <Input
                type="number"
                value={form.target_amount}
                onChange={e => setForm(p => ({ ...p, target_amount: e.target.value }))}
                placeholder="e.g. 5000000"
                className="rounded-xl h-11 bg-muted/30 border-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Start Date</label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                  className="rounded-xl h-11 bg-muted/30 border-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">End Date</label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
                  className="rounded-xl h-11 bg-muted/30 border-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={resetForm} className="rounded-xl h-11">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="rounded-xl h-11 px-8 shadow-lg shadow-primary/20">
                {saving ? "Saving..." : editingGoal ? "Update Goal" : "Create Goal"}
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
              <Heart className="w-5 h-5 text-primary" />
              Donors — {viewingDonors?.title}
            </DialogTitle>
            <DialogDescription>
              {donorsLoading ? "Loading..." : `${donors.length} contribution${donors.length !== 1 ? 's' : ''} recorded`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {donorsLoading ? (
              [1, 2, 3].map(i => <div key={i} className="h-14 bg-muted/30 rounded-xl animate-pulse" />)
            ) : donors.length === 0 ? (
              <div className="py-14 text-center space-y-3">
                <CreditCard className="w-12 h-12 text-muted-foreground mx-auto opacity-30" />
                <p className="text-muted-foreground font-semibold">No donations recorded for this goal yet</p>
                <p className="text-xs text-muted-foreground">Donations are matched by the linked fund type: <span className="font-bold text-primary uppercase tracking-tighter">{viewingDonors?.donation_type?.replace('_',' ')}</span></p>
              </div>
            ) : donors.map((d: any) => (
              <div key={d.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/40">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 font-bold text-primary text-sm">
                  {(d.donor_name || d.donor_email || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{d.is_anonymous ? 'Anonymous' : (d.donor_name || d.donor_email || 'Unknown')}</p>
                  <p className="text-xs text-muted-foreground">{d.created_at ? new Date(d.created_at).toLocaleDateString() : ''}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-primary">₦{(d.amount || 0).toLocaleString()}</p>
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
