import * as React from "react";
import { Radio, Youtube, Play, StopCircle, Clock, Eye, Plus, Edit2, Trash2, Globe, VideoIcon, MoreVertical, Wifi, WifiOff, Calendar, CheckCircle2, AlertCircle, HeartHandshake, ExternalLink, RotateCw, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/src/components/ui/ImageUpload";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "motion/react";

interface StreamForm {
  title: string;
  description: string;
  stream_url: string;
  embed_url: string;
  platform: string;
  thumbnail_url: string;
  scheduled_start: string;
  scheduled_end: string;
  is_featured: boolean;
  chat_enabled: boolean;
  notify_subscribers: boolean;
  status: string;
  speaker_id?: string;
  series_id?: string;
  scripture_reference?: string;
  scripture_text?: string;
}

export default function LiveStreamManager() {
  const { user } = useAuth();
  const [streams, setStreams] = React.useState<any[]>([]);
  const [speakers, setSpeakers] = React.useState<any[]>([]);
  const [series, setSeries] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingStream, setEditingStream] = React.useState<any>(null);
  const [form, setForm] = React.useState<StreamForm>({
    title: "",
    description: "",
    stream_url: "",
    embed_url: "",
    platform: "youtube",
    thumbnail_url: "",
    scheduled_start: "",
    scheduled_end: "",
    is_featured: true,
    chat_enabled: true,
    notify_subscribers: true,
    status: "scheduled",
    speaker_id: "",
    series_id: "",
    scripture_reference: "",
    scripture_text: "",
  });

  const fetchData = async () => {
    setLoading(true);
    const [streamsRes, speakersRes, seriesRes] = await Promise.all([
      supabase.from("live_streams").select("*").order("scheduled_start", { ascending: false }),
      supabase.from("sermon_speakers").select("id, name").order("name"),
      supabase.from("sermon_series").select("id, title").order("title")
    ]);

    if (streamsRes.error) toast.error(streamsRes.error.message);
    else setStreams(streamsRes.data || []);

    if (speakersRes.data) setSpeakers(speakersRes.data);
    if (seriesRes.data) setSeries(seriesRes.data);
    
    setLoading(false);
  };

  React.useEffect(() => { fetchData(); }, []);

  const openNew = (status: string = "scheduled") => {
    setEditingStream(null);
    setForm({ 
      title: "", 
      description: "", 
      stream_url: "", 
      embed_url: "", 
      platform: "youtube", 
      thumbnail_url: "",
      scheduled_start: status === "live" ? new Date().toISOString().slice(0, 16) : "", 
      scheduled_end: "", 
      is_featured: true, 
      chat_enabled: true, 
      notify_subscribers: true, 
      status: status, 
      speaker_id: "", 
      series_id: "", 
      scripture_reference: "", 
      scripture_text: "" 
    });
    setIsFormOpen(true);
  };

  const openEdit = (s: any, statusOverride?: string) => {
    setEditingStream(s);
    setForm({ 
      ...s, 
      scheduled_start: s.scheduled_start ? new Date(s.scheduled_start).toISOString().slice(0, 16) : (statusOverride === "live" ? new Date().toISOString().slice(0, 16) : ""), 
      scheduled_end: s.scheduled_end ? new Date(s.scheduled_end).toISOString().slice(0, 16) : "",
      speaker_id: s.speaker_id || "",
      series_id: s.series_id || "",
      scripture_reference: s.scripture_reference || "",
      scripture_text: s.scripture_text || "",
      thumbnail_url: s.thumbnail_url || "",
      status: statusOverride || s.status
    });
    setIsFormOpen(true);
  };

  const handleGoLive = async (id: string) => {
    const stream = streams.find(s => s.id === id);
    if (stream) {
      openEdit(stream, "live");
    }
  };

  const handleEndStream = async (id: string) => {
    const stream = streams.find(s => s.id === id);
    const { error } = await supabase.from("live_streams").update({ status: "ended", actual_end: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    
    // Auto-archive as a sermon
    if (stream) {
      const sermonSlug = stream.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + Date.now();
      const { error: sermonError } = await supabase.from("sermons").insert({
        title: stream.title,
        description: stream.description,
        video_embed_url: stream.embed_url,
        video_url: stream.stream_url,
        thumbnail_url: stream.thumbnail_url,
        sermon_date: stream.actual_start || stream.scheduled_start,
        speaker_id: stream.speaker_id || null,
        series_id: stream.series_id || null,
        scripture_reference: stream.scripture_reference || null,
        scripture_text: stream.scripture_text || null,
        slug: sermonSlug,
        status: "published",
        service_type: "live_stream"
      });
      
      if (sermonError) {
        toast.error("Stream ended, but failed to archive sermon: " + sermonError.message);
      } else {
        toast.success("Stream ended and archived to sermons archive!");
      }
    } else {
      toast.success("Stream ended successfully.");
    }
    
    fetchData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("live_streams").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Stream deleted.");
    fetchData();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.scheduled_start) { toast.error("Title and start time are required."); return; }
    const payload = { 
      ...form, 
      user_id: user?.id,
      scheduled_start: new Date(form.scheduled_start).toISOString(), 
      scheduled_end: form.scheduled_end ? new Date(form.scheduled_end).toISOString() : null,
      actual_start: form.status === "live" ? new Date().toISOString() : null
    };
    const isNewLive = form.status === "live" && (!editingStream || editingStream.status !== "live");
    
    const { error } = editingStream
      ? await supabase.from("live_streams").update(payload as any).eq("id", editingStream.id)
      : await supabase.from("live_streams").insert(payload as any);
    
    if (error) { toast.error(error.message); return; }

    // High IQ: Auto-broadcast push notification if just went live
    if (isNewLive) {
      try {
        await fetch(`${import.meta.env.VITE_MAIN_APP_URL || ''}/api/notifications/broadcast`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title: "🔴 WE ARE LIVE!", 
            body: `Join us now for: ${form.title}`, 
            url: "/watch" 
          })
        });
        toast.success("Push notification broadcasted to all members!");
      } catch (broadcastErr) {
        console.error("Auto-broadcast failed:", broadcastErr);
      }
    }
    toast.success(editingStream ? "Stream updated!" : form.status === "live" ? "🔴 Broadcasting started!" : "Stream scheduled!");
    setIsFormOpen(false);
    fetchData();
  };

  const liveStream = streams.find(s => s.status === "live");
  const upcoming = streams.filter(s => s.status === "scheduled");
  const past = streams.filter(s => s.status === "ended" || s.status === "cancelled");

  const statusBadge = (status: string) => {
    if (status === "live") return <Badge className="bg-red-500 text-white border-none animate-pulse gap-1"><Wifi className="w-3 h-3" /> LIVE</Badge>;
    if (status === "scheduled") return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 gap-1"><Clock className="w-3 h-3" /> Scheduled</Badge>;
    if (status === "ended") return <Badge variant="outline" className="text-muted-foreground gap-1"><WifiOff className="w-3 h-3" /> Ended</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Radio className="w-8 h-8 text-red-500" />
            Live Stream Manager
          </h1>
          <p className="text-muted-foreground">Schedule and manage church live streams. Go live directly from here.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => openNew("live")} 
            className="gap-2 h-11 rounded-xl border-red-500/20 text-red-500 hover:bg-red-500/10 shadow-lg shadow-red-500/10"
          >
            <Radio className="w-4 h-4" /> Go Live Now
          </Button>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="gap-2 h-11 rounded-xl no-print"
              onClick={() => window.open('https://ambassadors-assembly-web.onrender.com/watch', '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
              View Watch Page
            </Button>
            <Button onClick={() => openNew("scheduled")} className="gap-2 h-11 rounded-xl shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" /> Schedule Stream
            </Button>
          </div>
        </div>
      </div>

      {/* LIVE NOW banner */}
      {liveStream && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="relative overflow-hidden rounded-3xl bg-red-500 p-6 text-white">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-400" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                <Radio className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider opacity-80">🔴 Currently Live</p>
                <h2 className="text-2xl font-black">{liveStream.title}</h2>
                <p className="text-sm opacity-80">{liveStream.viewer_count || 0} watching now</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30 gap-2" onClick={() => window.open(liveStream.stream_url, "_blank")}>
                <Globe className="w-4 h-4" /> Open Stream
              </Button>
              <Button variant="destructive" className="bg-white text-red-600 hover:bg-white/90 gap-2 font-bold" onClick={() => handleEndStream(liveStream.id)}>
                <StopCircle className="w-4 h-4" /> End Stream
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stream Embed Preview */}
      {liveStream?.embed_url && (
        <Card className="border-none shadow-md bg-card/50 rounded-3xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2"><VideoIcon className="w-4 h-4 text-primary" /> Live Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video rounded-2xl overflow-hidden bg-black">
              <iframe src={liveStream.embed_url} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Upcoming Streams</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                <Card className="border-none shadow-sm bg-card/50 rounded-2xl overflow-hidden group hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                        {s.platform === "youtube" ? <Youtube className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{s.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(s.scheduled_start).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(s)}><Edit2 className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(s.id)}><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      {statusBadge(s.status)}
                      <Button size="sm" className="gap-2 bg-red-500 hover:bg-red-600 text-white border-none shadow-md shadow-red-500/20" onClick={() => handleGoLive(s.id)}>
                        <Play className="w-3 h-3 fill-current" /> Go Live Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Past Streams */}
      {past.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Past Broadcasts</h2>
          <Card className="border-none shadow-sm bg-card/50 rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="divide-y">
                {past.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors group">
                    <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      {s.platform === "youtube" ? <Youtube className="w-4 h-4 text-muted-foreground" /> : <VideoIcon className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{s.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.actual_start ? new Date(s.actual_start).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        {s.peak_viewers > 0 && ` · ${s.peak_viewers} peak viewers`}
                      </p>
                    </div>
                    {statusBadge(s.status)}
                    {s.recording_url && (
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => window.open(s.recording_url, "_blank")}>
                        <Eye className="w-3 h-3" /> Watch
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {streams.length === 0 && !loading && (
        <div className="py-24 text-center space-y-4 bg-muted/20 rounded-3xl border-2 border-dashed">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto"><Radio className="w-10 h-10 text-muted-foreground" /></div>
          <h3 className="font-bold text-xl">No streams yet</h3>
          <p className="text-muted-foreground">Schedule your first live stream to get started.</p>
          <Button onClick={() => openNew("scheduled")} className="gap-2 mt-4"><Plus className="w-4 h-4" /> Schedule Stream</Button>
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className={form.status === "live" ? "text-red-600 flex items-center gap-2" : ""}>
              {form.status === "live" ? <><Radio className="w-5 h-5 animate-pulse" /> Go Live Instantly</> : editingStream ? "Edit Stream" : "Schedule New Stream"}
            </DialogTitle>
            <DialogDescription>
              {form.status === "live" ? "This will create a new live stream entry and set it to active immediately." : "Configure the live stream details for Ambassadors Assembly."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Stream Title *</Label>
              <Input placeholder="Sunday Morning Service" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            
            <div className="space-y-2">
              <ImageUpload
                label="Stream Thumbnail / Cover Image"
                hint="Recommended: 16:9 ratio. This image will represent the stream on the watch page."
                value={form.thumbnail_url}
                onChange={url => setForm(f => ({ ...f, thumbnail_url: url }))}
                folder="ambassadors_assembly/live_streams"
                aspectRatio="video"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="What is this service about?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="resize-none" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select value={form.platform} onValueChange={v => setForm(f => ({ ...f, platform: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="facebook">Facebook Live</SelectItem>
                    <SelectItem value="zoom">Zoom</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Scheduled Start *</Label>
                <Input type="datetime-local" value={form.scheduled_start} onChange={e => setForm(f => ({ ...f, scheduled_start: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Stream URL (full link)</Label>
              <Input placeholder="https://youtube.com/live/..." value={form.stream_url} onChange={e => setForm(f => ({ ...f, stream_url: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Embed URL (for in-page player)</Label>
              <Input placeholder="https://www.youtube.com/embed/..." value={form.embed_url} onChange={e => setForm(f => ({ ...f, embed_url: e.target.value }))} />
              <p className="text-xs text-muted-foreground">For YouTube: replace /watch?v= with /embed/</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Speaker</Label>
                <Select value={form.speaker_id || ""} onValueChange={v => setForm(f => ({ ...f, speaker_id: v || "" }))}>
                  <SelectTrigger><SelectValue placeholder="Select Speaker" /></SelectTrigger>
                  <SelectContent>
                    {speakers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sermon Series</Label>
                <Select value={form.series_id || ""} onValueChange={v => setForm(f => ({ ...f, series_id: v || "" }))}>
                  <SelectTrigger><SelectValue placeholder="Select Series" /></SelectTrigger>
                  <SelectContent>
                    {series.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Scripture Reference</Label>
                <Input placeholder="e.g. Genesis 1:1-3" value={form.scripture_reference} onChange={e => setForm(f => ({ ...f, scripture_reference: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Scripture Text</Label>
                <Textarea placeholder="The actual scripture text..." value={form.scripture_text} onChange={e => setForm(f => ({ ...f, scripture_text: e.target.value }))} className="resize-none" rows={3} />
              </div>
            </div>
            <div className="space-y-3 pt-2">
              {[
                { key: "is_featured", label: "Feature on Watch page", desc: "This stream will appear as the main stream" },
                { key: "notify_subscribers", label: "Notify subscribers", desc: "Send email reminder 1 hour before" },
                { key: "chat_enabled", label: "Enable chat", desc: "Show live chat alongside the stream" },
              ].map(toggle => (
                <div key={toggle.key} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <div>
                    <p className="text-sm font-semibold">{toggle.label}</p>
                    <p className="text-xs text-muted-foreground">{toggle.desc}</p>
                  </div>
                  <Switch checked={form[toggle.key as keyof StreamForm] as boolean} onCheckedChange={v => setForm(f => ({ ...f, [toggle.key]: v }))} />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit" className={form.status === "live" ? "bg-red-600 hover:bg-red-700 text-white" : ""}>
                {form.status === "live" ? "Start Broadcasting Now" : editingStream ? "Save Changes" : "Schedule Stream"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
