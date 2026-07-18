import {
  createContext, useContext, useEffect, useMemo, useState,
} from 'react';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { getAuthRedirectUrl } from './authUtils';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [event, setEvent] = useState(null);
  const [initializationError, setInitializationError] = useState(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setInitializationError(error);
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((authEvent, nextSession) => {
      setEvent(authEvent);
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({
    event,
    initializationError,
    isDemoMode: !isSupabaseConfigured,
    loading,
    session,
    user: session?.user ?? null,
    signIn: credentials => supabase.auth.signInWithPassword(credentials),
    signUp: ({ email, password, fullName }) => supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: getAuthRedirectUrl('/eposta-dogrula'),
      },
    }),
    signOut: () => supabase.auth.signOut(),
    sendPasswordReset: email => supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAuthRedirectUrl('/sifre-yenile'),
    }),
    updatePassword: password => supabase.auth.updateUser({ password }),
  }), [event, initializationError, loading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth, AuthProvider içinde kullanılmalıdır.');
  return context;
}
