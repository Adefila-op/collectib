import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { AUTH_STATE_CHANGED_EVENT, isSignedIn } from "@/lib/api";

type AuthContextValue = {
  isSignedIn: boolean;
};

const AuthContext = createContext<AuthContextValue>({ isSignedIn: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(() => isSignedIn());

  useEffect(() => {
    const refresh = () => setSignedIn(isSignedIn());

    window.addEventListener(AUTH_STATE_CHANGED_EVENT, refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener(AUTH_STATE_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const value = useMemo(() => ({ isSignedIn: signedIn }), [signedIn]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
