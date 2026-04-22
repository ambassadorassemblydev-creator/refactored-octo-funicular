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
  Heart
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

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Milestone = {
  id: string;
  name: string;
  type: "Birthday" | "Anniversary";
  date: string;
  original_date: string;
  image: string | null;
  status: "Today" | "Upcoming" | "Past";
  day: number;
  month: number;
};


export default function Milestones() {
  const [milestones, setMilestones] = React.useState<Milestone[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  const fetchMilestones = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) throw error;

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentDay = now.getDate();

      const list: Milestone[] = [];
      data?.forEach(p => {
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
            month
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
            name: `${p.first_name} & Partner`, // Ideally we'd have partner name
            type: "Anniversary",
            date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            original_date: p.wedding_anniversary,
            image: p.avatar_url,
            status,
            day,
            month
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
  }, []);

  const filteredMilestones = milestones.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }
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
        <Button className="rounded-2xl h-12 px-6 font-bold uppercase tracking-widest text-[10px] gap-2 shadow-xl shadow-primary/20">
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

            <TabsContent value="all" className="space-y-4">
              {filteredMilestones.map((item) => (
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
                          item.type === "Birthday" ? "bg-blue-500/10 text-blue-600" : "bg-purple-500/10 text-purple-600"
                        )}>
                          {item.type}
                        </Badge>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.date}</span>
                        {item.status === "Today" && <Badge className="bg-primary text-primary-foreground text-[8px] font-bold uppercase tracking-widest animate-pulse">Today</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary">
                        <Mail className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary">
                        <Phone className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button className="rounded-xl h-10 px-4 font-bold uppercase tracking-widest text-[10px] gap-2 flex-1 sm:flex-none">
                      <Gift className="w-4 h-4" />
                      <span className="hidden xs:inline">Send Gift</span>
                      <span className="xs:hidden">Gift</span>
                    </Button>
                  </div>
                </motion.div>
              ))}
            </TabsContent>

            <TabsContent value="birthdays" className="space-y-4">
              {filteredMilestones.filter(m => m.type === "Birthday").map((item) => (
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
                        <Badge variant="outline" className="border-none text-[8px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-600">
                          {item.type}
                        </Badge>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.date}</span>
                      </div>
                    </div>
                  </div>
                  <Button className="rounded-xl h-10 px-4 font-bold uppercase tracking-widest text-[10px] gap-2">
                    <Gift className="w-4 h-4" />
                    Celebrating
                  </Button>
                </motion.div>
              ))}
            </TabsContent>

            <TabsContent value="anniversaries" className="space-y-4">
              {filteredMilestones.filter(m => m.type === "Anniversary").map((item) => (
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
                        <Badge variant="outline" className="border-none text-[8px] font-bold uppercase tracking-widest bg-purple-500/10 text-purple-600">
                          {item.type}
                        </Badge>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.date}</span>
                      </div>
                    </div>
                  </div>
                  <Button className="rounded-xl h-10 px-4 font-bold uppercase tracking-widest text-[10px] gap-2">
                    <Heart className="w-4 h-4" />
                    Loved
                  </Button>
                </motion.div>
              ))}
            </TabsContent>
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
                <Button variant="secondary" className="w-full rounded-2xl h-12 font-bold uppercase tracking-widest text-[10px]">
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
    </div>
  );
}

