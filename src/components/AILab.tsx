import * as React from "react";
import { 
  Sparkles, 
  Send, 
  Copy, 
  RefreshCw, 
  BookOpen, 
  Share2, 
  Wand2,
  MessageSquare,
  FileText,
  PenTool,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI } from "@google/genai";
import { toast } from "sonner";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface AIHistoryItem {
  type: string;
  prompt: string;
  result: string;
  date: Date;
}

export default function AILab() {
  const [prompt, setPrompt] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState("");
  const [history, setHistory] = React.useState<AIHistoryItem[]>([]);
  const [activeTab, setActiveTab] = React.useState("sermon");

  const generateContent = async (type: string) => {
    if (!prompt && type === "custom") {
      toast.error("Please enter a prompt");
      return;
    }

    setLoading(true);
    try {
      let systemInstruction = "";
      let userPrompt = prompt;

      switch (type) {
        case "sermon":
          systemInstruction = "You are an expert theologian and speaker for Ambassadors Assembly. Generate a detailed sermon outline including a title, key scriptures, 3 main points with illustrations, and a closing prayer.";
          userPrompt = prompt || "Generate a sermon about faith and perseverance.";
          break;
        case "social":
          systemInstruction = "You are a social media manager for Ambassadors Assembly. Generate 3 engaging Instagram/Facebook posts with emojis and hashtags based on the provided topic.";
          userPrompt = prompt || "Upcoming Sunday service invitation.";
          break;
        case "newsletter":
          systemInstruction = "You are a communications director for Ambassadors Assembly. Write a warm, encouraging weekly newsletter intro and 3 key announcements.";
          userPrompt = prompt || "Weekly update for the congregation.";
          break;
        default:
          systemInstruction = "You are a helpful assistant for Ambassadors Assembly church administration.";
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userPrompt,
        config: {
          systemInstruction,
        },
      });

      const text = response.text || "No response generated.";
      setResult(text);
      setHistory(prev => [{ type, prompt: userPrompt, result: text, date: new Date() }, ...prev]);
      toast.success("Content generated successfully!");
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      toast.error("Failed to generate content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter">AI Content Lab</h1>
        </div>
        <p className="text-muted-foreground font-medium">Generate high-quality spiritual content, social posts, and newsletters powered by Gemini AI.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-xl rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Content Studio</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Select a template or use custom prompt</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant={activeTab === "sermon" ? "default" : "outline"} 
                  className="h-20 rounded-2xl flex-col gap-2 text-[10px] font-bold uppercase tracking-widest border-none bg-muted/30"
                  onClick={() => setActiveTab("sermon")}
                >
                  <BookOpen className="w-5 h-5" />
                  Sermon
                </Button>
                <Button 
                  variant={activeTab === "social" ? "default" : "outline"} 
                  className="h-20 rounded-2xl flex-col gap-2 text-[10px] font-bold uppercase tracking-widest border-none bg-muted/30"
                  onClick={() => setActiveTab("social")}
                >
                  <Share2 className="w-5 h-5" />
                  Social
                </Button>
                <Button 
                  variant={activeTab === "newsletter" ? "default" : "outline"} 
                  className="h-20 rounded-2xl flex-col gap-2 text-[10px] font-bold uppercase tracking-widest border-none bg-muted/30"
                  onClick={() => setActiveTab("newsletter")}
                >
                  <FileText className="w-5 h-5" />
                  News
                </Button>
                <Button 
                  variant={activeTab === "custom" ? "default" : "outline"} 
                  className="h-20 rounded-2xl flex-col gap-2 text-[10px] font-bold uppercase tracking-widest border-none bg-muted/30"
                  onClick={() => setActiveTab("custom")}
                >
                  <Wand2 className="w-5 h-5" />
                  Custom
                </Button>
              </div>

              <div className="space-y-2 pt-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Prompt / Topic</label>
                <Textarea 
                  placeholder="Enter a theme, scripture, or topic..." 
                  className="min-h-[120px] rounded-2xl bg-background/50 border-none resize-none"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              <Button 
                className="w-full h-12 rounded-2xl font-bold uppercase tracking-widest text-[10px] gap-2"
                onClick={() => generateContent(activeTab)}
                disabled={loading}
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Generate Content
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-xl rounded-3xl overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold">History</CardTitle>
                <History className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-3">
                  {history.length === 0 ? (
                    <p className="text-[10px] text-center py-8 text-muted-foreground font-bold uppercase tracking-widest">No history yet</p>
                  ) : (
                    history.map((item, i) => (
                      <div key={i} className="p-3 rounded-xl bg-muted/30 border border-border/50 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setResult(item.result)}>
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className="text-[8px] font-bold uppercase">{item.type}</Badge>
                          <span className="text-[8px] text-muted-foreground">{item.date.toLocaleTimeString()}</span>
                        </div>
                        <p className="text-[10px] font-medium line-clamp-1">{item.prompt}</p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-xl rounded-3xl overflow-hidden h-full flex flex-col">
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold">Output Terminal</CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Review and refine generated content</CardDescription>
                </div>
                {result && (
                  <Button variant="outline" size="sm" className="rounded-xl gap-2 border-none bg-muted/50 text-[10px] font-bold uppercase tracking-widest" onClick={() => copyToClipboard(result)}>
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-[600px]">
                <div className="p-8">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
                      <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Gemini is thinking...</p>
                    </div>
                  ) : result ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="prose prose-sm dark:prose-invert max-w-none"
                    >
                      <div className="whitespace-pre-wrap font-medium leading-relaxed text-sm">
                        {result}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground space-y-4">
                      <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center">
                        <PenTool className="w-8 h-8 opacity-20" />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest">Your generated content will appear here</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
