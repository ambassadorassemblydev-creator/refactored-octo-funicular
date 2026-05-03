import * as React from "react";
import { 
  Bell, 
  Search, 
  Filter, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  MoreVertical,
  Calendar,
  Clock,
  Settings,
  Shield,
  Zap,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";

export default function Notifications() {
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [filterType, setFilterType] = React.useState("All");

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      toast.error("Failed to load notifications: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      
      if (error) throw error;
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success("Notification deleted");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filtered = notifications.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) || 
                         n.message.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "All" || n.type === filterType;
    return matchesSearch && matchesType;
  });

  const getIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'urgent': return AlertCircle;
      case 'success': return CheckCircle2;
      case 'info': return Info;
      default: return Bell;
    }
  };

  const getColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'urgent': return "text-rose-500 bg-rose-500/10";
      case 'success': return "text-emerald-500 bg-emerald-500/10";
      case 'info': return "text-blue-500 bg-blue-500/10";
      default: return "text-primary bg-primary/10";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/20">
              <Bell className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter">System Notifications</h1>
              <p className="text-muted-foreground font-medium text-sm">Monitor and manage automated system alerts and member activity.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="rounded-2xl h-12 px-5 font-bold uppercase tracking-widest text-[10px] gap-2 border-none bg-card/50 backdrop-blur-xl shadow-xl"
            onClick={fetchNotifications}
          >
            Refresh Logs
          </Button>
          <Button className="rounded-2xl h-12 px-6 font-bold uppercase tracking-widest text-[10px] gap-2 shadow-2xl shadow-primary/30">
            <Settings className="w-4 h-4" />
            Config Rules
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card/30 p-4 rounded-3xl backdrop-blur-xl border border-white/5">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search alerts..." 
            className="pl-12 h-12 rounded-2xl bg-background/50 border-none shadow-inner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          {["All", "Urgent", "Info", "Success"].map((t) => (
            <Button
              key={t}
              variant={filterType === t ? "default" : "outline"}
              size="sm"
              className="rounded-xl h-9 px-4 text-[10px] font-bold uppercase tracking-widest border-none bg-muted/30 shrink-0"
              onClick={() => setFilterType(t)}
            >
              {t}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-24 bg-card/50 animate-pulse rounded-3xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed border-2 bg-transparent">
            <CardContent className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <Bell className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-bold">No notifications found</p>
                <p className="text-sm text-muted-foreground">Everything is running smoothly at the moment.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map((item) => {
              const Icon = getIcon(item.type);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "p-6 rounded-[2rem] border transition-all relative overflow-hidden group",
                    item.is_read ? "bg-card/20 border-white/5 opacity-60" : "bg-card/80 border-primary/10 shadow-xl"
                  )}
                >
                  <div className="flex items-start gap-5">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", getColor(item.type))}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-lg tracking-tight">{item.title}</h4>
                          {!item.is_read && (
                            <Badge className="bg-primary text-[8px] font-black uppercase h-4 px-1.5 animate-pulse">New</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.created_at).toLocaleDateString()}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2">
                              {!item.is_read && (
                                <DropdownMenuItem onClick={() => handleMarkRead(item.id)} className="rounded-xl gap-2 cursor-pointer">
                                  <CheckCircle2 className="w-4 h-4" /> Mark as Read
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleDelete(item.id)} className="rounded-xl gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                                <Trash2 className="w-4 h-4" /> Delete Permanently
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-4xl">
                        {item.message}
                      </p>
                      {item.link && (
                        <div className="pt-2">
                          <Button variant="link" className="p-0 h-auto text-primary text-[10px] font-black uppercase tracking-[0.2em] gap-2 group/link">
                            Resolve Action <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
