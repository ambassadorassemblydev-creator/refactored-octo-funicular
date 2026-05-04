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

  const fetchProfileAndRole = async (userId: string, authUser: User) => {
    try {
      console.log('[Auth] Fetching profile for user:', userId);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[Auth] Profile fetch error:', error.message);
        return;
      }

      if (data) {
        console.log('[Auth] Profile found, role_claim:', data.role_claim);

        setProfile({
          ...data,
          avatar_url: data.avatar_url || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
          full_name: authUser.user_metadata?.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim()
        });

        const userRole = (data.role_claim || 'member').toLowerCase().trim().replace(/\s+/g, '_') as Role;
        console.log('[Auth] Role resolved:', userRole);
        setRole(userRole);
      } else {
        console.log('[Auth] No profile row found. Defaulting to member.');
        setProfile({
          id: authUser.id,
          email: authUser.email,
          avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
          full_name: authUser.user_metadata?.full_name
        });
        setRole('member');
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

  const hasPermission = (_permission: string) => {
    if (role === 'super_admin') return true;
    if (role === 'admin') return true;
    return false;
  };

  React.useEffect(() => {
    let mounted = true;

    // Step 1: Check for an existing session on mount
    const initSession = async () => {
      const { data: { session: existingSession } } = await supabase.auth.getSession();

      if (!mounted) return;

      if (existingSession?.user) {
        console.log('[Auth] Existing session found for:', existingSession.user.email);
        setSession(existingSession);
        setUser(existingSession.user);
        setIsRoleResolving(true);
        await fetchProfileAndRole(existingSession.user.id, existingSession.user);
        if (mounted) {
          setIsRoleResolving(false);
          setLoading(false);
        }
      } else {
        console.log('[Auth] No existing session. Showing login.');
        setLoading(false);
      }
    };

    initSession();

    // Step 2: Listen for auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('[Auth] State Change:', event);

      if (!mounted) return;

      if (event === 'SIGNED_OUT' || !newSession?.user) {
        setSession(null);
        setUser(null);
        setRole(null);
        setProfile(null);
        setLoading(false);
        setIsRoleResolving(false);
        return;
      }

      // For SIGNED_IN (new login) or TOKEN_REFRESHED
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const newUser = newSession.user;

        // Skip if this is just a token refresh for the same user we already have
        if (event === 'TOKEN_REFRESHED' && user?.id === newUser.id && role !== null) {
          console.log('[Auth] Token refreshed silently. No action needed.');
          setSession(newSession);
          return;
        }

        setSession(newSession);
        setUser(newUser);

        // Only fetch role if we don't already have one for this user
        if (role === null || user?.id !== newUser.id) {
          setIsRoleResolving(true);
          await fetchProfileAndRole(newUser.id, newUser);
          if (mounted) {
            setIsRoleResolving(false);
            setLoading(false);
          }
        }
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
