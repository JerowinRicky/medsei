import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types";
import { api } from "../services/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  hasPermission: (perm: string) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("medsei_token"));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await api.get("/auth/me");
        setUser(res.data.data);
      } catch (e) {
        localStorage.removeItem("medsei_token");
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  const login = async (email: string, pass: string) => {
    const res = await api.post("/auth/login", { email, password: pass });
    const { token: authToken, user: userData } = res.data.data;
    localStorage.setItem("medsei_token", authToken);
    localStorage.setItem("medsei_user", JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("medsei_token");
    localStorage.removeItem("medsei_user");
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  };

  const hasPermission = (perm: string) => {
    if (!user) return false;
    if (user.role.code === "SUPER_ADMIN") return true;
    return user.permissions?.includes(perm) || false;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, hasPermission, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

