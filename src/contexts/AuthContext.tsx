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

// Clean auth params from URL IMMEDIATELY on load to prevent
// Supabase from trying to re-exchange a used code on reload.
// Also clean bare "#" left behind by the implicit OAuth flow.
if (window.location.search.includes('code=') || window.location.hash) {
  window.history.replaceState({}, document.title, window.location.pathname);
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = React.useState<Session | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [role, setRole] = React.useState<Role | null>(null);
  const [profile, setProfile] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isRoleResolving, setIsRoleResolving] = React.useState(false);

  // Fetch profile with a hard 8-second timeout so the app NEVER hangs
  const fetchProfileAndRole = React.useCallback(async (userId: string, authUser: User) => {
    console.log('[Auth] Fetching profile for user:', userId);

    let didTimeout = false;
    const timeoutId = setTimeout(() => {
      didTimeout = true;
      console.warn('[Auth] Profile fetch timed out. Using fallback.');
      setRole('member');
      setProfile({
        id: authUser.id,
        email: authUser.email,
        avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
        full_name: authUser.user_metadata?.full_name,
      });
      setIsRoleResolving(false);
      setLoading(false);
    }, 8000);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (didTimeout) return; // Timeout already handled it
      clearTimeout(timeoutId);

      if (error) {
        console.error('[Auth] Profile fetch error:', error.message);
        setRole('member');
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
      if (didTimeout) return;
      clearTimeout(timeoutId);
      console.error('[Auth] Unexpected error during profile fetch:', err);
      setRole('member');
    }
  }, []);

  const refreshProfile = async () => {
    if (!user) return;
    await fetchProfileAndRole(user.id, user);
  };

  const hasPermission = (_permission: string) => {
    if (role === 'super_admin') return true;
    if (role === 'admin') return true;
    return false;
  };

  // EFFECT: React to user changes by fetching their profile
  const lastFetchedUserId = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!user) return;
    // Don't re-fetch if we already fetched for this user
    if (lastFetchedUserId.current === user.id && role !== null) return;

    lastFetchedUserId.current = user.id;
    setIsRoleResolving(true);

    fetchProfileAndRole(user.id, user).then(() => {
      setIsRoleResolving(false);
      setLoading(false);
    });
  }, [user?.id]);

  // EFFECT: Listen for auth state changes
  React.useEffect(() => {
    let mounted = true;

    // 1. Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      if (!mounted) return;
      if (existing?.user) {
        console.log('[Auth] Existing session found for:', existing.user.email);
        setSession(existing);
        setUser(existing.user);
      } else {
        console.log('[Auth] No existing session. Showing login.');
        setLoading(false);
      }
    });

    // 2. Listen for auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('[Auth] State Change:', event);
      if (!mounted) return;

      // Clean URL hash after any auth event to prevent re-processing
      if (window.location.hash) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (event === 'SIGNED_OUT' || !newSession?.user) {
        setSession(null);
        setUser(null);
        setRole(null);
        setProfile(null);
        setLoading(false);
        setIsRoleResolving(false);
        lastFetchedUserId.current = null;
        return;
      }

      // Only update user if it's actually a different user.
      // This prevents duplicate SIGNED_IN events from triggering extra fetches.
      setSession(newSession);
      setUser(prev => {
        if (prev?.id === newSession.user.id) return prev;
        return newSession.user;
      });
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
