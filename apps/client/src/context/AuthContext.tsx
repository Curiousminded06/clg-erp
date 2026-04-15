import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useContext,
  useState
} from 'react';
import type { PropsWithChildren } from 'react';
import { api } from '../lib/api';
import type { AuthResponse, AuthUser, Role } from '../types/auth';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, role: Role) => Promise<AuthUser>;
  register: (fullName: string, email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function persistToken(token: string | null) {
  if (token) {
    localStorage.setItem('erp_access_token', token);
  } else {
    localStorage.removeItem('erp_access_token');
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('erp_access_token'));
  const [loading, setLoading] = useState(true);

  const setSession = useCallback((payload: AuthResponse | null) => {
    if (!payload) {
      setUser(null);
      setToken(null);
      persistToken(null);
      return;
    }

    setUser(payload.user);
    setToken(payload.token);
    persistToken(payload.token);
  }, []);

  const bootstrap = useCallback(async () => {
    try {
      if (!token) {
        return;
      }

      const { data } = await api.get<{ success: boolean; user: AuthUser }>('/auth/me');
      setUser(data.user);
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [setSession, token]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(
    async (email: string, password: string, role: Role) => {
      const { data } = await api.post<AuthResponse>('/auth/login', { email, password, role });
      setSession(data);
      return data.user;
    },
    [setSession]
  );

  const register = useCallback(
    async (fullName: string, email: string, password: string) => {
      const { data } = await api.post<AuthResponse>('/auth/register', {
        fullName,
        email,
        password,
        role: 'student'
      });
      setSession(data);
      return data.user;
    },
    [setSession]
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setSession(null);
    }
  }, [setSession]);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [loading, login, logout, register, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
