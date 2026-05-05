import * as React from "react";
import {
  Settings, Shield, ShieldCheck, Database, Globe, Mail, Server,
  Users, Save, Plus, History, Activity, AlertTriangle, CheckCircle2,
  ChevronRight, Edit2, Trash2, Key, Cloud, Search, Download, Megaphone,
  Link, Phone, MapPin, Instagram, Youtube, Facebook, Twitter, Rss,
  MessageSquare, ToggleLeft, ToggleRight, Palette, Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "motion/react";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";
import { useAuth } from "@/src/contexts/AuthContext";
import { auditRepo } from "@/src/lib/audit";
import { notificationRepo } from "@/src/lib/notifications";

type Settings = Record<string, string>;

function SettingRow({ label, description, settingKey, settings, onChange }: { label: string; description?: string; settingKey: string; settings: Settings; onChange: (key: string, val: string) => void }) {
  const isBool = settings[settingKey] === "true" || settings[settingKey] === "false";
  if (isBool) {
    return (
      <div className="flex items-center justify-between p-4 rounded-2xl bg-background/40 border border-border/30">
        <div className="space-y-0.5">
          <Label className="text-sm font-bold">{label}</Label>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <Switch
          checked={settings[settingKey] === "true"}
          onCheckedChange={v => onChange(settingKey, v ? "true" : "false")}
        />
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <Input
        className="h-11 rounded-xl bg-background/50 border-none"
        value={settings[settingKey] || ""}
        onChange={e => onChange(settingKey, e.target.value)}
      />
    </div>
  );
}

export default function AdminControls({ defaultTab = "general" }: { defaultTab?: string }) {
  const { user, role, loading: authLoading } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [settings, setSettings] = React.useState<Settings>({});
  const [auditLogs, setAuditLogs] = React.useState<any[]>([]);
  const [roles, setRoles] = React.useState<any[]>([]);
  const [userSearch, setUserSearch] = React.useState("");
  const [foundUsers, setFoundUsers] = React.useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = React.useState(false);
  const [assigningId, setAssigningId] = React.useState<string | null>(null);
  const [selectedRole, setSelectedRole] = React.useState<string>("member");
  const [activeTab, setActiveTabState] = React.useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || defaultTab;
  });

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
  };

  if (!authLoading && role !== 'admin' && role !== 'super_admin' && role !== 'pastor') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-rose-500/10 rounded-[2.5rem] flex items-center justify-center relative">
          <div className="absolute inset-0 bg-rose-500/20 rounded-[2.5rem] blur-2xl animate-pulse" />
          <Shield className="w-12 h-12 text-rose-500 relative z-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black tracking-tighter">System Restricted</h2>
          <p className="text-muted-foreground max-w-sm mx-auto font-medium">
            Administrative controls and system settings are strictly limited to 
            Super Admins and Pastoral leadership.
          </p>
        </div>
        <Button 
          variant="outline" 
          className="rounded-xl border-primary/20 hover:bg-primary/5 text-primary font-bold uppercase tracking-widest text-[10px] h-11 px-8"
          onClick={() => window.history.back()}
        >
          Return to Dashboard
        </Button>
      </div>
    );
  }

  // Announcement bar state
  const [bar, setBar] = React.useState<any>({
    label: "",
    info_text: "",
    cta_text: "Watch Online",
    cta_link: "/watch",
    times: [] as string[],
    is_active: true,
    is_scrolling: false,
    bg_color: "rgba(14,14,14,0.85)",
    text_color: "#f5f0e8",
    speed: 10,
  });
  const [barId, setBarId] = React.useState<string | null>(null);
  const [newTime, setNewTime] = React.useState("");

  const fetchAll = async () => {
    setLoading(true);
    const [
      { data: settingsData },
      { data: logsData },
      { data: rolesData },
      { data: barData },
    ] = await Promise.all([
      supabase.from("church_settings").select("key, value"),
      supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("roles").select("*"),
      supabase.from("announcement_bar").select("*").limit(1).maybeSingle(),
    ]);

    // Convert settings array to object
    const settingsObj: Settings = {};
    (settingsData || []).forEach((s: any) => { settingsObj[s.key] = s.value; });
    setSettings(settingsObj);

    if (barData) {
      setBarId(barData.id);
      setBar({ ...barData, times: barData.times || [] });
    }

    setAuditLogs(logsData || []);
    setRoles(rolesData || []);
    setLoading(false);
  };

  React.useEffect(() => {
    if (!authLoading) fetchAll();
  }, [authLoading]);

  const handleSettingChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async (keys: string[]) => {
    setSaving(true);
    try {
      const updates = keys.map(key => 
        supabase.from("church_settings").upsert({ 
          key, 
          value: settings[key],
          updated_at: new Date().toISOString() 
        }, { onConflict: 'key' })
      );
      
      const results = await Promise.all(updates);

      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        toast.error("Some settings failed to save.");
        console.error("Save errors:", errors.map(e => e.error));
      } else {
        toast.success("Settings updated successfully!");
        // Log the action
        await auditRepo.logAction({
          admin_id: user?.id || 'unknown',
          action: 'UPDATE',
          table_name: 'church_settings',
          record_id: keys.join(','),
          new_values: settings
        });

        await notificationRepo.notifyAdmins(
          "Settings Updated",
          `${user?.user_metadata?.full_name || 'An admin'} updated church settings: ${keys.join(', ')}`
        );
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const saveBar = async () => {
    setSaving(true);
    const payload = { ...bar };
    let error;
    if (barId) {
      ({ error } = await supabase.from("announcement_bar").update(payload).eq("id", barId));
    } else {
      const res = await supabase.from("announcement_bar").insert(payload).select().single();
      error = res.error;
      if (res.data) setBarId(res.data.id);
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Announcement bar updated! Live on the website.");
    
    await auditRepo.logAction({
      admin_id: user?.id || 'unknown',
      action: barId ? 'UPDATE' : 'INSERT',
      table_name: 'announcement_bar',
      record_id: barId || 'new',
      new_values: payload
    });

    await notificationRepo.notifyAdmins(
      "Announcement Updated",
      `${user?.user_metadata?.full_name || 'An admin'} updated the website announcement bar.`
    );
  };

  const addTime = () => {
    if (newTime.trim() && !bar.times.includes(newTime.trim())) {
      setBar((b: any) => ({ ...b, times: [...b.times, newTime.trim()] }));
    }
    setNewTime("");
  };

  const removeTime = (t: string) => setBar((b: any) => ({ ...b, times: b.times.filter((x: string) => x !== t) }));

  const handleUserSearch = async () => {
    if (userSearch.length < 2) return;
    setSearchingUsers(true);
    try {
      const parts = userSearch.split(' ').filter(Boolean);
      let query = supabase.from('profiles').select('id, first_name, last_name, email, avatar_url');
      
      if (parts.length > 1) {
        // Full name search: match both first and last name
        query = query.filter('first_name', 'ilike', `%${parts[0]}%`).filter('last_name', 'ilike', `%${parts[1]}%`);
      } else {
        // Single term search: check all fields
        query = query.or(`first_name.ilike.%${userSearch}%,last_name.ilike.%${userSearch}%,email.ilike.%${userSearch}%,role_claim.ilike.%${userSearch}%`);
      }
      
      const { data } = await query.limit(10);
      setFoundUsers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingUsers(false);
    }
  };

  const assignRole = async (userId: string) => {
    setAssigningId(userId);
    try {
      // Single source of truth: update role_claim on profiles
      const { error } = await supabase.from('profiles').update({ role_claim: selectedRole }).eq('id', userId);
      if (error) throw error;

      toast.success(`Role '${selectedRole}' assigned successfully!`);
      setFoundUsers([]);
      setUserSearch("");
      
      await auditRepo.logAction({
        admin_id: user?.id || 'unknown',
        action: 'UPDATE',
        table_name: 'profiles',
        record_id: userId,
        new_values: { role_claim: selectedRole }
      });

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAssigningId(null);
    }
  };

  const SaveBtn = ({ keys }: { keys: string[] }) => (
    <Button disabled={saving} onClick={() => saveSettings(keys)} className="ml-auto gap-2 rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
      <Save className="w-4 h-4" />
      {saving ? "Saving..." : "Save Changes"}
    </Button>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <ShieldCheck className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter">Admin Controls</h1>
        </div>
        <p className="text-muted-foreground font-medium">Manage church-wide settings, announcement bar, user roles, and system configurations.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          <TabsList className="inline-flex h-12 p-1 bg-muted/50 rounded-xl mb-4 sm:mb-8 gap-1">
            {[
              { value: "general", icon: Globe, label: "General" },
              { value: "announcement", icon: Megaphone, label: "Announcement Bar" },
              { value: "features", icon: ToggleRight, label: "Features" },
              { value: "social", icon: Link, label: "Social" },
              { value: "email", icon: Mail, label: "Email" },
              { value: "roles", icon: Shield, label: "Roles" },
              { value: "system", icon: Server, label: "System" },
              { value: "audit", icon: History, label: "Audit" },
            ].map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="rounded-lg text-[10px] font-bold uppercase tracking-widest gap-1.5 px-3 h-10">
                <tab.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ── GENERAL ── */}
        <TabsContent value="general">
          <div className="grid gap-6">
            <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Church Information</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Core details shown across the website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {loading ? (
                  <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-11 bg-muted/30 rounded-xl animate-pulse" />)}</div>
                ) : (
                  <>
                    <div className="grid sm:grid-cols-2 gap-5">
                      <SettingRow label="Church Name" settingKey="church_name" settings={settings} onChange={handleSettingChange} />
                      <SettingRow label="Tagline / Motto" settingKey="church_tagline" settings={settings} onChange={handleSettingChange} />
                    </div>
                    <SettingRow label="Church Description (SEO)" description="Shown in Google search results" settingKey="church_description" settings={settings} onChange={handleSettingChange} />
                    <div className="grid sm:grid-cols-2 gap-5">
                      <SettingRow label="Contact Email" settingKey="church_email" settings={settings} onChange={handleSettingChange} />
                      <SettingRow label="Contact Phone" settingKey="church_phone" settings={settings} onChange={handleSettingChange} />
                    </div>
                    <SettingRow label="Church Address" settingKey="church_address" settings={settings} onChange={handleSettingChange} />
                    <div className="grid sm:grid-cols-2 gap-5">
                      <SettingRow label="Country" settingKey="church_country" settings={settings} onChange={handleSettingChange} />
                      <SettingRow label="Official Website URL" settingKey="site_title" settings={settings} onChange={handleSettingChange} />
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter className="p-6 border-t bg-muted/5">
                <SaveBtn keys={["church_name", "church_tagline", "church_description", "church_email", "church_phone", "church_address", "church_country", "site_title"]} />
              </CardFooter>
            </Card>

            <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Branding</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Logo, favicon, and brand colors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {!loading && (
                  <div className="grid sm:grid-cols-2 gap-5">
                    <SettingRow label="Logo URL (Cloudinary)" settingKey="logo_url" settings={settings} onChange={handleSettingChange} />
                    <SettingRow label="Favicon URL" settingKey="favicon_url" settings={settings} onChange={handleSettingChange} />
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Primary Color</Label>
                      <div className="flex items-center gap-3">
                        <input type="color" value={settings["primary_color"] || "#10b981"} onChange={e => handleSettingChange("primary_color", e.target.value)} className="w-12 h-11 rounded-xl border-none cursor-pointer" />
                        <Input value={settings["primary_color"] || ""} onChange={e => handleSettingChange("primary_color", e.target.value)} className="h-11 rounded-xl bg-background/50 border-none font-mono" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Secondary Color</Label>
                      <div className="flex items-center gap-3">
                        <input type="color" value={settings["secondary_color"] || "#e94560"} onChange={e => handleSettingChange("secondary_color", e.target.value)} className="w-12 h-11 rounded-xl border-none cursor-pointer" />
                        <Input value={settings["secondary_color"] || ""} onChange={e => handleSettingChange("secondary_color", e.target.value)} className="h-11 rounded-xl bg-background/50 border-none font-mono" />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="p-6 border-t bg-muted/5">
                <SaveBtn keys={["logo_url", "favicon_url", "primary_color", "secondary_color"]} />
              </CardFooter>
            </Card>

            <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl font-bold">SEO</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Search engine and social sharing settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {!loading && (
                  <>
                    <SettingRow label="Site Title" settingKey="site_title" settings={settings} onChange={handleSettingChange} />
                    <SettingRow label="Site Description" settingKey="site_description" settings={settings} onChange={handleSettingChange} />
                    <SettingRow label="OG Social Share Image" description="URL of the image shown when sharing in WhatsApp, Twitter, etc." settingKey="og_image" settings={settings} onChange={handleSettingChange} />
                    {settings["og_image"] && (
                      <img src={settings["og_image"]} alt="OG Preview" className="h-24 rounded-xl object-cover shadow-md" />
                    )}
                  </>
                )}
              </CardContent>
              <CardFooter className="p-6 border-t bg-muted/5">
                <SaveBtn keys={["site_title", "site_description", "og_image"]} />
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* ── ANNOUNCEMENT BAR ── */}
        <TabsContent value="announcement">
          <div className="grid gap-6">
            {/* Live preview */}
            {bar.is_active && (
              <div
                className="p-3 rounded-2xl flex items-center gap-3 text-sm font-medium shadow-md overflow-hidden"
                style={{ backgroundColor: bar.bg_color, color: bar.text_color }}
              >
                <Megaphone className="w-4 h-4 shrink-0" />
                <span className="flex-1 truncate">{bar.label || bar.info_text || "Your announcement bar preview"}</span>
                {bar.times?.length > 0 && (
                  <span className="text-xs opacity-75 shrink-0">{bar.times.join(" · ")}</span>
                )}
                {bar.cta_text && (
                  <a href={bar.cta_link || "#"} className="shrink-0 px-3 py-1 rounded-lg text-xs font-bold border" style={{ borderColor: bar.text_color, opacity: 0.9 }}>
                    {bar.cta_text}
                  </a>
                )}
              </div>
            )}

            <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2"><Megaphone className="w-5 h-5 text-primary" /> Announcement Bar</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest">
                  Controls the thin banner shown at the top of the main website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-background/40 border border-border/30">
                  <div>
                    <Label className="text-sm font-bold">Show Announcement Bar</Label>
                    <p className="text-xs text-muted-foreground">Toggle visibility on the main website</p>
                  </div>
                  <Switch checked={bar.is_active} onCheckedChange={v => setBar((b: any) => ({ ...b, is_active: v }))} />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Main Label</Label>
                  <Input placeholder="Sunday Services" value={bar.label || ""} onChange={e => setBar((b: any) => ({ ...b, label: e.target.value }))} className="h-11 rounded-xl bg-background/50 border-none" />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Info Text</Label>
                  <Input placeholder="What is going on at Ambassadors Assembly..." value={bar.info_text || ""} onChange={e => setBar((b: any) => ({ ...b, info_text: e.target.value }))} className="h-11 rounded-xl bg-background/50 border-none" />
                </div>

                {/* Service Times */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Service Times</Label>
                  <div className="flex gap-2">
                    <Input placeholder="e.g. 8AM" value={newTime} onChange={e => setNewTime(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTime(); } }} className="h-10 rounded-xl bg-background/50 border-none" />
                    <Button type="button" variant="outline" onClick={addTime} className="h-10 rounded-xl">Add</Button>
                  </div>
                  {bar.times?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {bar.times.map((t: string) => (
                        <Badge key={t} variant="secondary" className="gap-1 cursor-pointer group" onClick={() => removeTime(t)}>
                          {t} <span className="opacity-0 group-hover:opacity-100">×</span>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">CTA Button Text</Label>
                    <Input placeholder="Watch Online" value={bar.cta_text || ""} onChange={e => setBar((b: any) => ({ ...b, cta_text: e.target.value }))} className="h-11 rounded-xl bg-background/50 border-none" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">CTA Link</Label>
                    <Input placeholder="/watch" value={bar.cta_link || ""} onChange={e => setBar((b: any) => ({ ...b, cta_link: e.target.value }))} className="h-11 rounded-xl bg-background/50 border-none" />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Background Color</Label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={bar.bg_color?.replace(/rgba?\(.*?\)/, "#000000") || "#0e0e0e"} onChange={e => setBar((b: any) => ({ ...b, bg_color: e.target.value }))} className="w-12 h-11 rounded-xl border-none cursor-pointer" />
                      <Input value={bar.bg_color || ""} onChange={e => setBar((b: any) => ({ ...b, bg_color: e.target.value }))} className="h-11 rounded-xl bg-background/50 border-none font-mono text-sm" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Text Color</Label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={bar.text_color || "#f5f0e8"} onChange={e => setBar((b: any) => ({ ...b, text_color: e.target.value }))} className="w-12 h-11 rounded-xl border-none cursor-pointer" />
                      <Input value={bar.text_color || ""} onChange={e => setBar((b: any) => ({ ...b, text_color: e.target.value }))} className="h-11 rounded-xl bg-background/50 border-none font-mono text-sm" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-background/40 border border-border/30">
                  <div>
                    <Label className="text-sm font-bold">Scrolling Text</Label>
                    <p className="text-xs text-muted-foreground">Make the text scroll horizontally (marquee effect)</p>
                  </div>
                  <Switch checked={bar.is_scrolling || false} onCheckedChange={v => setBar((b: any) => ({ ...b, is_scrolling: v }))} />
                </div>
              </CardContent>
              <CardFooter className="p-6 border-t bg-muted/5">
                <Button disabled={saving} onClick={saveBar} className="ml-auto gap-2 rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Update Announcement Bar"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* ── FEATURES ── */}
        <TabsContent value="features">
          <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Feature Flags</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Toggle features on or off across the website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />)}</div>
              ) : [
                { key: "member_registration_enabled", label: "Member Registration", desc: "Allow new members to sign up on the website" },
                { key: "event_registration_enabled", label: "Event Registration", desc: "Members can register for church events" },
                { key: "live_stream_enabled", label: "Live Stream Banner", desc: "Show 'Live Now' section on the Watch page" },
                { key: "donations_enabled", label: "Online Giving", desc: "Show the giving/donation section" },
                { key: "prayer_wall_enabled", label: "Prayer Wall", desc: "Display public prayer requests on the website" },
                { key: "blog_enabled", label: "Blog / Articles", desc: "Show the blog section publicly" },
                { key: "testimonies_enabled", label: "Testimonies", desc: "Allow members to submit and view testimonies" },
                { key: "maintenance_mode", label: "Maintenance Mode", desc: "Show a maintenance page to all visitors" },
              ].map(f => (
                <SettingRow key={f.key} label={f.label} description={f.desc} settingKey={f.key} settings={settings} onChange={handleSettingChange} />
              ))}
              {settings["maintenance_mode"] === "true" && !loading && (
                <div className="space-y-2 pt-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Maintenance Message</Label>
                  <Textarea
                    value={settings["maintenance_message"] || ""}
                    onChange={e => handleSettingChange("maintenance_message", e.target.value)}
                    className="resize-none rounded-xl bg-background/50 border-none"
                    rows={2}
                  />
                </div>
              )}
            </CardContent>
            <CardFooter className="p-6 border-t bg-muted/5">
              <SaveBtn keys={["member_registration_enabled", "event_registration_enabled", "live_stream_enabled", "donations_enabled", "prayer_wall_enabled", "blog_enabled", "testimonies_enabled", "maintenance_mode", "maintenance_message"]} />
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ── SOCIAL ── */}
        <TabsContent value="social">
          <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Social Media Links</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest">These appear in the website footer and contact page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {loading ? (
                <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-11 bg-muted/30 rounded-xl animate-pulse" />)}</div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-5">
                  {[
                    { key: "social_youtube", label: "YouTube", icon: Youtube },
                    { key: "social_instagram", label: "Instagram", icon: Instagram },
                    { key: "social_facebook", label: "Facebook", icon: Facebook },
                    { key: "social_twitter", label: "Twitter / X", icon: Twitter },
                    { key: "social_tiktok", label: "TikTok", icon: Link },
                    { key: "social_whatsapp", label: "WhatsApp Number/Group Link", icon: MessageSquare },
                    { key: "social_podcast", label: "Podcast Link", icon: Rss },
                  ].map(s => (
                    <div key={s.key} className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <s.icon className="w-3.5 h-3.5" /> {s.label}
                      </Label>
                      <Input
                        className="h-11 rounded-xl bg-background/50 border-none"
                        placeholder={`https://...`}
                        value={settings[s.key] || ""}
                        onChange={e => handleSettingChange(s.key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="p-6 border-t bg-muted/5">
              <SaveBtn keys={["social_youtube", "social_instagram", "social_facebook", "social_twitter", "social_tiktok", "social_whatsapp", "social_podcast"]} />
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ── EMAIL ── */}
        <TabsContent value="email">
          <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Email Configuration</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Sender name and address used for church emails (via Resend)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {!loading && (
                <>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <SettingRow label="From Name" settingKey="email_from_name" settings={settings} onChange={handleSettingChange} />
                    <SettingRow label="From Address" settingKey="email_from_address" settings={settings} onChange={handleSettingChange} />
                  </div>
                  <SettingRow label="Reply-To Address" settingKey="email_reply_to" settings={settings} onChange={handleSettingChange} />
                </>
              )}
            </CardContent>
            <CardFooter className="p-6 border-t bg-muted/5">
              <SaveBtn keys={["email_from_name", "email_from_address", "email_reply_to"]} />
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ── ROLES ── */}
        <TabsContent value="roles">
          <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold">Role Management</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Define and manage permissions</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Quick Assign Section */}
              <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/10 space-y-6">
                <div className="space-y-1">
                  <h4 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Quick Role Assign
                  </h4>
                  <p className="text-[10px] text-muted-foreground font-medium">Search for any member to instantly upgrade their permissions.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search member name or email..." 
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleUserSearch()}
                      className="pl-10 h-11 bg-background/50 border-none rounded-xl"
                    />
                  </div>
                  <Select value={selectedRole} onValueChange={(val) => setSelectedRole(val || "member")}>
                    <SelectTrigger className="w-full sm:w-40 h-11 bg-background/50 border-none rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="pastor">Pastor</SelectItem>
                      <SelectItem value="leader">Leader</SelectItem>
                      <SelectItem value="worker">Worker</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleUserSearch} disabled={searchingUsers} className="rounded-xl h-11 px-6">
                    {searchingUsers ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                  </Button>
                </div>

                {foundUsers.length > 0 && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-4">
                    {foundUsers.map(u => (
                      <div key={u.id} className="flex items-center justify-between p-3 rounded-2xl bg-background shadow-sm border border-border/50">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="h-10 w-10 p-0 rounded-full flex items-center justify-center overflow-hidden border-none bg-muted/20">
                            <img src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} alt="" />
                          </Badge>
                          <div>
                            <p className="text-xs font-bold">{u.first_name} {u.last_name}</p>
                            <p className="text-[10px] text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          className="rounded-lg h-8 text-[9px] font-black uppercase tracking-widest px-4"
                          onClick={() => assignRole(u.id)}
                          disabled={assigningId === u.id}
                        >
                          {assigningId === u.id ? "Assigning..." : `Assign ${selectedRole}`}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {(roles.length > 0 ? roles : [
                  { name: "super_admin", description: "Full system access — all controls" },
                  { name: "admin", description: "Admin dashboard access" },
                  { name: "pastor", description: "Content + sermon management" },
                  { name: "leader", description: "Ministry & department management" },
                  { name: "worker", description: "Service teams and departments" },
                  { name: "member", description: "Standard member access" },
                  { name: "guest", description: "Unverified / recently signed up" },
                ]).map((role: any, i: number) => (
                  <div key={role.id || i} className="flex items-center justify-between p-4 rounded-2xl border bg-background/40 hover:bg-background/60 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-1.5 h-10 rounded-full", i === 0 ? "bg-red-500" : i === 1 ? "bg-primary" : i === 2 ? "bg-blue-500" : "bg-muted-foreground")} />
                      <div>
                        <h4 className="text-sm font-bold capitalize">{role.name?.replace(/_/g, " ")}</h4>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{role.description || "Role"}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider">{role.name || "role"}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SYSTEM ── */}
        <TabsContent value="system">
          <div className="grid gap-6">
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: "System Uptime", value: "99.9%", badge: "HEALTHY", color: "emerald", icon: Activity },
                { label: "Server Latency", value: "42ms", badge: "STABLE", color: "blue", icon: Server },
                { label: "DB Storage", value: "1.2GB", badge: "OK", color: "amber", icon: Database },
              ].map(s => (
                <Card key={s.label} className={`border-none shadow-md bg-${s.color}-500/10 text-${s.color}-600 p-6 rounded-3xl`}>
                  <div className="flex items-center justify-between mb-4">
                    <s.icon className="w-5 h-5" />
                    <Badge variant="outline" className={`bg-${s.color}-500/20 border-none text-${s.color}-700 text-[10px] font-bold`}>{s.badge}</Badge>
                  </div>
                  <p className="text-2xl font-black">{s.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{s.label}</p>
                </Card>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Backup & Restore</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-xl text-primary"><Cloud className="w-5 h-5" /></div>
                      <div>
                        <p className="text-sm font-bold">Automated Daily Backups</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-medium">Managed by Supabase</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-700 border-none">ACTIVE</Badge>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Database</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Supabase Project</Label>
                    <div className="relative">
                      <Input className="h-11 rounded-xl bg-background/50 border-none pr-10 font-mono text-xs" value="bxlmmvunfyvsbqakgxed" readOnly />
                      <Key className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── AUDIT ── */}
        <TabsContent value="audit">
          <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Audit Logs</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Recent administrative actions</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No audit logs yet.</p>
                ) : auditLogs.map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between p-4 rounded-2xl border bg-background/40">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center"><Activity className="w-5 h-5 text-primary" /></div>
                      <div>
                        <p className="text-sm font-bold">{log.action}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{log.actor_email || log.actor_id || "System"}</p>
                      </div>
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground">{log.created_at ? new Date(log.created_at).toLocaleString() : "—"}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
