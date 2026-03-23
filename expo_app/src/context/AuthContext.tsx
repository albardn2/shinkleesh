import React, { createContext, useContext, useEffect, useState } from "react";
import type { UserRead } from "../types/api";
import * as authService from "../services/auth";
import { getAccessToken, setTokens, clearTokens } from "../services/tokenStorage";
import { setOnUnauthorized } from "../services/api";

interface AuthState {
  user: UserRead | null;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (params: {
    username: string;
    password: string;
    email?: string;
    phone_number?: string;
  }) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserRead | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
  };

  useEffect(() => {
    setOnUnauthorized(() => setUser(null));

    (async () => {
      try {
        const token = await getAccessToken();
        if (token) {
          const me = await authService.getMe();
          setUser(me);
        }
      } catch {
        await clearTokens();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
    await authService.login(usernameOrEmail, password);
    const me = await authService.getMe();
    setUser(me);
  };

  const register = async (params: {
    username: string;
    password: string;
    email?: string;
    phone_number?: string;
  }) => {
    await authService.register(params);
    await authService.login(params.username, params.password);
    const me = await authService.getMe();
    setUser(me);
  };

  const loginWithToken = async (token: string) => {
    await setTokens(token);
    const me = await authService.getMe();
    setUser(me);
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, register, loginWithToken, logout: handleLogout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
