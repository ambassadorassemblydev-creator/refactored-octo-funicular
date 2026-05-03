import * as React from "react";
import { 
  Image as ImageIcon, 
  Video, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Download,
  Share2,
  Maximize2,
  Edit2,
  Trash2,
  FileText,
  FolderOpen,
  ChevronRight,
  X
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import MediaForm from "./forms/MediaForm";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";

import { useAuth } from "@/src/contexts/AuthContext";

export default function MediaGallery() {
  const { loading: authLoading } = useAuth();
  const [mediaItems, setMediaItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("all");
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [editingMedia, setEditingMedia] = React.useState<any>(null);
  const [selectedMedia, setSelectedMedia] = React.useState<any>(null);
  const [editingCloudinaryId, setEditingCloudinaryId] = React.useState<any>(null);
  const [newCloudinaryId, setNewCloudinaryId] = React.useState("");
  const [savingCloudinary, setSavingCloudinary] = React.useState(false);

  const CLOUD_NAME = (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME || 'dxwhpacz7';
  const getCloudinaryUrl = (item: any) => {
    if (item.cloudinary_url) return item.cloudinary_url;
    if (item.thumbnail_url) return item.thumbnail_url;
    if (item.url) return item.url;
    return 'https://images.unsplash.com/photo-1510076857177-7470076d4098?q=80&w=2072&auto=format&fit=crop';
  };

  const getIcon = (media_type: string) => {
    switch (media_type) {
      case 'video': return Video;
      case 'document': return FileText;
      default: return Image;
    }
  };

  const fetchMedia = async (retries = 3) => {
    setLoading(true);
    try {
      let query = supabase
        .from('media_gallery')
        .select('*')
        .order('created_at', { ascending: false });

      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      if (activeTab !== "all") {
        query = query.eq('media_type', activeTab === "images" ? "image" : activeTab === "videos" ? "video" : "document");
      }

      const { data, error } = await query;

      if (error) throw error;
      setMediaItems(data || []);
    } catch (error: any) {
      if (error?.message?.includes("Lock") && retries > 0) {
        setTimeout(() => fetchMedia(retries - 1), 500);
        return;
      }
      console.error("Error fetching media:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!authLoading) {
      const debounce = setTimeout(fetchMedia, 500);
      return () => clearTimeout(debounce);
    }
  }, [search, activeTab, authLoading]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('media_gallery').delete().eq('id', id);
      if (error) throw error;
      toast.success("Media deleted successfully");
      fetchMedia();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSaveCloudinaryId = async () => {
    if (!editingCloudinaryId) return;
    setSavingCloudinary(true);
    try {
      const cloudUrl = CLOUD_NAME
        ? `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${newCloudinaryId}`
        : editingCloudinaryId.url;
      const { error } = await supabase
        .from('media_gallery')
        .update({ cloudinary_public_id: newCloudinaryId, url: cloudUrl } as any)
        .eq('id', editingCloudinaryId.id);
      if (error) throw error;
      toast.success("Cloudinary ID updated — image synced across site ✅");
      setEditingCloudinaryId(null);
      fetchMedia();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingCloudinary(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Media Gallery</h1>
          <p className="text-muted-foreground">Browse and manage church photos, videos, and digital assets.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" />
            Upload Media
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload Media</DialogTitle>
              <DialogDescription>Add new photos, videos, or documents to the gallery.</DialogDescription>
            </DialogHeader>
            <MediaForm 
              onSuccess={() => {
                setIsAddOpen(false);
                fetchMedia();
              }} 
              onCancel={() => setIsAddOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <TabsList className="grid w-full grid-cols-4 lg:w-[500px] h-11 p-1 bg-muted/50 rounded-xl">
            <TabsTrigger value="all" className="rounded-lg text-[10px] font-bold uppercase tracking-widest">All</TabsTrigger>
            <TabsTrigger value="images" className="rounded-lg text-[10px] font-bold uppercase tracking-widest">Images</TabsTrigger>
            <TabsTrigger value="videos" className="rounded-lg text-[10px] font-bold uppercase tracking-widest">Videos</TabsTrigger>
            <TabsTrigger value="documents" className="rounded-lg text-[10px] font-bold uppercase tracking-widest">Docs</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search gallery..." 
                className="pl-10 h-11 bg-card/50 border-none shadow-sm focus-visible:ring-primary/20" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2 h-11 px-5 rounded-xl border-none shadow-sm bg-card/50">
              <FolderOpen className="w-4 h-4" />
              Albums
            </Button>
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-0">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="aspect-square animate-pulse bg-muted/50 rounded-2xl" />
              ))}
            </div>
          ) : mediaItems.length === 0 ? (
            <div className="py-20 text-center space-y-4 bg-muted/20 rounded-3xl border-2 border-dashed">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
                <FolderOpen className="w-10 h-10 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-xl">No media found</h3>
                <p className="text-muted-foreground">Try adjusting your search or upload new media.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {mediaItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="group relative overflow-hidden border-none shadow-md bg-card/50 backdrop-blur-sm aspect-square rounded-2xl">
                    <img 
                      src={getCloudinaryUrl(item)} 
                      alt={item.title}
                      className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-between p-5">
                      <div className="flex justify-between items-start">
                        <Badge className="bg-white/20 backdrop-blur-md border-none text-white text-[10px] font-bold uppercase tracking-widest">
                          {item.media_type === "video" ? <Video className="w-3 h-3 mr-1.5" /> : item.media_type === "document" ? <FileText className="w-3 h-3 mr-1.5" /> : <ImageIcon className="w-3 h-3 mr-1.5" />}
                          {item.media_type}
                        </Badge>
                        <div className="flex gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 text-white hover:bg-white/20 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
                              <MoreVertical className="w-4 h-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Media Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setEditingMedia(item)}>
                                <Edit2 className="w-4 h-4 mr-2" /> Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setEditingCloudinaryId(item); setNewCloudinaryId(item.cloudinary_public_id || ''); }}>
                                <Edit2 className="w-4 h-4 mr-2" /> Edit Cloudinary ID
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="w-4 h-4 mr-2" /> Download
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Share2 className="w-4 h-4 mr-2" /> Share Link
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-destructive-foreground" onClick={() => handleDelete(item.id)}>
                                <Trash2 className="w-4 h-4 mr-2" /> Delete Media
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-lg font-bold text-white line-clamp-1 leading-tight">{item.title}</h4>
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">{item.category || 'General'} • {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'TBD'}</p>
                          <Button 
                            size="icon" 
                            variant="secondary" 
                            className="h-8 w-8 rounded-full shadow-lg scale-90 group-hover:scale-100 transition-transform"
                            onClick={() => setSelectedMedia(item)}
                          >
                            <Maximize2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Lightbox / Preview */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl"
            onClick={() => setSelectedMedia(null)}
          >
            <Button 
              size="icon" 
              variant="ghost" 
              className="absolute top-6 right-6 text-white hover:bg-white/10 rounded-full h-12 w-12"
              onClick={() => setSelectedMedia(null)}
            >
              <X className="w-8 h-8" />
            </Button>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full aspect-video rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={getCloudinaryUrl(selectedMedia)} 
                alt={selectedMedia.title}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
                <h2 className="text-3xl font-bold text-white mb-2">{selectedMedia.title}</h2>
                <p className="text-white/70 font-medium">{selectedMedia.description || 'No description provided.'}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Dialog */}
      <Dialog open={!!editingMedia} onOpenChange={(open) => !open && setEditingMedia(null)}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Media Details</DialogTitle>
            <DialogDescription>Update the title or category for this media.</DialogDescription>
          </DialogHeader>
          {editingMedia && (
            <MediaForm 
              initialData={editingMedia}
              onSuccess={() => {
                setEditingMedia(null);
                fetchMedia();
              }} 
              onCancel={() => setEditingMedia(null)} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Cloudinary ID Edit Dialog */}
      <Dialog open={!!editingCloudinaryId} onOpenChange={open => !open && setEditingCloudinaryId(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Cloudinary Public ID</DialogTitle>
            <DialogDescription>
              Updating this ID will change the image displayed across the entire site wherever this media is referenced.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {newCloudinaryId && CLOUD_NAME && (
              <div className="rounded-xl overflow-hidden aspect-video bg-muted">
                <img
                  src={`https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${newCloudinaryId}`}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cloudinary Public ID</label>
              <input
                className="w-full h-11 rounded-xl bg-muted/30 border-none px-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={newCloudinaryId}
                onChange={e => setNewCloudinaryId(e.target.value)}
                placeholder="e.g. ambassadors/gallery/image_abc123"
              />
              <p className="text-[10px] text-muted-foreground">Find this in your Cloudinary Media Library</p>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditingCloudinaryId(null)} className="px-4 py-2 rounded-xl bg-muted text-sm font-bold">Cancel</button>
              <button
                onClick={handleSaveCloudinaryId}
                disabled={savingCloudinary}
                className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50"
              >
                {savingCloudinary ? 'Saving...' : 'Save & Sync'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
