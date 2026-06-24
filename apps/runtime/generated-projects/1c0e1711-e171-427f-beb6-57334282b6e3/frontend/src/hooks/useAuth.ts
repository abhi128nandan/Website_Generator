import { authService } from '../services/authService';
import { useEffect, useState } from 'react';

export function useAuth() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(authService.getToken());

  useEffect(() => {
    setToken(authService.getToken());
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const result = await authService.login(email, password);
        if (result.token) {
          setToken(result.token);
        } else if (result.error) {
          setError(result.error);
        }
      } catch (e) {
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const register = useCallback(
    async (email: string, password: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const result = await authService.register(email, password);
        if (result.success) {
          setError(null);
        } else if (result.error) {
          setError(result.error);
        }
      } catch (error) {
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    authService.logout();
    setToken(null);
  }, []);

  return {
    isAuthenticated: authService.isAuthenticated(),
    token,
    loading,
    error,
    login,
    register,
    logout,
  };
}