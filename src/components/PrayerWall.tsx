import * as React from "react";
import { 
  Heart, 
  MessageCircle, 
  Plus, 
  Search, 
  Filter, 
  Sparkles, 
  Clock, 
  User,
  Share2,
  Bookmark
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { supabase } from "@/src/lib/supabase";
import type { Database } from "@/src/types/database.types";
import { Loader2 } from "lucide-react";
import { cn } from "@/src/lib/utils";

type PrayerRequest = Database["public"]["Tables"]["prayer_requests"]["Row"] & {
  profiles: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
};


export default function PrayerWall() {
  const [prayers, setPrayers] = React.useState<PrayerRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("All Requests");
  const [prayedIds, setPrayedIds] = React.useState<Set<string>>(new Set());

  const fetchPrayers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('prayer_requests')
        .select(`
          *,
          profiles:profiles!prayer_requests_user_id_fkey (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrayers(data || []);
    } catch (error) {
      console.error("Error fetching prayers:", error);
      toast.error("Failed to load prayer requests");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPrayers();
  }, []);

  const togglePray = (id: string) => {
    const newSet = new Set(prayedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
      toast.success("Joined in prayer!");
    }
    setPrayedIds(newSet);
  };

  const filteredPrayers = prayers.filter(p => {
    const name = p.profiles ? `${p.profiles.first_name} ${p.profiles.last_name}` : "Member";
    const matchesSearch = p.description?.toLowerCase().includes(search.toLowerCase()) ||
                         name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "All Requests" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

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
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter">Prayer Wall</h1>
          </div>
          <p className="text-muted-foreground font-medium">A sacred space for our community to share requests, offer intercession, and celebrate praise reports.</p>
        </div>
        <Button className="rounded-2xl h-12 px-6 font-bold uppercase tracking-widest text-[10px] gap-2 shadow-xl shadow-primary/20">
          <Plus className="w-4 h-4" />
          Share Request
        </Button>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-xl rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Categories</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Filter by prayer type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {["All Requests", "Family", "Healing", "Guidance", "Praise", "General"].map((cat) => (
                <Button 
                  key={cat} 
                  variant={categoryFilter === cat ? "default" : "ghost"} 
                  className="w-full justify-between rounded-xl h-11 px-4 font-bold text-xs transition-all group"
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat}
                  <Badge variant="outline" className={cn(
                    "bg-muted/50 border-none text-[8px] transition-colors",
                    categoryFilter === cat ? "bg-white/20 text-white" : "group-hover:bg-primary/20"
                  )}>
                    {cat === "All Requests" ? prayers.length : prayers.filter(p => p.category === cat).length}
                  </Badge>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-primary text-primary-foreground rounded-3xl p-6 relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <h3 className="text-xl font-black leading-tight">Join the Global Intercession</h3>
              <p className="text-xs font-medium opacity-80">Over 1,240 prayers offered this week by Ambassadors around the world.</p>
              <Button variant="secondary" className="w-full rounded-xl font-bold uppercase tracking-widest text-[10px]">
                View Global Map
              </Button>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search prayer requests..." className="pl-10 h-12 rounded-2xl bg-card/50 backdrop-blur-xl border-none shadow-sm" />
            </div>
            <Button variant="outline" className="rounded-2xl h-12 gap-2 border-none bg-card/50 backdrop-blur-xl shadow-sm">
              <Filter className="w-4 h-4" />
              Sort
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-1 gap-4 md:gap-6">
            {filteredPrayers.map((prayer) => {
              const name = prayer.profiles ? `${prayer.profiles.first_name} ${prayer.profiles.last_name}` : "Member";
              return (
                <motion.div
                  key={prayer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  className="bg-card/50 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-border/50 group transition-all"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-primary/20 shrink-0">
                        <AvatarImage src={prayer.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`} />
                        <AvatarFallback>{name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm truncate">{name}</h4>
                        <div className="flex items-center gap-1.5 text-[8px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          <span className="truncate">{new Date(prayer.created_at || '').toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-none text-[7px] sm:text-[8px] font-bold uppercase tracking-widest shrink-0">
                      {prayer.category}
                    </Badge>
                  </div>

                  <p className="text-sm font-medium leading-relaxed mb-6 text-foreground/80 italic">
                    "{prayer.description}"
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-border/50 gap-4">
                    <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={cn(
                          "flex-1 sm:flex-none rounded-xl gap-1.5 sm:gap-2 h-8 sm:h-9 px-2 sm:px-4 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest transition-all",
                          prayedIds.has(prayer.id) ? "bg-primary text-primary-foreground" : "hover:bg-primary/10 hover:text-primary"
                        )}
                        onClick={() => togglePray(prayer.id)}
                      >
                        <Heart className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", prayedIds.has(prayer.id) && "fill-current")} />
                        <span className="truncate">{prayedIds.has(prayer.id) ? "Prayed" : "I'm Praying"}</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1 sm:flex-none rounded-xl gap-1.5 sm:gap-2 h-8 sm:h-9 px-2 sm:px-4 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest hover:bg-muted/50">
                        <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="truncate">Encourage</span>
                      </Button>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                      <span className="text-[8px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {prayedIds.has(prayer.id) ? 1 : 0} Intercessors
                      </span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 rounded-full">
                        <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

