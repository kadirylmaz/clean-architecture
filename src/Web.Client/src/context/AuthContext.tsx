import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { authApi } from "@/api/auth";
import { onSessionExpired } from "@/api/client";
import type { UserResponse } from "@/api/types";
import { getUserIdFromToken, isTokenExpired } from "@/lib/jwt";
import { tokenStorage } from "@/lib/tokenStorage";

interface AuthContextValue {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  const hydrateFromToken = useCallback(async (accessToken: string) => {
    const userId = getUserIdFromToken(accessToken);

    if (!userId) {
      throw new Error("Token içinde kullanıcı bilgisi bulunamadı");
    }

    const profile = await authApi.getById(userId);
    setUser(profile);
  }, []);

  const login = useCallback(
    async (accessToken: string, refreshToken: string) => {
      tokenStorage.setTokens(accessToken, refreshToken);
      await hydrateFromToken(accessToken);
    },
    [hydrateFromToken],
  );

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      const accessToken = tokenStorage.getAccessToken();

      if (!accessToken || isTokenExpired(accessToken)) {
        // The axios interceptor will attempt a silent refresh on the first
        // authenticated request; until then, treat the session as signed out.
        if (!cancelled) {
          setIsInitializing(false);
        }
        return;
      }

      try {
        await hydrateFromToken(accessToken);
      } catch {
        tokenStorage.clear();
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [hydrateFromToken]);

  useEffect(() => onSessionExpired(logout), [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isInitializing,
      login,
      logout,
    }),
    [user, isInitializing, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
