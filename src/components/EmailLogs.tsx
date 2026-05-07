import * as React from "react";
import { 
  Mail, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ExternalLink, 
  MoreVertical,
  Eye,
  Trash2,
  Send,
  History,
  User,
  Tag
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";
import { useAuth } from "@/src/contexts/AuthContext";

export default function EmailLogs() {
  const { loading: authLoading, role } = useAuth();
  const [logs, setLogs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [selectedLog, setSelectedLog] = React.useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('email_log')
        .select(`
          *,
          profiles:recipient_user_id (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .order('sent_at', { ascending: false })
        .limit(100);

      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter);
      }

      if (searchQuery) {
        query = query.or(`recipient_email.ilike.%${searchQuery}%,subject.ilike.%${searchQuery}%,recipient_name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      console.error("Error fetching email logs:", error);
      toast.error("Failed to load email logs");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!authLoading) {
      fetchLogs();
    }
  }, [authLoading, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-none rounded-lg gap-1"><CheckCircle2 className="w-3 h-3" /> Sent</Badge>;
      case 'failed':
        return <Badge className="bg-rose-500/10 text-rose-600 border-none rounded-lg gap-1"><AlertCircle className="w-3 h-3" /> Failed</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-600 border-none rounded-lg gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      default:
        return <Badge variant="outline" className="rounded-lg">{status}</Badge>;
    }
  };

  if (!authLoading && role !== 'admin' && role !== 'super_admin' && role !== 'pastor') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <Mail className="w-16 h-16 text-muted-foreground/20" />
        <h2 className="text-2xl font-black tracking-tight">Audit Access Restricted</h2>
        <p className="text-muted-foreground max-w-sm">Communication logs are strictly for administrative auditing.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Mail className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter">Email Infrastructure</h1>
          </div>
          <p className="text-muted-foreground font-medium text-sm">Transactional log audit and delivery monitoring system.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-xl h-11 w-11" 
            onClick={() => fetchLogs()}
            disabled={loading}
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
          <div className="flex bg-muted/30 p-1 rounded-xl gap-1">
            {['all', 'sent', 'failed'].map((s) => (
              <Button
                key={s}
                size="sm"
                variant={statusFilter === s ? "secondary" : "ghost"}
                className={cn(
                  "rounded-lg text-[10px] font-bold uppercase tracking-widest px-4",
                  statusFilter === s && "bg-card shadow-sm"
                )}
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by recipient, subject, or name..." 
            className="h-12 pl-11 rounded-2xl bg-card/50 border-none shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button type="submit" className="h-12 px-8 rounded-2xl font-bold uppercase tracking-widest text-[10px]">Filter</Button>
      </form>

      <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-xl rounded-[2rem] overflow-hidden">
        <CardHeader className="p-8 pb-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold">Delivery History</CardTitle>
              <CardDescription className="text-[10px] font-black uppercase tracking-widest">Real-time outbound communications</CardDescription>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
              <span>{logs.length} Total Logs</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-3">
            {loading ? (
              [1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 bg-muted/20 animate-pulse rounded-2xl" />)
            ) : logs.length === 0 ? (
              <div className="p-20 text-center space-y-4">
                <History className="w-12 h-12 text-muted-foreground/20 mx-auto" />
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No logs found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log, i) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between p-4 rounded-2xl bg-background/40 border border-white/5 group hover:bg-background/80 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner",
                        log.status === 'failed' ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                      )}>
                        <Mail className="w-6 h-6" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm leading-tight">{log.recipient_name || log.recipient_email.split('@')[0]}</p>
                          <Badge variant="outline" className="text-[7px] font-black uppercase border-primary/20 text-primary py-0 h-4">
                            {log.template_name?.replace(/_/g, ' ') || 'Transactional'}
                          </Badge>
                        </div>
                        <p className="text-[10px] font-medium text-muted-foreground max-w-md truncate">{log.subject}</p>
                        <div className="flex items-center gap-3 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                          <span className="flex items-center gap-1"><User className="w-2.5 h-2.5" /> {log.recipient_email}</span>
                          <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {new Date(log.sent_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="hidden md:block">
                        {getStatusBadge(log.status)}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            setSelectedLog(log);
                            setIsPreviewOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl">
                            <DropdownMenuItem className="rounded-xl gap-2 cursor-pointer">
                              <Send className="w-4 h-4" /> Resend Email
                            </DropdownMenuItem>
                            {log.resend_email_id && (
                              <DropdownMenuItem 
                                className="rounded-xl gap-2 cursor-pointer"
                                onClick={() => window.open(`https://resend.com/emails/${log.resend_email_id}`, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4" /> View in Resend
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="rounded-xl gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                              <Trash2 className="w-4 h-4" /> Delete Log
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Log Detail Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-card">
          <DialogHeader className="p-8 pb-0">
            <DialogTitle className="text-2xl font-black tracking-tight">Email Details</DialogTitle>
          </DialogHeader>
          
          <div className="p-8 pt-6 space-y-6">
            {selectedLog && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-muted/30 space-y-1">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Recipient</p>
                    <p className="text-sm font-bold">{selectedLog.recipient_name || 'N/A'}</p>
                    <p className="text-[10px] text-muted-foreground">{selectedLog.recipient_email}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-muted/30 space-y-1">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Status</p>
                    <div className="pt-1">{getStatusBadge(selectedLog.status)}</div>
                    <p className="text-[10px] text-muted-foreground">{new Date(selectedLog.sent_at).toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                      <Tag className="w-3 h-3" /> Metadata
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="rounded-lg text-[9px] font-bold uppercase py-1">
                        Template: {selectedLog.template_name || 'unknown'}
                      </Badge>
                      <Badge variant="secondary" className="rounded-lg text-[9px] font-bold uppercase py-1">
                        ID: {selectedLog.id.substring(0, 8)}...
                      </Badge>
                      {selectedLog.resend_email_id && (
                        <Badge variant="secondary" className="rounded-lg text-[9px] font-bold uppercase py-1">
                          Resend ID: {selectedLog.resend_email_id.substring(0, 8)}...
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Subject</p>
                    <p className="text-md font-black tracking-tight">{selectedLog.subject}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Body Preview</p>
                    <div className="p-4 rounded-2xl bg-background/50 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap border border-border/50">
                      {selectedLog.body_preview || 'No preview available'}
                    </div>
                  </div>

                  {selectedLog.error_message && (
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Error Details</p>
                      <div className="p-4 rounded-2xl bg-rose-500/5 text-[10px] font-mono text-rose-600 leading-relaxed border border-rose-500/10 overflow-x-auto">
                        {selectedLog.error_message}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
            
            <div className="flex gap-3 pt-4">
              <Button className="flex-1 rounded-xl font-bold uppercase tracking-widest text-[10px] h-11" onClick={() => setIsPreviewOpen(false)}>
                Close
              </Button>
              {selectedLog?.resend_email_id && (
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-xl font-bold uppercase tracking-widest text-[10px] h-11 gap-2"
                  onClick={() => window.open(`https://resend.com/emails/${selectedLog.resend_email_id}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" /> Resend.com
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
