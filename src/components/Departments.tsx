import * as React from "react";
import { 
  Building2, 
  Users, 
  Settings, 
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  UserPlus,
  Activity,
  Target,
  Briefcase,
  Share2
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
import DepartmentForm from "./forms/DepartmentForm";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";
import { auditRepo } from "@/src/lib/audit";
import { useAuth } from "@/src/contexts/AuthContext";

export default function Departments({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const { user } = useAuth();
  const [departments, setDepartments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [editingDepartment, setEditingDepartment] = React.useState<any>(null);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('church_departments')
        .select(`
          *,
          leader:profiles!leader_id (
            first_name,
            last_name,
            avatar_url
          ),
          workers:church_workers(count)
        `);

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      if (statusFilter !== "all") {
        query = query.eq('is_active', statusFilter === 'active');
      }

      const { data, error } = await query;

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error("Error fetching departments:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const debounce = setTimeout(fetchDepartments, 500);
    return () => clearTimeout(debounce);
  }, [search, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    
    try {
      const { error } = await supabase.from('church_departments').delete().eq('id', id);
      if (error) throw error;

      // Log delete action
      await auditRepo.logAction({
        admin_id: user?.id || 'unknown',
        action: 'DELETE',
        table_name: 'church_departments',
        record_id: id
      });

      toast.success("Department deleted successfully");
      fetchDepartments();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground">Internal functional units that support the church operations.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={
            <Button className="shadow-lg shadow-primary/20 gap-2">
              <Plus className="w-4 h-4" />
              Create Department
            </Button>
          } />
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Department</DialogTitle>
              <DialogDescription>Define a new operational unit for the church.</DialogDescription>
            </DialogHeader>
            <DepartmentForm 
              onSuccess={() => {
                setIsAddOpen(false);
                fetchDepartments();
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
            placeholder="Search departments..." 
            className="pl-10 h-11 bg-card/50 border-none shadow-sm focus-visible:ring-primary/20" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={statusFilter === 'all' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setStatusFilter('all')}
            className="rounded-xl text-[10px] font-bold uppercase tracking-widest h-11 px-6"
          >
            All
          </Button>
          <Button 
            variant={statusFilter === 'active' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setStatusFilter('active')}
            className="rounded-xl text-[10px] font-bold uppercase tracking-widest h-11 px-6"
          >
            Active
          </Button>
          <Button 
            variant={statusFilter === 'inactive' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setStatusFilter('inactive')}
            className="rounded-xl text-[10px] font-bold uppercase tracking-widest h-11 px-6"
          >
            Inactive
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-[280px] animate-pulse bg-muted/50 border-none" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {departments.map((dept) => (
              <motion.div
                key={dept.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm">
                  <div className="h-2 w-full bg-primary/20 group-hover:bg-primary transition-colors duration-300" />
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => setEditingDepartment(dept)}>
                            <Edit2 className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(dept.id)}>
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            const url = `${window.location.origin}/departments/${dept.id}`;
                            navigator.clipboard.writeText(url);
                            toast.success("Department link copied to clipboard");
                            
                            auditRepo.logAction({
                              admin_id: user?.id || 'unknown',
                              action: 'UPDATE',
                              table_name: 'church_departments',
                              record_id: dept.id,
                              new_values: { action: 'share_department' }
                            });
                          }}>
                            <Share2 className="w-4 h-4 mr-2" /> Share Department
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardTitle className="mt-4 text-xl">{dept.name}</CardTitle>
                    <CardDescription className="line-clamp-2 min-h-[40px]">
                      {dept.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>Workers</span>
                        </div>
                        <span className="font-semibold">{dept.workers?.[0]?.count || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Activity className="w-4 h-4" />
                          <span>Status</span>
                        </div>
                        <Badge variant={dept.is_active ? 'default' : 'secondary'} className="capitalize">
                          {dept.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-4 border-t border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8 border-2 border-background shadow-sm">
                        <AvatarImage src={dept.leader?.avatar_url} />
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {dept.leader ? `${dept.leader.first_name[0]}${dept.leader.last_name[0]}` : <Settings className="w-3 h-3" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold leading-none">
                          {dept.leader ? `${dept.leader.first_name} ${dept.leader.last_name}` : "No Leader"}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">Department Lead</span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs font-bold uppercase tracking-widest text-primary hover:bg-primary/10"
                      onClick={() => onTabChange?.("members")}
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={!!editingDepartment} onOpenChange={(open) => !open && setEditingDepartment(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>Update the details for this department.</DialogDescription>
          </DialogHeader>
          <DepartmentForm 
            initialData={editingDepartment}
            onSuccess={() => {
              setEditingDepartment(null);
              fetchDepartments();
            }} 
            onCancel={() => setEditingDepartment(null)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
