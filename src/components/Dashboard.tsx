import * as React from "react";
import { 
  Users, 
  Calendar, 
  Heart, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
  Activity,
  ChevronRight,
  Plus,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  Building2,
  UserPlus,
  BookOpen,
  Settings
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const chartData = [
  { name: "Mon", attendance: 45, giving: 1200 },
  { name: "Tue", attendance: 52, giving: 900 },
  { name: "Wed", attendance: 85, giving: 2100 },
  { name: "Thu", attendance: 48, giving: 1100 },
  { name: "Fri", attendance: 65, giving: 1500 },
  { name: "Sat", attendance: 120, giving: 3400 },
  { name: "Sun", attendance: 450, giving: 8900 },
];

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description: string;
  trend?: "up" | "down";
  trendValue?: string;
  color?: string;
}

const StatCard = ({ title, value, icon: Icon, description, trend, trendValue, color }: StatCardProps) => (
  <motion.div
    whileHover={{ y: -5 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <Card className="overflow-hidden border-none shadow-md bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group relative">
      <div className={cn("absolute top-0 left-0 w-1 h-full", color || "bg-primary")} />
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</CardTitle>
        <div className="p-2 bg-muted rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
          <Icon className="w-4 h-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight mb-1">{value}</div>
        <div className="flex items-center gap-1.5">
          <div className={cn(
            "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
            trend === "up" ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"
          )}>
            {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trendValue}
          </div>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">{description}</span>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

import { useAuth } from "@/src/contexts/AuthContext";

interface DashboardProps {
  onTabChange?: (tab: string) => void;
}

interface ActivityItem {
  icon: React.ElementType;
  color: string;
  title: string;
  time: string;
  desc: string;
}

interface EventItem {
  id: string;
  title: string;
  start_date: string;
  location_name?: string | null;
  cover_image_url?: string | null;
}

interface ChartDataItem {
  name: string;
  giving: number;
  attendance: number;
}

export default function Dashboard({ onTabChange }: DashboardProps) {
  const { user, role, loading: authLoading } = useAuth();
  const [stats, setStats] = React.useState({
    members: 0,
    attendance: 0,
    giving: 0,
    ministries: 0,
    outreachTeams: 0
  });
  const [upcomingEvents, setUpcomingEvents] = React.useState<EventItem[]>([]);
  const [recentActivity, setRecentActivity] = React.useState<ActivityItem[]>([]);
  const [chartData, setChartData] = React.useState<ChartDataItem[]>([]);
  const [ministryDistribution, setMinistryDistribution] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<{ first_name: string | null; last_name: string | null; title: string | null; avatar_url: string | null } | null>(null);

  React.useEffect(() => {
    async function fetchDashboardData(retries = 3) {
      if (!user) return;
      
      try {
        // Fetch profile for personalized greeting
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name, title, avatar_url')
          .eq('id', user.id)
          .maybeSingle();
        if (profileData) setProfile(profileData);
        // Fetch Stats
        const [
          { count: memberCount },
          { data: givingData },
          { count: ministryCount },
          { count: departmentCount },
          { count: attendanceCount },
          { data: eventsData }
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('donations').select('amount'),
          supabase.from('ministries').select('*', { count: 'exact', head: true }),
          supabase.from('church_departments').select('*', { count: 'exact', head: true }),
          supabase.from('attendance_records').select('*', { count: 'exact', head: true }),
          supabase.from('events').select('*').gte('start_date', new Date().toISOString().split('T')[0]).order('start_date', { ascending: true }).limit(3)
        ]);

        const totalGiving = givingData?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;

        setStats({
          members: memberCount || 0,
          attendance: attendanceCount || 0,
          giving: totalGiving,
          ministries: ministryCount || 0,
          outreachTeams: departmentCount || 0
        });

        setUpcomingEvents(eventsData || []);

        // Fetch Recent Activity (Combining multiple sources)
        const [
          { data: recentMembers },
          { data: recentSermons },
          { data: recentDonations },
          { data: recentPrayers }
        ] = await Promise.all([
          supabase.from('profiles').select('first_name, last_name, created_at').order('created_at', { ascending: false }).limit(2),
          supabase.from('sermons').select('title, created_at').order('created_at', { ascending: false }).limit(2),
          supabase.from('donations').select('amount, donor_name, created_at').order('created_at', { ascending: false }).limit(2),
          supabase.from('prayer_requests').select('title, created_at').order('created_at', { ascending: false }).limit(2)
        ]);

        const activity = [
          ...(recentMembers?.map(m => ({ 
            icon: CheckCircle2, 
            color: "bg-emerald-500/10 text-emerald-600", 
            title: "New Member", 
            time: m.created_at ? new Date(m.created_at).toLocaleDateString() : 'Today', 
            desc: `${m.first_name} ${m.last_name} registered` 
          })) || []),
          ...(recentSermons?.map(s => ({ 
            icon: Clock, 
            color: "bg-amber-500/10 text-amber-600", 
            title: "Sermon Uploaded", 
            time: s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Today', 
            desc: s.title 
          })) || []),
          ...(recentDonations?.map(d => ({ 
            icon: Heart, 
            color: "bg-rose-500/10 text-rose-600", 
            title: "Donation", 
            time: d.created_at ? new Date(d.created_at).toLocaleDateString() : 'Today', 
            desc: `₦${d.amount || 0} from ${d.donor_name || 'Anonymous'}` 
          })) || []),
          ...(recentPrayers?.map(p => ({ 
            icon: MessageSquare, 
            color: "bg-blue-500/10 text-blue-600", 
            title: "Prayer Request", 
            time: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Today', 
            desc: p.title 
          })) || [])
        ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

        setRecentActivity(activity);

        // Fetch Chart Data (Giving and Member Growth over last 7 days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
        }).reverse();

        const [
          { data: dailyGiving },
          { data: dailyGrowth }
        ] = await Promise.all([
          supabase
            .from('donations')
            .select('amount, created_at')
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
          supabase
            .from('profiles')
            .select('created_at')
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        ]);

        const chart = last7Days.map(date => {
          const dayGiving = dailyGiving?.filter(d => d.created_at?.startsWith(date))
            .reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
          const dayGrowth = dailyGrowth?.filter(d => d.created_at?.startsWith(date)).length || 0;
          
          return {
            name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
            giving: dayGiving,
            attendance: dayGrowth // Using member growth as a proxy for attendance growth in the chart
          };
        });

        setChartData(chart);

        // Fetch Ministry Distribution
        const { data: ministries } = await supabase.from('ministries').select('name');
        if (ministries) {
          const colors = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
          const dist = ministries.slice(0, 5).map((m, i) => ({
            name: m.name,
            value: Math.floor(Math.random() * 100) + 20, // Mocking member count per ministry for now as there's no join table
            color: colors[i % colors.length]
          }));
          setMinistryDistribution(dist);
        }

      } catch (error: any) {
        if (error?.message?.includes("Lock") && retries > 0) {
          setTimeout(() => fetchDashboardData(retries - 1), 500);
          return;
        }
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchDashboardData();
    }
  }, [user, authLoading]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative">
      {/* Background Image with Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]">
        <img 
          src="https://res.cloudinary.com/dxwhpacz7/image/upload/v1775200226/IMG-20260304-WA0059_telyum.jpg" 
          className="w-full h-full object-cover" 
          alt="Background" 
        />
      </div>

      <div className="relative z-10 space-y-8">
        {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-primary p-6 md:p-12 text-primary-foreground shadow-2xl shadow-primary/20">

        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-black/10 rounded-full blur-2xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest">
              <Zap className="w-3 h-3 fill-current" />
              Ambassadors Assembly Panel
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight">
              Welcome back,<br /> 
              <span className="text-white/90">
                {profile?.title ? `${profile.title} ` : ''}
                {profile?.first_name || user?.user_metadata?.full_name?.split(' ')[0] || 'Ambassador'}
                {' '}{profile?.last_name || ''}
              </span>
            </h1>

            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3" />
                {role ? role.replace('_', ' ') : 'Member'}
              </span>
            </div>
            <p className="text-primary-foreground/80 max-w-md text-sm md:text-lg font-medium">
              Your church community is thriving. Here's a snapshot of the impact you're making today.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" className="rounded-xl font-bold uppercase tracking-widest text-[9px] md:text-[10px] h-9 md:h-11 px-4 md:px-6">
                Quick Actions
              </Button>
              <Button variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20 rounded-xl font-bold uppercase tracking-widest text-[9px] md:text-[10px] h-9 md:h-11 px-4 md:px-6">
                View Reports
              </Button>
            </div>

          </div>
          
          <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
            <div className="bg-white/10 backdrop-blur-md p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center">
              <Activity className="w-5 h-5 md:w-8 md:h-8 mb-1 md:mb-2 opacity-60" />
              <span className="text-xl md:text-3xl font-bold">{loading ? "..." : "98%"}</span>
              <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest opacity-60">Engagement</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center">
              <Users className="w-5 h-5 md:w-8 md:h-8 mb-1 md:mb-2 opacity-60" />
              <span className="text-xl md:text-3xl font-bold">+{loading ? "..." : stats.members}</span>
              <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest opacity-60">New Souls</span>
            </div>
          </div>

        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        <StatCard 
          title="Total Members" 
          value={loading ? "..." : stats.members.toLocaleString()} 
          icon={Users} 
          description="Active community members" 
          trend="up" 
          trendValue="+100%" 
          color="bg-blue-500"
        />
        <StatCard 
          title="Avg. Attendance" 
          value={loading ? "..." : stats.attendance.toLocaleString()} 
          icon={Calendar} 
          description="Average per service" 
          trend="up" 
          trendValue="+100%" 
          color="bg-emerald-500"
        />
        <StatCard 
          title="Total Giving" 
          value={loading ? "..." : `₦${stats.giving.toLocaleString()}`} 
          icon={Heart} 
          description="Total donations received" 
          trend="up" 
          trendValue="+100%" 
          color="bg-rose-500"
        />
        <StatCard 
          title="Active Ministries" 
          value={loading ? "..." : stats.ministries.toLocaleString()} 
          icon={ShieldCheck} 
          description="Spiritual outreach groups" 
          trend="up" 
          trendValue="+100%" 
          color="bg-amber-500"
        />
        <StatCard 
          title="Outreach & Impact" 
          value={loading ? "..." : stats.outreachTeams.toLocaleString()} 
          icon={Building2} 
          description="Community impact groups" 
          trend="up" 
          trendValue="+100%" 
          color="bg-indigo-500"
        />
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">

        {[
          { label: 'Add Member', icon: UserPlus, color: 'text-blue-500', bg: 'bg-blue-500/10', tab: 'members' },
          { label: 'New Event', icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-500/10', tab: 'events' },
          { label: 'Record Attendance', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', tab: 'attendance' },
          { label: 'Upload Sermon', icon: BookOpen, color: 'text-amber-500', bg: 'bg-amber-500/10', tab: 'sermons' },
          { label: 'New Prayer', icon: MessageSquare, color: 'text-rose-500', bg: 'bg-rose-500/10', tab: 'prayers' },
          { label: 'Settings', icon: Settings, color: 'text-slate-500', bg: 'bg-slate-500/10', tab: 'admin' },
        ].map((action, i) => (
          <Button 
            key={i} 
            variant="ghost" 
            onClick={() => onTabChange?.(action.tab)}
            className="h-auto py-4 flex-col gap-2 rounded-2xl bg-card/50 hover:bg-card hover:shadow-md transition-all border border-transparent hover:border-primary/10"
          >
            <div className={cn("p-2 rounded-xl", action.bg, action.color)}>
              <action.icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tighter">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-md bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold">Growth Analytics</CardTitle>
              <CardDescription className="text-xs uppercase tracking-widest font-bold">Weekly Performance</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase">Attendance</Button>
              <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase">Giving</Button>
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[350px] w-full min-h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.length > 0 ? chartData : chartData}>
                  <defs>
                    <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                  <XAxis 
                    dataKey="name" 
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
                    dataKey="attendance" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorAttendance)" 
                    strokeWidth={4}
                    dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-md bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden flex flex-col">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
            <CardDescription className="text-xs uppercase tracking-widest font-bold">Live Updates</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-6">
              {recentActivity.length > 0 ? recentActivity.map((item, i) => (
                <div 
                  key={i} 
                  className="flex gap-4 group cursor-pointer"
                  onClick={() => {
                    if (item.title === "New Member") onTabChange?.("members");
                    else if (item.title === "Sermon Uploaded") onTabChange?.("sermons");
                    else if (item.title === "New Donation") onTabChange?.("donations");
                    else if (item.title === "Prayer Request") onTabChange?.("prayers");
                    else if (item.title === "Admin Action") onTabChange?.("admin-audit");
                  }}
                >
                  <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", item.color)}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold leading-none">{item.title}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{item.time}</p>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{item.desc}</p>
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
                  <Activity className="w-8 h-8 text-muted-foreground/30" />
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="p-6 pt-0">
            <Button 
              variant="ghost" 
              className="w-full justify-between group/btn px-0 hover:bg-transparent"
              onClick={() => onTabChange?.("admin-audit")}
            >
              <span className="text-xs font-bold uppercase tracking-widest">View Full Audit Log</span>
              <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Ministry Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center min-h-[200px]">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ministryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {ministryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-4 justify-center pb-6">
            {ministryDistribution.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </CardFooter>
        </Card>

        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.length > 0 ? upcomingEvents.map((event) => (
                <div 
                  key={event.id} 
                  onClick={() => onTabChange?.('events')}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex flex-col items-center justify-center text-primary shrink-0">
                    <span className="text-[10px] font-black leading-none">{new Date(event.start_date).toLocaleString('en-US', { month: 'short' }).toUpperCase()}</span>
                    <span className="text-sm font-bold leading-none">{new Date(event.start_date).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate group-hover:text-primary transition-colors">{event.title}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">{event.location_name || 'Church Hall'}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              )) : (
                <p className="text-xs text-muted-foreground text-center py-4">No upcoming events</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="p-6 pt-0">
            <Button 
              variant="ghost" 
              onClick={() => onTabChange?.('events')}
              className="w-full text-[10px] font-bold uppercase tracking-widest h-8"
            >
              View Calendar
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden p-6 flex flex-col justify-between bg-gradient-to-br from-primary/5 to-transparent">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold">Giving Goal</h3>
              <p className="text-sm text-muted-foreground">You're ₦2,500 away from your monthly mission goal.</p>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "75%" }}
                className="h-full bg-emerald-500"
              />
            </div>
          </div>
          <Button variant="outline" className="w-full mt-6 rounded-xl font-bold uppercase tracking-widest text-[10px] h-11">
            View Campaigns
          </Button>
        </Card>
      </div>
      </div>
    </div>
  );
}
