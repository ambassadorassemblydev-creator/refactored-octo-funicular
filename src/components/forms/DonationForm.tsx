import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const donationSchema = z.object({
  amount: z.coerce.number().min(1, "Amount must be at least ₦1"),
  donation_type: z.enum(["tithe", "offering", "building_fund", "special", "welfare", "missions", "other"]),
  payment_channel: z.string().min(1, "Payment method is required"),
  donor_name: z.string().optional(),
  donor_email: z.string().optional(),
  donor_phone: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["completed", "pending", "failed"]),
  is_anonymous: z.boolean().default(false),
  paystack_reference: z.string().optional(),
});

type DonationFormValues = z.infer<typeof donationSchema>;

interface DonationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const FUND_LABELS: Record<string, string> = {
  tithe: "Tithe",
  offering: "Offering",
  building_fund: "Fund the Building",
  special: "Special Seed",
  welfare: "Welfare Fund",
  missions: "Missions",
  other: "General / Other",
};

export default function DonationForm({ onSuccess, onCancel }: DonationFormProps) {
  const [loading, setLoading] = React.useState(false);

  const form = useForm<DonationFormValues>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      amount: 0,
      donation_type: "tithe",
      payment_channel: "bank_transfer",
      status: "completed",
      is_anonymous: false,
    },
  });

  const isAnon = form.watch("is_anonymous");

  async function onSubmit(values: DonationFormValues) {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const payload = {
        amount: values.amount,
        currency: "NGN",
        donation_type: values.donation_type,
        payment_channel: values.payment_channel,
        donor_name: values.is_anonymous ? "Anonymous" : (values.donor_name || null),
        donor_email: values.donor_email || null,
        donor_phone: values.donor_phone || null,
        notes: values.notes || null,
        status: values.status,
        is_anonymous: values.is_anonymous,
        paystack_reference: values.paystack_reference || null,
        user_id: user?.id || null,
        paid_at: values.status === "completed" ? new Date().toISOString() : null,
        receipt_number: `AA-${Date.now().toString(36).toUpperCase()}`,
      };

      const { error } = await supabase.from("donations").insert([payload]);
      if (error) throw error;
      toast.success("Donation recorded! ✅");
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
        {/* Amount */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (₦)</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">₦</span>
                  <Input type="number" step="1" className="pl-8" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          {/* Fund Type */}
          <FormField
            control={form.control}
            name="donation_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fund Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select fund" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {Object.entries(FUND_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Payment Channel */}
          <FormField
            control={form.control}
            name="payment_channel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Method</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="card">Card (Paystack)</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="ussd">USSD</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="qr">QR Code</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Paystack Reference */}
        <FormField
          control={form.control}
          name="paystack_reference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Paystack Reference (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. PAY_ref_12345" {...field} className="font-mono text-sm" />
              </FormControl>
              <FormDescription>Paste the Paystack transaction reference if paying by card.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Anonymous toggle */}
        <FormField
          control={form.control}
          name="is_anonymous"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div>
                <FormLabel className="text-sm font-semibold">Anonymous Donation</FormLabel>
                <p className="text-xs text-muted-foreground">Name will not be shown in reports</p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Donor Info (hidden if anonymous) */}
        {!isAnon && (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="donor_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Donor Name</FormLabel>
                  <FormControl><Input placeholder="Full name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="donor_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (Optional)</FormLabel>
                  <FormControl><Input placeholder="+234 ..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Status */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="completed">Completed ✅</SelectItem>
                  <SelectItem value="pending">Pending ⏳</SelectItem>
                  <SelectItem value="failed">Failed ❌</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Any additional details..." {...field} rows={2} className="resize-none" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record Donation
          </Button>
        </div>
      </form>
    </Form>
  );
}
