"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { auth as authApi, type User } from "@/lib/api";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (data: { firstname: string; lastname: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Access token TTL must match the backend (JWT_EXPIRES_IN = 15m).
const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
// Refresh 1 minute before expiry so navigations never hit an expired token.
const REFRESH_BEFORE_MS = 60 * 1000;

export function AuthProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser?: User | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser ?? null);
  const [loading, setLoading] = useState(initialUser === undefined);
  const tokenExpiresAt = useRef<number | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRefresh = useCallback((expiresAt: number) => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    const delay = Math.max(0, expiresAt - Date.now() - REFRESH_BEFORE_MS);
    refreshTimer.current = setTimeout(async () => {
      const ok = await authApi.silentRefresh();
      if (ok) {
        const next = Date.now() + ACCESS_TOKEN_TTL_MS;
        tokenExpiresAt.current = next;
        scheduleRefresh(next);
      } else {
        window.dispatchEvent(new Event("auth:logout"));
      }
    }, delay);
  }, []);

  const markTokenFresh = useCallback(() => {
    const expiresAt = Date.now() + ACCESS_TOKEN_TTL_MS;
    tokenExpiresAt.current = expiresAt;
    scheduleRefresh(expiresAt);
  }, [scheduleRefresh]);

  const fetchUser = useCallback(async () => {
    try {
      const currentUser = await authApi.me();
      setUser(currentUser);
      markTokenFresh();
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [markTokenFresh]);

  useEffect(() => {
    if (initialUser === undefined) {
      fetchUser();
    } else if (initialUser !== null) {
      markTokenFresh();
    }
  }, [fetchUser, initialUser, markTokenFresh]);

  // Handle forced logout (refresh token expired or exhausted retries).
  useEffect(() => {
    const handler = () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      authApi.logout().catch(() => {});
      setUser(null);
      window.location.href = "/login";
    };
    window.addEventListener("auth:logout", handler);
    return () => window.removeEventListener("auth:logout", handler);
  }, []);

  // When the tab becomes visible again (e.g. user returns after sleep/AFK),
  // check if the token has expired or is about to and refresh immediately if so.
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState !== "visible") return;
      if (!user || !tokenExpiresAt.current) return;
      if (Date.now() < tokenExpiresAt.current - REFRESH_BEFORE_MS) return;

      const ok = await authApi.silentRefresh();
      if (ok) {
        const next = Date.now() + ACCESS_TOKEN_TTL_MS;
        tokenExpiresAt.current = next;
        scheduleRefresh(next);
      } else {
        window.dispatchEvent(new Event("auth:logout"));
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [user, scheduleRefresh]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    setUser(res.user);
    markTokenFresh();
  };

  const loginWithGoogle = async (credential: string) => {
    const res = await authApi.loginWithGoogle(credential);
    setUser(res.user);
    markTokenFresh();
  };

  const register = async (data: { firstname: string; lastname: string; email: string; password: string }) => {
    const res = await authApi.register(data);
    setUser(res.user);
    markTokenFresh();
  };

  const logout = () => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    tokenExpiresAt.current = null;
    authApi.logout().catch(() => {});
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
