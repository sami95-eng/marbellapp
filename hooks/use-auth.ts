import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export type User = {
  id: string;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  lastSignedIn: Date;
};

function mapUser(supaUser: SupabaseUser): User {
  const meta = supaUser.user_metadata ?? {};
  return {
    id: supaUser.id,
    openId: supaUser.id,
    name: meta.name ?? meta.full_name ?? supaUser.email?.split("@")[0] ?? null,
    email: supaUser.email ?? null,
    loginMethod: meta.login_method ?? meta.provider ?? "email",
    lastSignedIn: supaUser.last_sign_in_at ? new Date(supaUser.last_sign_in_at) : new Date(),
  };
}

export function useAuth(options?: { autoFetch?: boolean }) {
  const { autoFetch = true } = options ?? {};
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!autoFetch) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session }, error: err }) => {
      if (cancelled) return;
      if (err) setError(new Error(err.message));
      setUser(session?.user ? mapUser(session.user) : null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setUser(session?.user ? mapUser(session.user) : null);
      setLoading(false);
      setError(null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [autoFetch]);

  const logout = useCallback(async () => {
    console.log("[Auth] logout() called");
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error("[Auth] supabase.auth.signOut() error:", signOutError.message);
    } else {
      console.log("[Auth] supabase.auth.signOut() success");
    }
    setUser(null);
    setError(null);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.clear();
        window.sessionStorage.clear();
        console.log("[Auth] localStorage + sessionStorage cleared");
      } catch (e) {
        console.error("[Auth] storage clear error:", e);
      }
    }
  }, []);

  const refresh = useCallback(async () => {
    const { data: { session }, error: err } = await supabase.auth.refreshSession();
    if (err) {
      setError(new Error(err.message));
    } else {
      setUser(session?.user ? mapUser(session.user) : null);
    }
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    logout,
    refresh,
  };
}
