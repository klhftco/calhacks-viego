"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  viegoUID: string;
  email: string;
  firstName: string;
  lastName: string;
  xp: number;
  schoolName?: string;
}

interface AuthContextType {
  user: User | null;
  login: (viegoUID: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('viego_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user:', e);
        localStorage.removeItem('viego_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (viegoUID: string) => {
    setIsLoading(true);
    try {
      // Fetch user profile from API
      const response = await fetch(`/api/account?viegoUID=${encodeURIComponent(viegoUID)}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to login');
      }

      const userData: User = {
        viegoUID: result.profile.viegoUID,
        email: result.profile.email,
        firstName: result.profile.firstName,
        lastName: result.profile.lastName,
        xp: result.profile.xp,
        schoolName: result.profile.schoolName,
      };

      setUser(userData);
      localStorage.setItem('viego_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('viego_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
