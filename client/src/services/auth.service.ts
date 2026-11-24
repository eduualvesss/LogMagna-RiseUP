import { api } from './api';
import type {
  ChangePasswordPayload,
  ClientePerfil,
  RegisterPayload,
  Session,
  SetupStatus,
  UpdateProfilePayload,
  User,
} from '@/types';

export const authService = {
  getSetupStatus: (signal?: AbortSignal) =>
    api.get<SetupStatus>('/auth/setup-status', { skipAuth: true, signal }),

  login: (email_corporativo: string, password: string) =>
    api.post<Session>('/auth/login', { email_corporativo, password }, { skipAuth: true }),

  register: (payload: RegisterPayload) =>
    api.post<Session>('/auth/register', payload, { skipAuth: true }),

  logout: () => api.post<void>('/auth/logout'),

  getMe: (signal?: AbortSignal) =>
    api.get<{ user: User; cliente: ClientePerfil | null }>('/auth/me', { signal }),

  updateProfile: (payload: UpdateProfilePayload) =>
    api.put<{ user: User; cliente: ClientePerfil | null }>('/auth/profile', payload),

  changePassword: (payload: ChangePasswordPayload) =>
    api.put<{ ok: boolean }>('/auth/password', payload),
};
