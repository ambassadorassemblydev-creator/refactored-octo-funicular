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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";
import { Loader2, Image as ImageIcon } from "lucide-react";

const mediaSchema = z.object({
  title: z.string().min(2, "Title is required"),
  url: z.string().url("Valid URL is required"),
  type: z.enum(["image", "video", "document"]),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
});

type MediaFormValues = z.infer<typeof mediaSchema>;

interface MediaFormProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function MediaForm({ initialData, onSuccess, onCancel }: MediaFormProps) {
  const [loading, setLoading] = React.useState(false);

  const form = useForm<z.input<typeof mediaSchema>>({
    resolver: zodResolver(mediaSchema),
    defaultValues: initialData || {
      title: "",
      url: "",
      type: "image",
      category: "Events",
    },
  });

  async function onSubmit(values: any) {
    setLoading(true);
    try {
      if (initialData?.id) {
        const { error } = await supabase
          .from("media_gallery")
          .update(values)
          .eq("id", initialData.id);
        if (error) throw error;
        toast.success("Media updated successfully");
      } else {
        const { error } = await supabase
          .from("media_gallery")
          .insert([values]);
        if (error) throw error;
        toast.success("Media added to gallery");
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
              <FormLabel>Media Title</FormLabel>
              <FormControl>
                <Input placeholder="Sunday Service Highlights..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Media URL</FormLabel>
              <FormControl>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="https://..." className="pl-10" {...field} />
                </div>
              </FormControl>
              <FormDescription>Link to an image, video, or document.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Media Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Events">Events</SelectItem>
                    <SelectItem value="Worship">Worship</SelectItem>
                    <SelectItem value="Youth">Youth</SelectItem>
                    <SelectItem value="Outreach">Outreach</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Brief description..." {...field} />
              </FormControl>
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
            {initialData ? "Update Media" : "Add to Gallery"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
