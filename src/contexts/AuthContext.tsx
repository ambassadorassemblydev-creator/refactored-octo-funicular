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
  permissions: {},
  loading: true,
  isRoleResolving: true,
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
  const [isRoleResolving, setIsRoleResolving] = React.useState(true);

  const refreshProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    // High IQ: Merge DB profile with Auth metadata (e.g. Google avatar)
    if (data) {
      setProfile({
        ...data,
        avatar_url: data.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture,
        full_name: data.full_name || user.user_metadata?.full_name || `${data.first_name} ${data.last_name}`
      });
    } else if (user.user_metadata) {
      // Fallback for brand new users without a DB profile yet
      setProfile({
        id: user.id,
        email: user.email,
        avatar_url: user.user_metadata.avatar_url || user.user_metadata.picture,
        full_name: user.user_metadata.full_name
      });
    }
  };

  const hasPermission = (permission: string) => {
    if (role === 'super_admin' || permissions['all']) return true;
    return !!permissions[permission];
  };

  React.useEffect(() => {
    let mounted = true;

    // High IQ Safety: If auth doesn't resolve within 15s, force loading to false to prevent infinite preloader
    const safetyTimeout = setTimeout(() => {
      if (loading && mounted) {
        console.warn('[Auth] Safety timeout triggered. Forcing preloader to resolve.');
        setLoading(false);
      }
    }, 15000);

    // High IQ: Use onAuthStateChange as the single source of truth for session and role resolution.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[Auth] State Change: ${event}`);
      
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        
        // High IQ: If we have a session, we are no longer "loading" the auth state
        setLoading(false);

        if (session?.user) {
          setIsRoleResolving(true);
          await Promise.all([
            fetchRole(session.user.id),
            refreshProfile()
          ]);
          setIsRoleResolving(false);
        } else {
          setRole(null);
          setRoles([]);
          setPermissions({});
          setIsRoleResolving(false);
        }
        
        clearTimeout(safetyTimeout);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const fetchRole = async (userId: string, retries = 2) => {
    // High IQ: Guard against redundant calls while loading
    if (loading && role && user?.id === userId) return;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s safety timeout

    try {
      // Don't set global loading here, let isRoleResolving handle it
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
        .eq('is_active', true)
        .abortSignal(controller.signal);

      if (dbError) {
        console.warn('[Auth] Database role fetch error:', dbError);
      }

      if (dbData && dbData.length > 0) {
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
        
        const mergedPermissions = sortedRoles.reduce((acc, curr) => ({
          ...acc,
          ...curr.permissions
        }), {});
        
        setPermissions(mergedPermissions);
        setLoading(false);
        clearTimeout(timeoutId);
        return; 
      }

      // 2. Fallback: Check app_metadata
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const metadataRole = authUser?.app_metadata?.role;
      
      if (metadataRole) {
        const formattedRole = metadataRole.toLowerCase().replace(/\s+/g, '_') as Role;
        console.log(`[Auth] Role resolved from Metadata: ${formattedRole}`);
        setRole(formattedRole);
        setRoles([formattedRole]);
        setLoading(false);
        clearTimeout(timeoutId);
        return;
      }

      // 3. Last Resort Fallback: Check profiles table
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role_claim')
        .eq('id', userId)
        .maybeSingle();
      
      if (profileData?.role_claim) {
        const formattedRole = profileData.role_claim.toLowerCase().trim().replace(/\s+/g, '_') as Role;
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
      if (err.name === 'AbortError') {
        console.error('[Auth] Role resolution timed out after 10s. Defaulting to member for safety.');
      } else if (retries > 0) {
        console.warn(`[Auth] Role fetch failed, retrying... (${retries} left)`, err);
        return fetchRole(userId, retries - 1);
      } else {
        console.error('[Auth] Final role fetch failure:', err);
      }
      
      // Safety Fallback: Use existing role if we have one, otherwise member
      if (!role) {
        setRole('member');
        setRoles(['member']);
      }
    } finally {
      // High IQ: Always ensure loading is false after a resolution attempt
      if (mounted) {
        setLoading(false);
      }
      clearTimeout(timeoutId);
    }
  };


  return (
    <AuthContext.Provider value={{ session, user, role, roles, profile, permissions, loading, isRoleResolving, hasPermission, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);
