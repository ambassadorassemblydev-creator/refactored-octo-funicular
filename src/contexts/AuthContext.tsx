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
  permissions: Record<string, boolean>;
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  roles: [],
  permissions: {},
  loading: true,
  hasPermission: () => false,
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = React.useState<Session | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [role, setRole] = React.useState<Role | null>(null);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [profile, setProfile] = React.useState<any | null>(null);
  const [permissions, setPermissions] = React.useState<Record<string, boolean>>({});
  const [loading, setLoading] = React.useState(true);

  const refreshProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (data) setProfile(data);
  };

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
            await Promise.all([
              fetchRole(session.user.id),
              refreshProfile()
            ]);
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
          await Promise.all([
            fetchRole(session.user.id),
            refreshProfile()
          ]);
        } else {
          setRole(null);
          setRoles([]);
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

  const fetchRole = async (userId: string, retries = 2) => {
    try {
      console.log(`[Auth] Resolving role for user: ${userId}`);

      // 1. High IQ: Fetch all active roles and prioritize the most powerful one
      const { data: dbData, error: dbError } = await supabase
        .from('user_roles')
        .select(`
          is_active,
          roles (
            name,
            permissions
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (dbError) {
        console.warn('[Auth] Database role fetch error:', dbError);
      }

      if (dbData && dbData.length > 0) {
        // High IQ: Rank roles to ensure Super Admin/Admin/Pastor take precedence over 'worker' or 'member'
        const roleRanking: Record<string, number> = {
          'super_admin': 100,
          'admin': 80,
          'superadmin': 99,
          'super_admin_role': 98,
          'pastor': 70,
          'leader': 50,
          'worker': 30,
          'member': 10,
          'guest': 0
        };

        const sortedRoles = dbData
          .map((ur: any) => ({
            name: (ur.roles?.name || '').toLowerCase().trim().replace(/\s+/g, '_'),
            permissions: ur.roles?.permissions || {}
          }))
          .sort((a, b) => (roleRanking[b.name] || 0) - (roleRanking[a.name] || 0));

        const highestRole = sortedRoles[0];
        
        console.log(`[Auth] Role resolved from DB (Priority: ${highestRole.name})`);
        setRole(highestRole.name as Role);
        setRoles(sortedRoles.map(r => r.name as Role));
        
        // Merge all permissions from all active roles
        const mergedPermissions = sortedRoles.reduce((acc, curr) => ({
          ...acc,
          ...curr.permissions
        }), {});
        
        setPermissions(mergedPermissions);
        setLoading(false);
        return; 
      }

      // 2. Fallback: Check app_metadata (Fast but can be stale)
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      const metadataRole = user?.app_metadata?.role;
      
      if (metadataRole) {
        const formattedRole = metadataRole.toLowerCase().replace(/\s+/g, '_') as Role;
        console.log(`[Auth] Role resolved from Metadata: ${formattedRole}`);
        setRole(formattedRole);
        setRoles([formattedRole]);
        setLoading(false);
        return;
      }

      // 3. Last Resort Fallback: Check profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('role_claim')
        .eq('id', userId)
        .maybeSingle();
      
      if (profile?.role_claim) {
        const formattedRole = profile.role_claim.toLowerCase().trim().replace(/\s+/g, '_') as Role;
        console.log(`[Auth] Role resolved from Profile Claim: ${formattedRole}`);
        setRole(formattedRole);
        setRoles([formattedRole]);
      } else {
        console.log(`[Auth] No specific role found, defaulting to member`);
        setRole("member");
        setRoles(["member"]);
      }
      setPermissions({});

    } catch (err: any) {
      if (retries > 0) {
        console.warn(`[Auth] Role fetch failed, retrying... (${retries} left)`, err);
        setTimeout(() => fetchRole(userId, retries - 1), 1000);
        return;
      }
      console.error('[Auth] Final role fetch failure, defaulting to member:', err);
      setRole('member');
      setRoles(['member']);
    } finally {
      setLoading(false);
    }
  };


  return (
    <AuthContext.Provider value={{ session, user, role, roles, profile, permissions, loading, hasPermission, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);
