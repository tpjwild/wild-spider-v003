"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

export type AuthContextValue = {
  /** Supabase not configured (e.g. smoke tests): game runs without login. */
  bypass: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const bypass = !isSupabaseConfigured();
  const [loading, setLoading] = useState(!bypass);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (bypass) {
      setLoading(false);
      setSession(null);
      return;
    }

    const client = getSupabaseBrowserClient();
    if (!client) {
      setLoading(false);
      setSession(null);
      return;
    }

    let cancelled = false;

    client.auth.getSession().then(({ data: { session: s } }) => {
      if (cancelled) return;
      setSession(s);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [bypass]);

  const signOut = useCallback(async () => {
    if (bypass) return;
    const client = getSupabaseBrowserClient();
    if (!client) return;
    await client.auth.signOut();
    setSession(null);
  }, [bypass]);

  const value = useMemo<AuthContextValue>(
    () => ({
      bypass,
      loading,
      session,
      user: session?.user ?? null,
      signOut,
    }),
    [bypass, loading, session, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
