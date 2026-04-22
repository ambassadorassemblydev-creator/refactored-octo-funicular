import * as React from "react";
import { Mail, MailOpen, Reply, Trash2, Search, Filter, CheckCircle2, Clock, AlertCircle, User, Phone, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";
import { motion } from "motion/react";
import { useAuth } from "@/src/contexts/AuthContext";

export default function ContactInbox() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<any>(null);
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState("all");
  const [replyText, setReplyText] = React.useState("");
  const [stats, setStats] = React.useState({ total: 0, unread: 0, replied: 0 });

  const fetchSubmissions = async () => {
    setLoading(true);
    let query = supabase.from("contact_submissions").select("*").order("created_at", { ascending: false });
    if (filter === "unread") query = query.eq("is_read", false);
    if (filter === "replied") query = query.eq("is_replied", true);
    if (filter === "unreplied") query = query.eq("is_replied", false);
    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%`);
    const { data, error } = await query;
    if (error) { toast.error(error.message); setLoading(false); return; }
    const all = data || [];
    setSubmissions(all);
    setStats({ total: all.length, unread: all.filter(s => !s.is_read).length, replied: all.filter(s => s.is_replied).length });
    setLoading(false);
  };

  React.useEffect(() => { fetchSubmissions(); }, [filter, search]);

  const markRead = async (id: string) => {
    await supabase.from("contact_submissions").update({ is_read: true, read_at: new Date().toISOString(), read_by: user?.id }).eq("id", id);
    fetchSubmissions();
  };

  const handleOpen = async (sub: any) => {
    setSelected(sub);
    setReplyText("");
    if (!sub.is_read) await markRead(sub.id);
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    const { error } = await supabase.from("contact_submissions").update({
      is_replied: true,
      replied_at: new Date().toISOString(),
      replied_by: user?.id,
      reply_notes: replyText,
    }).eq("id", selected.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Reply recorded. Send the actual email via your email client.");
    setSelected(null);
    fetchSubmissions();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    await supabase.from("contact_submissions").delete().eq("id", id);
    toast.success("Message deleted.");
    setSelected(null);
    fetchSubmissions();
  };

  const handleMarkSpam = async (id: string) => {
    await supabase.from("contact_submissions").update({ is_spam: true }).eq("id", id);
    toast.success("Marked as spam.");
    setSelected(null);
    fetchSubmissions();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Mail className="w-8 h-8 text-primary" />
            Contact Inbox
          </h1>
          <p className="text-muted-foreground">Messages received from the main church website contact form.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Messages", value: stats.total, color: "text-foreground", bg: "bg-muted/30" },
          { label: "Unread", value: stats.unread, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Replied", value: stats.replied, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((s, i) => (
          <Card key={i} className={`border-none shadow-sm ${s.bg} rounded-2xl`}>
            <CardContent className="p-5">
              <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground font-semibold mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name, email or subject..." className="pl-10 h-11 bg-card/50 border-none shadow-sm" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full md:w-48 h-11 bg-card/50 border-none shadow-sm">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Messages</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="unreplied">Not Replied</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Messages list */}
      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-muted/30 rounded-xl animate-pulse" />)}</div>
      ) : submissions.length === 0 ? (
        <div className="py-24 text-center space-y-4 bg-muted/20 rounded-3xl border-2 border-dashed">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto"><Mail className="w-10 h-10 text-muted-foreground" /></div>
          <h3 className="font-bold text-xl">No messages</h3>
          <p className="text-muted-foreground">When someone submits the contact form on the website, it will appear here.</p>
        </div>
      ) : (
        <Card className="border-none shadow-sm bg-card/50 rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="divide-y">
              {submissions.map((sub, i) => (
                <motion.button
                  key={sub.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => handleOpen(sub)}
                  className={`w-full text-left flex items-start gap-4 px-5 py-4 hover:bg-muted/20 transition-colors ${!sub.is_read ? "bg-primary/3" : ""}`}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${!sub.is_read ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {sub.is_read ? <MailOpen className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`text-sm truncate ${!sub.is_read ? "font-bold" : "font-medium"}`}>{sub.name}</p>
                      {!sub.is_read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{sub.subject || sub.department || "General Enquiry"}</p>
                    <p className="text-xs text-muted-foreground/70 truncate mt-0.5">{sub.message?.substring(0, 80)}…</p>
                  </div>
                  {/* Meta */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <p className="text-[10px] text-muted-foreground">{new Date(sub.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                    {sub.is_replied ? (
                      <Badge variant="outline" className="text-[9px] text-emerald-600 border-emerald-200 bg-emerald-50"><CheckCircle2 className="w-2.5 h-2.5 mr-1" />Replied</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-200 bg-amber-50"><Clock className="w-2.5 h-2.5 mr-1" />Pending</Badge>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message Dialog */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selected.subject || "General Enquiry"}</DialogTitle>
                <DialogDescription className="flex items-center gap-4 mt-1">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> {selected.name}</span>
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {selected.email}</span>
                  {selected.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {selected.phone}</span>}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {/* Department */}
                {selected.department && (
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <Badge variant="outline" className="capitalize">{selected.department}</Badge>
                  </div>
                )}

                {/* Message */}
                <div className="p-4 bg-muted/30 rounded-2xl">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{selected.message}</p>
                </div>

                <p className="text-xs text-muted-foreground">Received: {new Date(selected.created_at).toLocaleString("en-GB")}</p>

                {/* Previous reply note */}
                {selected.is_replied && selected.reply_notes && (
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Your previous reply note</p>
                    <p className="text-sm text-emerald-800">{selected.reply_notes}</p>
                  </div>
                )}

                {/* Reply area */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Reply Notes (internal record)</p>
                  <Textarea
                    placeholder={`Draft your reply to ${selected.name}. Copy and paste into your email client to send.`}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button onClick={handleReply} className="gap-2 flex-1">
                    <Reply className="w-4 h-4" /> Mark as Replied
                  </Button>
                  <Button variant="outline" onClick={() => { navigator.clipboard.writeText(selected.email); toast.success("Email copied!"); }} className="gap-2">
                    <Mail className="w-4 h-4" /> Copy Email
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(selected.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
