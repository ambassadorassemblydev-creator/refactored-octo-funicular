import * as React from "react";
import { 
  Play, 
  Download, 
  Share2, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  User,
  Clock,
  BookOpen,
  MoreVertical,
  Edit2,
  Trash2,
  Bookmark,
  MessageCircle,
  Video,
  Music,
  ChevronRight,
  X
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import SermonForm from "./forms/SermonForm";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";
import { auditRepo } from "@/src/lib/audit";

import { useAuth } from "@/src/contexts/AuthContext";

interface SermonsProps {
  onTabChange?: (tab: string) => void;
}

export default function Sermons({ onTabChange }: SermonsProps) {
  const { user, loading: authLoading } = useAuth();
  const [sermons, setSermons] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [seriesFilter, setSeriesFilter] = React.useState("all");
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [editingSermon, setEditingSermon] = React.useState<any>(null);
  const [selectedSermon, setSelectedSermon] = React.useState<any>(null);
  const [bookmarked, setBookmarked] = React.useState<Set<string>>(new Set());

  const fetchSermons = async (retries = 3) => {
    setLoading(true);
    try {
      let query = supabase
        .from('sermons')
        .select(`
          *,
          sermon_series (
            title
          ),
          sermon_speakers (
            name
          )
        `)
        .order('sermon_date', { ascending: false });

      if (search) {
        // High IQ: Search across multiple tables using .or with foreign key joins
        query = query.or(`title.ilike.%${search}%,sermon_series.title.ilike.%${search}%,sermon_speakers.name.ilike.%${search}%`);
      }

      if (seriesFilter !== "all") {
        if (seriesFilter === "none") {
          query = query.is('series_id', null);
        } else {
          query = query.eq('series_id', seriesFilter);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setSermons(data || []);
    } catch (error: any) {
      if (error?.message?.includes("Lock") && retries > 0) {
        setTimeout(() => fetchSermons(retries - 1), 500);
        return;
      }
      console.error("Error fetching sermons:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!authLoading) {
      const debounce = setTimeout(fetchSermons, 500);
      return () => clearTimeout(debounce);
    }
  }, [search, seriesFilter, authLoading]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sermon?")) return;
    
    try {
      const { error } = await supabase.from('sermons').delete().eq('id', id);
      if (error) throw error;

      // Log delete action
      await auditRepo.logAction({
        admin_id: user?.id || 'unknown',
        action: 'DELETE',
        table_name: 'sermons',
        record_id: id
      });

      toast.success("Sermon deleted successfully");
      fetchSermons();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const toggleBookmark = (id: string) => {
    const newBookmarks = new Set(bookmarked);
    if (newBookmarks.has(id)) {
      newBookmarks.delete(id);
      toast.info("Removed from bookmarks");
    } else {
      newBookmarks.add(id);
      toast.success("Added to bookmarks");
    }
    setBookmarked(newBookmarks);
  };

  const handleDownload = (sermon: any) => {
    const pdfUrl = sermon.notes_pdf_url || sermon.pdf_url;
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
      toast.success("Opening sermon notes...");
      
      // Log download action
      auditRepo.logAction({
        admin_id: user?.id || 'unknown',
        action: 'UPDATE',
        table_name: 'sermons',
        record_id: sermon.id,
        new_values: { action: 'download_notes' }
      });
    } else {
      toast.error("No notes available for this sermon");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Sermon Archive</h1>
          <p className="text-muted-foreground">Access our library of past sermons, teachings, and series.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" />
            Upload Sermon
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload New Sermon</DialogTitle>
              <DialogDescription>Add a new sermon to the church archive.</DialogDescription>
            </DialogHeader>
            <SermonForm 
              onSuccess={() => {
                setIsAddOpen(false);
                fetchSermons();
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
            placeholder="Search by title, speaker, or series..." 
            className="pl-10 h-11 bg-card/50 border-none shadow-sm focus-visible:ring-primary/20" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="gap-2 h-11 px-5 rounded-xl bg-card/50 border-none shadow-sm font-bold text-[10px] uppercase tracking-widest"
            onClick={() => onTabChange?.('live-stream')}
          >
            <Video className="w-4 h-4" />
            Live Stream
          </Button>
        </div>
          <Select value={seriesFilter} onValueChange={(val: string | null) => setSeriesFilter(val || "all")}>
            <SelectTrigger className="h-11 px-5 bg-card/50 border-none shadow-sm min-w-[140px] rounded-xl font-bold text-[10px] uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5" />
                <SelectValue placeholder="All Series" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-2xl">
              <SelectItem value="all">All Archive</SelectItem>
              <SelectItem value="none">Standalone Messages</SelectItem>
              <SelectItem value="all" disabled className="text-[9px] opacity-50 font-bold uppercase tracking-widest px-2 py-1">Series</SelectItem>
              {/* Dynamic series list should be fetched, but for now we use the ones in data */}
              {Array.from(new Set(sermons.map(s => s.series_id).filter(Boolean))).map(id => {
                const s = sermons.find(x => x.series_id === id);
                return <SelectItem key={id as string} value={id as string}>{s?.sermon_series?.title}</SelectItem>
              })}
            </SelectContent>
          </Select>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-96 animate-pulse bg-muted/50 rounded-2xl border-none" />
          ))}
        </div>
      ) : sermons.length === 0 ? (
        <div className="py-20 text-center space-y-4 bg-muted/20 rounded-3xl border-2 border-dashed">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
            <BookOpen className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-xl">No sermons found</h3>
            <p className="text-muted-foreground">Try adjusting your search or upload a new sermon.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {sermons.map((sermon, i) => (
            <motion.div
              key={sermon.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="overflow-hidden border-none shadow-md bg-card/50 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 group rounded-2xl flex flex-col h-full">
                <div className="relative aspect-video overflow-hidden">
                  <img 
                    src={sermon.thumbnail_url || `https://picsum.photos/seed/${sermon.id}/800/450`} 
                    alt={sermon.title}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button size="icon" variant="secondary" className="rounded-full w-14 h-14 shadow-2xl scale-90 group-hover:scale-100 transition-transform">
                      <Play className="w-7 h-7 fill-current" />
                    </Button>
                  </div>
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge className="bg-black/60 backdrop-blur-md border-none text-[10px] font-bold uppercase tracking-wider">
                      {sermon.sermon_series?.title || 'Standalone'}
                    </Badge>
                  </div>
                  <button 
                    onClick={() => toggleBookmark(sermon.id)}
                    className={cn(
                      "absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all",
                      bookmarked.has(sermon.id) ? "bg-primary text-primary-foreground" : "bg-black/40 text-white hover:bg-black/60"
                    )}
                  >
                    <Bookmark className={cn("w-4 h-4", bookmarked.has(sermon.id) && "fill-current")} />
                  </button>
                </div>
                
                <CardHeader className="p-6 pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest">
                      <Calendar className="w-3 h-3" />
                      {sermon.sermon_date ? new Date(sermon.sermon_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                    </div>
                    <div className="flex items-center gap-2">
                      {sermon.video_url && <Video className="w-3 h-3 text-muted-foreground" />}
                      {sermon.audio_url && <Music className="w-3 h-3 text-muted-foreground" />}
                    </div>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors leading-tight line-clamp-2">{sermon.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2 font-medium">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-3 h-3 text-primary" />
                    </div>
                    {sermon.sermon_speakers?.name || 'Unknown Speaker'}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="p-6 pt-0 flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                    {sermon.description || 'Listen to this powerful message from Ambassadors Assembly.'}
                  </p>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {sermon.duration || '45 MIN'}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5" />
                      {sermon.comment_count || 0} Comments
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="p-6 pt-0 border-t bg-muted/5 mt-auto flex gap-2">
                  <Button 
                    variant="ghost" 
                    className="flex-1 justify-between group/btn px-0 hover:bg-transparent"
                    onClick={() => setSelectedSermon(sermon)}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest">Watch Now</span>
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-full hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <MoreVertical className="w-4 h-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Sermon Options</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setEditingSermon(sermon)}>
                        <Edit2 className="w-4 h-4 mr-2" /> Edit Sermon
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(sermon)}>
                        <Download className="w-4 h-4 mr-2" /> Download Notes
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share2 className="w-4 h-4 mr-2" /> Share Link
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-destructive-foreground" onClick={() => handleDelete(sermon.id)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete Sermon
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingSermon} onOpenChange={(open) => !open && setEditingSermon(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Sermon</DialogTitle>
            <DialogDescription>Update the details for {editingSermon?.title}.</DialogDescription>
          </DialogHeader>
          {editingSermon && (
            <SermonForm 
              initialData={editingSermon}
              onSuccess={() => {
                setEditingSermon(null);
                fetchSermons();
              }} 
              onCancel={() => setEditingSermon(null)} 
            />
          )}
        </DialogContent>
      </Dialog>
      {/* Video Player Dialog */}
      <Dialog open={!!selectedSermon} onOpenChange={(open) => !open && setSelectedSermon(null)}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-black border-none">
          {selectedSermon && (
            <div className="aspect-video w-full bg-muted flex items-center justify-center relative group">
              <img 
                src={selectedSermon.image_url || `https://picsum.photos/seed/${selectedSermon.id}/800/450`} 
                alt={selectedSermon.title}
                className="w-full h-full object-cover opacity-50"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white space-y-4">
                <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-2xl shadow-primary/40">
                  <Play className="w-8 h-8 fill-current ml-1" />
                </div>
                <div className="text-center space-y-1">
                  <h2 className="text-2xl font-bold">{selectedSermon.title}</h2>
                  <p className="text-white/60 text-sm">{selectedSermon.sermon_speakers?.name || 'Ambassadors Speaker'}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-4 right-4 text-white hover:bg-white/10"
                onClick={() => setSelectedSermon(null)}
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
