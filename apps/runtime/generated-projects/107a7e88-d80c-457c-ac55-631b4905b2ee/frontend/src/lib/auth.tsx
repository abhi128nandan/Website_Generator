import React, { createContext, useState, useEffect, ReactNode } from 'react';

export type Role = 'USER' | 'MANAGER' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: Role;
  token?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: Role | Role[]) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('websiteGenerator_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('websiteGenerator_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const mockUser: User = {
        id: '1',
        email,
        name: email.split('@')[0],
        role: 'USER',
        token: 'mock-jwt-token',
      };
      if (email.includes('admin')) {
        mockUser.role = 'ADMIN';
      } else if (email.includes('manager')) {
        mockUser.role = 'MANAGER';
      } else if (email.includes('super')) {
        mockUser.role = 'SUPER_ADMIN';
      }
      setUser(mockUser);
      localStorage.setItem('websiteGenerator_user', JSON.stringify(mockUser));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      setUser(null);
      localStorage.removeItem('websiteGenerator_user');
    } finally {
      setIsLoading(false);
    }
  };

  const hasRole = (roles: Role | Role[]): boolean => {
    if (!user) return false;
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    return requiredRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};
