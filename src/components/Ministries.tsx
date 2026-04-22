import * as React from "react";
import { 
  ShieldCheck, 
  Users, 
  Calendar, 
  ChevronRight, 
  Plus,
  Search,
  MapPin,
  Clock,
  MoreVertical,
  Edit2,
  Trash2,
  UserPlus,
  Activity,
  Target,
  Heart
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { supabase } from "@/src/lib/supabase";
import MinistryForm from "./forms/MinistryForm";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";
import { auditRepo } from "@/src/lib/audit";
import { useAuth } from "@/src/contexts/AuthContext";

interface MinistriesProps {
  type?: "ministry" | "department";
  onTabChange?: (tab: string) => void;
}

export default function Ministries({ type = "ministry", onTabChange }: MinistriesProps) {
  const { user } = useAuth();
  const isDepartment = type === "department";
  const title = isDepartment ? "Departments" : "Ministries";
  const description = isDepartment 
    ? "Operational and internal functional units supporting the church." 
    : "Outward-facing spiritual groups focused on outreach and community.";

  const [ministries, setMinistries] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [editingMinistry, setEditingMinistry] = React.useState<any>(null);

  const fetchMinistries = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('ministries')
        .select(`
          *,
          leader:profiles!leader_id (
            first_name,
            last_name,
            avatar_url
          )
        `);

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      if (statusFilter !== "all") {
        query = query.eq('is_active', statusFilter === 'active');
      }

      // Filter by type if column exists (optional feature)
      // query = query.eq('type', type);

      const { data, error } = await query;

      if (error) throw error;
      setMinistries(data || []);
    } catch (error) {
      console.error("Error fetching ministries:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const debounce = setTimeout(fetchMinistries, 500);
    return () => clearTimeout(debounce);
  }, [search, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    try {
      const { error } = await supabase.from('ministries').delete().eq('id', id);
      if (error) throw error;

      // Log delete action
      await auditRepo.logAction({
        admin_id: user?.id || 'unknown',
        action: 'DELETE',
        table_name: 'ministries',
        record_id: id
      });

      toast.success(`${isDepartment ? 'Department' : 'Ministry'} deleted successfully`);
      fetchMinistries();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={
            <Button className="shadow-lg shadow-primary/20 gap-2">
              <Plus className="w-4 h-4" />
              Create {isDepartment ? 'Department' : 'Ministry'}
            </Button>
          } />
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New {isDepartment ? 'Department' : 'Ministry'}</DialogTitle>
              <DialogDescription>Define a new area of {isDepartment ? 'operation' : 'service'} for the church.</DialogDescription>
            </DialogHeader>
            <MinistryForm 
              type={type}
              onSuccess={() => {
                setIsAddOpen(false);
                fetchMinistries();
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
            placeholder={`Search ${type}s...`} 
            className="pl-10 h-11 bg-card/50 border-none shadow-sm focus-visible:ring-primary/20" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={statusFilter === 'all' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setStatusFilter('all')}
            className="rounded-xl text-[10px] font-bold uppercase tracking-widest h-11 px-6"
          >
            All
          </Button>
          <Button 
            variant={statusFilter === 'active' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setStatusFilter('active')}
            className="rounded-xl text-[10px] font-bold uppercase tracking-widest h-11 px-6"
          >
            Active
          </Button>
          <Button 
            variant={statusFilter === 'inactive' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setStatusFilter('inactive')}
            className="rounded-xl text-[10px] font-bold uppercase tracking-widest h-11 px-6"
          >
            Inactive
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="h-96 animate-pulse bg-muted/50 rounded-2xl border-none" />
          ))}
        </div>
      ) : ministries.length === 0 ? (
        <div className="py-20 text-center space-y-4 bg-muted/20 rounded-3xl border-2 border-dashed">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-xl">No ministries found</h3>
            <p className="text-muted-foreground">Try adjusting your search or create a new ministry.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {ministries.map((ministry, i) => (
            <motion.div
              key={ministry.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="overflow-hidden border-none shadow-md bg-card/50 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 group rounded-2xl flex flex-col h-full relative">
                <div className="absolute top-4 right-4 z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-background/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <MoreVertical className="w-4 h-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Ministry Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setEditingMinistry(ministry)}>
                        <Edit2 className="w-4 h-4 mr-2" /> Edit Ministry
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onTabChange?.("members")}>
                        <UserPlus className="w-4 h-4 mr-2" /> Assign Members
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Heart className="w-4 h-4 mr-2" /> View Impact
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-destructive-foreground" onClick={() => handleDelete(ministry.id)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete Ministry
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="relative h-56 overflow-hidden">
                  <img 
                    src={ministry.cover_image_url || `https://picsum.photos/seed/${ministry.id}/800/400`} 
                    alt={ministry.name}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="space-y-2">
                      <Badge className="bg-primary/90 hover:bg-primary border-none shadow-lg uppercase tracking-widest text-[10px] font-bold">
                        {ministry.type || 'Ministry'}
                      </Badge>
                      <h3 className="text-3xl font-bold text-white tracking-tight">{ministry.name}</h3>
                    </div>
                  </div>
                </div>

                <CardHeader className="p-6">
                  <CardDescription className="text-sm line-clamp-3 leading-relaxed">
                    {ministry.description || 'Serving the Ambassadors Assembly community through dedicated service and faith.'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6 pt-0 space-y-6 flex-1">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <Clock className="w-3 h-3" /> Meeting Time
                      </div>
                      <p className="text-sm font-medium">{ministry.meeting_time || 'TBD'}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <MapPin className="w-3 h-3" /> Location
                      </div>
                      <p className="text-sm font-medium truncate">{ministry.meeting_location || 'Church Hall'}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <Users className="w-3 h-3" /> Members
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{ministry.member_count || 0}</p>
                        <div className="flex -space-x-2">
                          {[1, 2, 3].map(i => (
                            <Avatar key={i} className="w-5 h-5 border-2 border-background">
                              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + ministry.id}`} />
                            </Avatar>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <ShieldCheck className="w-3 h-3" /> Leader
                      </div>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={ministry.leader?.avatar_url} />
                          <AvatarFallback className="text-[8px]">{ministry.leader?.first_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <p className="text-sm font-medium truncate">
                          {ministry.leader ? `${ministry.leader.first_name} ${ministry.leader.last_name}` : 'TBD'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-6 pt-0 border-t bg-muted/5 mt-auto">
                  <Button variant="ghost" className="w-full justify-between group/btn px-0 hover:bg-transparent">
                    <span className="text-xs font-bold uppercase tracking-widest">Explore Ministry</span>
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingMinistry} onOpenChange={(open) => !open && setEditingMinistry(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Ministry</DialogTitle>
            <DialogDescription>Update the details for the {editingMinistry?.name}.</DialogDescription>
          </DialogHeader>
          {editingMinistry && (
            <MinistryForm 
              initialData={editingMinistry}
              onSuccess={() => {
                setEditingMinistry(null);
                fetchMinistries();
              }} 
              onCancel={() => setEditingMinistry(null)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
