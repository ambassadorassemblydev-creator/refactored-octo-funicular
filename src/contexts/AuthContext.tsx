import * as React from "react";
import { supabase } from "@/src/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

type Role = "super_admin" | "admin" | "pastor" | "leader" | "member" | "guest";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: Role | null;
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
  const [profile, setProfile] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isRoleResolving, setIsRoleResolving] = React.useState(false);

  // Refs to track state for the onAuthStateChange listener closure
  const userRef = React.useRef<User | null>(null);
  const roleRef = React.useRef<Role | null>(null);
  const loadingRef = React.useRef<boolean>(true);

  // Sync refs with state
  React.useEffect(() => { userRef.current = user; }, [user]);
  React.useEffect(() => { roleRef.current = role; }, [role]);
  React.useEffect(() => { loadingRef.current = loading; }, [loading]);

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
        return;
      }

      if (data) {
        // Set profile with avatar fallback
        setProfile({
          ...data,
          avatar_url: data.avatar_url || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
          full_name: authUser.user_metadata?.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim()
        });

        // Use role_claim as the single source of truth as requested
        const userRole = (data.role_claim || 'member').toLowerCase().trim().replace(/\s+/g, '_') as Role;
        console.log(`[Auth] Role resolved: ${userRole}`);
        
        setRole(userRole);
      } else {
        // Brand new user with no profile row yet
        setProfile({
          id: authUser.id,
          email: authUser.email,
          avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
          full_name: authUser.user_metadata?.full_name
        });
        setRole('member');
        console.log('[Auth] No profile found, defaulting to member.');
      }
    } catch (err) {
      console.error('[Auth] Unexpected error during profile fetch:', err);
      setRole('member');
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (authEvent, newSession) => {
      console.log(`[Auth] State Change: ${authEvent}`);
      if (!mounted) return;

      if (authEvent === 'TOKEN_REFRESHED') return;

      setSession(newSession);
      const newUser = newSession?.user ?? null;
      
      // Optimization: Only re-resolve role if the user ID actually changed
      // This prevents "reloading" flickers during background token refreshes
      const userIdChanged = newUser?.id !== userRef.current?.id;
      const needsRoleResolution = userIdChanged || !roleRef.current;

      setUser(newUser);

      const changeTimeoutId = setTimeout(() => {
        if (mounted) {
          setIsRoleResolving(false);
          if (!roleRef.current && newSession?.user) {
            console.warn('[Auth] Auth change resolve safety timeout reached.');
            const metaRole = newSession.user.user_metadata?.role || newSession.user.user_metadata?.role_claim;
            if (metaRole) setRole(metaRole as Role);
            else setRole('member');
          }
        }
      }, 8000);

      try {
        if (newUser) {
          if (needsRoleResolution) {
            setIsRoleResolving(true);
            await fetchProfileAndRole(newUser.id, newUser);
          }
        } else {
          setRole(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('[Auth] Auth change error:', err);
      } finally {
        if (mounted) {
          setIsRoleResolving(false);
          // Only stop loading if we haven't already finished initialization
          if (loadingRef.current) setLoading(false);
        }
        clearTimeout(changeTimeoutId);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, role, profile, loading, isRoleResolving, hasPermission, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);
