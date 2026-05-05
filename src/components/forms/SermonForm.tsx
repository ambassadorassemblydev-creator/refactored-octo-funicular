import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/src/lib/utils";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";
import { ImageUpload } from "@/src/components/ui/ImageUpload";

const sermonSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  speaker_name: z.string().min(2, "Speaker name is required"),
  series_id: z.string().optional(),
  video_url: z.string().url().optional().or(z.literal("")),
  audio_url: z.string().url().optional().or(z.literal("")),
  thumbnail_url: z.string().optional(),
  sermon_date: z.string().min(1, "Sermon date is required"),
  status: z.enum(["published", "draft", "archived"]),
});

type SermonFormValues = z.infer<typeof sermonSchema>;

interface SermonFormProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function SermonForm({ initialData, onSuccess, onCancel }: SermonFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [series, setSeries] = React.useState<any[]>([]);
  const [speakers, setSpeakers] = React.useState<any[]>([]);
  const [isSeriesDialogOpen, setIsSeriesDialogOpen] = React.useState(false);
  const [isSpeakerPopoverOpen, setIsSpeakerPopoverOpen] = React.useState(false);
  const [isSeriesPopoverOpen, setIsSeriesPopoverOpen] = React.useState(false);
  const [newSeriesTitle, setNewSeriesTitle] = React.useState("");
  const [creatingSeries, setCreatingSeries] = React.useState(false);

  const form = useForm<SermonFormValues>({
    resolver: zodResolver(sermonSchema),
    defaultValues: initialData ? {
      ...initialData,
      speaker_name: initialData.sermon_speakers?.name || "",
      sermon_date: initialData.sermon_date || new Date().toISOString().split('T')[0],
      status: initialData.status || "published",
    } : {
      title: "",
      description: "",
      speaker_name: "",
      series_id: "none",
      video_url: "",
      audio_url: "",
      thumbnail_url: "",
      sermon_date: new Date().toISOString().split('T')[0],
      status: "published",
    },
  });

  const fetchData = async () => {
    const [seriesRes, speakersRes, profilesRes] = await Promise.all([
      supabase.from('sermon_series').select('id, title'),
      supabase.from('sermon_speakers').select('id, name'),
      supabase.from('profiles').select('id, first_name, last_name')
    ]);
    setSeries(seriesRes.data || []);
    
    // Merge sermon_speakers and profiles
    const profileSpeakers = (profilesRes.data || []).map(p => ({
      id: p.id,
      name: `${p.first_name} ${p.last_name}`
    }));
    
    const allSpeakers = [...(speakersRes.data || [])];
    profileSpeakers.forEach(ps => {
      if (!allSpeakers.some(s => s.name === ps.name)) {
        allSpeakers.push(ps);
      }
    });
    
    setSpeakers(allSpeakers);
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSeries = async () => {
    if (!newSeriesTitle.trim()) return;
    setCreatingSeries(true);
    try {
      const slug = newSeriesTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const { data, error } = await supabase
        .from('sermon_series')
        .insert([{ title: newSeriesTitle.trim(), slug }])
        .select('id, title')
        .single();
      
      if (error) throw error;
      toast.success("New series created!");
      setSeries([...series, data]);
      form.setValue("series_id", data.id);
      setIsSeriesDialogOpen(false);
      setNewSeriesTitle("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreatingSeries(false);
    }
  };

  async function onSubmit(values: SermonFormValues) {
    setLoading(true);
    try {
      // Handle speaker: find or create a speaker record, then use speaker_id
      let speaker_id: string | null = null;
      if (values.speaker_name?.trim()) {
        const { data: existingSpeaker } = await supabase
          .from('sermon_speakers')
          .select('id')
          .ilike('name', values.speaker_name.trim())
          .maybeSingle();

        if (existingSpeaker) {
          speaker_id = existingSpeaker.id;
        } else {
          const { data: newSpeaker, error: speakerErr } = await supabase
            .from('sermon_speakers')
            .insert([{ name: values.speaker_name.trim() }])
            .select('id')
            .single();
          if (speakerErr) throw speakerErr;
          speaker_id = newSpeaker.id;
        }
      }

      // Build the payload without speaker_name (not a DB column)
      const { speaker_name, ...rest } = values;
      const slug = values.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const payload = { 
        ...rest, 
        speaker_id, 
        slug,
        series_id: values.series_id === "none" ? null : values.series_id 
      };

      if (initialData?.id) {
        const { error } = await supabase
          .from("sermons")
          .update(payload)
          .eq("id", initialData.id);
        if (error) throw error;
        toast.success("Sermon updated successfully");
      } else {
        const { error } = await supabase
          .from("sermons")
          .insert([payload]);
        if (error) throw error;
        toast.success("Sermon published successfully");
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sermon Title</FormLabel>
              <FormControl>
                <Input placeholder="The Power of Grace..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="speaker_name"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="mb-1">Speaker</FormLabel>
                <Popover open={isSpeakerPopoverOpen} onOpenChange={setIsSpeakerPopoverOpen}>
                  <PopoverTrigger>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value || "Select speaker..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[250px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search or type speaker..." />
                      <CommandList>
                        <CommandEmpty>
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start text-primary font-bold text-xs h-8"
                            onClick={() => {
                              const searchInput = document.querySelector('[placeholder="Search or type speaker..."]') as HTMLInputElement;
                              if (searchInput?.value) {
                                field.onChange(searchInput.value);
                              }
                            }}
                          >
                            <Plus className="mr-2 h-3 w-3" />
                            Add as new speaker
                          </Button>
                        </CommandEmpty>
                        <CommandGroup>
                          {speakers.map((s) => (
                            <CommandItem
                              key={s.id}
                              value={s.name}
                              onSelect={() => {
                                field.onChange(s.name);
                                setIsSpeakerPopoverOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", field.value === s.name ? "opacity-100" : "opacity-0")} />
                              {s.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sermon_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sermon Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="series_id"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="mb-1">Sermon Series</FormLabel>
              <Popover open={isSeriesPopoverOpen} onOpenChange={setIsSeriesPopoverOpen}>
                <PopoverTrigger>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value === "none" ? "Standalone / No Series" : 
                       (field.value ? series.find((s) => s.id === field.value)?.title : "Select series...")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search series..." />
                    <CommandList>
                      <CommandEmpty>No series found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            field.onChange("none");
                            setIsSeriesPopoverOpen(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", field.value === "none" ? "opacity-100" : "opacity-0")} />
                          Standalone / No Series
                        </CommandItem>
                        {series.map((s) => (
                          <CommandItem
                            key={s.id}
                            value={s.title}
                            onSelect={() => {
                            field.onChange(s.id);
                            setIsSeriesPopoverOpen(false);
                          }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", field.value === s.id ? "opacity-100" : "opacity-0")} />
                            {s.title}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandSeparator />
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => setIsSeriesDialogOpen(true)}
                          className="text-primary font-bold"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create New Series
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description / Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Key points from the sermon..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="video_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Video URL (YouTube/Vimeo)</FormLabel>
                <FormControl>
                  <Input placeholder="https://..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="audio_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Audio URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="thumbnail_url"
          render={({ field }) => (
            <FormItem>
              <ImageUpload
                label="Sermon Thumbnail"
                hint="Recommended: 16:9 ratio (1280×720). Shown as the sermon card preview image."
                value={field.value}
                onChange={field.onChange}
                folder="ambassadors_assembly/sermons"
                aspectRatio="video"
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Update Sermon" : "Publish Sermon"}
          </Button>
        </div>
      </form>

      {/* Quick Series Add Dialog */}
      <Dialog open={isSeriesDialogOpen} onOpenChange={setIsSeriesDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add New Sermon Series</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Series Title</label>
              <Input 
                placeholder="e.g. The Year of Flourishing" 
                value={newSeriesTitle} 
                onChange={e => setNewSeriesTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsSeriesDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleCreateSeries} 
                disabled={creatingSeries || !newSeriesTitle.trim()}
              >
                {creatingSeries ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Create Series
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Form>
  );
}

