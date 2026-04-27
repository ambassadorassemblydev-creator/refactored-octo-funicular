import * as React from "react";
import { 
  CheckCircle2, 
  XCircle, 
  UserCheck, 
  Users, 
  MessageSquare, 
  HeartHandshake,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  Clock,
  Calendar,
  Shield,
  FileText,
  HandHeart,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { auditRepo } from "@/src/lib/audit";
import { useAuth } from "@/src/contexts/AuthContext";

export default function ApprovalsCenter() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = React.useState("staff");
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<any>({
    staff: [],
    volunteers: [],
    ministries: [],
    testimonies: [],
    prayers: []
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Staff Verifications (already_serving=true and approval_status=pending)
      const { data: staff } = await supabase
        .from('profiles')
        .select('*')
        .eq('already_serving', true)
        .eq('approval_status', 'pending');

      // 2. Fetch Volunteer Applications
      const { data: volunteers } = await supabase
        .from('volunteer_applications')
        .select('*, church_departments(name), church_positions(title)')
        .eq('status', 'pending');

      // 3. Fetch Ministry Joins (pending members not yet active)
      const { data: ministries } = await supabase
        .from('ministry_members')
        .select('*, ministries(name), profiles:user_id(first_name, last_name, email, avatar_url)')
        .eq('role', 'pending');

      // 4. Fetch Testimonies
      const { data: testimonies } = await supabase
        .from('testimonies')
        .select('*')
        .eq('status', 'pending' as any);

      // 5. Fetch Prayer Requests pending approval
      const { data: prayers } = await supabase
        .from('prayer_requests')
        .select('id, title, description, requester_name, requester_email, created_at, is_urgent, category')
        .eq('is_approved', false)
        .is('approved_at', null);

      setData({
        staff: staff || [],
        volunteers: volunteers || [],
        ministries: ministries || [],
        testimonies: testimonies || [],
        prayers: prayers || []
      });
    } catch (error: any) {
      toast.error("Failed to load approval items");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (type: string, id: string, action: 'approve' | 'reject', record: any) => {
    try {
      let table = "";
      let updateData: any = {};

      switch (type) {
        case 'staff':
          table = 'profiles';
          updateData = { approval_status: action === 'approve' ? 'approved' : 'rejected' };
          break;
        case 'volunteers':
          table = 'volunteer_applications';
          updateData = { status: action === 'approve' ? 'approved' : 'rejected' };
          break;
        case 'ministries':
          table = 'ministry_members';
          updateData = { status: action === 'approve' ? 'active' : 'rejected', role: action === 'approve' ? 'member' : 'rejected' };
          break;
        case 'testimonies':
        case 'prayers':
          table = type;
          updateData = { 
            status: action === 'approve' ? 'approved' : 'rejected',
            is_approved: action === 'approve'
          };
          break;
      }

      if (type === 'staff') {
        const { error } = await supabase.from('profiles').update(updateData).eq('id', id);
        if (error) throw error;
      } else if (type === 'volunteers') {
        const { error } = await supabase.from('volunteer_applications').update(updateData).eq('id', id);
        if (error) throw error;
      } else if (type === 'ministries') {
        const { error } = await supabase.from('ministry_members').update({ 
          role: action === 'approve' ? 'member' : 'rejected',
          is_active: action === 'approve'
        }).eq('id', id);
        if (error) throw error;
      } else if (type === 'testimonies') {
        const { error } = await supabase.from('testimonies').update(updateData).eq('id', id);
        if (error) throw error;
      } else if (type === 'prayers') {
        const { error } = await supabase.from('prayer_requests').update({ is_approved: action === 'approve', approved_at: new Date().toISOString() }).eq('id', id);
        if (error) throw error;
      }

      if (type === 'staff' && action === 'approve') {
        // For staff, we might want to set a specific role or just mark as approved
        // The user already has already_serving=true
        await supabase.from('profiles').update({ 
          approval_status: 'approved',
          is_member: true 
        }).eq('id', id);
      } else if (type === 'volunteers' && action === 'approve') {
        // Update profile cache for department
        const deptName = record.church_departments?.name;
        if (deptName) {
          await supabase.from('profiles').update({ department: deptName } as any).eq('id', record.user_id);
        }
      } else if (type === 'ministries' && action === 'approve') {
        // Update profile cache for ministry
        const minName = record.ministries?.name;
        if (minName) {
          await supabase.from('profiles').update({ ministry: minName } as any).eq('id', record.user_id);
        }
      }

      await auditRepo.logAction({
        admin_id: user?.id || 'unknown',
        action: 'UPDATE',
        table_name: table,
        record_id: id,
        new_values: updateData
      });

      toast.success(`Item ${action}ed successfully`);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getCount = (tab: string) => data[tab]?.length || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
            <UserCheck className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter">Approvals Center</h1>
        </div>
        <p className="text-muted-foreground font-medium max-w-2xl">
          Central hub for all pending administrative actions. Review staff verifications, 
          volunteer applications, ministry joins, and community content.
        </p>
      </div>

      <Tabs defaultValue="staff" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 p-1 rounded-2xl h-14 w-full justify-start overflow-x-auto no-scrollbar mb-8">
          {[
            { id: "staff", label: "Staff Verifications", icon: Shield },
            { id: "volunteers", label: "Service Applicants", icon: Users },
            { id: "ministries", label: "Ministry Joins", icon: HeartHandshake },
            { id: "testimonies", label: "Testimonies", icon: MessageSquare },
            { id: "prayers", label: "Prayer Requests", icon: MessageSquare },
          ].map((tab) => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id}
              className="rounded-xl px-6 h-12 text-[10px] font-bold uppercase tracking-widest gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg"
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {getCount(tab.id) > 0 && (
                <Badge className="ml-1 bg-primary text-primary-foreground text-[8px] h-4 w-4 p-0 flex items-center justify-center rounded-full">
                  {getCount(tab.id)}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted/30 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <>
            <TabsContent value="staff" className="space-y-4">
              {data.staff.length === 0 ? <EmptyState icon={Shield} title="No pending staff verifications" /> : (
                <div className="grid gap-4">
                  {data.staff.map((item: any) => (
                    <ApprovalCard 
                      key={item.id} 
                      title={`${item.first_name} ${item.last_name}`}
                      subtitle={item.email}
                      meta={`Applied ${new Date(item.created_at).toLocaleDateString()}`}
                      avatar={item.avatar_url}
                      onApprove={() => handleAction('staff', item.id, 'approve', item)}
                      onReject={() => handleAction('staff', item.id, 'reject', item)}
                    >
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-none text-[8px] font-bold uppercase">Existing Worker Claim</Badge>
                      </div>
                    </ApprovalCard>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="volunteers" className="space-y-4">
              {data.volunteers.length === 0 ? <EmptyState icon={Users} title="No pending volunteer applications" /> : (
                <div className="grid gap-4">
                  {data.volunteers.map((item: any) => (
                    <ApprovalCard 
                      key={item.id} 
                      title={item.applicant_name}
                      subtitle={item.applicant_email}
                      meta={item.church_departments?.name || "General"}
                      onApprove={() => handleAction('volunteers', item.id, 'approve', item)}
                      onReject={() => handleAction('volunteers', item.id, 'reject', item)}
                    >
                      <div className="mt-2 space-y-2">
                        <p className="text-xs text-muted-foreground font-medium italic">"{item.motivation}"</p>
                        <div className="flex gap-2">
                           <Badge variant="outline" className="bg-primary/10 text-primary border-none text-[8px] font-bold uppercase">{item.church_positions?.title || "Member"}</Badge>
                           {item.skills && <Badge variant="outline" className="bg-muted/50 border-none text-[8px] font-bold uppercase">Skills: {item.skills}</Badge>}
                        </div>
                      </div>
                    </ApprovalCard>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="ministries" className="space-y-4">
              {data.ministries.length === 0 ? <EmptyState icon={HeartHandshake} title="No pending ministry joins" /> : (
                <div className="grid gap-4">
                  {data.ministries.map((item: any) => (
                    <ApprovalCard 
                      key={item.id} 
                      title={`${item.profiles?.first_name} ${item.profiles?.last_name}`}
                      subtitle={item.profiles?.email}
                      meta={`Joined ${item.ministries?.name}`}
                      avatar={item.profiles?.avatar_url}
                      onApprove={() => handleAction('ministries', item.id, 'approve', item)}
                      onReject={() => handleAction('ministries', item.id, 'reject', item)}
                    >
                      {item.notes && <p className="mt-2 text-xs text-muted-foreground font-medium italic">"{item.notes}"</p>}
                    </ApprovalCard>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="testimonies" className="space-y-4">
              {data.testimonies.length === 0 ? <EmptyState icon={MessageSquare} title="No pending testimonies" /> : (
                <div className="grid gap-4">
                  {data.testimonies.map((item: any) => (
                    <ApprovalCard 
                      key={item.id} 
                      title={item.title}
                      subtitle={`By ${item.author_name} ${item.is_anonymous ? '(Anonymous)' : ''}`}
                      meta={new Date(item.created_at).toLocaleDateString()}
                      onApprove={() => handleAction('testimonies', item.id, 'approve', item)}
                      onReject={() => handleAction('testimonies', item.id, 'reject', item)}
                    >
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-3">{item.content}</p>
                    </ApprovalCard>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="prayers" className="space-y-4">
              {data.prayers.length === 0 ? <EmptyState icon={MessageSquare} title="No pending prayer requests" /> : (
                <div className="grid gap-4">
                  {data.prayers.map((item: any) => (
                    <ApprovalCard 
                      key={item.id} 
                      title={item.title || item.category}
                      subtitle={`Request from ${item.requester_name}`}
                      meta={item.category}
                      onApprove={() => handleAction('prayers', item.id, 'approve', item)}
                      onReject={() => handleAction('prayers', item.id, 'reject', item)}
                    >
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-3">{item.description}</p>
                      <div className="mt-2 flex gap-2">
                        {item.is_public ? <Badge variant="outline" className="text-[8px] bg-emerald-50 border-emerald-100 text-emerald-600 font-bold uppercase">Public Wall</Badge> : <Badge variant="outline" className="text-[8px] bg-muted border-none text-muted-foreground font-bold uppercase">Private</Badge>}
                      </div>
                    </ApprovalCard>
                  ))}
                </div>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

function ApprovalCard({ title, subtitle, meta, avatar, children, onApprove, onReject }: any) {
  return (
    <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="p-6 flex flex-col md:flex-row md:items-center gap-6">
        <Avatar className="h-14 w-14 rounded-2xl shadow-lg shadow-primary/10 border-2 border-background">
          <AvatarImage src={avatar} />
          <AvatarFallback className="bg-primary/10 text-primary font-black text-xl">{title[0]}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-lg font-black tracking-tight truncate">{title}</h3>
            <Badge variant="outline" className="bg-primary/5 text-primary border-none text-[8px] font-bold uppercase tracking-widest">{meta}</Badge>
          </div>
          <p className="text-sm text-muted-foreground font-medium">{subtitle}</p>
          {children}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button 
            onClick={onReject} 
            variant="outline" 
            className="h-11 rounded-xl border-none bg-rose-500/5 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 text-[10px] font-black uppercase tracking-widest px-6"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Reject
          </Button>
          <Button 
            onClick={onApprove} 
            className="h-11 rounded-xl shadow-lg shadow-primary/20 text-[10px] font-black uppercase tracking-widest px-6"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Approve
          </Button>
        </div>
      </div>
    </Card>
  );
}

function EmptyState({ icon: Icon, title }: { icon: any, title: string }) {
  return (
    <div className="py-24 text-center space-y-4 bg-muted/10 rounded-[2rem] border-2 border-dashed border-muted">
      <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto">
        <Icon className="w-10 h-10 text-muted-foreground/30" />
      </div>
      <div className="space-y-1">
        <h3 className="font-bold text-xl text-muted-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground/60">Check back later for new items to review.</p>
      </div>
    </div>
  );
}
