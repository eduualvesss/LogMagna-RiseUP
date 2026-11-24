'use client';

import { createContext, useContext } from 'react';
import type {
  ChangePasswordPayload,
  ClientePerfil,
  RegisterPayload,
  UpdateProfilePayload,
  User,
} from '@/types';

export interface AuthContextValue {
  user: User | null;
  cliente: ClientePerfil | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  changePassword: (payload: ChangePasswordPayload) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser utilizado dentro de AuthProvider.');
  }
  return ctx;
}
