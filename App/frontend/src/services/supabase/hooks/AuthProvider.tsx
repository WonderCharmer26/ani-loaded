import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";

import { useAuth } from "./useAuth";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
};

// create context to use at the top
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// provide auth to the rest of the app
export function AuthProvider({ children }: { children: ReactNode }) {
  // Centralize auth state once so all routes/components share it.
  const auth = useAuth();

  // return wrap
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

// custom so that we can get the context for the user, loading and refreshUser function
export function useAuthContext() {
  // gets value from the AuthContext.Provider
  const context = useContext(AuthContext);

  // error on no context
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }

  // use data from the AuthProvider so we can call where ever
  return context;
}
