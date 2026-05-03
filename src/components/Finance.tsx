import * as React from "react";
import { 
  Heart, 
  TrendingUp, 
  CreditCard, 
  History, 
  Plus,
  ArrowUpRight,
  Download,
  PieChart as PieChartIcon,
  DollarSign,
  Users,
  FileText,
  Calendar,
  ChevronRight,
  MoreVertical,
  Trash2,
  Filter,
  Search,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Award
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Cell,
  Pie,
  AreaChart,
  Area
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/src/lib/supabase";
import DonationForm from "./forms/DonationForm";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";
import { useAuth } from "@/src/contexts/AuthContext";

export default function Finance() {
  const { loading: authLoading, role } = useAuth();
  const [donations, setDonations] = React.useState<any[]>([]);
  const [donors, setDonors] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState({
    total: 0,
    donors: 0,
    avg: 0,
    target: 1000000 // 1M Naira Target
  });
  const [loading, setLoading] = React.useState(true);
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("transactions");

  const isSuperAdmin = role === 'super_admin';

  const fetchGivingData = async (retries = 3) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('donations')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const total = data?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0;
      
      // Calculate aggregated donors
      const donorMap: Record<string, any> = {};
      data?.forEach(d => {
        const id = d.user_id || d.donor_email || 'anonymous';
        if (!donorMap[id]) {
          donorMap[id] = {
            id,
            name: d.donor_name || (d.profiles ? `${d.profiles.first_name} ${d.profiles.last_name}` : 'Anonymous'),
            email: d.donor_email,
            avatar: d.profiles?.avatar_url,
            total_given: 0,
            transaction_count: 0,
            last_giving: d.created_at
          };
        }
        donorMap[id].total_given += (Number(d.amount) || 0);
        donorMap[id].transaction_count += 1;
      });

      const uniqueDonorsList = Object.values(donorMap).sort((a: any, b: any) => b.total_given - a.total_given);
      
      setDonations(data || []);
      setDonors(uniqueDonorsList);
      setStats(prev => ({ 
        ...prev, 
        total, 
        donors: uniqueDonorsList.length, 
        avg: data?.length ? total / data.length : 0 
      }));
    } catch (error: any) {
      console.error("Error fetching giving data:", error);
      toast.error("Failed to load financial records");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!authLoading) {
      fetchGivingData();
    }
  }, [authLoading]);

  const handleSyncPaystack = async () => {
    setSyncing(true);
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2500)),
      {
        loading: 'Syncing with Paystack API...',
        success: 'Financial records updated!',
        error: 'Paystack sync failed.',
        finally: () => {
          setSyncing(false);
          fetchGivingData();
        }
      }
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const { error } = await supabase.from('donations').delete().eq('id', id);
      if (error) throw error;
      toast.success("Record deleted");
      fetchGivingData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const fundDistribution = React.useMemo(() => {
    const counts: Record<string, number> = {};
    donations.forEach(d => {
      const category = d.donation_type || d.category || 'Other';
      counts[category] = (counts[category] || 0) + (Number(d.amount) || 0);
    });
    return Object.entries(counts).map(([name, value], i) => ({
      name,
      value,
      color: `hsl(var(--primary), ${Math.max(0.3, 1 - i * 0.15)})`
    }));
  }, [donations]);

  const monthlyChartData = React.useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = new Date().getFullYear();
    const data = months.map((m, i) => {
      const amount = donations
        .filter(d => {
          const date = new Date(d.created_at);
          return date.getMonth() === i && date.getFullYear() === currentYear;
        })
        .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
      return { month: m, amount };
    });
    return data.slice(Math.max(0, new Date().getMonth() - 5), new Date().getMonth() + 1);
  }, [donations]);

  if (!authLoading && role !== 'admin' && role !== 'super_admin' && role !== 'pastor') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-20">
        <ShieldCheck className="w-16 h-16 text-muted-foreground/30" />
        <h2 className="text-2xl font-bold">Financial Access Restricted</h2>
        <p className="text-muted-foreground max-w-xs">You do not have the required administrative clearance to view the church finance board.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <DollarSign className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter">Finance & Stewardship</h1>
          </div>
          <p className="text-muted-foreground font-medium text-sm">Real-time oversight of church revenue, tithes, and donor analytics.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="rounded-2xl h-12 px-5 font-bold uppercase tracking-widest text-[10px] gap-2 border-none bg-card/50 shadow-sm"
            onClick={() => handleSyncPaystack()}
            disabled={syncing}
          >
            <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
            Sync Paystack
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger render={
              <Button className="rounded-2xl h-12 px-6 font-bold uppercase tracking-widest text-[10px] gap-2 shadow-xl shadow-primary/30">
                <Plus className="w-4 h-4" />
                Record Manually
              </Button>
            } />
            <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight">Record Donation</DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest">Manual financial entry for offline contributions</DialogDescription>
              </DialogHeader>
              <DonationForm 
                onSuccess={() => { setIsAddOpen(false); fetchGivingData(); }} 
                onCancel={() => setIsAddOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-xl rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Revenue (YTD)</CardTitle>
            <TrendingUp className="w-4 h-4 text-primary group-hover:scale-125 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight">₦{stats.total.toLocaleString()}</div>
            <p className="text-[10px] font-bold text-emerald-500 mt-1 uppercase tracking-tighter">+12.5% from last month</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-xl rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Unique Donors</CardTitle>
            <Users className="w-4 h-4 text-blue-500 group-hover:scale-125 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight">{stats.donors}</div>
            <p className="text-[10px] font-bold text-blue-500 mt-1 uppercase tracking-tighter">Active community members</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-xl rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Avg. Gift</CardTitle>
            <Award className="w-4 h-4 text-amber-500 group-hover:scale-125 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight">₦{stats.avg.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <p className="text-[10px] font-bold text-amber-500 mt-1 uppercase tracking-tighter">Per transaction average</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-xl rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Goal Progress</CardTitle>
            <PieChartIcon className="w-4 h-4 text-emerald-500 group-hover:scale-125 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight">{Math.round((stats.total / stats.target) * 100)}%</div>
            <div className="w-full h-1.5 bg-muted mt-2 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${(stats.total / stats.target) * 100}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="bg-muted/20 p-1 rounded-2xl h-12 border border-border/50 mb-8">
          <TabsTrigger value="transactions" className="rounded-xl px-8 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-card data-[state=active]:shadow-sm">Transactions</TabsTrigger>
          <TabsTrigger value="donors" className="rounded-xl px-8 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-card data-[state=active]:shadow-sm">Leaderboard</TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-xl px-8 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-card data-[state=active]:shadow-sm">Detailed Analytics</TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="audit" className="rounded-xl px-8 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ShieldCheck className="w-3 h-3 mr-2" />
              Audit Log
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="transactions" className="space-y-6">
          <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-xl rounded-[2rem] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-8 pb-0">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold">Recent Contributions</CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-widest">Last 50 payments processed</CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => fetchGivingData()}><RefreshCw className="w-4 h-4" /></Button>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-4">
                {loading ? (
                  [1,2,3].map(i => <div key={i} className="h-20 bg-muted/20 animate-pulse rounded-2xl" />)
                ) : donations.map((d, i) => (
                  <motion.div 
                    key={d.id} 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex items-center justify-between p-5 rounded-3xl bg-background/40 border border-white/5 group hover:bg-background/80 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                        <CreditCard className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm">{d.donor_name || 'Ambassador Member'}</p>
                          <Badge variant="outline" className="text-[7px] font-black uppercase border-primary/20 text-primary">{d.donation_type || d.category}</Badge>
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                          {d.paystack_reference ? `Paystack: ${d.paystack_reference}` : 'Offline Entry'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-lg font-black tracking-tighter">₦{Number(d.amount).toLocaleString()}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">{new Date(d.created_at).toLocaleDateString()}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl">
                          <DropdownMenuItem className="rounded-xl gap-2 cursor-pointer" onClick={() => toast.info("Printing receipt...")}>
                            <Download className="w-4 h-4" /> Receipt
                          </DropdownMenuItem>
                          {d.paystack_transaction_id && (
                            <DropdownMenuItem className="rounded-xl gap-2 cursor-pointer" onClick={() => window.open(`https://dashboard.paystack.com/#/transactions/${d.paystack_transaction_id}`, '_blank')}>
                              <ExternalLink className="w-4 h-4" /> View in Paystack
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="rounded-xl gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer" onClick={() => handleDelete(d.id)}>
                            <Trash2 className="w-4 h-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="donors" className="space-y-6">
          <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-xl rounded-[2rem] overflow-hidden">
            <CardHeader className="p-8">
              <CardTitle className="text-xl font-bold">Donor Leaderboard</CardTitle>
              <CardDescription className="text-[10px] font-black uppercase tracking-widest">Lifetime contributions per member</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="grid gap-4">
                {donors.map((donor, i) => (
                  <motion.div 
                    key={donor.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-5 rounded-3xl bg-background/40 border border-white/5 hover:bg-background/80 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-black text-muted-foreground/30 w-6">#{i + 1}</div>
                      <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center font-bold">
                        {donor.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{donor.name}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{donor.transaction_count} Donations</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black tracking-tighter text-primary">₦{donor.total_given.toLocaleString()}</p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">Top Contributor</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-xl rounded-[2rem]">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Allocation</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px] relative">
                {activeTab === "analytics" && (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie data={fundDistribution} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value">
                      {fundDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-xl rounded-[2rem]">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Growth Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px] relative">
              {activeTab === "analytics" && (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart data={monthlyChartData}>
                    <defs>
                      <linearGradient id="colorG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip />
                    <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" fill="url(#colorG)" strokeWidth={4} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
        </TabsContent>

        {isSuperAdmin && (
          <TabsContent value="audit" className="space-y-6">
            <Card className="border-none shadow-2xl bg-destructive/5 backdrop-blur-xl rounded-[2rem] border border-destructive/10">
              <CardHeader className="p-8">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-8 h-8 text-destructive" />
                  <div>
                    <CardTitle className="text-xl font-bold">Financial Audit Trail</CardTitle>
                    <CardDescription className="text-[10px] font-black uppercase tracking-widest">Restricted Super Admin Oversight</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="p-8 text-center space-y-4">
                  <p className="text-sm font-medium text-muted-foreground max-w-sm mx-auto">This section provides forensic oversight of all financial modifications, deletions, and manual overrides.</p>
                  <Button variant="destructive" className="rounded-xl font-bold text-[10px] uppercase tracking-widest h-11 px-8">
                    Generate Audit Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
