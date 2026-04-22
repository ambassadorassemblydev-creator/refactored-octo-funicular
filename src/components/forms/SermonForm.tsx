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
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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

  React.useEffect(() => {
    async function fetchSeries() {
      const { data } = await supabase.from('sermon_series').select('id, title');
      setSeries(data || []);
    }
    fetchSeries();
  }, []);

  const form = useForm<z.input<typeof sermonSchema>>({
    resolver: zodResolver(sermonSchema),
    defaultValues: initialData ? {
      ...initialData,
      speaker_name: initialData.sermon_speakers?.name || "",
      sermon_date: initialData.sermon_date ? new Date(initialData.sermon_date).toISOString().slice(0, 10) : "",
    } : {
      title: "",
      description: "",
      speaker_name: "",
      sermon_date: new Date().toISOString().slice(0, 10),
      status: "published",
    },
  });

  async function onSubmit(values: any) {
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
      const payload = { ...rest, speaker_id };

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
              <FormItem>
                <FormLabel>Speaker</FormLabel>
                <FormControl>
                  <Input placeholder="Pastor John Doe" {...field} />
                </FormControl>
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
            <FormItem>
              <FormLabel>Sermon Series</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a series" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {series.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
    </Form>
  );
}
