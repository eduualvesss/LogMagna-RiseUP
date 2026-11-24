import { api } from './api';
import type { CreateUserPayload, LogAuditoria, UsuarioAdminItem } from '@/types';

export const adminService = {
  listAuditoria: (entidade: string, busca: string, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    if (entidade) params.set('entidade', entidade);
    if (busca.trim()) params.set('busca', busca.trim());
    const qs = params.toString();
    return api.get<LogAuditoria[]>(`/auditoria${qs ? `?${qs}` : ''}`, { signal });
  },

  listUsuarios: (signal?: AbortSignal) => api.get<UsuarioAdminItem[]>('/usuarios', { signal }),

  createUsuario: (payload: CreateUserPayload) => api.post<UsuarioAdminItem>('/usuarios', payload),

  toggleUsuarioAtivo: (id: string, ativo: boolean) =>
    api.patch<UsuarioAdminItem>(`/usuarios/${encodeURIComponent(id)}/ativo`, { ativo }),

  updateUsuarioPerfil: (id: string, perfil: 'admin' | 'cliente') =>
    api.patch<UsuarioAdminItem>(`/usuarios/${encodeURIComponent(id)}/perfil`, { perfil }),
};
