import * as React from "react";
import { 
  Target, 
  TrendingUp, 
  Users, 
  Calendar, 
  Plus, 
  ArrowUpRight, 
  Heart, 
  DollarSign,
  PieChart,
  Activity,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

import { supabase } from "@/src/lib/supabase";

export default function GivingGoals() {
  const [goals, setGoals] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState({
    totalRaised: 0,
    activeDonors: 0,
    activeCampaigns: 0,
    completedGoals: 0
  });
  const [loading, setLoading] = React.useState(true);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('donation_categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);

      // Calculate Stats
      const total = data?.reduce((acc, curr) => acc + (curr.current_amount || 0), 0) || 0;
      const active = data?.filter(g => g.is_active).length || 0;
      const completed = data?.filter(g => (g.current_amount || 0) >= (g.goal_amount || 0)).length || 0;
      const donors = 0; // donor_count does not exist on donation_categories table

      setStats({
        totalRaised: total,
        activeDonors: donors,
        activeCampaigns: active,
        completedGoals: completed
      });
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchGoals();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Target className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter">Giving Goals</h1>
          </div>
          <p className="text-muted-foreground font-medium">Track progress on church projects, fundraising campaigns, and community outreach goals.</p>
        </div>
        <Button className="rounded-2xl h-12 px-6 font-bold uppercase tracking-widest text-[10px] gap-2 shadow-xl shadow-primary/20">
          <Plus className="w-4 h-4" />
          New Campaign
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-xl rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <DollarSign className="w-5 h-5" />
            </div>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-none text-[8px] font-bold">+18%</Badge>
          </div>
          <p className="text-2xl font-black">₦{stats.totalRaised.toLocaleString()}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Raised</p>
        </Card>
        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-xl rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600">
              <Users className="w-5 h-5" />
            </div>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-none text-[8px] font-bold">LIVE</Badge>
          </div>
          <p className="text-2xl font-black">{stats.activeDonors}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active Donors</p>
        </Card>
        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-xl rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-600">
              <Activity className="w-5 h-5" />
            </div>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-none text-[8px] font-bold">ACTIVE</Badge>
          </div>
          <p className="text-2xl font-black">{stats.activeCampaigns}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Running Campaigns</p>
        </Card>
        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-xl rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-600">
              <Heart className="w-5 h-5" />
            </div>
            <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-none text-[8px] font-bold">COMPLETED</Badge>
          </div>
          <p className="text-2xl font-black">{stats.completedGoals}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reached Goals</p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-64 animate-pulse bg-muted/50 rounded-[2.5rem] border-none" />
          ))
        ) : goals.length === 0 ? (
          <div className="col-span-full py-20 text-center space-y-4 bg-muted/20 rounded-3xl border-2 border-dashed">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Target className="w-10 h-10 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-xl">No active campaigns</h3>
              <p className="text-muted-foreground">Create your first goal to start tracking progress.</p>
            </div>
          </div>
        ) : (
          goals.map((goal) => {
            const percentage = Math.min(100, Math.round(((goal.current_amount || 0) / (goal.goal_amount || 1)) * 100));
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                className="bg-card/50 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl border border-border/50 group transition-all"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="space-y-1">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-none text-[8px] font-bold uppercase tracking-widest mb-2">
                      {goal.category || 'General'}
                    </Badge>
                    <h3 className="text-xl font-black tracking-tight">{goal.name}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-primary">{percentage}%</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Funded</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                      <span className="text-muted-foreground">Progress</span>
                      <span>₦{(goal.current_amount || 0).toLocaleString()} / ₦{(goal.goal_amount || 0).toLocaleString()}</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden p-0.5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-primary rounded-full shadow-[0_0_12px_rgba(var(--primary),0.4)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Donors</span>
                      </div>
                      <p className="text-sm font-black">{goal.donor_count || 0}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Deadline</span>
                      </div>
                      <p className="text-sm font-black">{goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'No Limit'}</p>
                    </div>
                    <div className="flex items-end justify-end">
                      <Button variant="ghost" size="sm" className="rounded-xl h-9 px-4 text-[10px] font-bold uppercase tracking-widest hover:bg-primary/10 hover:text-primary group/btn">
                        Details
                        <ChevronRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
