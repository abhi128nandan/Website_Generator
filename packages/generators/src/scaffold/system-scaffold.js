"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemScaffold = void 0;
var promises_1 = require("fs/promises");
var path_1 = require("path");
var SystemScaffold = /** @class */ (function () {
    function SystemScaffold() {
    }
    SystemScaffold.generateErrorAuthority = function (srcDir) {
        return __awaiter(this, void 0, void 0, function () {
            var systemDir;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        systemDir = path_1.default.join(srcDir, 'components', 'system');
                        return [4 /*yield*/, promises_1.default.mkdir(systemDir, { recursive: true })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(systemDir, 'ErrorBoundary.tsx'), "import React, { Component, ErrorInfo, ReactNode } from 'react';\nimport { ErrorFallback } from './ErrorFallback';\n\ninterface Props {\n  children: ReactNode;\n}\n\ninterface State {\n  hasError: boolean;\n  error: Error | null;\n}\n\nexport class ErrorBoundary extends Component<Props, State> {\n  public state: State = {\n    hasError: false,\n    error: null\n  };\n\n  public static getDerivedStateFromError(error: Error): State {\n    return { hasError: true, error };\n  }\n\n  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {\n    console.error('Uncaught error:', error, errorInfo);\n  }\n\n  public render() {\n    if (this.state.hasError) {\n      return <ErrorFallback error={this.state.error} resetError={() => window.location.reload()} />;\n    }\n\n    return this.props.children;\n  }\n}\n")];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(systemDir, 'ErrorFallback.tsx'), "import React from 'react';\nimport { AlertCircle, RefreshCw } from 'lucide-react';\n\ninterface ErrorFallbackProps {\n  error: Error | null;\n  resetError: () => void;\n}\n\nexport const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {\n  return (\n    <div className=\"min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4\">\n      <div className=\"max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100\">\n        <div className=\"bg-red-50 p-6 flex flex-col items-center text-center border-b border-red-100\">\n          <div className=\"w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4\">\n            <AlertCircle size={32} />\n          </div>\n          <h2 className=\"text-xl font-bold text-slate-900 mb-2\">Something went wrong</h2>\n          <p className=\"text-slate-600 text-sm mb-6\">\n            We encountered an unexpected error. Please try refreshing the page.\n          </p>\n          <button\n            onClick={resetError}\n            className=\"inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors shadow-sm shadow-red-500/20\"\n          >\n            <RefreshCw size={18} />\n            Try Again\n          </button>\n        </div>\n        \n        {error && (\n          <div className=\"p-6 bg-slate-50\">\n            <div className=\"text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2\">Error Details</div>\n            <div className=\"bg-slate-900 rounded-lg p-4 overflow-x-auto\">\n              <pre className=\"text-red-400 text-sm font-mono whitespace-pre-wrap break-words\">\n                {error.message}\n              </pre>\n            </div>\n          </div>\n        )}\n      </div>\n    </div>\n  );\n};\n")];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    SystemScaffold.generateQueryAuthority = function (srcDir) {
        return __awaiter(this, void 0, void 0, function () {
            var libDir;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        libDir = path_1.default.join(srcDir, 'lib');
                        return [4 /*yield*/, promises_1.default.mkdir(libDir, { recursive: true })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(libDir, 'query-client.ts'), "import { QueryClient } from '@tanstack/react-query';\n\nexport const queryClient = new QueryClient({\n  defaultOptions: {\n    queries: {\n      staleTime: 5 * 60 * 1000, // 5 minutes\n      gcTime: 10 * 60 * 1000, // 10 minutes\n      retry: 1,\n      refetchOnWindowFocus: false,\n    },\n  },\n});\n")];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    SystemScaffold.generateAuthAuthority = function (srcDir) {
        return __awaiter(this, void 0, void 0, function () {
            var libDir, systemDir, hooksDir;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        libDir = path_1.default.join(srcDir, 'lib');
                        systemDir = path_1.default.join(srcDir, 'components', 'system');
                        hooksDir = path_1.default.join(srcDir, 'hooks');
                        return [4 /*yield*/, promises_1.default.mkdir(libDir, { recursive: true })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, promises_1.default.mkdir(systemDir, { recursive: true })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, promises_1.default.mkdir(hooksDir, { recursive: true })];
                    case 3:
                        _a.sent();
                        // 1. src/lib/auth.tsx
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(libDir, 'auth.tsx'), "import React, { createContext, useState, useEffect, ReactNode } from 'react';\n\nexport type Role = 'USER' | 'MANAGER' | 'ADMIN' | 'SUPER_ADMIN';\n\nexport interface User {\n  id: string;\n  email: string;\n  name?: string;\n  role: Role;\n  token?: string;\n}\n\nexport interface AuthContextType {\n  user: User | null;\n  isAuthenticated: boolean;\n  isLoading: boolean;\n  login: (email: string, password: string) => Promise<void>;\n  logout: () => Promise<void>;\n  hasRole: (roles: Role | Role[]) => boolean;\n}\n\nexport const AuthContext = createContext<AuthContextType | undefined>(undefined);\n\nexport const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {\n  const [user, setUser] = useState<User | null>(null);\n  const [isLoading, setIsLoading] = useState(true);\n\n  useEffect(() => {\n    const storedUser = localStorage.getItem('websiteGenerator_user');\n    if (storedUser) {\n      try {\n        setUser(JSON.parse(storedUser));\n      } catch (e) {\n        localStorage.removeItem('websiteGenerator_user');\n      }\n    }\n    setIsLoading(false);\n  }, []);\n\n  const login = async (email: string, password: string) => {\n    setIsLoading(true);\n    try {\n      const mockUser: User = {\n        id: '1',\n        email,\n        name: email.split('@')[0],\n        role: 'USER',\n        token: 'mock-jwt-token',\n      };\n      if (email.includes('admin')) {\n        mockUser.role = 'ADMIN';\n      } else if (email.includes('manager')) {\n        mockUser.role = 'MANAGER';\n      } else if (email.includes('super')) {\n        mockUser.role = 'SUPER_ADMIN';\n      }\n      setUser(mockUser);\n      localStorage.setItem('websiteGenerator_user', JSON.stringify(mockUser));\n    } finally {\n      setIsLoading(false);\n    }\n  };\n\n  const logout = async () => {\n    setIsLoading(true);\n    try {\n      setUser(null);\n      localStorage.removeItem('websiteGenerator_user');\n    } finally {\n      setIsLoading(false);\n    }\n  };\n\n  const hasRole = (roles: Role | Role[]): boolean => {\n    if (!user) return false;\n    const requiredRoles = Array.isArray(roles) ? roles : [roles];\n    return requiredRoles.includes(user.role);\n  };\n\n  return (\n    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, hasRole }}>\n      {children}\n    </AuthContext.Provider>\n  );\n};\n")];
                    case 4:
                        // 1. src/lib/auth.tsx
                        _a.sent();
                        // 2. src/hooks/useAuth.ts
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(hooksDir, 'useAuth.ts'), "import { useContext } from 'react';\nimport { AuthContext } from '../lib/auth';\n\nexport function useAuth() {\n  const context = useContext(AuthContext);\n  if (!context) {\n    throw new Error('useAuth must be used within an AuthProvider');\n  }\n  return context;\n}\n")];
                    case 5:
                        // 2. src/hooks/useAuth.ts
                        _a.sent();
                        // 3. src/components/system/ProtectedRoute.tsx
                        return [4 /*yield*/, promises_1.default.writeFile(path_1.default.join(systemDir, 'ProtectedRoute.tsx'), "import React from 'react';\nimport { Navigate, useLocation } from 'react-router-dom';\nimport { useAuth } from '../../hooks/useAuth';\nimport { Role } from '../../lib/auth';\n\ninterface ProtectedRouteProps {\n  children: React.ReactNode;\n  allowedRoles?: Role[];\n}\n\nexport const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {\n  const { isAuthenticated, isLoading, hasRole } = useAuth();\n  const location = useLocation();\n\n  if (isLoading) {\n    return (\n      <div className=\"min-h-screen bg-slate-900 flex items-center justify-center\">\n        <div className=\"animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500\" />\n      </div>\n    );\n  }\n\n  if (!isAuthenticated) {\n    return <Navigate to=\"/login\" state={{ from: location }} replace />;\n  }\n\n  if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {\n    return <Navigate to=\"/unauthorized\" replace />;\n  }\n\n  return <>{children}</>;\n};\n")];
                    case 6:
                        // 3. src/components/system/ProtectedRoute.tsx
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    SystemScaffold.getMainTsxContent = function () {
        return "import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App.tsx'\nimport './index.css'\nimport { ErrorBoundary } from './components/system/ErrorBoundary'\nimport { QueryClientProvider } from '@tanstack/react-query'\nimport { queryClient } from './lib/query-client'\nimport { AuthProvider } from './lib/auth'\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <ErrorBoundary>\n      <QueryClientProvider client={queryClient}>\n        <AuthProvider>\n          <App />\n        </AuthProvider>\n      </QueryClientProvider>\n    </ErrorBoundary>\n  </React.StrictMode>,\n)\n";
    };
    return SystemScaffold;
}());
exports.SystemScaffold = SystemScaffold;
