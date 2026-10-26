import React, { createContext, useContext, useEffect, useState } from "react";
import { api, clearStoredAuth, getStoredUser, setStoredAuth } from "../lib/api";
import type { User } from "../types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phoneNumber: string, password: string) => Promise<void>;
  register: (name: string, phoneNumber: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("echanda_token");
      const storedUser = getStoredUser();
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
      }
    } catch (e) {
      console.error("Error reading stored credentials", e);
    } finally {
      setIsLoading(false);
    }

    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener("echanda:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("echanda:unauthorized", handleUnauthorized);
  }, []);

  const login = async (phoneNumber: string, password: string) => {
    const res = await api.auth.login({ phone_number: phoneNumber, password });
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (name: string, phoneNumber: string, password: string) => {
    // Register user first
    await api.auth.register({ name, phone_number: phoneNumber, password });
    // Then auto login
    await login(phoneNumber, password);
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      console.warn("Logout request failed, cleaning local state anyway", e);
    }
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
