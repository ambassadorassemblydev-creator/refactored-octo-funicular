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
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const prayerSchema = z.object({
  title: z.string().min(2, "Title is required"),
  content: z.string().min(10, "Content is required"),
  category: z.string().optional(),
  is_anonymous: z.boolean(),
  is_public: z.boolean(),
  status: z.enum(["active", "answered", "archived"]),
});

type PrayerFormValues = z.infer<typeof prayerSchema>;

interface PrayerFormProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PrayerForm({ initialData, onSuccess, onCancel }: PrayerFormProps) {
  const [loading, setLoading] = React.useState(false);

  const form = useForm<z.input<typeof prayerSchema>>({
    resolver: zodResolver(prayerSchema),
    defaultValues: initialData || {
      title: "",
      content: "",
      is_anonymous: false,
      is_public: true,
      status: "active",
    },
  });

  async function onSubmit(values: any) {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to post a prayer request");

      if (initialData?.id) {
        const { error } = await supabase
          .from("prayer_requests")
          .update(values)
          .eq("id", initialData.id);
        if (error) throw error;
        toast.success("Prayer request updated");
      } else {
        const { error } = await supabase
          .from("prayer_requests")
          .insert([{ ...values, user_id: user.id }]);
        if (error) throw error;
        toast.success("Prayer request posted to the wall");
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
              <FormLabel>Prayer Title</FormLabel>
              <FormControl>
                <Input placeholder="Healing for my family, New job opportunity..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Prayer Request</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Share your heart with the community..." 
                  className="min-h-[120px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="healing">Healing</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="guidance">Guidance</SelectItem>
                    <SelectItem value="thanksgiving">Thanksgiving</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="answered">Answered!</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
          <FormField
            control={form.control}
            name="is_anonymous"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between gap-4 space-y-0">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm font-bold">Post Anonymously</FormLabel>
                  <FormDescription className="text-[10px]">Your name will not be shown.</FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="is_public"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between gap-4 space-y-0">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm font-bold">Public Wall</FormLabel>
                  <FormDescription className="text-[10px]">Visible to all members.</FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Update Request" : "Post Prayer Request"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
