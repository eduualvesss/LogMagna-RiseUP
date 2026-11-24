import { api } from './api';
import type { UnidadeItem } from '@/types';

export const unidadesService = {
  list: (busca: string, status: string, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    if (busca) params.set('busca', busca);
    if (status) params.set('status', status);
    const qs = params.toString();
    return api.get<UnidadeItem[]>(`/unidades${qs ? `?${qs}` : ''}`, { signal });
  },
  create: (payload: { nome: string; tipo: string; cidade: string; estado: string; status: string }) =>
    api.post<UnidadeItem>('/unidades', payload),
  update: (
    id: number,
    payload: { nome: string; tipo: string; cidade: string; estado: string; status: string; version?: number }
  ) => api.put<UnidadeItem>(`/unidades/${id}`, payload),
  remove: (id: number) => api.delete(`/unidades/${id}`),
};
