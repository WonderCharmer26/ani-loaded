import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../supabaseConnection";
import { getCurrentUser } from "../supabaseAuth";

export function useAuth() {
  // states
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Manual refresh for places where profile metadata changes after an action
  const refreshUser = useCallback(async () => {
    const {
      data: { user },
      error,
    } = await getCurrentUser();

    if (!error) {
      setUser(user);
    }
  }, []);

  useEffect(() => {
    // React to login/logout/session updates in real time
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      },
    );

    // Initial fetch keeps metadata current on first load.
    refreshUser().finally(() => setLoading(false));

    return () => listener.subscription.unsubscribe();
  }, [refreshUser]);

  return { user, loading, refreshUser };
}
