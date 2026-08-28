import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { setToken } from '../api/client';
import { auth as authApi } from '../api/endpoints';
import type { LoginRequest, Role } from '../api/types';

interface Session {
  role: Role;
  fullName: string;
  email: string;
}

interface AuthValue {
  session: Session | null;
  login: (body: LoginRequest, remember?: boolean) => Promise<Session>;
  logout: () => void;
}

const SESSION_KEY = 'erp.session';

const AuthContext = createContext<AuthValue | null>(null);

function readStoredSession(): Session | null {
  const raw = sessionStorage.getItem(SESSION_KEY) ?? localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readStoredSession);

  const logout = useCallback(() => {
    setToken(null);
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, []);

  // The api client fires this when any request comes back 401.
  useEffect(() => {
    window.addEventListener('erp:unauthorized', logout);
    return () => window.removeEventListener('erp:unauthorized', logout);
  }, [logout]);

  /** `remember` false keeps the session in this tab only. */
  const login = useCallback(async (body: LoginRequest, remember = true) => {
    const res = await authApi.login(body);
    setToken(res.token, remember);
    const next: Session = {
      role: res.role,
      fullName: res.fullName,
      email: body.email,
    };
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    (remember ? localStorage : sessionStorage)
      .setItem(SESSION_KEY, JSON.stringify(next));
    setSession(next);
    return next;
  }, []);

  const value = useMemo(() => ({ session, login, logout }), [session, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}

export const HOME_FOR_ROLE: Record<Role, string> = {
  ADMIN: '/admin',
  FACULTY: '/faculty',
  STUDENT: '/student',
};
