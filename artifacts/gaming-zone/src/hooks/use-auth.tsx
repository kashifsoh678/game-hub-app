import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  authOptions: { request: { headers: { Authorization: string } } } | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const authOptions = token ? { request: { headers: { Authorization: `Bearer ${token}` } } } : undefined;

  const { data: user, isLoading } = useGetMe({
    ...authOptions,
    query: {
      enabled: !!token,
      retry: false,
    },
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
      queryClient.setQueryData(getGetMeQueryKey(), null);
    }
  }, [token, queryClient]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    queryClient.setQueryData(getGetMeQueryKey(), newUser);
    setLocation("/dashboard");
  };

  const logout = () => {
    setToken(null);
    queryClient.clear();
    setLocation("/login");
  };

  // If we have a token but fetching user fails (e.g., token expired), logout.
  useEffect(() => {
    if (token && !isLoading && !user) {
      logout();
    }
  }, [token, isLoading, user]);

  return (
    <AuthContext.Provider value={{ user: user || null, token, isLoading, login, logout, authOptions }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
