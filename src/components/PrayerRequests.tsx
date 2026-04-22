import * as React from "react";
import { 
  MessageSquare, 
  Heart, 
  Share2, 
  Plus, 
  Search, 
  Filter,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Edit2,
  Trash2,
  ChevronRight,
  HandHelping,
  Users
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/src/lib/supabase";
import type { Database } from "@/src/types/database.types";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import PrayerForm from "./forms/PrayerForm";

import { useAuth } from "@/src/contexts/AuthContext";

export default function PrayerRequests() {
  const { user, loading: authLoading } = useAuth();
  const [prayers, setPrayers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [editingPrayer, setEditingPrayer] = React.useState<any>(null);

  const fetchPrayers = async (retries = 3) => {
    setLoading(true);
    try {
      let query = supabase
        .from('prayer_requests')
        .select(`
          *,
          user:profiles!prayer_requests_user_id_fkey (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter as Database["public"]["Enums"]["prayer_status"]);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPrayers(data || []);
    } catch (error: any) {
      if (error?.message?.includes("Lock") && retries > 0) {
        setTimeout(() => fetchPrayers(retries - 1), 500);
        return;
      }
      console.error("Error fetching prayers:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!authLoading) {
      const debounce = setTimeout(fetchPrayers, 500);
      return () => clearTimeout(debounce);
    }
  }, [search, statusFilter, authLoading]);

  const handlePray = async (id: string) => {
    try {
      // In a real app, we'd use a RPC or a separate table for 'prayers_joined'
      // For now, we'll just increment a counter
      const { data: current } = await supabase.from('prayer_requests').select('prayer_count').eq('id', id).single();
      const { error } = await supabase.from('prayer_requests').update({ prayer_count: (current?.prayer_count || 0) + 1 }).eq('id', id);
      
      if (error) throw error;
      
      setPrayers(prev => prev.map(p => p.id === id ? { ...p, prayer_count: (p.prayer_count || 0) + 1 } : p));
      toast.success("You've joined in prayer for this request.");
    } catch (error) {
      console.error("Error updating prayer count:", error);
      toast.error("Failed to update prayer count.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this prayer request?")) return;
    
    try {
      const { error } = await supabase.from('prayer_requests').delete().eq('id', id);
      if (error) throw error;
      toast.success("Prayer request deleted");
      fetchPrayers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Prayer Wall</h1>
          <p className="text-muted-foreground">Share your requests and join our community in intercession.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" />
            Submit Request
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Submit Prayer Request</DialogTitle>
              <DialogDescription>Share your heart with the church family.</DialogDescription>
            </DialogHeader>
            <PrayerForm 
              onSuccess={() => {
                setIsAddOpen(false);
                fetchPrayers();
              }} 
              onCancel={() => setIsAddOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search prayer requests..." 
            className="pl-10 h-11 bg-card/50 border-none shadow-sm focus-visible:ring-primary/20" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          <Button 
            variant={statusFilter === 'all' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setStatusFilter('all')}
            className="rounded-xl text-[10px] font-bold uppercase tracking-widest h-11 px-6 shrink-0"
          >
            All
          </Button>
          <Button 
            variant={statusFilter === 'pending' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setStatusFilter('pending')}
            className="rounded-xl text-[10px] font-bold uppercase tracking-widest h-11 px-6 shrink-0"
          >
            Pending
          </Button>
          <Button 
            variant={statusFilter === 'answered' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setStatusFilter('answered')}
            className="rounded-xl text-[10px] font-bold uppercase tracking-widest h-11 px-6 shrink-0"
          >
            Answered
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-48 animate-pulse bg-muted/50 rounded-2xl border-none" />
          ))}
        </div>
      ) : prayers.length === 0 ? (
        <div className="py-20 text-center space-y-4 bg-muted/20 rounded-3xl border-2 border-dashed">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
            <MessageSquare className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-xl">The wall is quiet</h3>
            <p className="text-muted-foreground">Be the first to share a prayer request or thanksgiving.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {prayers.map((prayer, i) => (
            <motion.div
              key={prayer.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className={cn(
                "border-none shadow-md bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-500 group rounded-2xl overflow-hidden",
                prayer.status === 'answered' && "ring-2 ring-emerald-500/20"
              )}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] font-bold uppercase tracking-widest">
                        {prayer.category || 'General'}
                      </Badge>
                      {prayer.status === "answered" && (
                        <Badge className="bg-emerald-500 text-white border-none text-[10px] font-bold uppercase tracking-widest">
                          Answered!
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {prayer.created_at ? new Date(prayer.created_at).toLocaleDateString() : 'TBD'}
                      </span>
                      {(user?.id === prayer.user_id) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            <MoreVertical className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Manage Request</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setEditingPrayer(prayer)}>
                              <Edit2 className="w-4 h-4 mr-2" /> Edit Request
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <CheckCircle2 className="w-4 h-4 mr-2" /> Mark as Answered
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-destructive-foreground" onClick={() => handleDelete(prayer.id)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Delete Request
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold tracking-tight group-hover:text-primary transition-colors">{prayer.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar className="h-6 w-6 border shadow-sm">
                      <AvatarImage src={prayer.is_anonymous ? undefined : prayer.user?.avatar_url} />
                      <AvatarFallback className="text-[8px]">{prayer.is_anonymous ? 'A' : prayer.user?.first_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {prayer.is_anonymous ? 'Anonymous Member' : `${prayer.user?.first_name} ${prayer.user?.last_name}`}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative p-6 bg-muted/20 rounded-2xl border border-muted/50">
                    <p className="text-base leading-relaxed text-foreground italic font-medium">
                      "{prayer.content}"
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-0 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className={cn(
                        "gap-2 rounded-full px-4 h-9 font-bold text-[10px] uppercase tracking-widest transition-all",
                        "hover:bg-primary hover:text-primary-foreground shadow-sm"
                      )}
                      onClick={() => handlePray(prayer.id)}
                    >
                      <Heart className="w-4 h-4" />
                      I'm Praying ({prayer.prayer_count || 0})
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button variant="ghost" className="gap-2 text-[10px] font-bold uppercase tracking-widest group/btn">
                    Add Update
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingPrayer} onOpenChange={(open) => !open && setEditingPrayer(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Prayer Request</DialogTitle>
            <DialogDescription>Update your prayer request for the church family.</DialogDescription>
          </DialogHeader>
          {editingPrayer && (
            <PrayerForm 
              initialData={editingPrayer}
              onSuccess={() => {
                setEditingPrayer(null);
                fetchPrayers();
              }} 
              onCancel={() => setEditingPrayer(null)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
