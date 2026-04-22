import * as React from "react";
import { ShieldCheck, Mail, Lock, ArrowRight, Github, Chrome } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "motion/react";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [mode, setMode] = React.useState<'login' | 'signup'>('login');
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
    } else {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });

      if (error) {
        toast.error(error.message);
        setIsLoading(false);
      } else {
        toast.success("Account created! Please check your email to verify.");
        setMode('login');
        setIsLoading(false);
      }
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      toast.error(error.message);
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
              {mode === 'login' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="gap-2 h-11 rounded-xl bg-background/50 border-none shadow-sm hover:bg-background transition-all" onClick={() => handleOAuthLogin('google')}>
                      <Chrome className="w-4 h-4" />
                      Google
                    </Button>
                    <Button variant="outline" className="gap-2 h-11 rounded-xl bg-background/50 border-none shadow-sm hover:bg-background transition-all" onClick={() => handleOAuthLogin('github')}>
                      <Github className="w-4 h-4" />
                      GitHub
                    </Button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                      <span className="bg-card px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>
                </>
              )}
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
            <CardFooter>
              <p className="text-center text-xs text-muted-foreground w-full">
                {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{" "}
                <Button 
                  variant="link" 
                  className="px-0 font-bold text-primary"
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                >
                  {mode === 'login' ? 'Sign up' : 'Log in'}
                </Button>
              </p>
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
