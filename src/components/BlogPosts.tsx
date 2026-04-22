import * as React from "react";
import { FileText, Plus, Edit2, Trash2, Eye, Star, Search, Tag, Calendar, User, BookOpen, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";
import { motion } from "motion/react";
import { useAuth } from "@/src/contexts/AuthContext";

const EMPTY_FORM = { title: "", slug: "", excerpt: "", content: "", cover_image_url: "", status: "draft", is_featured: false, allow_comments: true, author_name: "", category_id: "", tags: [] as string[], send_to_newsletter: false };

function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "").replace(/--+/g, "-").substring(0, 60);
}

export default function BlogPosts() {
  const { user } = useAuth();
  const [posts, setPosts] = React.useState<any[]>([]);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingPost, setEditingPost] = React.useState<any>(null);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [form, setForm] = React.useState({ ...EMPTY_FORM });
  const [tagInput, setTagInput] = React.useState("");

  const fetchData = async () => {
    setLoading(true);
    const [{ data: postsData }, { data: catData }] = await Promise.all([
      supabase.from("blog_posts").select("*, blog_categories(name)").order("created_at", { ascending: false }),
      supabase.from("blog_categories").select("id, name").order("name"),
    ]);
    setPosts(postsData || []);
    setCategories(catData || []);
    setLoading(false);
  };

  React.useEffect(() => { fetchData(); }, []);

  const filtered = posts.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.author_name || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openNew = () => {
    setEditingPost(null);
    setForm({ ...EMPTY_FORM, author_name: user?.email?.split("@")[0] || "" });
    setTagInput("");
    setIsFormOpen(true);
  };

  const openEdit = (post: any) => {
    setEditingPost(post);
    setForm({ ...EMPTY_FORM, ...post, tags: post.tags || [] });
    setTagInput("");
    setIsFormOpen(true);
  };

  const handleTitleChange = (title: string) => {
    setForm(f => ({ ...f, title, slug: editingPost ? f.slug : slugify(title) }));
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm(f => ({ ...f, tags: [...f.tags, tag] }));
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) { toast.error("Title is required"); return; }
    if (!form.content) { toast.error("Content is required"); return; }
    const payload: any = { ...form, author_id: user?.id };
    if (form.status === "published" && !editingPost?.published_at) payload.published_at = new Date().toISOString();
    const { error } = editingPost
      ? await supabase.from("blog_posts").update(payload).eq("id", editingPost.id)
      : await supabase.from("blog_posts").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(editingPost ? "Post updated!" : "Post created!");
    setIsFormOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post permanently?")) return;
    await supabase.from("blog_posts").delete().eq("id", id);
    toast.success("Post deleted.");
    fetchData();
  };

  const statusBadge = (status: string) => {
    if (status === "published") return <Badge className="bg-emerald-500/10 text-emerald-700 border-none text-[9px]">Published</Badge>;
    if (status === "draft") return <Badge variant="outline" className="text-[9px] text-muted-foreground">Draft</Badge>;
    if (status === "archived") return <Badge variant="outline" className="text-[9px] text-orange-600 border-orange-200">Archived</Badge>;
    return <Badge variant="outline" className="text-[9px]">{status}</Badge>;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3"><BookOpen className="w-8 h-8 text-primary" /> Blog Posts</h1>
          <p className="text-muted-foreground">Write articles, church news, and kingdom updates for the website.</p>
        </div>
        <Button onClick={openNew} className="gap-2 shadow-lg shadow-primary/20"><Plus className="w-4 h-4" /> New Post</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Published", value: posts.filter(p => p.status === "published").length, color: "text-emerald-600" },
          { label: "Drafts", value: posts.filter(p => p.status === "draft").length, color: "text-amber-600" },
          { label: "Total Views", value: posts.reduce((sum, p) => sum + (p.view_count || 0), 0), color: "text-primary" },
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-card/50 rounded-2xl">
            <CardContent className="p-5">
              <p className={`text-3xl font-black ${s.color}`}>{s.value.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground font-semibold mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search posts..." className="pl-10 h-11 bg-card/50 border-none shadow-sm" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-40 h-11 bg-card/50 border-none shadow-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Posts</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Drafts</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-muted/30 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center space-y-4 bg-muted/20 rounded-3xl border-2 border-dashed">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto"><FileText className="w-10 h-10 text-muted-foreground" /></div>
          <h3 className="font-bold text-xl">No posts yet</h3>
          <Button onClick={openNew} className="mt-2 gap-2"><Plus className="w-4 h-4" /> Write First Post</Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-none shadow-sm bg-card/50 rounded-2xl overflow-hidden group hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {post.cover_image_url && (
                      <img src={post.cover_image_url} alt={post.title} className="w-20 h-16 object-cover rounded-xl shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        {statusBadge(post.status)}
                        {post.is_featured && <Badge className="bg-amber-500/10 text-amber-700 border-none text-[9px]"><Star className="w-2.5 h-2.5 mr-1 fill-amber-500" /> Featured</Badge>}
                        {post.blog_categories && <Badge variant="outline" className="text-[9px]">{post.blog_categories.name}</Badge>}
                      </div>
                      <h3 className="font-bold text-base leading-tight mb-1 group-hover:text-primary transition-colors">{post.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">{post.excerpt}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{post.author_name || "—"}</span>
                        {post.published_at && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(post.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>}
                        <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{post.view_count || 0} views</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => openEdit(post)}><Edit2 className="w-3.5 h-3.5" /> Edit</Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDelete(post.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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
        <DialogContent className="sm:max-w-[700px] max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? "Edit Post" : "New Blog Post"}</DialogTitle>
            <DialogDescription>Create or edit a blog post for the Ambassadors Assembly website.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input placeholder="Enter post title" value={form.title} onChange={e => handleTitleChange(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>URL Slug</Label>
                <Input placeholder="auto-generated-from-title" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Excerpt (short summary)</Label>
              <Textarea placeholder="A brief description shown in listings..." value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} rows={2} className="resize-none" />
            </div>
            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea placeholder="Write your full article here..." value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={10} className="resize-none font-mono text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cover Image URL</Label>
                <Input placeholder="https://..." value={form.cover_image_url} onChange={e => setForm(f => ({ ...f, cover_image_url: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Author Name</Label>
                <Input placeholder="Pastor Ezekiel" value={form.author_name} onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))} />
              </div>
            </div>
            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input placeholder="Add a tag and press Enter" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} />
                <Button type="button" variant="outline" onClick={addTag}>Add</Button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removeTag(tag)}>
                      <Tag className="w-3 h-3" />{tag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            {/* Status + toggles */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { key: "is_featured", label: "Feature this post", desc: "Show prominently on the blog homepage" },
                { key: "allow_comments", label: "Allow comments", desc: "Let members leave comments on this post" },
                { key: "send_to_newsletter", label: "Send to newsletter", desc: "Include in next newsletter email" },
              ].map(toggle => (
                <div key={toggle.key} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <div>
                    <p className="text-sm font-semibold">{toggle.label}</p>
                    <p className="text-xs text-muted-foreground">{toggle.desc}</p>
                  </div>
                  <Switch checked={(form as any)[toggle.key]} onCheckedChange={v => setForm(f => ({ ...f, [toggle.key]: v }))} />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit" variant="outline" onClick={() => setForm(f => ({ ...f, status: "draft" }))}>Save as Draft</Button>
              <Button type="submit" onClick={() => setForm(f => ({ ...f, status: "published" }))}>Publish</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
