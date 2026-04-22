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
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

const chartData = [
  { month: "Jan", amount: 4500 },
  { month: "Feb", amount: 5200 },
  { month: "Mar", amount: 4800 },
  { month: "Apr", amount: 6100 },
  { month: "May", amount: 5900 },
  { month: "Jun", amount: 7200 },
];

import { useAuth } from "@/src/contexts/AuthContext";

export default function Giving() {
  const { loading: authLoading } = useAuth();
  const [donations, setDonations] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState({
    total: 0,
    donors: 0,
    avg: 0,
    target: 25000
  });
  const [loading, setLoading] = React.useState(true);
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);

  const fetchGivingData = async (retries = 3) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const total = data?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
      const uniqueDonors = new Set(data?.map(d => d.user_id)).size;
      const avg = data?.length ? total / data.length : 0;

      setDonations(data || []);
      setStats(prev => ({ ...prev, total, donors: uniqueDonors, avg }));
    } catch (error: any) {
      if (error?.message?.includes("Lock") && retries > 0) {
        setTimeout(() => fetchGivingData(retries - 1), 500);
        return;
      }
      console.error("Error fetching giving data:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!authLoading) {
      fetchGivingData();
    }
  }, [authLoading]);

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

  const generateStatement = () => {
    setIsGenerating(true);
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Generating your annual giving statement...',
        success: 'Statement generated! Check your downloads.',
        error: 'Failed to generate statement.',
        finally: () => setIsGenerating(false)
      }
    );
  };

  const fundDistribution = React.useMemo(() => {
    const counts: Record<string, number> = {};
    donations.forEach(d => {
      counts[d.category] = (counts[d.category] || 0) + (d.amount || 0);
    });
    return Object.entries(counts).map(([name, value], i) => ({
      name,
      value,
      color: `hsl(var(--primary), ${1 - i * 0.2})`
    }));
  }, [donations]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Giving & Stewardship</h1>
          <p className="text-muted-foreground">Manage church finances, track donations, and generate reports.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 h-11 px-5 rounded-xl border-none shadow-sm bg-card/50" onClick={generateStatement} disabled={isGenerating}>
            <FileText className="w-4 h-4" />
            Annual Statement
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-6 rounded-xl shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" />
              Record Donation
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Record Donation</DialogTitle>
                <DialogDescription>Manually record a donation or tithe received.</DialogDescription>
              </DialogHeader>
              <DonationForm 
                onSuccess={() => {
                  setIsAddOpen(false);
                  fetchGivingData();
                }} 
                onCancel={() => setIsAddOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Giving (YTD)</CardTitle>
            <DollarSign className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">₦{stats.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <div className="flex items-center mt-2 gap-1.5">
              <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[10px] font-bold">
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                +15.2%
              </Badge>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">vs last year</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Donors</CardTitle>
            <Users className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{stats.donors}</div>
            <div className="flex items-center mt-2 gap-1.5">
              <Badge className="bg-blue-500/10 text-blue-600 border-none text-[10px] font-bold">
                <Plus className="w-3 h-3 mr-0.5" />
                8
              </Badge>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">new this month</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Avg. Donation</CardTitle>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">₦{stats.avg.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <div className="flex items-center mt-2 gap-1.5">
              <Badge className="bg-amber-500/10 text-amber-600 border-none text-[10px] font-bold">
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                +4.1%
              </Badge>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">per transaction</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-md bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold">Giving Trends</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Monthly Revenue Overview</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase rounded-lg">
              Full Report
            </Button>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorGiving" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '16px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorGiving)" 
                    strokeWidth={4}
                    dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-md bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden flex flex-col">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Fund Allocation</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Distribution by Category</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={fundDistribution.length > 0 ? fundDistribution : [{ name: 'Empty', value: 1, color: '#ccc' }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {fundDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-6">
              {fundDistribution.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="p-6 pt-0">
            <div className="w-full p-4 bg-primary/5 rounded-2xl border border-primary/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest">Monthly Goal</span>
                <span className="text-[10px] font-bold text-primary">75%</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "75%" }}
                  className="h-full bg-primary"
                />
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>

      <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold">Transaction History</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Detailed Donation Logs</CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder="Search donors..." className="h-9 pl-9 w-64 bg-background/50 border-none rounded-xl" />
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-none bg-background/50">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading ? (
              [1, 2, 3, 4].map(i => <div key={i} className="h-16 animate-pulse bg-muted/50 rounded-2xl" />)
            ) : donations.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <History className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">No transactions recorded yet.</p>
              </div>
            ) : (
              donations.map((donation, i) => (
                <motion.div 
                  key={donation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-2xl border bg-background/40 hover:bg-background/60 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <CreditCard className="w-6 h-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold">{donation.donor_name || 'Anonymous Ambassador'}</p>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        <Badge variant="outline" className="text-[8px] h-4 px-1.5 border-primary/20 text-primary uppercase">{donation.category}</Badge>
                        <span>•</span>
                        <Calendar className="w-3 h-3" />
                        {donation.created_at ? new Date(donation.created_at).toLocaleDateString() : 'TBD'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right space-y-1">
                      <p className="text-lg font-bold tracking-tight">₦{(donation.amount || 0).toFixed(2)}</p>
                      <div className="flex items-center justify-end gap-1.5">
                        <div className={cn("w-1.5 h-1.5 rounded-full", donation.status === 'completed' ? "bg-emerald-500" : "bg-amber-500")} />
                        <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">{donation.status}</span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <MoreVertical className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Transaction Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Download className="w-4 h-4 mr-2" /> Download Receipt
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ArrowRight className="w-4 h-4 mr-2" /> Reallocate Fund
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-destructive-foreground" onClick={() => handleDelete(donation.id)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete Record
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
        <CardFooter className="p-6 pt-0">
          <Button variant="ghost" className="w-full justify-between group/btn px-0 hover:bg-transparent">
            <span className="text-xs font-bold uppercase tracking-widest">Load More Transactions</span>
            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
