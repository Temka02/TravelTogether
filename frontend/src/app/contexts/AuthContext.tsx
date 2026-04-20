import React, { createContext, useContext, useState, useEffect } from "react";
import type { User, LoginRequest, RegisterRequest } from "../types/index";
import type { ReactNode } from "react";
import { apiClient } from "../api/client";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (apiClient.isAuthenticated()) {
        try {
          const response = await apiClient.getMe();
          if (response.success && response.data) {
            setUser(response.data);
          }
        } catch (error) {
          console.error("Failed to load user:", error);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (credentials: LoginRequest) => {
    const response = await apiClient.login(credentials);
    const meResponse = await apiClient.getMe();
    if (meResponse.success && meResponse.data) {
      setUser(meResponse.data);
    } else {
      setUser(response.user);
    }
  };

  const register = async (data: RegisterRequest) => {
    const response = await apiClient.register(data);
    const meResponse = await apiClient.getMe();
    if (meResponse.success && meResponse.data) {
      setUser(meResponse.data);
    } else {
      setUser(response.user);
    }
  };

  const logout = async () => {
    await apiClient.logout();
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
