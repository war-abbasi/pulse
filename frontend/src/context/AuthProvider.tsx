import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setUnauthorizedHandler, tokenStorage } from '../services/api';
import { authService } from '../services/authService';
import type { AuthResponse, LoginPayload, PublicUser, RegisterPayload } from '../types';
import { AuthContext } from './auth-context';

const USER_KEY = 'pulse.user';

/**
 * Reads the persisted user synchronously. Doing this in useState's initialiser
 * rather than in an effect matters: if the value arrived one render late, every
 * refresh would briefly look unauthenticated and ProtectedRoute would bounce
 * the user to the login page.
 */
function readStoredUser(): PublicUser | null {
  if (!tokenStorage.get()) return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as PublicUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(readStoredUser);

  const applySession = useCallback(({ accessToken, user: nextUser }: AuthResponse) => {
    // Only the token and a public profile are persisted. There is no password
    // hash to store, because the API never sends one.
    tokenStorage.set(accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => applySession(await authService.login(payload)),
    [applySession],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => applySession(await authService.register(payload)),
    [applySession],
  );

  // If any request comes back 401 (expired or tampered token), drop the
  // session here so the whole app reacts at once.
  useEffect(() => setUnauthorizedHandler(logout), [logout]);

  const value = useMemo(
    () => ({ user, isAuthenticated: user !== null, login, register, logout }),
    [user, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
