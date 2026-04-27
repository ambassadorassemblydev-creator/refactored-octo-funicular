import * as React from "react";
import { createClient } from '@supabase/supabase-js';
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
import { Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { auditRepo } from "@/src/lib/audit";
import { useAuth } from "@/src/contexts/AuthContext";

const memberSchema = z.object({
  title: z.enum(['Mr', 'Mrs', 'Ms', 'Dr', 'Pastor', 'Deacon', 'Deaconess', 'Elder', 'Minister', 'Bishop', 'Evangelist', 'Apostle', 'Prophet']),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  middle_name: z.string().default(""),
  preferred_name: z.string().default(""),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  alt_phone: z.string().default(""),
  whatsapp_number: z.string().default(""),
  gender: z.enum(["male", "female", "prefer_not_to_say"]),
  date_of_birth: z.string().default(""),
  marital_status: z.enum(["single", "married", "widowed", "divorced", "prefer_not_to_say"]),
  wedding_anniversary: z.string().default(""),
  member_id: z.string().min(1, "Member ID is required"),
  status: z.enum(["active", "inactive", "suspended", "pending_verification"]),
  is_member: z.boolean().default(true),
  is_baptized: z.boolean().default(false),
  salvation_date: z.string().default(""),
  baptism_date: z.string().default(""),
  previous_church: z.string().default(""),
  occupation: z.string().default(""),
  employer: z.string().default(""),
  bio: z.string().default(""),
  address_line_1: z.string().min(1, "Address is required"),
  address_line_2: z.string().default(""),
  city: z.string().min(1, "City is required"),
  county: z.string().default(""),
  postal_code: z.string().default(""),
  country: z.string().default("Nigeria"),
  emergency_contact_name: z.string().min(1, "Emergency contact is required"),
  emergency_contact_phone: z.string().min(1, "Contact phone is required"),
  emergency_contact_relationship: z.string().min(1, "Relationship is required"),
});

type MemberFormValues = z.infer<typeof memberSchema>;

interface MemberData extends MemberFormValues {
  id: string;
  created_at?: string;
  updated_at?: string;
}

interface MemberFormProps {
  initialData?: Partial<MemberData>;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function MemberForm({ initialData, onSuccess, onCancel }: MemberFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const { user: currentUser } = useAuth();

  const steps = ["Basic Details", "Church Life", "Background", "Emergency & Address"];

  const generateMemberId = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('member_id')
        .not('member_id', 'is', null)
        .order('member_id', { ascending: false })
        .limit(1);
      
      if (data && data[0]?.member_id) {
        const lastId = data[0].member_id;
        const match = lastId.match(/AA-(\d+)/);
        if (match) {
          const nextNum = parseInt(match[1]) + 1;
          return `AA-${nextNum.toString().padStart(4, '0')}`;
        }
      }
      return "AA-0001";
    } catch (err) {
      return "AA-" + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    }
  };

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema) as any,
    defaultValues: {
      first_name: initialData?.first_name || "",
      last_name: initialData?.last_name || "",
      middle_name: initialData?.middle_name || "",
      preferred_name: initialData?.preferred_name || "",
      title: initialData?.title || "Mr",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      alt_phone: initialData?.alt_phone || "",
      whatsapp_number: initialData?.whatsapp_number || "",
      gender: initialData?.gender || "male",
      date_of_birth: initialData?.date_of_birth || "",
      marital_status: initialData?.marital_status || "single",
      wedding_anniversary: initialData?.wedding_anniversary || "",
      member_id: initialData?.member_id || "",
      status: initialData?.status || "active",
      is_member: initialData?.is_member ?? false,
      is_baptized: initialData?.is_baptized ?? false,
      salvation_date: initialData?.salvation_date || "",
      baptism_date: initialData?.baptism_date || "",
      previous_church: initialData?.previous_church || "",
      occupation: initialData?.occupation || "",
      employer: initialData?.employer || "",
      bio: initialData?.bio || "",
      address_line_1: initialData?.address_line_1 || "",
      address_line_2: initialData?.address_line_2 || "",
      city: initialData?.city || "",
      county: initialData?.county || "",
      postal_code: initialData?.postal_code || "",
      country: initialData?.country || "Nigeria",
      emergency_contact_name: initialData?.emergency_contact_name || "",
      emergency_contact_phone: initialData?.emergency_contact_phone || "",
      emergency_contact_relationship: initialData?.emergency_contact_relationship || "",
    } as MemberFormValues,
  });

  React.useEffect(() => {
    if (!initialData && !form.getValues("member_id")) {
      generateMemberId().then(id => form.setValue("member_id", id));
    }
  }, [initialData, form]);

  async function onSubmit(values: MemberFormValues) {
    setLoading(true);
    try {
      if (initialData?.id) {
        const { error } = await supabase
          .from("profiles")
          .update(values)
          .eq("id", initialData.id);
        if (error) throw error;
        
        // Audit log for update
        if (currentUser) {
          await auditRepo.logAction({
            admin_id: currentUser.id,
            action: 'UPDATE',
            table_name: 'profiles',
            record_id: initialData.id,
            old_values: initialData,
            new_values: values
          });
        }
        
        toast.success("Member updated successfully");
      } else {
        // SILENT SIGNUP FLOW to avoid FK violation on profiles.id
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, {
          auth: { persistSession: false }
        });
        
        const tempPassword = Math.random().toString(36).slice(-12) + "A1!";
        
        const { data: signUpData, error: signUpError } = await tempSupabase.auth.signUp({
          email: values.email,
          password: tempPassword,
          options: {
            data: {
              first_name: values.first_name,
              last_name: values.last_name
            }
          }
        });
        
        if (signUpError) throw signUpError;
        const newId = signUpData.user?.id;
        if (!newId) throw new Error("Failed to create auth user");

        // The trigger 'handle_new_user' already created the profile.
        // We now update it with the additional values from the form.
        const { error: updateError } = await supabase
          .from("profiles")
          .update(values)
          .eq("id", newId);
        
        if (updateError) throw updateError;

        // Audit log for insert
        if (currentUser) {
          await auditRepo.logAction({
            admin_id: currentUser.id,
            action: 'INSERT',
            table_name: 'profiles',
            record_id: newId,
            new_values: values
          });
        }

        toast.success("Member added successfully. A verification email has been sent.");
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const nextStep = async () => {
    const fields: (keyof MemberFormValues)[] = step === 0 
      ? ["title", "first_name", "last_name", "email", "phone"] 
      : step === 1 
      ? ["member_id", "status"] 
      : step === 2 
      ? ["occupation"] 
      : [];
    
    const isValid = await form.trigger(fields);
    if (isValid) setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-1 relative">
              <div 
                className={cn(
                  "w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 z-10",
                  step === i 
                    ? "bg-primary border-primary text-primary-foreground scale-110 shadow-[0_0_15px_rgba(var(--primary),0.5)]" 
                    : step > i 
                    ? "bg-primary/20 border-primary text-primary" 
                    : "bg-background border-muted text-muted-foreground"
                )}
              >
                {step > i ? "✓" : i + 1}
              </div>
              <span className={cn("text-[10px] font-bold uppercase tracking-wider", step === i ? "text-primary" : "text-muted-foreground")}>
                {s}
              </span>
              {i < steps.length - 1 && (
                <div className={cn("absolute top-4 left-[60%] right-[-40%] h-[2px] -z-0", step > i ? "bg-primary" : "bg-muted")} />
              )}
            </div>
          ))}
        </div>

        {/* Step 0: Basic Details */}
        {step === 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Title" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {['Mr', 'Mrs', 'Ms', 'Dr', 'Pastor', 'Deacon', 'Deaconess', 'Elder', 'Minister', 'Bishop', 'Evangelist', 'Apostle', 'Prophet'].map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="middle_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Middle Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="preferred_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Alias" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+234..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {/* Step 1: Church Life */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="member_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Member ID</FormLabel>
                    <FormControl>
                      <Input placeholder="AA-XXXX" {...field} />
                    </FormControl>
                    <FormDescription>Automatically generated for new members</FormDescription>
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
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="pending_verification">Pending Verification</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-muted/50">
              <FormField
                control={form.control}
                name="salvation_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salvation Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="baptism_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Baptism Date</FormLabel>
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
              name="previous_church"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Previous Church</FormLabel>
                  <FormControl>
                    <Input placeholder="Name of previous church" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Step 2: Background */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="occupation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Occupation</FormLabel>
                    <FormControl>
                      <Input placeholder="Software Engineer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="marital_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marital Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brief Bio</FormLabel>
                  <FormControl>
                    <textarea 
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Share a little about yourself..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Step 3: Emergency & Address */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Address Details</p>
              <FormField
                control={form.control}
                name="address_line_1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 1</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Street Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="postal_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="E1..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-muted/50">
              <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Emergency Contact</p>
              <FormField
                control={form.control}
                name="emergency_contact_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="emergency_contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergency_contact_relationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Spouse" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between gap-3 pt-6 border-t border-muted/50">
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            {step > 0 && (
              <Button type="button" variant="outline" onClick={prevStep}>
                Previous
              </Button>
            )}
          </div>
          
          <div className="flex gap-3">
            {step < steps.length - 1 ? (
              <Button type="button" onClick={nextStep}>
                Next Step
              </Button>
            ) : (
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Update Member" : "Complete Registration"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}
