"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { auth as authApi, setToken, removeToken, type User } from "@/lib/api";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { firstname: string; lastname: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const currentUser = await authApi.me();
      setUser(currentUser);
    } catch {
      setUser(null);
      removeToken();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    setToken(res.accessToken);
    localStorage.setItem("refreshToken", res.refreshToken);
    setUser(res.user);
  };

  const register = async (data: { firstname: string; lastname: string; email: string; password: string }) => {
    const res = await authApi.register(data);
    setToken(res.accessToken);
    localStorage.setItem("refreshToken", res.refreshToken);
    setUser(res.user);
  };

  const logout = () => {
    removeToken();
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
