"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { auth as authApi, type User } from "@/lib/api";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { firstname: string; lastname: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser?: User | null;
}) {
  // If initialUser was provided by server, use it directly (no loading flash).
  const [user, setUser] = useState<User | null>(initialUser ?? null);
  const [loading, setLoading] = useState(initialUser === undefined);

  const fetchUser = useCallback(async () => {
    try {
      const currentUser = await authApi.me();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Only fetch client-side when no server-provided initial state.
  useEffect(() => {
    if (initialUser === undefined) {
      fetchUser();
    }
  }, [fetchUser, initialUser]);

  // Handle forced logout (refresh token expired or 401 with no retry path).
  useEffect(() => {
    const handler = () => {
      authApi.logout().catch(() => {});
      setUser(null);
      window.location.href = "/login";
    };
    window.addEventListener("auth:logout", handler);
    return () => window.removeEventListener("auth:logout", handler);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    setUser(res.user);
  };

  const register = async (data: { firstname: string; lastname: string; email: string; password: string }) => {
    const res = await authApi.register(data);
    setUser(res.user);
  };

  // Fire-and-forget the API call; clear user state immediately for instant UX.
  const logout = () => {
    authApi.logout().catch(() => {});
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
