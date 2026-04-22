import * as React from "react";
import { cn } from "@/src/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  MessageSquare, 
  BookOpen, 
  Heart, 
  Settings, 
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  Server,
  Video,
  Image as ImageIcon,
  FileText,
  UserCircle,
  Command as CommandIcon,
  Plus,
  Zap,
  Activity,
  History,
  CheckCircle2,
  Building2,
  Sparkles,
  ShoppingBag,
  ClipboardList,
  Library,
  Target,
  PartyPopper,
  ClipboardCheck,
  Tv,
  Inbox,
  PenLine,
  Sun
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "motion/react";
import { Command } from "cmdk";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/contexts/AuthContext";

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
  collapsed?: boolean;
}

const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative",
      active 
        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    )}
  >
    <Icon className={cn("w-5 h-5 shrink-0", active ? "text-primary-foreground" : "group-hover:scale-110 transition-transform")} />
    {!collapsed && <span className="text-sm font-medium">{label}</span>}
    {active && !collapsed && <motion.div layoutId="active-pill" className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />}
    {active && !collapsed && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
  </button>
);

export default function Layout({ children, onTabChange, activeTab }: { children: React.ReactNode, onTabChange: (tab: string) => void, activeTab: string }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { user, role } = useAuth();
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Simulate page loading animation when tab changes
  React.useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const menuItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", category: "Main" },
    { id: "members", icon: Users, label: "Members", category: "Community" },
    { id: "ministries", icon: ShieldCheck, label: "Ministries", category: "Community" },
    { id: "departments", icon: Building2, label: "Departments", category: "Community" },
    { id: "volunteers", icon: Heart, label: "Volunteers", category: "Community" },
    { id: "master-rota", icon: ClipboardList, label: "Master Rota", category: "Community" },
    { id: "events", icon: Calendar, label: "Events", category: "Engagement" },
    { id: "event-registrations", icon: ClipboardCheck, label: "Registrations", category: "Engagement" },
    { id: "attendance", icon: CheckCircle2, label: "Attendance", category: "Engagement" },
    { id: "live-stream", icon: Tv, label: "Live Stream", category: "Engagement" },
    { id: "contact-inbox", icon: Inbox, label: "Contact Inbox", category: "Engagement" },
    { id: "prayer-wall", icon: MessageSquare, label: "Prayer Wall", category: "Engagement" },
    { id: "milestones", icon: PartyPopper, label: "Milestones", category: "Engagement" },
    { id: "sermons", icon: BookOpen, label: "Sermons", category: "Resources" },
    { id: "blog-posts", icon: PenLine, label: "Blog Posts", category: "Resources" },
    { id: "devotionals", icon: Sun, label: "Devotionals", category: "Resources" },
    { id: "media", icon: ImageIcon, label: "Media Gallery", category: "Resources" },
    { id: "resources", icon: Library, label: "Resource Center", category: "Resources" },
    { id: "ai-lab", icon: Sparkles, label: "AI Content Lab", category: "Resources" },
    { id: "donations", icon: Heart, label: "Giving", category: "Finance" },
    { id: "giving-goals", icon: Target, label: "Giving Goals", category: "Finance" },
    { id: "tasks", icon: ClipboardList, label: "Tasks", category: "Engagement" },
    ...(role === 'admin' || role === 'pastor' || role === 'super_admin' ? [
      { id: "admin-settings", icon: Settings, label: "Settings", category: "System" },
      { id: "admin-roles", icon: ShieldCheck, label: "Roles", category: "System" },
      { id: "admin-system", icon: Server, label: "System Status", category: "System" },
      { id: "admin-audit", icon: History, label: "Audit Logs", category: "System" },
      { id: "reports", icon: FileText, label: "Reports", category: "System" },
    ] : []),
  ];

  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* Loading Bar */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ scaleX: 0, opacity: 1 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "circOut" }}
            className="fixed top-0 left-0 right-0 h-1 bg-primary z-[100] origin-left"
          />
        )}
      </AnimatePresence>

      {/* Command Palette */}
      <AnimatePresence>
        {commandOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCommandOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="relative w-full max-w-2xl bg-card border rounded-2xl shadow-2xl overflow-hidden"
            >
              <Command className="flex flex-col h-full">
                <div className="flex items-center border-b px-4 py-3 gap-3">
                  <Search className="w-5 h-5 text-muted-foreground" />
                  <Command.Input 
                    placeholder="Search members, events, sermons..." 
                    className="flex-1 bg-transparent border-none outline-none text-lg"
                  />
                  <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                    <span className="text-xs">ESC</span>
                  </kbd>
                </div>
                <Command.List className="max-h-[400px] overflow-y-auto p-2">
                  <Command.Empty className="p-8 text-center text-muted-foreground">No results found.</Command.Empty>
                  
                  <Command.Group heading="Navigation" className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {menuItems.map(item => (
                      <Command.Item 
                        key={item.id}
                        onSelect={() => {
                          onTabChange(item.id);
                          setCommandOpen(false);
                        }}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="text-sm text-foreground">{item.label}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>

                  <Command.Group heading="Quick Actions" className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mt-4">
                    <Command.Item className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent cursor-pointer">
                      <Plus className="w-4 h-4" />
                      <span className="text-sm text-foreground">Add New Member</span>
                    </Command.Item>
                    <Command.Item className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent cursor-pointer">
                      <Zap className="w-4 h-4" />
                      <span className="text-sm text-foreground">Post Announcement</span>
                    </Command.Item>
                  </Command.Group>
                </Command.List>
              </Command>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 280 }}
        className={cn(
          "hidden md:flex flex-col border-r bg-card relative z-20 transition-all duration-300",
          "shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
        )}
      >
        <div className="p-6 flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-xl shadow-primary/20 shrink-0">
            <ShieldCheck className="w-6 h-6 text-primary-foreground" />
          </div>
          {!collapsed && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
              <span className="font-bold text-lg leading-tight tracking-tight">Ambassadors</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-semibold">Assembly</span>
            </motion.div>
          )}
        </div>

        <div className="flex-1 px-4 overflow-y-auto scrollbar-hide">
          <div className="space-y-6 py-4">
            {categories.map(category => (
              <div key={category} className="space-y-1">
                {!collapsed && (
                  <h3 className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                    {category}
                  </h3>
                )}
                {menuItems.filter(item => item.category === category).map((item) => (
                  <SidebarItem
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    active={activeTab === item.id}
                    collapsed={collapsed}
                    onClick={() => onTabChange(item.id)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t bg-muted/20">
          <div className={cn("flex items-center gap-3 mb-4", collapsed ? "justify-center" : "px-2")}>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {!collapsed && <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">System Online</span>}
          </div>
          <SidebarItem 
            icon={collapsed ? Menu : X} 
            label={collapsed ? "Expand" : "Collapse Sidebar"} 
            collapsed={collapsed}
            onClick={() => setCollapsed(!collapsed)}
          />
        </div>
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 md:hidden"
            />
              <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-80 bg-card z-50 md:hidden shadow-2xl border-r flex flex-col h-full"
            >
              <div className="p-6 flex items-center justify-between border-b shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                    <ShieldCheck className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-lg leading-tight">Ambassadors</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Assembly</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="rounded-full">
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex-1 px-4 overflow-y-auto scrollbar-hide">
                <div className="space-y-6 py-6">
                  {categories.map(category => (
                    <div key={category} className="space-y-1">
                      <h3 className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                        {category}
                      </h3>
                      {menuItems.filter(item => item.category === category).map((item) => (
                        <SidebarItem
                          key={item.id}
                          icon={item.icon}
                          label={item.label}
                          active={activeTab === item.id}
                          onClick={() => {
                            onTabChange(item.id);
                            setMobileOpen(false);
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-20 border-b bg-background/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden rounded-full" onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            
            <button 
              onClick={() => setCommandOpen(true)}
              className="hidden sm:flex items-center bg-muted/50 hover:bg-muted rounded-2xl px-4 py-2 gap-3 w-64 md:w-96 border transition-all group"
            >
              <Search className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm text-muted-foreground flex-1 text-left">Search anything...</span>
              <kbd className="inline-flex h-5 items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden lg:flex items-center gap-4 mr-4">
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-primary uppercase tracking-tighter">System Healthy</span>
                </div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Ambassadors Assembly v2.4</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                <Activity className="w-5 h-5 text-primary" />
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger className="relative inline-flex items-center justify-center h-10 w-10 rounded-full hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 p-0" align="end">
                <div className="p-4 border-b flex items-center justify-between">
                  <h4 className="font-bold text-sm">Notifications</h4>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase tracking-wider">Mark all read</Button>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="p-4 border-b hover:bg-muted/50 transition-colors cursor-pointer flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium">New Prayer Request</p>
                        <p className="text-[10px] text-muted-foreground line-clamp-2">Sister Mary just posted a new prayer request for her family.</p>
                        <p className="text-[9px] text-primary font-bold">2 MINS AGO</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t text-center">
                  <Button variant="ghost" className="w-full text-xs h-8">View all notifications</Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger className="relative h-12 w-12 rounded-2xl p-0 hover:bg-muted transition-all overflow-hidden border-2 border-transparent hover:border-primary/20 outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="h-full w-full rounded-none">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="User" />
                  <AvatarFallback className="rounded-none">UA</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 p-2" align="end">
                <DropdownMenuLabel className="font-normal p-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold leading-none">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Ambassador'}</p>
                    <p className="text-[10px] leading-none text-muted-foreground uppercase tracking-widest mt-1">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="grid grid-cols-2 gap-1 p-1">
                  <DropdownMenuItem onClick={() => onTabChange("profile")} className="flex flex-col items-center justify-center h-16 rounded-xl gap-1">
                    <UserCircle className="h-5 w-5" />
                    <span className="text-[10px] font-bold uppercase">Profile</span>
                  </DropdownMenuItem>
                  {(role === 'admin' || role === 'pastor' || role === 'super_admin') && (
                    <DropdownMenuItem onClick={() => onTabChange("admin")} className="flex flex-col items-center justify-center h-16 rounded-xl gap-1">
                      <Settings className="h-5 w-5" />
                      <span className="text-[10px] font-bold uppercase">Settings</span>
                    </DropdownMenuItem>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-destructive-foreground rounded-xl" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span className="font-bold uppercase text-[10px]">Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <ScrollArea className="flex-1 min-h-0 bg-muted/30">
          <div className="p-4 md:p-8 max-w-7xl mx-auto w-full min-h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}

