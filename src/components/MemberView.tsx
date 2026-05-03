import * as React from "react";
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  CreditCard, 
  History, 
  ShieldCheck, 
  Award,
  AlertCircle,
  Plus,
  Loader2,
  Download,
  Heart,
  Users,
  CheckCircle2,
  ExternalLink,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";
import { motion } from "motion/react";
import { useAuth } from "@/src/contexts/AuthContext";
import SendEmailDialog from "./SendEmailDialog";

interface MemberViewProps {
  member: any;
  onBack: () => void;
  canViewFinancials: boolean;
  canViewNotes: boolean;
}

export default function MemberView({ member, onBack, canViewFinancials, canViewNotes }: MemberViewProps) {
  const [loading, setLoading] = React.useState(true);
  const [donations, setDonations] = React.useState<any[]>([]);
  const [notes, setNotes] = React.useState<any[]>([]);
  const [attendance, setAttendance] = React.useState<any[]>([]);
  const [family, setFamily] = React.useState<any[]>([]);
  const [suggestions, setSuggestions] = React.useState<any[]>([]);
  const [newNote, setNewNote] = React.useState("");
  const [isNoteAdding, setIsNoteAdding] = React.useState(false);
  const [emailDialog, setEmailDialog] = React.useState({ open: false, to: "", subject: "" });
  const [isLinking, setIsLinking] = React.useState<string | null>(null);

  const handleOpenEmail = () => {
    setEmailDialog({
      open: true,
      to: member.email,
      subject: `Message from Ambassadors Assembly`
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const promises = [];

      // 1. Fetch Donations
      if (canViewFinancials) {
        promises.push(
          supabase
            .from('donations')
            .select('*')
            .eq('user_id', member.id)
            .order('created_at', { ascending: false })
            .then(({ data }) => setDonations(data || []))
        );
      }

      // 2. Fetch Notes
      if (canViewNotes) {
        promises.push(
          supabase
            .from('member_notes')
            .select('*, author:author_id(first_name, last_name)')
            .eq('member_id', member.id)
            .order('created_at', { ascending: false })
            .then(({ data }) => setNotes(data || []))
        );
      }

      // 3. Fetch Attendance
      promises.push(
        supabase
          .from('attendance_records')
          .select('*')
          .eq('user_id', member.id)
          .order('service_date', { ascending: false })
          .limit(10)
          .then(({ data }) => setAttendance(data || []))
      );

      // 4. Fetch Family
      promises.push(
        supabase
          .from('family_members')
          .select('family_id')
          .eq('user_id', member.id)
          .then(async ({ data: links }) => {
            if (links && links.length > 0) {
              const familyIds = links.map(l => l.family_id);
              const { data: members } = await supabase
                .from('family_members')
                .select('*, profile:user_id(first_name, last_name, avatar_url)')
                .in('family_id', familyIds);
              setFamily(members || []);
            } else {
              setFamily([]);
            }
          })
      );

      // 5. Fetch Suggested Family (Same Last Name)
      promises.push(
        supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .eq('last_name', member.last_name)
          .neq('id', member.id)
          .limit(5)
          .then(({ data }) => setSuggestions(data || []))
      );

      await Promise.all(promises);
    } catch (err) {
      console.error("Error fetching member detail data:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [member.id]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setIsNoteAdding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('member_notes')
        .insert({
          member_id: member.id,
          author_id: user!.id,
          note: newNote,
          category: 'Pastoral',
          is_confidential: true
        });

      if (error) throw error;
      toast.success("Pastoral note added");
      setNewNote("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsNoteAdding(false);
    }
  };

  const handleLinkFamily = async (suggestedMemberId: string) => {
    setIsLinking(suggestedMemberId);
    try {
      // 1. Check if current member has a family
      const { data: currentLinks } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', member.id)
        .single();

      // 2. Check if suggested member has a family
      const { data: suggestedLinks } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', suggestedMemberId)
        .single();

      let targetFamilyId = currentLinks?.family_id || suggestedLinks?.family_id;

      if (!targetFamilyId) {
        // Create new family group
        const { data: newGroup, error: groupError } = await supabase
          .from('family_groups')
          .insert({ family_name: `${member.last_name} Family` })
          .select()
          .single();
        
        if (groupError) throw groupError;
        targetFamilyId = newGroup.id;
      }

      // 3. Add members to family if not already there
      const inserts = [];
      if (!currentLinks) {
        inserts.push({ family_id: targetFamilyId, user_id: member.id, relationship: 'Member' });
      }
      if (!suggestedLinks) {
        inserts.push({ family_id: targetFamilyId, user_id: suggestedMemberId, relationship: 'Family Member' });
      }

      if (inserts.length > 0) {
        const { error: insertError } = await supabase
          .from('family_members')
          .insert(inserts);
        if (insertError) throw insertError;
      }

      // 4. Update potential_family_matches if it exists
      try {
        const { data: match } = await supabase
          .from('potential_family_matches')
          .select('id')
          .or(`user_id_1.eq.${member.id},user_id_2.eq.${member.id}`)
          .or(`user_id_2.eq.${suggestedMemberId},user_id_1.eq.${suggestedMemberId}`)
          .eq('status', 'pending')
          .maybeSingle();

        if (match) {
          const { error: updateError } = await supabase
            .from('potential_family_matches')
            .update({ 
              status: 'confirmed',
              confirmed_at: new Date().toISOString(),
              confirmed_by: (await supabase.auth.getUser()).data.user?.id
            })
            .eq('id', match.id);
          
          if (updateError) throw updateError;
          console.log("Potential match updated to confirmed ✅");
        }
      } catch (e) {
        console.error("Potential match update failed (non-critical):", e);
      }

      toast.success("Family connection established");
      fetchData();
    } catch (err: any) {
      console.error("Error linking family:", err);
      toast.error("Failed to link family member");
    } finally {
      setIsLinking(null);
    }
  };

  const { role: currentUserRole } = useAuth();
  const isAdmin = currentUserRole === 'admin' || currentUserRole === 'super_admin' || currentUserRole === 'pastor';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 sm:pb-0">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-2xl h-12 w-12 hover:bg-primary/5 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-4 border-background shadow-xl ring-2 ring-primary/10">
              <AvatarImage src={member.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`} />
              <AvatarFallback className="bg-primary/5 text-primary text-xl font-black">
                {member.first_name?.[0]}{member.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center flex-wrap gap-x-2">
                {member.title && <span className="text-muted-foreground font-medium">{member.title}</span>}
                {member.first_name} {member.last_name}
              </h1>
              <Badge className={cn("text-[10px] font-bold uppercase tracking-widest px-3 py-1 border-none",
                member.status === 'active' ? "bg-emerald-500 text-white" : "bg-amber-500 text-white")}>
                {member.status}
              </Badge>
            </div>
            <p className="text-muted-foreground flex items-center gap-2 text-xs sm:text-sm">
              <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-primary/20 text-primary bg-primary/5">
                {member.member_id || 'AMBASSADOR'}
              </Badge>
              <span className="hidden sm:inline">•</span>
              <span className="truncate max-w-[150px] sm:max-w-none">{member.email}</span>
            </p>
          </div>
        </div>
        
        {isAdmin && (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-none rounded-2xl h-11 px-6 font-bold uppercase tracking-widest text-[10px] gap-2 border-primary/20 hover:bg-primary/5">
              <Download className="w-4 h-4" /> <span className="hidden sm:inline">Download Profile</span><span className="sm:hidden">Download</span>
            </Button>
            <Button className="flex-1 sm:flex-none rounded-2xl h-11 px-8 font-bold uppercase tracking-widest text-[10px] gap-2 shadow-xl shadow-primary/20">
              <ShieldCheck className="w-4 h-4" /> Edit Profile
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Info */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-primary/5 pb-6">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Users className="w-4 h-4" /> Member Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-3xl bg-muted/30 text-center">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Attendance</p>
                  <p className="text-xl sm:text-2xl font-black">{attendance.filter(a => a.attendance === 'in_person').length}/10</p>
                </div>
                <div className="p-4 rounded-3xl bg-muted/30 text-center">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Giving</p>
                  <p className="text-xl sm:text-2xl font-black">{donations.length}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Joined Date</span>
                  <span className="font-bold">{new Date(member.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Baptized</span>
                  <Badge variant={member.is_baptized ? "default" : "secondary"} className="rounded-full text-[9px] uppercase">
                    {member.is_baptized ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Ministry</span>
                  <span className="font-bold text-primary">{member.ministry || 'General'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-primary/5 pb-6">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Contact & Bio
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone</p>
                    <p className="text-sm font-medium">{member.phone || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Address</p>
                    <p className="text-sm font-medium leading-relaxed">
                      {member.address_line_1}<br/>{member.city}, {member.country}
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-muted/50">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">About Member</p>
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  {member.bio || "No biography provided for this member."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: History Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="giving" className="w-full">
            <div className="relative">
              <TabsList className="bg-muted/50 p-1 rounded-2xl h-14 w-full justify-start gap-2 overflow-x-auto scrollbar-none flex-nowrap whitespace-nowrap">
                <TabsTrigger value="giving" className="shrink-0 rounded-xl px-6 data-[state=active]:bg-card data-[state=active]:shadow-lg font-bold text-xs uppercase tracking-widest">
                  <CreditCard className="w-4 h-4 mr-2" /> Giving
                </TabsTrigger>
                <TabsTrigger value="attendance" className="shrink-0 rounded-xl px-6 data-[state=active]:bg-card data-[state=active]:shadow-lg font-bold text-xs uppercase tracking-widest">
                  <History className="w-4 h-4 mr-2" /> Attendance
                </TabsTrigger>
                <TabsTrigger value="notes" className="shrink-0 rounded-xl px-6 data-[state=active]:bg-card data-[state=active]:shadow-lg font-bold text-xs uppercase tracking-widest text-emerald-600 data-[state=active]:text-emerald-700">
                  <AlertCircle className="w-4 h-4 mr-2" /> Pastoral Notes
                </TabsTrigger>
                <TabsTrigger value="contact" className="shrink-0 rounded-xl px-6 data-[state=active]:bg-card data-[state=active]:shadow-lg font-bold text-xs uppercase tracking-widest text-primary data-[state=active]:text-primary">
                  <Mail className="w-4 h-4 mr-2" /> Contact
                </TabsTrigger>
                <TabsTrigger value="family" className="shrink-0 rounded-xl px-6 data-[state=active]:bg-card data-[state=active]:shadow-lg font-bold text-xs uppercase tracking-widest text-amber-600 data-[state=active]:text-amber-700">
                  <Users className="w-4 h-4 mr-2" /> Family
                </TabsTrigger>
              </TabsList>
            </div>

            {/* GIVING TAB */}
            <TabsContent value="giving" className="mt-6 animate-in fade-in slide-in-from-top-2">
              <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md rounded-[2.5rem]">
                <CardContent className="p-4 sm:p-6">
                  {loading ? (
                    <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted/30 rounded-2xl animate-pulse" />)}</div>
                  ) : donations.length === 0 ? (
                    <div className="py-20 text-center">
                      <CreditCard className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                      <p className="text-muted-foreground font-medium">No donation history found.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {donations.map((donation) => (
                        <div key={donation.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors group">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                              <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-xs sm:text-sm">{donation.donation_type || 'General Donation'}</p>
                              <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-widest">
                                {new Date(donation.created_at).toLocaleDateString()} · {donation.payment_channel || 'Stripe'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-base sm:text-lg text-emerald-600">
                              {donation.currency === 'NGN' ? '₦' : '£'}{parseFloat(donation.amount).toLocaleString()}
                            </p>
                            <Badge className="text-[7px] sm:text-[8px] uppercase tracking-widest font-black bg-emerald-500/10 text-emerald-600 border-none">
                              Successful
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ... other TabsContent remain similar, adding p-4 sm:p-6 padding ... */}
            <TabsContent value="attendance" className="mt-6 animate-in fade-in slide-in-from-top-2">
              <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md rounded-[2.5rem]">
                <CardContent className="p-4 sm:p-6">
                  {loading ? (
                    <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted/30 rounded-2xl animate-pulse" />)}</div>
                  ) : attendance.length === 0 ? (
                    <div className="py-20 text-center">
                      <History className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                      <p className="text-muted-foreground font-medium">No attendance records found.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {attendance.map((record) => (
                        <div key={record.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                              <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-xs sm:text-sm">{record.service_name}</p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                                {new Date(record.service_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge className={cn("text-[9px] sm:text-[10px] uppercase tracking-widest font-black border-none",
                            record.attendance === 'in_person' ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600")}>
                            {record.attendance.replace('_', ' ')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* NOTES TAB */}
            <TabsContent value="notes" className="mt-6 animate-in fade-in slide-in-from-top-2">
              <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md rounded-[2.5rem]">
                <CardHeader className="p-4 sm:p-6 pb-4">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Type a pastoral note..." 
                      className="bg-muted/30 border-none h-12 rounded-2xl text-sm"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                    />
                    <Button 
                      className="h-12 rounded-2xl px-6 bg-emerald-600 hover:bg-emerald-700"
                      onClick={handleAddNote}
                      disabled={isNoteAdding || !newNote.trim()}
                    >
                      {isNoteAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  {loading ? (
                    <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-muted/30 rounded-2xl animate-pulse" />)}</div>
                  ) : notes.length === 0 ? (
                    <div className="py-20 text-center">
                      <AlertCircle className="w-12 h-12 text-emerald-500/20 mx-auto mb-4" />
                      <p className="text-muted-foreground font-medium">No pastoral notes for this member.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {notes.map((note) => (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }} 
                          animate={{ opacity: 1, x: 0 }}
                          key={note.id} 
                          className="p-4 sm:p-5 rounded-3xl bg-card border border-primary/5 shadow-sm space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] text-white font-black">P</div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                                Pastor {note.author?.first_name} {note.author?.last_name}
                              </p>
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground">
                              {new Date(note.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm leading-relaxed text-card-foreground/80">
                            {note.note}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* CONTACT TAB */}
            <TabsContent value="contact" className="mt-6 animate-in fade-in slide-in-from-top-2">
              <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md rounded-[2.5rem]">
                <CardContent className="p-6 sm:p-12 space-y-6">
                  <div className="flex flex-col items-center justify-center py-6 sm:py-12 text-center space-y-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <Mail className="w-8 h-8 sm:w-10 sm:h-10" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg sm:text-xl font-black tracking-tight">Direct Communication</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">Send a branded email directly to {member.first_name} via the church's official channel.</p>
                    </div>
                    <Button 
                      className="w-full sm:w-auto rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-[10px] gap-2 shadow-xl shadow-primary/20"
                      onClick={handleOpenEmail}
                    >
                      <Mail className="w-4 h-4" />
                      Compose Email
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* FAMILY TAB */}
            <TabsContent value="family" className="mt-6 animate-in fade-in slide-in-from-top-2">
              <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md rounded-[2.5rem]">
                <CardHeader className="p-6 sm:p-8 pb-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl sm:text-2xl font-black tracking-tight">Family Circle</CardTitle>
                      <CardDescription className="text-xs">Members connected to {member.first_name}'s unit.</CardDescription>
                    </div>
                    {isAdmin && (
                      <Button variant="outline" className="w-full sm:w-auto rounded-2xl border-amber-500/20 text-amber-600 hover:bg-amber-500/5 font-bold uppercase tracking-widest text-[10px] gap-2">
                        <Plus className="w-4 h-4" /> Add Member
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6 sm:p-8 space-y-6">
                  {family.length === 0 ? (
                    <div className="py-12 text-center space-y-4">
                      <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-600 mx-auto">
                        <Users className="w-8 h-8" />
                      </div>
                      <p className="text-muted-foreground font-medium">No family connections found.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {family.map((rel) => (
                        <div key={rel.id} className="p-4 rounded-3xl bg-muted/30 border border-primary/5 flex items-center gap-4 group hover:bg-muted/50 transition-all">
                          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-background shadow-md">
                            <AvatarImage src={rel.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${rel.user_id}`} />
                            <AvatarFallback className="bg-amber-500 text-white font-bold text-xs">
                              {rel.profile?.first_name?.[0]}{rel.profile?.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-bold text-xs sm:text-sm">{rel.profile?.first_name} {rel.profile?.last_name}</p>
                            <Badge variant="outline" className="text-[8px] sm:text-[9px] uppercase tracking-tighter bg-background/50">
                              {rel.relationship}
                            </Badge>
                          </div>
                          <Button size="icon" variant="ghost" className="rounded-full opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* SUGGESTIONS SECTION (Admin only) */}
                  {isAdmin && suggestions.length > 0 && suggestions.some(s => !family.some(f => f.user_id === s.id)) && (
                    <div className="pt-8 border-t border-muted/50 space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-lg bg-amber-500/10 flex items-center justify-center">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Smart Suggestions</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {suggestions.filter(s => !family.some(f => f.user_id === s.id)).map((sug) => (
                          <div key={sug.id} className="p-3 sm:p-4 rounded-3xl bg-amber-500/5 border border-amber-500/10 flex items-center gap-4 group hover:bg-amber-500/10 transition-all">
                            <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                              <AvatarImage src={sug.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sug.id}`} />
                              <AvatarFallback className="bg-amber-100 text-amber-600 font-bold text-xs">
                                {sug.first_name?.[0]}{sug.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-xs truncate">{sug.first_name} {sug.last_name}</p>
                              <p className="text-[8px] text-muted-foreground font-medium uppercase tracking-tighter">Potential Relative</p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest gap-1 hover:bg-amber-500 hover:text-white transition-all px-2 sm:px-3"
                              onClick={() => handleLinkFamily(sug.id)}
                              disabled={isLinking === sug.id}
                            >
                              {isLinking === sug.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                              Link
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <SendEmailDialog 
        open={emailDialog.open}
        onOpenChange={(open) => setEmailDialog(prev => ({ ...prev, open }))}
        defaultTo={emailDialog.to}
        defaultSubject={emailDialog.subject}
      />
    </div>
  );
}
