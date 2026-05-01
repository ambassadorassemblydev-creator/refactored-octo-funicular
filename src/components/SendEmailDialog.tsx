import * as React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { sendEmail } from "@/src/lib/email";
import { toast } from "sonner";

interface SendEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTo?: string;
  defaultSubject?: string;
}

export default function SendEmailDialog({ open, onOpenChange, defaultTo = "", defaultSubject = "" }: SendEmailDialogProps) {
  const [to, setTo] = React.useState(defaultTo);
  const [subject, setSubject] = React.useState(defaultSubject);
  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setTo(defaultTo);
      setSubject(defaultSubject);
      setMessage("");
    }
  }, [open, defaultTo, defaultSubject]);

  const handleSend = async () => {
    if (!to || !subject || !message) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await sendEmail({ to, subject, message });
      toast.success("Email sent successfully!");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight">Compose Message</DialogTitle>
          <DialogDescription className="text-[10px] font-bold uppercase tracking-widest">
            Send a direct email via Ambassadors Assembly Office
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Recipient</label>
            <Input 
              value={to} 
              onChange={(e) => setTo(e.target.value)} 
              placeholder="email@example.com"
              className="rounded-xl h-12 bg-muted/30 border-none font-medium"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Subject</label>
            <Input 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)} 
              placeholder="Enter subject..."
              className="rounded-xl h-12 bg-muted/30 border-none font-medium"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Message</label>
            <Textarea 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
              placeholder="Write your message here..."
              className="rounded-2xl min-h-[150px] bg-muted/30 border-none resize-none font-medium"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-12 px-6 font-bold uppercase tracking-widest text-[10px]">
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={loading} className="rounded-xl h-12 px-8 font-bold uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-primary/20">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
