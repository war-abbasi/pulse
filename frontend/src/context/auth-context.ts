import { createContext } from 'react';
import type { LoginPayload, PublicUser, RegisterPayload } from '../types';

export interface AuthContextValue {
  user: PublicUser | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
