import * as React from "react";
import { supabase } from "@/src/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

type Role = "super_admin" | "admin" | "pastor" | "leader" | "member" | "guest";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: Role | null;
  roles: Role[];
  profile: any | null;
  loading: boolean;
  isRoleResolving: boolean;
  hasPermission: (permission: string) => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  roles: [],
  profile: null,
  loading: true,
  isRoleResolving: false,
  hasPermission: () => false,
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = React.useState<Session | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [role, setRole] = React.useState<Role | null>(null);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [profile, setProfile] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isRoleResolving, setIsRoleResolving] = React.useState(false);

  const fetchProfileAndRole = async (userId: string, authUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[Auth] Profile fetch error:', error.message);
        setRole('member');
        setRoles(['member']);
        return;
      }

      if (data) {
        // Set profile with avatar fallback
        setProfile({
          ...data,
          avatar_url: data.avatar_url || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
          full_name: data.full_name || authUser.user_metadata?.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim()
        });

        // Use role_claim as the single source of truth as requested
        const userRole = (data.role_claim || 'member').toLowerCase().trim().replace(/\s+/g, '_') as Role;
        console.log(`[Auth] Role resolved: ${userRole}`);
        
        setRole(userRole);
        setRoles([userRole]); // Provide array for UI compatibility
      } else {
        // Brand new user with no profile row yet
        setProfile({
          id: authUser.id,
          email: authUser.email,
          avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
          full_name: authUser.user_metadata?.full_name
        });
        setRole('member');
        setRoles(['member']);
        console.log('[Auth] No profile found, defaulting to member.');
      }
    } catch (err) {
      console.error('[Auth] Unexpected error during profile fetch:', err);
      setRole('member');
      setRoles(['member']);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    await fetchProfileAndRole(user.id, user);
  };

  const hasPermission = (permission: string) => {
    if (role === 'super_admin') return true;
    if (role === 'admin') return true;
    return false;
  };

  React.useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      // 1. Get the current session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!mounted) return;

      if (currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);
        setIsRoleResolving(true);
        await fetchProfileAndRole(currentSession.user.id, currentSession.user);
        if (mounted) setIsRoleResolving(false);
      }

      if (mounted) setLoading(false);
    };

    initAuth();

    // 2. Listen for future auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log(`[Auth] State Change: ${event}`);
      if (!mounted) return;

      // Skip token refreshes — we already have the session
      if (event === 'TOKEN_REFRESHED') return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        setIsRoleResolving(true);
        await fetchProfileAndRole(newSession.user.id, newSession.user);
        if (mounted) setIsRoleResolving(false);
      } else {
        // Signed out
        setRole(null);
        setRoles([]);
        setProfile(null);
        setIsRoleResolving(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, role, roles, profile, loading, isRoleResolving, hasPermission, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);
