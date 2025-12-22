import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';
import type { Tables } from '../integrations/supabase/types';

type Profile = Tables<'profiles'>;
type UserRole = Tables<'user_roles'>;
type CompanyMember = Tables<'company_members'>;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: UserRole[];
  membership: CompanyMember | null;
  isLoading: boolean;
  isInitialized: boolean;
  isSuperAdmin: boolean;
  isCompanyAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [membership, setMembership] = useState<CompanyMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Refs to prevent race conditions
  const initStartedRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);

  const isSuperAdmin = roles.some(r => r.role === 'super_admin');
  const isCompanyAdmin = roles.some(r => r.role === 'admin') || membership?.role === 'admin';

  // Memoized function to fetch user data - NEVER sets isLoading directly
  const fetchUserData = useCallback(async (userId: string): Promise<boolean> => {
    console.log('[Auth] Fetching user data for:', userId);
    
    try {
      // Fetch all data in parallel for speed
      const [profileResult, rolesResult, memberResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('user_roles').select('*').eq('user_id', userId),
        supabase.from('company_members').select('*').eq('user_id', userId).maybeSingle()
      ]);

      console.log('[Auth] Data loaded - Profile:', !!profileResult.data, 'Roles:', rolesResult.data?.length || 0);
      
      setProfile(profileResult.data);
      setRoles(rolesResult.data || []);
      setMembership(memberResult.data);
      
      return true;
    } catch (error) {
      console.error('[Auth] Error fetching user data:', error);
      return false;
    }
  }, []);

  // Clear all user data
  const clearUserData = useCallback(() => {
    console.log('[Auth] Clearing user data');
    setProfile(null);
    setRoles([]);
    setMembership(null);
    currentUserIdRef.current = null;
  }, []);

  // Initialize auth - runs ONCE on mount
  useEffect(() => {
    // Prevent double initialization (React StrictMode)
    if (initStartedRef.current) {
      console.log('[Auth] Init already started, skipping');
      return;
    }
    initStartedRef.current = true;
    
    console.log('[Auth] Starting initialization');
    
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get current session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth] Error getting session:', error);
        }
        
        if (!mounted) return;
        
        console.log('[Auth] Session found:', !!currentSession?.user);
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          currentUserIdRef.current = currentSession.user.id;
          await fetchUserData(currentSession.user.id);
        }
        
        if (mounted) {
          setIsLoading(false);
          setIsInitialized(true);
          console.log('[Auth] Initialization complete');
        }
      } catch (error) {
        console.error('[Auth] Init error:', error);
        if (mounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    // Set up auth state listener for SUBSEQUENT changes only
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('[Auth] Auth state changed:', event);
        
        if (!mounted) return;
        
        // Skip if this is the initial session (we handle that in initializeAuth)
        if (event === 'INITIAL_SESSION') {
          console.log('[Auth] Skipping INITIAL_SESSION event (handled by initializeAuth)');
          return;
        }
        
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          // Only fetch if user changed
          if (currentUserIdRef.current !== newSession.user.id) {
            currentUserIdRef.current = newSession.user.id;
            await fetchUserData(newSession.user.id);
          }
        } else {
          clearUserData();
        }
      }
    );

    // Start initialization
    initializeAuth();

    return () => {
      console.log('[Auth] Cleanup');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserData, clearUserData]);

  const signIn = useCallback(async (email: string, password: string) => {
    console.log('[Auth] Signing in:', email);
    setIsLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('[Auth] Sign in error:', error);
      setIsLoading(false);
    }
    // isLoading will be set to false by onAuthStateChange after data is loaded
    
    return { error: error as Error | null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, firstName?: string, lastName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    });
    return { error: error as Error | null };
  }, []);

  const signOut = useCallback(async () => {
    console.log('[Auth] Signing out');
    await supabase.auth.signOut();
    clearUserData();
    setUser(null);
    setSession(null);
  }, [clearUserData]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  }, [user, fetchUserData]);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      roles,
      membership,
      isLoading,
      isInitialized,
      isSuperAdmin,
      isCompanyAdmin,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};