import * as React from "react";
import { 
  FileText, 
  Download, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  PieChart, 
  BarChart, 
  TrendingUp, 
  Users, 
  DollarSign,
  MoreVertical,
  CheckCircle2,
  Clock,
  FileDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { supabase } from "@/src/lib/supabase";
import type { Database } from "@/src/types/database.types";
import { Loader2 } from "lucide-react";
import { cn } from "@/src/lib/utils";

type Report = Database["public"]["Tables"]["reports"]["Row"];


export default function Reports() {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [reports, setReports] = React.useState<Report[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerate = () => {
    setIsGenerating(true);
    toast.info("Generating report... this may take a moment.");
    setTimeout(() => {
      setIsGenerating(false);
      toast.success("Report generated successfully!");
    }, 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <FileText className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter">Report Builder</h1>
          </div>
          <p className="text-muted-foreground font-medium">Generate comprehensive insights, financial audits, and ministry impact reports with custom branding.</p>
        </div>
        <Button 
          className="rounded-2xl h-12 px-6 font-bold uppercase tracking-widest text-[10px] gap-2 shadow-xl shadow-primary/20"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? <Clock className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Generate New Report
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-xl rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Report Configuration</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Define your report parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Report Type</label>
                <Select defaultValue="financial">
                  <SelectTrigger className="h-11 rounded-xl bg-background/50 border-none">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="financial">Financial Summary</SelectItem>
                    <SelectItem value="growth">Member Growth</SelectItem>
                    <SelectItem value="attendance">Attendance Trends</SelectItem>
                    <SelectItem value="audit">System Audit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Time Period</label>
                <Select defaultValue="last-30">
                  <SelectTrigger className="h-11 rounded-xl bg-background/50 border-none">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="last-7">Last 7 Days</SelectItem>
                    <SelectItem value="last-30">Last 30 Days</SelectItem>
                    <SelectItem value="last-90">Last 90 Days</SelectItem>
                    <SelectItem value="year">Year to Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Output Format</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="h-11 rounded-xl border-none bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">PDF Document</Button>
                  <Button variant="outline" className="h-11 rounded-xl border-none bg-muted/30 text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Excel Sheet</Button>
                </div>
              </div>

              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Include Branding</span>
                  <div className="w-10 h-5 bg-primary rounded-full relative p-1 cursor-pointer">
                    <div className="w-3 h-3 bg-white rounded-full absolute right-1" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Detailed Charts</span>
                  <div className="w-10 h-5 bg-primary rounded-full relative p-1 cursor-pointer">
                    <div className="w-3 h-3 bg-white rounded-full absolute right-1" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-xl rounded-3xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-lg font-black">98.4%</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Data Accuracy</p>
              </div>
            </div>
            <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">
              All reports are generated using real-time data from Ambassadors Assembly's secure cloud infrastructure.
            </p>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-xl rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-bold">Recent Reports</CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Download or share generated insights</CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search reports..." 
                    className="pl-10 h-10 rounded-xl bg-background/50 border-none w-full" 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {loading ? (
                  <div className="flex items-center justify-center p-12">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                ) : reports.filter(r => r.name.toLowerCase().includes(search.toLowerCase())).map((report) => (
                  <div key={report.id} className="p-6 flex items-center justify-between hover:bg-muted/20 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                        report.format === "PDF" ? "bg-red-500/10 text-red-600" : "bg-emerald-500/10 text-emerald-600"
                      )}>
                        <FileDown className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{report.name}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="outline" className="bg-muted/50 border-none text-[8px] font-bold uppercase tracking-widest">{report.type}</Badge>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{new Date(report.created_at || '').toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn(
                        "border-none text-[8px] font-bold uppercase px-2 py-0.5",
                        report.status === "Ready" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600 animate-pulse"
                      )}>
                        {report.status}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-xl rounded-3xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                <PieChart className="w-6 h-6" />
              </div>
              <div>
                <p className="text-lg font-black">12</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Scheduled Reports</p>
              </div>
            </Card>
            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-xl rounded-3xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                <BarChart className="w-6 h-6" />
              </div>
              <div>
                <p className="text-lg font-black">45</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Downloads</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

