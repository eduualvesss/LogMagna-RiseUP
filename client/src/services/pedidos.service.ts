import { api } from './api';
import type {
  CreatePedidoPayload,
  EventoRastreioItem,
  PedidoItem,
  PublicTrackingData,
  TrackingData,
  UpdatePedidoPayload,
} from '@/types';

export const pedidosService = {
  list: (signal?: AbortSignal) => api.get<PedidoItem[]>('/pedidos', { signal }),

  getById: (id: string, signal?: AbortSignal) => api.get<PedidoItem>(`/pedidos/${encodeURIComponent(id)}`, { signal }),

  create: (payload: CreatePedidoPayload) => api.post<PedidoItem>('/pedidos', payload),

  update: (id: string, payload: UpdatePedidoPayload) =>
    api.patch<PedidoItem>(`/pedidos/${encodeURIComponent(id)}`, payload),

  remove: (id: string) => api.delete(`/pedidos/${encodeURIComponent(id)}`),

  getPublicTracking: (code: string, signal?: AbortSignal) =>
    api.get<PublicTrackingData>(`/tracking/${encodeURIComponent(code.trim())}`, { skipAuth: true, signal }),

  getPrivateTracking: (code: string, signal?: AbortSignal) =>
    api.get<TrackingData>(`/pedidos/rastreio/${encodeURIComponent(code.trim())}`, { signal }),

  createEventoRemessa: (
    idRemessa: string,
    payload: { descricao: string; localizacao?: string; status_entrega?: string }
  ) => api.post<EventoRastreioItem>(`/remessas/${encodeURIComponent(idRemessa)}/eventos`, payload),
};
