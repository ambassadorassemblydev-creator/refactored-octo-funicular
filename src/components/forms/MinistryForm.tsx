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

const ministrySchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().min(10, "Description is required"),
  leader_id: z.string().optional(),
  type: z.string().optional(),
  status: z.enum(["active", "inactive"]),
  meeting_time: z.string().optional(),
  location: z.string().optional(),
});

type MinistryFormValues = z.infer<typeof ministrySchema>;

interface MinistryFormProps {
  initialData?: any;
  type?: "ministry" | "department";
  onSuccess: () => void;
  onCancel: () => void;
}

export default function MinistryForm({ initialData, type = "ministry", onSuccess, onCancel }: MinistryFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [leaders, setLeaders] = React.useState<any[]>([]);

  const isDepartment = type === "department";

  React.useEffect(() => {
    async function fetchLeaders() {
      const { data } = await supabase.from('profiles').select('id, first_name, last_name');
      setLeaders(data || []);
    }
    fetchLeaders();
  }, []);

  const form = useForm<z.input<typeof ministrySchema>>({
    resolver: zodResolver(ministrySchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      status: "active",
      type: type,
    },
  });

  async function onSubmit(values: any) {
    setLoading(true);
    const tableName = isDepartment ? "church_departments" : "ministries";
    try {
      // Sanitize and map values based on table schema
      const finalValues: any = {
        name: values.name,
        description: values.description,
      };

      if (isDepartment) {
        finalValues.head_id = values.leader_id || null;
        finalValues.is_active = values.status === "active";
        // Departments don't have meeting_time/location in schema
      } else {
        finalValues.leader_id = values.leader_id || null;
        finalValues.is_active = values.status === "active";
        finalValues.meeting_time = values.meeting_time || null;
        finalValues.meeting_location = values.location || null; // Fix: was meeting_location
        finalValues.category = values.type || "General";
        finalValues.slug = values.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }

      if (initialData?.id) {
        const { error } = await supabase
          .from(tableName)
          .update(finalValues)
          .eq("id", initialData.id);
        if (error) throw error;
        toast.success(`${isDepartment ? 'Department' : 'Ministry'} updated successfully`);
      } else {
        const { error } = await supabase
          .from(tableName)
          .insert([finalValues]);
        if (error) throw error;
        toast.success(`${isDepartment ? 'Department' : 'Ministry'} created successfully`);
      }
      onSuccess();
    } catch (error: any) {
      console.error(`Error saving ${tableName}:`, error);
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isDepartment ? 'Department' : 'Ministry'} Name</FormLabel>
              <FormControl>
                <Input placeholder={isDepartment ? "Media, Finance, Logistics..." : "Youth Ministry, Worship Team..."} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder={`What is the purpose of this ${isDepartment ? 'department' : 'ministry'}?`} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="leader_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{isDepartment ? 'Department' : 'Ministry'} Leader</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a leader" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {leaders.map(l => (
                      <SelectItem key={l.id} value={l.id}>{l.first_name} {l.last_name}</SelectItem>
                    ))}
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
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="meeting_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meeting Time</FormLabel>
                <FormControl>
                  <Input placeholder="Fridays at 6 PM" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="Youth Hall" {...field} />
                </FormControl>
                <FormMessage />
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
            {initialData ? `Update ${isDepartment ? 'Department' : 'Ministry'}` : `Create ${isDepartment ? 'Department' : 'Ministry'}`}
          </Button>
        </div>
      </form>
    </Form>
  );
}
