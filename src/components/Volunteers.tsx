import * as React from "react";
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  UserPlus, 
  MoreVertical, 
  Shield, 
  Star,
  Award,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { supabase } from "@/src/lib/supabase";
import type { Database } from "@/src/types/database.types";
import { Loader2 } from "lucide-react";

type Volunteer = Database["public"]["Tables"]["church_workers"]["Row"] & {
  profiles: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
  church_positions: {
    title: string | null;
    is_leadership: boolean | null;
  } | null;
  church_departments: {
    name: string | null;
  } | null;
};


export default function Volunteers({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const [volunteers, setVolunteers] = React.useState<Volunteer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const fetchVolunteers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('church_workers')
        .select(`
          *,
          profiles:profiles!church_workers_user_id_fkey (
            first_name,
            last_name,
            avatar_url
          ),
          church_positions (
            title,
            is_leadership
          ),
          church_departments (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVolunteers(data || []);
    } catch (error) {
      console.error("Error fetching volunteers:", error);
      toast.error("Failed to load volunteers");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchVolunteers();
  }, []);

  const filteredVolunteers = volunteers.filter(v => {
    const profiles = v.profiles || { first_name: "Member", last_name: "" };
    const fullName = `${profiles.first_name} ${profiles.last_name}`.toLowerCase();
    const role = v.church_positions?.title || "";
    const dept = v.church_departments?.name || "";
    const matchesSearch = fullName.includes(search.toLowerCase()) || 
                         role.toLowerCase().includes(search.toLowerCase()) ||
                         dept.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const totalHours = volunteers.reduce((acc, curr) => acc + (curr.total_hours || 0), 0);
  const avgRating = volunteers.length > 0 
    ? (volunteers.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0) / volunteers.length).toFixed(1)
    : "0.0";
  const leadVolunteers = volunteers.filter(v => v.church_positions?.is_leadership).length;

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
              <Heart className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter">Volunteer Management</h1>
          </div>
          <p className="text-muted-foreground font-medium">Coordinate your dedicated workforce, track service hours, and recognize outstanding contributions.</p>
        </div>
        <Button 
          onClick={() => {
            if (onTabChange) {
              onTabChange('members'); // Or whichever tab handles pending approvals
            }
          }}
          className="rounded-2xl h-12 px-6 font-bold uppercase tracking-widest text-[10px] gap-2 shadow-xl shadow-primary/20"
        >
          <UserPlus className="w-4 h-4" />
          Recruit Volunteer
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-xl rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <Users className="w-5 h-5" />
            </div>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-none text-[8px] font-bold">TOTAL</Badge>
          </div>
          <p className="text-2xl font-black">{volunteers.length}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Volunteers</p>
        </Card>
        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-xl rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600">
              <Clock className="w-5 h-5" />
            </div>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-none text-[8px] font-bold">ALL TIME</Badge>
          </div>
          <p className="text-2xl font-black">{totalHours.toLocaleString()}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Service Hours</p>
        </Card>
        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-xl rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-600">
              <Award className="w-5 h-5" />
            </div>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-none text-[8px] font-bold">LEADERSHIP</Badge>
          </div>
          <p className="text-2xl font-black">{leadVolunteers}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Lead Volunteers</p>
        </Card>
        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-xl rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-600">
              <Star className="w-5 h-5" />
            </div>
            <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-none text-[8px] font-bold">AVERAGE</Badge>
          </div>
          <p className="text-2xl font-black">{avgRating}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Satisfaction Rate</p>
        </Card>
      </div>

      <Card className="border-none shadow-xl bg-card/50 backdrop-blur-xl rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search volunteers..." 
                className="pl-10 h-11 rounded-2xl bg-background/50 border-none" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="rounded-xl h-11 gap-2 border-none bg-background/50 text-[10px] font-bold uppercase tracking-widest">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
              <Button variant="outline" className="rounded-xl h-11 gap-2 border-none bg-background/50 text-[10px] font-bold uppercase tracking-widest">
                Schedule
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 bg-muted/10">
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Volunteer</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Outreach & Impact</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Role</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Hours</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Rating</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="p-4 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {filteredVolunteers.map((v) => (
                  <tr key={v.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                          <AvatarImage src={v.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${v.profiles?.first_name}`} />
                          <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-bold">
                            {v.profiles?.first_name?.[0] || ""}{v.profiles?.last_name?.[0] || ""}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-sm leading-none mb-1">
                            {v.profiles?.first_name} {v.profiles?.last_name}
                          </p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            Joined {new Date(v.created_at || '').toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="bg-muted/50 border-none text-[10px] font-bold uppercase">
                        {v.church_departments?.name || "General"}
                      </Badge>
                    </td>
                    <td className="p-4 font-medium text-sm">
                      {v.church_positions?.title || "Staff"}
                    </td>
                    <td className="p-4 font-bold text-sm">{v.total_hours}h</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="text-xs font-bold">{v.rating}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge 
                        className={cn(
                          "border-none text-[10px] font-bold uppercase px-2 py-0.5",
                          v.status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted/30 text-muted-foreground"
                        )}
                      >
                        {v.status || "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="icon" className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { cn } from "@/src/lib/utils";
