import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
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

  const isSuperAdmin = roles.some(r => r.role === 'super_admin');
  const isCompanyAdmin = roles.some(r => r.role === 'admin') || membership?.role === 'admin';

  // Initialize auth - runs on mount
  // No refs needed - we use a simple mounted flag and ensure state is always set
  useEffect(() => {
    let mounted = true;
    console.log('[Auth] useEffect starting');

    // Define fetchUserData inside useEffect to avoid dependency issues
    const fetchUserData = async (userId: string): Promise<void> => {
      console.log('[Auth] Fetching user data for:', userId);
      
      try {
        // Fetch all data in parallel for speed
        const [profileResult, rolesResult, memberResult] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
          supabase.from('user_roles').select('*').eq('user_id', userId),
          supabase.from('company_members').select('*').eq('user_id', userId).maybeSingle()
        ]);

        if (!mounted) {
          console.log('[Auth] Component unmounted, skipping state update');
          return;
        }

        console.log('[Auth] Data fetched - Profile:', !!profileResult.data, 'Roles:', rolesResult.data?.length || 0, 'Member:', !!memberResult.data);
        
        setProfile(profileResult.data);
        setRoles(rolesResult.data || []);
        setMembership(memberResult.data);
      } catch (error) {
        console.error('[Auth] Error fetching user data:', error);
      }
    };

    const clearUserData = () => {
      console.log('[Auth] Clearing user data');
      setProfile(null);
      setRoles([]);
      setMembership(null);
    };

    const initialize = async () => {
      console.log('[Auth] Starting initialization');
      
      try {
        // Get current session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth] Error getting session:', error);
        }
        
        if (!mounted) {
          console.log('[Auth] Component unmounted during init');
          return;
        }
        
        console.log('[Auth] Session result:', !!currentSession?.user);
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          await fetchUserData(currentSession.user.id);
        }
      } catch (error) {
        console.error('[Auth] Init error:', error);
      } finally {
        // ALWAYS set these - critical for avoiding infinite loading
        if (mounted) {
          console.log('[Auth] Initialization complete, setting isLoading=false, isInitialized=true');
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log('[Auth] Auth state changed:', event);
        
        if (!mounted) return;
        
        // Skip INITIAL_SESSION - we handle it in initialize()
        if (event === 'INITIAL_SESSION') {
          console.log('[Auth] Skipping INITIAL_SESSION (handled by initialize)');
          return;
        }
        
        // Update session and user synchronously
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Handle data fetching asynchronously but don't use async in the callback
        if (newSession?.user) {
          // Fire and forget - don't await
          fetchUserData(newSession.user.id);
        } else {
          clearUserData();
        }
      }
    );

    // THEN initialize
    initialize();

    return () => {
      console.log('[Auth] Cleanup - setting mounted=false');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Empty deps - only run on mount

  const signIn = useCallback(async (email: string, password: string) => {
    console.log('[Auth] Signing in:', email);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('[Auth] Sign in error:', error);
    }
    
    return { error: error as Error | null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, firstName?: string, lastName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
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

    // If signup was successful, try to link user to company
    if (!error && data.user) {
      let linked = false;
      
      // 1. First, check localStorage for pending invite (from URL parameters)
      const pendingInviteStr = localStorage.getItem('pendingInvite');
      if (pendingInviteStr) {
        try {
          const pendingInvite = JSON.parse(pendingInviteStr);
          console.log('[Auth] Found pending invite in localStorage, linking user:', pendingInvite);
          
          // Update the company_member record to link this user
          const { error: linkError } = await supabase
            .from('company_members')
            .update({ 
              user_id: data.user.id,
              status: 'invited',
              placeholder_first_name: null,
              placeholder_last_name: null,
              placeholder_email: null
            })
            .eq('id', pendingInvite.inviteId)
            .eq('company_id', pendingInvite.companyId);
          
          if (linkError) {
            console.error('[Auth] Error linking user to company member:', linkError);
          } else {
            console.log('[Auth] Successfully linked user to company member via localStorage');
            linked = true;
          }
          
          // Clear the pending invite
          localStorage.removeItem('pendingInvite');
        } catch (err) {
          console.error('[Auth] Error processing pending invite:', err);
        }
      }
      
      // 2. BACKUP: If no localStorage invite, check DB for pending invite by email
      // This handles cases where user cleared localStorage or used different browser
      if (!linked) {
        try {
          console.log('[Auth] Checking DB for pending invite by email:', email);
          
          const { data: pendingMember } = await supabase
            .from('company_members')
            .select('id, company_id')
            .eq('placeholder_email', email.toLowerCase())
            .is('user_id', null)
            .maybeSingle();
          
          if (pendingMember) {
            console.log('[Auth] Found pending invite in DB, linking user:', pendingMember);
            
            const { error: linkError } = await supabase
              .from('company_members')
              .update({ 
                user_id: data.user.id,
                status: 'invited',
                placeholder_first_name: null,
                placeholder_last_name: null,
                placeholder_email: null
              })
              .eq('id', pendingMember.id);
            
            if (linkError) {
              console.error('[Auth] Error linking user to company member via email:', linkError);
            } else {
              console.log('[Auth] Successfully linked user to company member via email matching');
            }
          }
        } catch (err) {
          console.error('[Auth] Error checking DB for pending invite:', err);
        }
      }
    }

    return { error: error as Error | null };
  }, []);

  const signOut = useCallback(async () => {
    console.log('[Auth] Signing out');
    setProfile(null);
    setRoles([]);
    setMembership(null);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    
    console.log('[Auth] Refreshing profile for:', user.id);
    
    try {
      const [profileResult, rolesResult, memberResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('user_roles').select('*').eq('user_id', user.id),
        supabase.from('company_members').select('*').eq('user_id', user.id).maybeSingle()
      ]);
      
      setProfile(profileResult.data);
      setRoles(rolesResult.data || []);
      setMembership(memberResult.data);
    } catch (error) {
      console.error('[Auth] Error refreshing profile:', error);
    }
  }, [user]);

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
