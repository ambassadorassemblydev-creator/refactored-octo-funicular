/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import Layout from "./components/layout/Layout";
import Dashboard from "./components/Dashboard";
import MembersList from "./components/MembersList";
import ProfileSettings from "./components/ProfileSettings";
import Sermons from "./components/Sermons";
import AdminControls from "./components/AdminControls";
import Ministries from "./components/Ministries";
import Departments from "./components/Departments";
import Finance from "./components/Finance";
import PrayerRequests from "./components/PrayerRequests";
import Events from "./components/Events";
import EventRegistrations from "./components/EventRegistrations";
import MediaGallery from "./components/MediaGallery";
import Attendance from "./components/Attendance";
import AILab from "./components/AILab";
import Tasks from "./components/Tasks";
import PrayerWall from "./components/PrayerWall";
import Resources from "./components/Resources";
import GivingGoals from "./components/GivingGoals";
import Milestones from "./components/Milestones";
import Reports from "./components/Reports";
import Volunteers from "./components/Volunteers";
import MasterRota from "./components/MasterRota";
import Login from "./components/Login";
import LiveStreamManager from "./components/LiveStreamManager";
import ContactInbox from "./components/ContactInbox";
import BlogPosts from "./components/BlogPosts";
import DevoManager from "./components/DevoManager";
import NewsletterManager from "./components/NewsletterManager";
import ApprovalsCenter from "./components/ApprovalsCenter";
import Broadcast from "./components/Broadcast";
import Notifications from "./components/Notifications";
import { Toaster } from "sonner";

import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Loader2, Shield } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "./lib/supabase";
import { Button } from "@/components/ui/button";

function AppContent() {
  const { session, loading } = useAuth();
  const [activeTab, setActiveTab] = React.useState(() => {
    // Initialize from URL path
    const path = window.location.pathname.substring(1) || "dashboard";
    return path;
  });

  // Sync state with URL
  React.useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.substring(1) || "dashboard";
      setActiveTab(path);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Sync URL with state
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const newPath = tab === "dashboard" ? "/" : `/${tab}`;
    if (window.location.pathname !== newPath) {
      window.history.pushState({ tab }, "", newPath);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#010101] overflow-hidden p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative flex flex-col items-center w-full max-w-md"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center mb-6 sm:mb-8 relative">
            <div className="absolute inset-0 bg-primary/20 rounded-[2rem] sm:rounded-[2.5rem] blur-2xl animate-pulse" />
            <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-primary relative z-10" />
            <motion.div 
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-2 border-primary/20 rounded-[2rem] sm:rounded-[2.5rem] border-t-primary"
            />
          </div>
          
          <div className="flex flex-col items-center gap-2 w-full">
            <h1 className="text-lg sm:text-4xl md:text-5xl font-black tracking-tighter text-white flex flex-wrap justify-center items-center gap-1 px-2 text-center leading-tight">
              <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap justify-center">
                { "AMBASSADORS".split("").map((char, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
                    className="inline-block"
                  >
                    {char}
                  </motion.span>
                ))}
                <motion.span 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2, duration: 0.5 }}
                  className="text-primary ml-1 sm:ml-2"
                >
                  ADMIN
                </motion.span>
              </div>
            </h1>

            
            <div className="flex items-center gap-4 w-full max-w-[200px] sm:max-w-[256px] h-1 bg-white/5 rounded-full overflow-hidden mt-6 sm:mt-8 relative">
              <motion.div 
                initial={{ width: 0, left: "-100%" }}
                animate={{ width: "100%", left: "100%" }}
                transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
                className="absolute h-full bg-primary shadow-[0_0_20px_rgba(37,211,102,0.8)]"
              />
            </div>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 1.5, duration: 1 }}
              className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] sm:tracking-[0.4em] text-white mt-6 sm:mt-8 text-center"
            >
              Initializing Secure Infrastructure
            </motion.p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!session) {
    return (
      <TooltipProvider>
        <Login onLogin={() => {}} />
        <Toaster 
          position="top-right" 
          richColors 
          closeButton 
          expand={true}
          theme="light"
          toastOptions={{
            className: "rounded-2xl border-none shadow-2xl backdrop-blur-xl bg-card/80",
            style: {
              fontFamily: 'inherit'
            }
          }}
        />
      </TooltipProvider>
    );
  }

  // ==========================================
  // RBAC GATEKEEPER (Simplified)
  // ==========================================
  const { role, isRoleResolving } = useAuth();
  
  // Only show the loader if we are resolving a role and DON'T already have one.
  // This prevents background refreshes from flickering the screen.
  if (role === null || (isRoleResolving && role === null)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#010101] p-6 text-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-white/50 font-bold uppercase tracking-widest text-[10px]">Loading Dashboard...</p>
      </div>
    );
  }

  const isAuthorized = ['super_admin', 'admin', 'pastor', 'leader'].includes(role);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#010101] p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-8 ring-1 ring-red-500/20">
          <Shield className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-black tracking-tighter text-white mb-2">Access Restricted</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          This workstation is reserved for authorized Ambassadors Assembly personnel. 
          Your current account does not have administrative privileges.
        </p>
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            className="rounded-xl border-white/10"
            onClick={() => supabase.auth.signOut()}
          >
            Sign Out
          </Button>
          <Button 
            className="rounded-xl"
            onClick={() => window.location.href = "https://theambassadorsassembly.org"}
          >
            Return to Main Site
          </Button>
        </div>
      </div>
    );
  }


  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard onTabChange={handleTabChange} />;
      case "members":
        return <MembersList onTabChange={handleTabChange} />;
      case "sermons":
        return <Sermons onTabChange={handleTabChange} />;
      case "profile":
        return <ProfileSettings />;
      case "admin":
        return <AdminControls />;
      case "admin-settings":
        return <AdminControls defaultTab="general" />;
      case "admin-roles":
        return <AdminControls defaultTab="roles" />;
      case "admin-system":
        return <AdminControls defaultTab="system" />;
      case "admin-audit":
        return <AdminControls defaultTab="audit" />;
      case "ministries":
        return <Ministries onTabChange={handleTabChange} />;
      case "departments":
        return <Departments onTabChange={handleTabChange} />;
      case "donations":
        return <Finance />;
      case "prayers":
        return <PrayerRequests />;
      case "events":
        return <Events />;
      case "event-registrations":
        return <EventRegistrations />;
      case "media":
        return <MediaGallery />;
      case "attendance":
        return <Attendance />;
      case "ai-lab":
        return <AILab />;
      case "tasks":
        return <Tasks />;
      case "prayer-wall":
        return <PrayerWall />;
      case "resources":
        return <Resources />;
      case "giving-goals":
        return <GivingGoals />;
      case "milestones":
        return <Milestones />;
      case "reports":
        return <Reports />;
      case "volunteers":
        return <Volunteers onTabChange={handleTabChange} />;
      case "master-rota":
        return <MasterRota />;
      case "live-stream":
        return <LiveStreamManager />;
      case "contact-inbox":
        return <ContactInbox />;
      case "blog-posts":
        return <BlogPosts />;
      case "devotionals":
        return <DevoManager />;
      case "newsletter":
        return <NewsletterManager />;
      case "broadcast":
        return <Broadcast />;
      case "approvals":
        return <ApprovalsCenter />;
      case "notifications":
        return <Notifications />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <TooltipProvider>
      <Layout onTabChange={setActiveTab} activeTab={activeTab}>
        {renderContent()}
      </Layout>
      <Toaster 
        position="top-right" 
        richColors 
        closeButton 
        expand={true}
        theme="light"
        toastOptions={{
          className: "rounded-2xl border-none shadow-2xl backdrop-blur-xl bg-card/80",
          style: {
            fontFamily: 'inherit'
          }
        }}
      />
    </TooltipProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}









