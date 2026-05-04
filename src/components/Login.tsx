import * as React from "react";
import { ShieldCheck, Mail, Lock, ArrowRight, ExternalLink, Chrome } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "motion/react";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [mode] = React.useState<'login' | 'signup'>('login');
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        setIsLoading(false);
      } else {
        toast.success("Logged in successfully!");
        onLogin();
      }
    }

  };
  
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline'
        }
      }
    });
    if (error) {
      toast.error(error.message);
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://res.cloudinary.com/dxwhpacz7/image/upload/v1775200226/IMG-20260304-WA0059_telyum.jpg" 
          className="w-full h-full object-cover opacity-40 scale-105 animate-pulse-slow" 
          alt="Background" 
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/50 to-background/90 backdrop-blur-md" />
      </div>

      <div className="w-full max-w-[400px] space-y-8 relative z-10">
        <div className="flex flex-col items-center text-center space-y-2">
          <motion.div 
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            className="w-16 h-16 rounded-3xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/30 mb-4"
          >
            <ShieldCheck className="w-9 h-9 text-primary-foreground" />
          </motion.div>
          <h1 className="text-4xl font-black tracking-tighter">
            {mode === 'login' ? 'Welcome Back' : 'Join Us'}
          </h1>
          <p className="text-muted-foreground font-medium">
            {mode === 'login' 
              ? 'Enter your credentials to access Ambassadors Assembly' 
              : 'Create an account to join the Ambassadors Assembly community'}
          </p>
        </div>

        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
        >
          <Card className="border-none shadow-2xl bg-card/60 backdrop-blur-2xl ring-1 ring-white/10">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">{mode === 'login' ? 'Login' : 'Sign Up'}</CardTitle>
              <CardDescription>
                {mode === 'login' ? 'Choose your preferred login method' : 'Enter your details to create an account'}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">

              <div className="grid gap-4 mb-6">
                <Button 
                  variant="outline" 
                  className="w-full h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-foreground font-bold uppercase tracking-widest text-[10px] gap-3"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <Chrome className="w-4 h-4 text-primary" />
                  Continue with Google
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/5" />
                  </div>
                  <div className="relative flex justify-center text-[8px] uppercase tracking-[0.2em] font-bold">
                    <span className="bg-card/60 px-2 text-muted-foreground">Or continue with email</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input 
                        id="firstName" 
                        placeholder="John" 
                        className="h-11 bg-background/50 border-none shadow-sm focus-visible:ring-primary/20" 
                        required 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input 
                        id="lastName" 
                        placeholder="Doe" 
                        className="h-11 bg-background/50 border-none shadow-sm focus-visible:ring-primary/20" 
                        required 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="m@example.com" 
                      className="pl-10 h-11 bg-background/50 border-none shadow-sm focus-visible:ring-primary/20" 
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {mode === 'login' && <Button variant="link" className="px-0 font-bold text-[10px] uppercase tracking-widest h-auto text-primary">Forgot password?</Button>}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="password" 
                      type="password" 
                      className="pl-10 h-11 bg-background/50 border-none shadow-sm focus-visible:ring-primary/20" 
                      required 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
                <Button className="w-full h-12 gap-2 rounded-xl shadow-lg shadow-primary/20 font-bold uppercase tracking-widest text-[10px]" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      {mode === 'login' ? 'Sign In' : 'Create Account'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <div className="w-full h-px bg-white/5" />
              <div className="text-center space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">New Administrator?</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  To maintain system integrity, all administrative accounts must first be registered on our 
                  <span className="text-primary font-bold"> Main Church Platform</span>.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full h-11 rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 font-bold uppercase tracking-widest text-[10px] gap-2"
                  onClick={() => window.open('https://ambassadors-assembly.vercel.app/signup', '_blank')}
                >
                  Register on Main Site
                  <ExternalLink className="w-3 h-3" />
                </Button>
                <p className="text-[9px] text-muted-foreground/60 italic">
                  Once registered, return here to sign in with your credentials.
                </p>
              </div>
            </CardFooter>
          </Card>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground px-8">
          By clicking continue, you agree to our{" "}
          <Button variant="link" className="px-0 h-auto text-xs">Terms of Service</Button> and{" "}
          <Button variant="link" className="px-0 h-auto text-xs">Privacy Policy</Button>.
        </p>
      </div>
    </div>
  );
}
