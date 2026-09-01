import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { apiClient, getErrorMessage, setAuthTokens, setTokenRefreshHandlers } from '../api/client';
import type { AuthResponse, User } from '../types';

const STORAGE_KEY = 'socialpage.auth';

interface Credentials {
  email: string;
  password: string;
}

interface RegisterInput extends Credentials {
  username: string;
}

interface AuthResult {
  ok: boolean;
  message?: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  ready: boolean;
  login: (credentials: Credentials) => Promise<AuthResult>;
  register: (input: RegisterInput) => Promise<AuthResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredAuth(): AuthResponse | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthResponse) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthResponse | null>(() => readStoredAuth());
  const [ready, setReady] = useState(false);
  const authRef = useRef(auth);
  authRef.current = auth;

  function persist(nextAuth: AuthResponse | null) {
    setAuth(nextAuth);
    if (nextAuth) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAuth));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  useEffect(() => {
    setAuthTokens(auth ? { accessToken: auth.accessToken, refreshToken: auth.refreshToken } : null);
    setReady(true);
  }, [auth?.accessToken, auth?.refreshToken]);

  useEffect(() => {
    setTokenRefreshHandlers({
      onRefreshed: (tokens) => {
        const current = authRef.current;
        if (!current) return;
        persist({ ...current, ...tokens });
      },
      onRefreshFailed: () => persist(null),
    });
  }, []);

  async function login({ email, password }: Credentials): Promise<AuthResult> {
    try {
      const { data } = await apiClient.post<AuthResponse>('/api/auth/login', { email, password });
      persist(data);
      return { ok: true };
    } catch (error) {
      return { ok: false, message: getErrorMessage(error) };
    }
  }

  async function register({ username, email, password }: RegisterInput): Promise<AuthResult> {
    try {
      const { data } = await apiClient.post<AuthResponse>('/api/auth/register', { username, email, password });
      persist(data);
      return { ok: true };
    } catch (error) {
      return { ok: false, message: getErrorMessage(error) };
    }
  }

  function logout() {
    const refreshToken = authRef.current?.refreshToken;
    persist(null);
    if (refreshToken) {
      apiClient.post('/api/auth/logout', { refreshToken }).catch(() => {
        // best-effort: token will simply expire server-side if this fails
      });
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user: auth?.user ?? null,
      isAuthenticated: Boolean(auth?.accessToken),
      ready,
      login,
      register,
      logout,
    }),
    [auth, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
