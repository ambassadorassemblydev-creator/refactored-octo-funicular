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
      const { data, error } = await (supabase
        .from('profiles')
        .select('*') as any)
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[Auth] Profile fetch error:', error.message);
        setRole('member');
        return;
      }

      if (data) {
        // Use an explicit cast to help TypeScript understand the data structure
        const profileData = data as any;
        
        // Set profile with avatar fallback
        setProfile({
          ...profileData,
          avatar_url: profileData.avatar_url || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
          full_name: authUser.user_metadata?.full_name || `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim()
        });

        // Use role_claim as the single source of truth as requested
        const userRole = (profileData.role_claim || 'member').toLowerCase().trim().replace(/\s+/g, '_') as Role;
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

  // Protection against rapid-fire auth events (like Clock Skew loops)
  const lastFetchTimeRef = React.useRef<number>(0);

  React.useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (authEvent, newSession) => {
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTimeRef.current;
      
      console.log(`[Auth] State Change: ${authEvent}`);
      if (!mounted) return;

      // Handle sign out immediately
      if (!newSession?.user) {
        setSession(null);
        setUser(null);
        setRole(null);
        setProfile(null);
        setLoading(false);
        setIsRoleResolving(false);
        return;
      }

      setSession(newSession);
      const newUser = newSession.user;
      
      // Determine if this is a background update or a fresh identity
      const isIdentityChange = newUser.id !== userRef.current?.id;
      
      // If the user identity hasn't changed AND we just fetched recently (< 5s),
      // ignore this event to prevent Clock Skew loops from slamming the DB.
      if (!isIdentityChange && timeSinceLastFetch < 5000) {
        console.log('[Auth] Ignoring rapid-fire redundant event.');
        return;
      }

      setUser(newUser);
      lastFetchTimeRef.current = now;

      // ONLY show the global loading spinner if it's a completely different user
      // or if we have literally NO role yet (first load ever)
      const needsBlockingLoad = isIdentityChange || roleRef.current === null;

      // Emergency timeout: If role resolution takes too long, force loading to end
      const emergencyTimeoutId = setTimeout(() => {
        if (mounted && loadingRef.current) {
          console.warn('[Auth] Emergency timeout reached. Forcing loading to end.');
          setLoading(false);
          setIsRoleResolving(false);
          if (roleRef.current === null) {
            const metadataRole = newUser.user_metadata?.role || newUser.user_metadata?.role_claim || 'member';
            console.log(`[Auth] Using metadata fallback role: ${metadataRole}`);
            setRole(metadataRole as Role);
          }
        }
      }, 5000);

      try {
        if (needsBlockingLoad) {
          setIsRoleResolving(true);
        }

        // Fetch profile and role silently in the background
        await fetchProfileAndRole(newUser.id, newUser);
      } catch (err) {
        console.error('[Auth] Auth change error:', err);
      } finally {
        if (mounted) {
          setIsRoleResolving(false);
          if (loadingRef.current) setLoading(false);
        }
        clearTimeout(emergencyTimeoutId);
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
