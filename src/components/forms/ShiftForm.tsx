import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/src/lib/utils";

const shiftSchema = z.object({
  user_id: z.string().min(1, "Worker is required"),
  department_id: z.string().min(1, "Department is required"),
  service_name: z.string().min(2, "Service name is required"),
  schedule_date: z.date(),
  shift_start: z.string().min(1, "Start time is required"),
  shift_end: z.string().min(1, "End time is required"),
  role_for_day: z.string().optional(),
});

type ShiftFormValues = z.infer<typeof shiftSchema>;

interface ShiftFormProps {
  workers: any[];
  departments: any[];
  onSubmit: (data: ShiftFormValues) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ShiftForm({ workers, departments, onSubmit, onCancel, loading }: ShiftFormProps) {
  const form = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftSchema),
    defaultValues: {
      user_id: "",
      department_id: "",
      service_name: "Sunday Service",
      schedule_date: new Date(),
      shift_start: "08:00",
      shift_end: "12:00",
      role_for_day: "",
    },
  });

  const selectedDeptId = form.watch("department_id");
  const filteredWorkers = selectedDeptId
    ? workers.filter(w => w.department_id === selectedDeptId)
    : workers;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="department_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Department</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl h-11 bg-muted/30 border-none">
                      <SelectValue placeholder="Select Dept" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl">
                    {departments.map((d: any) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="user_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Worker</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl h-11 bg-muted/30 border-none">
                      <SelectValue placeholder="Select Worker" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl">
                    {filteredWorkers.map((w: any) => (
                      <SelectItem key={w.id} value={w.user_id}>
                        {w.profiles?.first_name} {w.profiles?.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="service_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Service/Event Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Sunday Celebration" className="rounded-xl h-11 bg-muted/30 border-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="schedule_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Date</FormLabel>
                <Popover>
                  <FormControl>
                    <PopoverTrigger className={cn(
                      "w-full h-11 rounded-xl bg-muted/30 border-none px-3 text-left font-normal flex items-center justify-between outline-none",
                      !field.value && "text-muted-foreground"
                    )}>
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="h-4 w-4 opacity-50" />
                    </PopoverTrigger>
                  </FormControl>
                  <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role_for_day"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Role (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Lead Usher" className="rounded-xl h-11 bg-muted/30 border-none" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="shift_start"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Start Time</FormLabel>
                <FormControl>
                  <Input type="time" className="rounded-xl h-11 bg-muted/30 border-none" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="shift_end"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">End Time</FormLabel>
                <FormControl>
                  <Input type="time" className="rounded-xl h-11 bg-muted/30 border-none" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onCancel} className="rounded-xl h-11 px-6 font-bold uppercase tracking-widest text-[10px]">
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="rounded-xl h-11 px-8 font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign Shift
          </Button>
        </div>
      </form>
    </Form>
  );
}
