import React, { createContext, useContext, useEffect, useState } from "react";
import {
  AuthSession,
  AuthUser,
  beginOAuthSignIn,
  clearStoredSession,
  finishOAuthCallback,
  readStoredSession,
  refreshStoredSession,
} from "../lib/auth";

interface AuthContextValue {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  error: null,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapAuth() {
      try {
        const url = new URL(window.location.href);

        if (url.pathname === "/auth/callback") {
          const callbackSession = await finishOAuthCallback(url);
          if (cancelled) return;
          setSession(callbackSession);
          setUser(callbackSession.user);
          setError(null);
          window.history.replaceState({}, document.title, "/");
          return;
        }

        const storedSession = readStoredSession();
        if (!storedSession) {
          if (!cancelled) {
            setSession(null);
            setUser(null);
            setError(null);
          }
          return;
        }

        const expiresSoon =
          storedSession.expires_at !== null &&
          storedSession.expires_at <= Date.now() + 60_000;

        const activeSession = expiresSoon
          ? await refreshStoredSession(storedSession)
          : storedSession;

        if (cancelled) return;

        setSession(activeSession);
        setUser(activeSession?.user ?? null);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        clearStoredSession();
        setSession(null);
        setUser(null);
        setError(err instanceof Error ? err.message : "登录流程失败");
        if (window.location.pathname === "/auth/callback") {
          window.history.replaceState({}, document.title, "/");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void bootstrapAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = async () => {
    setError(null);
    await beginOAuthSignIn();
  };

  const signOut = async () => {
    clearStoredSession();
    setSession(null);
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, error, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
