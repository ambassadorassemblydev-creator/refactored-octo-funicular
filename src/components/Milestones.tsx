import * as React from "react";
import { 
  Cake, 
  Gift, 
  Calendar, 
  Search, 
  Filter, 
  Bell, 
  Mail, 
  Phone, 
  MoreVertical, 
  Star,
  PartyPopper,
  ChevronRight,
  Heart,
  Briefcase,
  Trophy,
  RotateCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { supabase } from "@/src/lib/supabase";
import type { Database } from "@/src/types/database.types";
import { Loader2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import SendEmailDialog from "./SendEmailDialog";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Milestone = {
  id: string;
  name: string;
  type: "Birthday" | "Anniversary" | "Job Promotion" | "Celebration" | "Other";
  date: string;
  original_date: string;
  image: string | null;
  status: "Today" | "Upcoming" | "Past";
  day: number;
  month: number;
  email?: string;
  phone?: string;
  description?: string;
};


export default function Milestones() {
  const [milestones, setMilestones] = React.useState<Milestone[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [emailDialog, setEmailDialog] = React.useState({ open: false, to: "", subject: "" });
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [settings, setSettings] = React.useState({ bday: true, milestone: true });

  const fetchMilestones = async () => {
    setLoading(true);
    try {
      // 1. Fetch Profiles (for Bdays and Anniversaries)
      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('*');

      if (pError) throw pError;

      // 2. Fetch Member Milestones (for Job Promotions etc)
      const { data: customMilestones, error: mError } = await supabase
        .from('member_milestones')
        .select('*, profiles!member_milestones_user_id_fkey(first_name, last_name, avatar_url, email, phone)');

      if (mError) throw mError;

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentDay = now.getDate();

      const list: Milestone[] = [];

      // Process Birthdays & Anniversaries from Profiles
      profiles?.forEach(p => {
        if (p.date_of_birth) {
          const d = new Date(p.date_of_birth);
          const month = d.getMonth() + 1;
          const day = d.getDate();
          
          let status: "Today" | "Upcoming" | "Past" = "Upcoming";
          if (month === currentMonth && day === currentDay) status = "Today";
          else if (month < currentMonth || (month === currentMonth && day < currentDay)) status = "Past";

          list.push({
            id: `${p.id}-bday`,
            name: `${p.first_name} ${p.last_name}`,
            type: "Birthday",
            date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            original_date: p.date_of_birth,
            image: p.avatar_url,
            status,
            day,
            month,
            email: p.email || undefined,
            phone: p.phone || undefined
          });
        }
        if (p.wedding_anniversary) {
          const d = new Date(p.wedding_anniversary);
          const month = d.getMonth() + 1;
          const day = d.getDate();

          let status: "Today" | "Upcoming" | "Past" = "Upcoming";
          if (month === currentMonth && day === currentDay) status = "Today";
          else if (month < currentMonth || (month === currentMonth && day < currentDay)) status = "Past";

          list.push({
            id: `${p.id}-anniv`,
            name: `${p.first_name} & Partner`,
            type: "Anniversary",
            date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            original_date: p.wedding_anniversary,
            image: p.avatar_url,
            status,
            day,
            month,
            email: p.email || undefined,
            phone: p.phone || undefined
          });
        }
      });

      // Process Custom Milestones (Job Promotions etc)
      customMilestones?.forEach(m => {
        if (m.milestone_date) {
          const d = new Date(m.milestone_date);
          const month = d.getMonth() + 1;
          const day = d.getDate();

          let status: "Today" | "Upcoming" | "Past" = "Upcoming";
          if (month === currentMonth && day === currentDay) status = "Today";
          else if (month < currentMonth || (month === currentMonth && day < currentDay)) status = "Past";

          const profile = m.profiles as any;
          
          let type: Milestone["type"] = "Other";
          if (m.milestone === "job_promotion") type = "Job Promotion";
          if (m.milestone === "celebration") type = "Celebration";

          list.push({
            id: m.id,
            name: `${profile?.first_name} ${profile?.last_name}`,
            type,
            date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            original_date: m.milestone_date!,
            image: profile?.avatar_url,
            status,
            day,
            month,
            email: profile?.email || undefined,
            phone: profile?.phone || undefined,
            description: m.description || undefined
          });
        }
      });

      // Sort by month/day (upcoming first)
      list.sort((a, b) => {
        if (a.month !== b.month) return a.month - b.month;
        return a.day - b.day;
      });

      setMilestones(list);
    } catch (error) {
      console.error("Error fetching milestones:", error);
      toast.error("Failed to load milestones");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchMilestones();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from('church_settings').select('key, value').in('key', ['automated_birthday_emails', 'automated_milestone_emails']);
    if (data) {
      setSettings({
        bday: data.find(s => s.key === 'automated_birthday_emails')?.value === 'true',
        milestone: data.find(s => s.key === 'automated_milestone_emails')?.value === 'true'
      });
    }
  };

  const updateSetting = async (key: string, value: boolean) => {
    const { error } = await supabase.from('church_settings').update({ value: String(value) }).eq('key', key);
    if (!error) {
      toast.success("Settings updated");
      fetchSettings();
    }
  };

  const filteredMilestones = milestones.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const openMail = (to: string, name: string, type: string) => {
    setEmailDialog({
      open: true,
      to,
      subject: `Special Message from Ambassadors Assembly: Happy ${type}, ${name}!`
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "Birthday": return Cake;
      case "Anniversary": return Heart;
      case "Job Promotion": return Briefcase;
      case "Celebration": return Trophy;
      default: return Star;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <PartyPopper className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter">Member Milestones</h1>
          </div>
          <p className="text-muted-foreground font-medium">Celebrate birthdays, anniversaries, and special achievements within the Ambassadors Assembly community.</p>
        </div>
        <Button 
          className="rounded-2xl h-12 px-6 font-bold uppercase tracking-widest text-[10px] gap-2 shadow-xl shadow-primary/20"
          onClick={() => setSettingsOpen(true)}
        >
          <Bell className="w-4 h-4" />
          Manage Notifications
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="all" className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <TabsList className="bg-muted/20 p-1 rounded-2xl h-12 border border-border/50 w-full sm:w-auto overflow-x-auto no-scrollbar">
                <TabsTrigger value="all" className="flex-1 sm:flex-none rounded-xl px-6 font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-card data-[state=active]:shadow-sm">All</TabsTrigger>
                <TabsTrigger value="birthdays" className="flex-1 sm:flex-none rounded-xl px-6 font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-card data-[state=active]:shadow-sm">Birthdays</TabsTrigger>
                <TabsTrigger value="anniversaries" className="flex-1 sm:flex-none rounded-xl px-6 font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-card data-[state=active]:shadow-sm">Anniversaries</TabsTrigger>
                <TabsTrigger value="promotions" className="flex-1 sm:flex-none rounded-xl px-6 font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-card data-[state=active]:shadow-sm">Promotions</TabsTrigger>
              </TabsList>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search members..." 
                  className="pl-10 h-11 rounded-2xl bg-card/50 backdrop-blur-xl border-none shadow-sm w-full" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {["all", "birthdays", "anniversaries", "promotions"].map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-4">
                {filteredMilestones
                  .filter(m => {
                    if (tab === "all") return true;
                    if (tab === "birthdays") return m.type === "Birthday";
                    if (tab === "anniversaries") return m.type === "Anniversary";
                    if (tab === "promotions") return m.type === "Job Promotion";
                    return true;
                  })
                  .map((item) => {
                    const Icon = getIcon(item.type);
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-card/50 backdrop-blur-xl p-4 rounded-3xl shadow-xl border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-muted/20 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border-4 border-background shadow-lg shrink-0">
                            <AvatarImage src={item.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.name}`} />
                            <AvatarFallback>{item.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <h4 className="font-bold text-base truncate">{item.name}</h4>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <Badge variant="outline" className={cn(
                                "border-none text-[8px] font-bold uppercase tracking-widest",
                                item.type === "Birthday" ? "bg-blue-500/10 text-blue-600" : 
                                item.type === "Anniversary" ? "bg-purple-500/10 text-purple-600" :
                                item.type === "Job Promotion" ? "bg-emerald-500/10 text-emerald-600" :
                                "bg-amber-500/10 text-amber-600"
                              )}>
                                <Icon className="w-2 h-2 mr-1" />
                                {item.type}
                              </Badge>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.date}</span>
                              {item.status === "Today" && <Badge className="bg-primary text-primary-foreground text-[8px] font-bold uppercase tracking-widest animate-pulse">Today</Badge>}
                            </div>
                            {item.description && <p className="text-[10px] text-muted-foreground mt-1 italic line-clamp-1">{item.description}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary"
                              onClick={() => item.email && openMail(item.email, item.name, item.type)}
                              disabled={!item.email}
                            >
                              <Mail className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary"
                              onClick={() => { if(item.phone) window.location.href = `tel:${item.phone}`; }}
                              disabled={!item.phone}
                            >
                              <Phone className="w-4 h-4" />
                            </Button>
                          </div>
                          <Button 
                            className="rounded-xl h-10 px-4 font-bold uppercase tracking-widest text-[10px] gap-2 flex-1 sm:flex-none" 
                            onClick={() => {
                              if (item.email) {
                                setEmailDialog({
                                  open: true,
                                  to: item.email,
                                  subject: `A Special Gift for Your ${item.type}!`
                                });
                              } else {
                                toast.error("Member has no email on file");
                              }
                            }}
                          >
                            <Gift className="w-4 h-4" />
                            <span className="hidden xs:inline">Send Gift</span>
                            <span className="xs:hidden">Gift</span>
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-[2.5rem] p-8 relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                <Cake className="w-6 h-6 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black leading-tight">
                  {milestones.find(m => m.status === "Today")?.name || "No Milestones Today"}
                </h3>
                <p className="text-sm font-medium opacity-90">
                  {milestones.find(m => m.status === "Today") 
                    ? "Today is a special day! Join us in celebrating our community members." 
                    : "Check back tomorrow for more member celebrations and milestones."}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button 
                  variant="secondary" 
                  className="w-full rounded-2xl h-12 font-bold uppercase tracking-widest text-[10px]"
                  disabled={!milestones.find(m => m.status === "Today")?.email}
                  onClick={() => {
                    const m = milestones.find(m => m.status === "Today");
                    if (m && m.email) openMail(m.email, m.name, m.type);
                  }}
                >
                  Send Congrats
                </Button>
              </div>
            </div>
            <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse-slow" />
          </Card>

          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-xl rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Upcoming Milestones</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Next 30 days</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {milestones.filter(m => m.status === "Upcoming").slice(0, 5).map((item) => (
                  <div key={item.id} className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center font-bold text-xs shrink-0">
                        {item.date.split(' ')[1]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">{item.type}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-border/50">
                <Button variant="ghost" className="w-full text-[10px] font-bold uppercase tracking-widest h-8">View Calendar</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[2rem] border-none shadow-2xl bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">Notification Settings</DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest">
              Control automated communications
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30">
              <div className="space-y-0.5">
                <label className="text-sm font-bold">Birthday Greetings</label>
                <p className="text-[10px] text-muted-foreground">Send automated emails on birthdays</p>
              </div>
              <Switch 
                checked={settings.bday} 
                onCheckedChange={(checked) => updateSetting('automated_birthday_emails', checked)} 
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30">
              <div className="space-y-0.5">
                <label className="text-sm font-bold">Milestone Greetings</label>
                <p className="text-[10px] text-muted-foreground">Send emails for job promotions etc.</p>
              </div>
              <Switch 
                checked={settings.milestone} 
                onCheckedChange={(checked) => updateSetting('automated_milestone_emails', checked)} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full rounded-xl h-12 font-bold uppercase tracking-widest text-[10px]" onClick={() => setSettingsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SendEmailDialog 
        open={emailDialog.open}
        onOpenChange={(open) => setEmailDialog(prev => ({ ...prev, open }))}
        defaultTo={emailDialog.to}
        defaultSubject={emailDialog.subject}
      />
    </div>
  );
}


