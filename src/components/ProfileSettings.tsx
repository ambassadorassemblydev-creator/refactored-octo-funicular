import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Bell, 
  Shield, 
  CreditCard,
  Camera,
  Save,
  CheckCircle2,
  AlertCircle,
  Key,
  Smartphone,
  Globe,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  Activity,
  Heart,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/src/lib/supabase";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";

const profileSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address_line_1: z.string().optional(),
  bio: z.string().max(500).optional(),
});

import { useAuth } from "@/src/contexts/AuthContext";

export default function ProfileSettings() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [profile, setProfile] = React.useState<any>(null);
  const [showPassword, setShowPassword] = React.useState(false);

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(profileSchema),
  });

  const fetchProfile = async (retries = 3) => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      reset({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: user.email || "",
        phone: data.phone || "",
        address_line_1: data.address_line_1 || "",
        bio: data.bio || "",
      });
    } catch (error: any) {
      if (error?.message?.includes("Lock") && retries > 0) {
        setTimeout(() => fetchProfile(retries - 1), 500);
        return;
      }
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!authLoading) {
      fetchProfile();
    }
  }, [user, authLoading]);

  const onSubmit = async (data: any) => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);

      if (error) throw error;
      toast.success("Profile updated successfully!");
      fetchProfile();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const calculateCompleteness = () => {
    if (!profile) return 0;
    const fields = ['first_name', 'last_name', 'phone', 'address_line_1', 'bio', 'avatar_url'];
    const filled = fields.filter(f => !!profile[f]).length;
    return Math.round((filled / fields.length) * 100);
  };

  const completeness = calculateCompleteness();

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-muted-foreground">Manage your profile, notifications, and security preferences.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Profile Strength</span>
            <div className="flex items-center gap-2">
              <Progress value={completeness} className="w-24 h-1.5" />
              <span className="text-xs font-bold text-primary">{completeness}%</span>
            </div>
          </div>
          <Button variant="outline" className="rounded-xl h-11 px-5 border-none shadow-sm bg-card/50">
            View Public Profile
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px] h-12 p-1 bg-muted/50 rounded-xl mb-8">
          <TabsTrigger value="profile" className="rounded-lg text-[10px] font-bold uppercase tracking-widest gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg text-[10px] font-bold uppercase tracking-widest gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg text-[10px] font-bold uppercase tracking-widest gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="giving" className="rounded-lg text-[10px] font-bold uppercase tracking-widest gap-2">
            <Heart className="w-4 h-4" />
            <span className="hidden sm:inline">Giving</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-3">
            <Card className="lg:col-span-1 border-none shadow-md bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden h-fit">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Profile Identity</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Your digital church ID</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-8">
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Avatar className="w-40 h-40 border-4 border-background shadow-2xl relative z-10">
                    <AvatarImage src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} />
                    <AvatarFallback className="text-4xl">{profile?.first_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="absolute bottom-2 right-2 rounded-full shadow-xl z-20 h-10 w-10 border-2 border-background"
                  >
                    <Camera className="w-5 h-5" />
                  </Button>
                </div>
                
                <div className="text-center space-y-1">
                  <h3 className="text-2xl font-bold tracking-tight">{profile?.first_name} {profile?.last_name}</h3>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Member since {profile?.created_at ? new Date(profile.created_at).getFullYear() : '2024'}</p>
                </div>

                  />
                </div>

                <div className="w-full pt-4 border-t border-muted/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Account Role</span>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-none text-[10px] font-bold uppercase">{profile?.role || 'Member'}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Verification</span>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "border-none text-[10px] font-bold uppercase",
                        profile?.approval_status === 'approved' ? "bg-emerald-500/10 text-emerald-600" : 
                        profile?.approval_status === 'pending' ? "bg-amber-500/10 text-amber-600" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {profile?.approval_status || 'Unverified'}
                    </Badge>
                  </div>
                  {profile?.department && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Department</span>
                      <span className="text-xs font-bold text-foreground">{profile.department}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-none shadow-md bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Personal Information</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Update your contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">First Name</Label>
                    <Input className="h-11 rounded-xl bg-background/50 border-none" {...register("first_name")} />
                    {errors.first_name && <p className="text-[10px] text-destructive font-bold uppercase">{errors.first_name.message as string}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Last Name</Label>
                    <Input className="h-11 rounded-xl bg-background/50 border-none" {...register("last_name")} />
                    {errors.last_name && <p className="text-[10px] text-destructive font-bold uppercase">{errors.last_name.message as string}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input className="h-11 pl-11 rounded-xl bg-background/50 border-none" {...register("email")} disabled />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Email cannot be changed manually. Contact admin for updates.</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input className="h-11 pl-11 rounded-xl bg-background/50 border-none" {...register("phone")} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Home Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input className="h-11 pl-11 rounded-xl bg-background/50 border-none" {...register("address_line_1")} />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-6 border-t bg-muted/5">
                <Button type="submit" className="ml-auto gap-2 rounded-xl h-11 px-8 shadow-lg shadow-primary/20" disabled={saving || !isDirty}>
                  {saving ? "Saving..." : "Save Changes"}
                  <Save className="w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Notification Preferences</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Choose how you stay connected</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { id: "news", title: "Church Newsletter", desc: "Weekly updates, news, and announcements.", icon: Globe },
                { id: "events", title: "Event Reminders", desc: "Notifications for events you've registered for.", icon: Calendar },
                { id: "prayers", title: "Prayer Requests", desc: "Alerts for new or urgent prayer requests.", icon: Activity },
                { id: "sermons", title: "New Sermons", desc: "Get notified when a new sermon is uploaded.", icon: Lock },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-background/40 hover:bg-background/60 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold">{item.title}</Label>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Update Password</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Keep your account secure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Current Password</Label>
                    <div className="relative">
                      <Input type={showPassword ? "text" : "password"} className="h-11 rounded-xl bg-background/50 border-none" />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">New Password</Label>
                    <Input type="password" className="h-11 rounded-xl bg-background/50 border-none" />
                  </div>
                </div>
                <Button className="w-full rounded-xl h-11 font-bold uppercase tracking-widest text-[10px] gap-2">
                  <Key className="w-4 h-4" />
                  Update Password
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-destructive">Danger Zone</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Irreversible account actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/10">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                    <p className="text-sm font-bold text-destructive">Delete Account</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                    Once you delete your account, all your data, including giving history and ministry memberships, will be permanently removed.
                  </p>
                  <Button variant="destructive" className="w-full rounded-xl h-11 font-bold uppercase tracking-widest text-[10px]">
                    Delete My Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
