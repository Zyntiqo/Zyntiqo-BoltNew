import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'SALES' | 'PROJECT_MANAGER' | 'SUPPORT' | 'CUSTOMER';

export type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  business_name: string | null;
  phone: string | null;
  website: string | null;
  role: UserRole;
  created_at: string;
};

type AuthContextValue = {
  user: UserProfile | null;
  loading: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STAFF_ROLES: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'SALES', 'PROJECT_MANAGER', 'SUPPORT'];

export function isStaff(role: string | undefined | null): boolean {
  return STAFF_ROLES.includes(role as UserRole);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (uid: string, retries = 10): Promise<UserProfile | null> => {
    for (let i = 0; i < retries; i++) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();
      if (data) return data as UserProfile;
      // Either error or no data — retry. The trigger might not have fired yet.
      if (error) {
        console.warn('[auth] profile fetch error (attempt %d):', i + 1, error.message);
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    // Profile still missing after all retries — try to self-heal by creating it.
    // The trigger may have failed or the user may have been created before the trigger existed.
    const { data: session } = await supabase.auth.getSession();
    const email = session?.session?.user?.email ?? '';
    const fullName = (session?.session?.user?.user_metadata?.['full_name'] as string) ?? email.split('@')[0];

    const { data: created, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: uid,
        email,
        full_name: fullName,
        role: 'CUSTOMER',
      })
      .select('*')
      .maybeSingle();

    if (created) return created as UserProfile;
    if (insertError) {
      console.warn('[auth] profile self-heal insert failed:', insertError.message);
    }
    return null;
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.user) {
      const profile = await fetchProfile(session.session.user.id);
      if (profile) {
        setUser(profile);
        setAuthError(null);
      }
    } else {
      setUser(null);
    }
  }, [fetchProfile]);

  useEffect(() => {
    let mounted = true;

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (!session?.user) {
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }
        const profile = await fetchProfile(session.user.id);
        if (mounted) {
          if (profile) {
            setUser(profile);
            setAuthError(null);
          } else {
            setUser(null);
            setAuthError('We could not load your profile. Please try signing in again, or contact support if the problem persists.');
          }
          setLoading(false);
        }
      })();
    });

    // Check initial session on mount
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) {
        if (mounted) setLoading(false);
        return;
      }
      const profile = await fetchProfile(data.session.user.id);
      if (mounted) {
        if (profile) {
          setUser(profile);
        } else {
          setAuthError('We could not load your profile. Please try signing in again, or contact support if the problem persists.');
        }
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    setAuthError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return { error: error.message };

    // The database trigger `on_auth_user_created` automatically creates
    // a profiles row with role 'CUSTOMER' when the auth user is created.
    void data;
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAuthError(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, authError, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
