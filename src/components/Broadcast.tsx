import * as React from "react";
import { 
  Zap, 
  Send, 
  Bell, 
  Info, 
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Link as LinkIcon
} from "lucide-react";
import { supabase } from "@/src/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";

export default function Broadcast() {
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [url, setUrl] = React.useState("/");
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<{ sent: number; failed: number } | null>(null);

  const handleBroadcast = async () => {
    if (!title || !body) {
      toast.error("Ambassador, please provide both a title and a message.");
      return;
    }

    setLoading(true);
    setStatus(null);

    const safetyTimeout = setTimeout(() => {
      setLoading(false);
      toast.error("Broadcast request timed out. Please check the archive later.");
    }, 30000); // 30 second safety net

    try {
      // 1. Get the session token from local storage or context
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // High IQ: Calling the main server API with the token
      const response = await fetch(`${import.meta.env.VITE_MAIN_APP_URL || 'https://theambassadorsassembly.org'}/api/notifications/broadcast`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, body, url })
      });

      // Handle empty or non-JSON response gracefully
      const contentType = response.headers.get("content-type");
      let result;
      if (contentType && contentType.indexOf("application/json") !== -1) {
          result = await response.json();
      } else {
          const text = await response.text();
          result = { error: text || "An unexpected error occurred" };
      }

      if (response.ok) {
        toast.success(`Broadcast Successful! Sent to ${result.sent} devices.`);
        setStatus({ sent: result.sent, failed: result.failed });
        setTitle("");
        setBody("");
        setUrl("/");
      } else {
        const errorMsg = result.error || result.message || `Broadcast failed with status ${response.status}: ${response.statusText}`;
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      console.error('[Broadcast] Error:', err);
      toast.error(err.message || "Something went wrong during broadcast.");
    } finally {
      setLoading(false);
      clearTimeout(safetyTimeout);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest w-fit">
          <Zap className="w-3 h-3 fill-current" />
          Global Communication
        </div>
        <h1 className="text-3xl font-black tracking-tighter sm:text-4xl md:text-5xl">
          Push Broadcast Center
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
          Instantly reach every member of the Ambassadors Assembly directly on their mobile device or workstation.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Form Section */}
        <Card className="lg:col-span-7 border-none shadow-xl bg-card/50 backdrop-blur-xl rounded-3xl overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Compose Message
            </CardTitle>
            <CardDescription className="text-xs uppercase tracking-widest font-bold">
              Draft your global announcement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-[10px] font-bold uppercase tracking-widest opacity-60">Notification Title</Label>
              <Input 
                id="title"
                placeholder="e.g., Sunday Service Starting Soon!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-2xl h-12 bg-background/50 border-primary/10 focus:border-primary/30 transition-all text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body" className="text-[10px] font-bold uppercase tracking-widest opacity-60">Message Body</Label>
              <Textarea 
                id="body"
                placeholder="Join us in 15 minutes for a powerful word that will transform your life..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="rounded-2xl min-h-[120px] bg-background/50 border-primary/10 focus:border-primary/30 transition-all text-base resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url" className="text-[10px] font-bold uppercase tracking-widest opacity-60">Action URL (Optional)</Label>
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="url"
                  placeholder="/"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="rounded-2xl h-12 bg-background/50 border-primary/10 focus:border-primary/30 transition-all text-base pl-12"
                />
              </div>
              <p className="text-[10px] text-muted-foreground font-medium pl-1">Where should they land when they tap the notification?</p>
            </div>
          </CardContent>
          <CardFooter className="pt-2 pb-8">
            <Button 
              onClick={handleBroadcast}
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest shadow-lg shadow-primary/20 group relative overflow-hidden"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Broadcasting Grace...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Launch Global Broadcast
                </div>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Info & Preview Section */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Preview */}
          <Card className="border-none shadow-xl bg-slate-900 text-white rounded-[2.5rem] p-6 relative overflow-hidden h-[240px] flex flex-col justify-center border-4 border-slate-800">
             <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-6 bg-black rounded-full mb-8" />
             
             <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex gap-3 mt-4">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Ambassadors</p>
                    <p className="text-[8px] text-white/40">NOW</p>
                  </div>
                  <p className="text-sm font-bold leading-none">{title || "Your Title Here"}</p>
                  <p className="text-xs text-white/60 line-clamp-2">{body || "Your message will appear here on every member's lock screen..."}</p>
                </div>
             </div>

             <div className="mt-8 text-center">
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em]">Device Preview</p>
             </div>
          </Card>

          {/* Guidelines */}
          <Card className="border-none shadow-md bg-card/30 rounded-3xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                Ambassador Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <p className="text-xs text-muted-foreground font-medium">Keep titles short and punchy for maximum impact.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <p className="text-xs text-muted-foreground font-medium">Use urgent but encouraging language to boost engagement.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <p className="text-xs text-muted-foreground font-medium">Broadcasts are sent instantly to all subscribed devices.</p>
              </div>
            </CardContent>
          </Card>

          {/* Result Status */}
          <AnimatePresence>
            {status && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-bold text-sm">Last Broadcast Stats</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-2xl font-black">{status.sent}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Delivered</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black">{status.failed}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Expired</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
