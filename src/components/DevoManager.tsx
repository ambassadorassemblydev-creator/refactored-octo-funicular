import * as React from "react";
import { Sun, Plus, Edit2, Trash2, Search, BookOpen, Calendar, CheckCircle2, Clock, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";
import { motion } from "motion/react";
import { useAuth } from "@/src/contexts/AuthContext";
import { ImageUpload } from "@/src/components/ui/ImageUpload";

const EMPTY = { title: "", scripture_reference: "", scripture_text: "", reflection: "", prayer: "", confession: "", action_point: "", devotional_date: "", cover_image_url: "", status: "published", author_name: "" };

export default function DevoManager() {
  const { user } = useAuth();
  const [devos, setDevos] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<any>(null);
  const [form, setForm] = React.useState({ ...EMPTY });
  const [search, setSearch] = React.useState("");

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("devotionals").select("*").order("devotional_date", { ascending: false });
    setDevos(data || []);
    setLoading(false);
  };

  React.useEffect(() => { fetch(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY, devotional_date: new Date().toISOString().split("T")[0], author_name: user?.email?.split("@")[0] || "" });
    setIsFormOpen(true);
  };

  const openEdit = (d: any) => {
    setEditing(d);
    setForm({ ...EMPTY, ...d });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this devotional?")) return;
    await supabase.from("devotionals").delete().eq("id", id);
    toast.success("Deleted.");
    fetch();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.devotional_date || !form.scripture_reference || !form.reflection) {
      toast.error("Title, date, scripture and reflection are required.");
      return;
    }
    const payload = { ...form, author_id: user?.id };
    const { error } = editing
      ? await supabase.from("devotionals").update(payload).eq("id", editing.id)
      : await supabase.from("devotionals").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Updated!" : "Devotional published!");
    setIsFormOpen(false);
    fetch();
  };

  const filtered = devos.filter(d => !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.scripture_reference.toLowerCase().includes(search.toLowerCase()));

  const today = new Date().toISOString().split("T")[0];
  const todaysDevo = devos.find(d => d.devotional_date === today);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3"><Sun className="w-8 h-8 text-amber-500" /> Daily Devotionals</h1>
          <p className="text-muted-foreground">Write and schedule daily devotionals for church members.</p>
        </div>
        <Button onClick={openNew} className="gap-2 shadow-lg shadow-primary/20"><Plus className="w-4 h-4" /> New Devotional</Button>
      </div>

      {/* Today banner */}
      {todaysDevo ? (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Today's Devotional is Set ✓</p>
            <p className="font-bold">{todaysDevo.title}</p>
            <p className="text-xs text-amber-700">{todaysDevo.scripture_reference}</p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => openEdit(todaysDevo)}><Edit2 className="w-3.5 h-3.5 mr-1" /> Edit</Button>
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-red-700 uppercase tracking-wider">No Devotional for Today</p>
            <p className="text-sm text-red-700">Members won't see a devotional today. Add one now.</p>
          </div>
          <Button className="ml-auto bg-red-500 hover:bg-red-600 text-white" size="sm" onClick={openNew}><Plus className="w-3.5 h-3.5 mr-1" /> Add Today's</Button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by title or scripture..." className="pl-10 h-11 bg-card/50 border-none shadow-sm" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted/30 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center space-y-4 bg-muted/20 rounded-3xl border-2 border-dashed">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto"><Sun className="w-10 h-10 text-muted-foreground" /></div>
          <h3 className="font-bold text-xl">No devotionals yet</h3>
          <Button onClick={openNew} className="mt-2 gap-2"><Plus className="w-4 h-4" /> Write First Devotional</Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="border-none shadow-sm bg-card/50 rounded-2xl group hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {d.cover_image_url ? (
                      <div className="relative group/thumb shrink-0">
                        <img src={d.cover_image_url} alt={d.title} className="w-20 h-16 object-cover rounded-xl shadow-sm" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/thumb:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                        <Sun className="w-8 h-8" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`text-[9px] border-none ${d.status === "published" ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                          {d.status}
                        </Badge>
                        {d.email_sent && <Badge className="text-[9px] bg-blue-500/10 text-blue-700 border-none"><Mail className="w-2.5 h-2.5 mr-1" />Emailed</Badge>}
                        {d.devotional_date === today && <Badge className="text-[9px] bg-amber-500/10 text-amber-700 border-none">Today</Badge>}
                      </div>
                      <h3 className="font-bold text-sm mb-0.5 group-hover:text-primary transition-colors">{d.title}</h3>
                      <p className="text-xs text-primary font-semibold">{d.scripture_reference}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(d.devotional_date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={() => openEdit(d)}><Edit2 className="w-3.5 h-3.5" /> Edit</Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDelete(d.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[680px] max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Devotional" : "New Daily Devotional"}</DialogTitle>
            <DialogDescription>Fill in the devotional for a specific date. Members will see this on that day.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input type="date" value={form.devotional_date} onChange={e => setForm(f => ({ ...f, devotional_date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <ImageUpload
                label="Cover Image"
                hint="Visual asset for the devotional. Recommended 16:9 ratio."
                value={form.cover_image_url}
                onChange={url => setForm(f => ({ ...f, cover_image_url: url }))}
                folder="ambassadors_assembly/devotionals"
                aspectRatio="video"
              />
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input placeholder="e.g. Walking in Faith" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Scripture Reference *</Label>
                <Input placeholder="e.g. John 3:16" value={form.scripture_reference} onChange={e => setForm(f => ({ ...f, scripture_reference: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Author Name</Label>
                <Input placeholder="Pastor Ezekiel" value={form.author_name} onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Scripture Text</Label>
              <Textarea placeholder="Paste the Bible verse here..." value={form.scripture_text} onChange={e => setForm(f => ({ ...f, scripture_text: e.target.value }))} rows={3} className="resize-none italic text-sm" />
            </div>
            <div className="space-y-2">
              <Label>Reflection / Message *</Label>
              <Textarea placeholder="The main devotional message..." value={form.reflection} onChange={e => setForm(f => ({ ...f, reflection: e.target.value }))} rows={6} className="resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prayer</Label>
                <Textarea placeholder="A closing prayer..." value={form.prayer} onChange={e => setForm(f => ({ ...f, prayer: e.target.value }))} rows={3} className="resize-none text-sm" />
              </div>
              <div className="space-y-2">
                <Label>Action Point</Label>
                <Textarea placeholder="One practical step to take today..." value={form.action_point} onChange={e => setForm(f => ({ ...f, action_point: e.target.value }))} rows={3} className="resize-none text-sm" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confession</Label>
              <Textarea placeholder="A faith confession to declare..." value={form.confession} onChange={e => setForm(f => ({ ...f, confession: e.target.value }))} rows={2} className="resize-none text-sm italic" />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? "Save Changes" : "Publish Devotional"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
