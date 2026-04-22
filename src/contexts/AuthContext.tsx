import * as React from "react";
import { supabase } from "@/src/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

type Role = "super_admin" | "admin" | "pastor" | "leader" | "member" | "guest";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: Role | null;
  permissions: Record<string, boolean>;
  loading: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = React.createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  permissions: {},
  loading: true,
  hasPermission: () => false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = React.useState<Session | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [role, setRole] = React.useState<Role | null>(null);
  const [permissions, setPermissions] = React.useState<Record<string, boolean>>({});
  const [loading, setLoading] = React.useState(true);

  const hasPermission = (permission: string) => {
    if (role === 'super_admin' || permissions['all']) return true;
    return !!permissions[permission];
  };

  React.useEffect(() => {
    let mounted = true;

    // Fallback timeout to ensure we never get stuck on loading
    const timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn("Auth initialization timed out. Forcing load completion.");
        setLoading(false);
      }
    }, 5000);

    async function getInitialSession(retries = 3) {
      try {
        // Only call getSession initially to avoid concurrent auth calls that cause lock issues
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (mounted) {
          if (session) {
            setSession(session);
            setUser(session.user);
            await fetchRole(session.user.id);
          } else {
            setLoading(false);
          }
        }
      } catch (error: any) {
        if (error?.message?.includes("Lock") && retries > 0) {
          console.warn(`Auth lock detected, retrying... (${retries} left)`);
          setTimeout(() => getInitialSession(retries - 1), 500);
          return;
        }
        console.error("Error getting session:", error);
        if (mounted) setLoading(false);
      }
    }

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchRole(session.user.id);
        } else {
          setRole(null);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const fetchRole = async (userId: string) => {
    try {
      // Fetch from user_roles -> roles table as per the system RBAC
      const rolePromise = supabase
        .from('user_roles')
        .select(`
          role_id,
          roles:role_id (
            name
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Role fetch timeout')), 3000)
      );

      const result = await Promise.race([rolePromise, timeoutPromise]) as any;
      
      if (result.error) {
        console.warn('Error fetching role, defaulting to member:', result.error);
        setRole('member');
        return;
      }
      
      if (result.data && result.data.roles) {
        // Handle both object and array response from supabase
        const roleData = Array.isArray(result.data.roles) ? result.data.roles[0] : result.data.roles;
        setRole(roleData.name.toLowerCase() as Role);
        setPermissions(roleData.permissions || {});
      } else {
        setRole("member");
        setPermissions({});
      }
    } catch (err) {
      console.warn('Role fetch failed or timed out, defaulting to member:', err);
      setRole('member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, role, permissions, loading, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);
