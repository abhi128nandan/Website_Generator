import fs from 'fs/promises';
import path from 'path';

export class SystemScaffold {
  static async generateErrorAuthority(srcDir: string) {
    const systemDir = path.join(srcDir, 'components', 'system');
    await fs.mkdir(systemDir, { recursive: true });

    await fs.writeFile(path.join(systemDir, 'ErrorBoundary.tsx'), `import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} resetError={() => window.location.reload()} />;
    }

    return this.props.children;
  }
}
`);

    await fs.writeFile(path.join(systemDir, 'ErrorFallback.tsx'), `import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error | null;
  resetError: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-red-50 p-6 flex flex-col items-center text-center border-b border-red-100">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-slate-600 text-sm mb-6">
            We encountered an unexpected error. Please try refreshing the page.
          </p>
          <button
            onClick={resetError}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors shadow-sm shadow-red-500/20"
          >
            <RefreshCw size={18} />
            Try Again
          </button>
        </div>
        
        {error && (
          <div className="p-6 bg-slate-50">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Error Details</div>
            <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-red-400 text-sm font-mono whitespace-pre-wrap break-words">
                {error.message}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
`);
  }

  static async generateQueryAuthority(srcDir: string) {
    const libDir = path.join(srcDir, 'lib');
    await fs.mkdir(libDir, { recursive: true });

    await fs.writeFile(path.join(libDir, 'query-client.ts'), `import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
`);
  }

  static async generateAuthAuthority(srcDir: string) {
    const libDir = path.join(srcDir, 'lib');
    const systemDir = path.join(srcDir, 'components', 'system');
    const hooksDir = path.join(srcDir, 'hooks');

    await fs.mkdir(libDir, { recursive: true });
    await fs.mkdir(systemDir, { recursive: true });
    await fs.mkdir(hooksDir, { recursive: true });

    // 1. src/lib/auth.tsx
    await fs.writeFile(path.join(libDir, 'auth.tsx'), `import React, { createContext, useState, useEffect, ReactNode } from 'react';

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
`);

    // 2. src/hooks/useAuth.ts
    await fs.writeFile(path.join(hooksDir, 'useAuth.ts'), `import { useContext } from 'react';
import { AuthContext } from '../lib/auth';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
`);

    // 3. src/components/system/ProtectedRoute.tsx
    await fs.writeFile(path.join(systemDir, 'ProtectedRoute.tsx'), `import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Role } from '../../lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
`);
  }

  static getMainTsxContent(): string {
    return `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ErrorBoundary } from './components/system/ErrorBoundary'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/query-client'
import { AuthProvider } from './lib/auth'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
`;
  }
}
