import { api } from './api';
import type { ApoliceItem, CategoriaItem, SeguradoraItem } from '@/types';

export const segurosService = {
  listCategorias: (signal?: AbortSignal) => api.get<CategoriaItem[]>('/categorias', { signal }),
  createCategoria: (descricao: string) => api.post<CategoriaItem>('/categorias', { descricao }),
  updateCategoria: (id: string, descricao: string) =>
    api.put<CategoriaItem>(`/categorias/${encodeURIComponent(id)}`, { descricao }),
  deleteCategoria: (id: string) => api.delete(`/categorias/${encodeURIComponent(id)}`),

  listSeguradoras: (signal?: AbortSignal) => api.get<SeguradoraItem[]>('/seguradoras', { signal }),
  createSeguradora: (payload: { razao_social: string; contato: string }) =>
    api.post<SeguradoraItem>('/seguradoras', payload),
  updateSeguradora: (id: string, payload: { razao_social: string; contato: string }) =>
    api.put<SeguradoraItem>(`/seguradoras/${encodeURIComponent(id)}`, payload),
  deleteSeguradora: (id: string) => api.delete(`/seguradoras/${encodeURIComponent(id)}`),

  listApolices: (signal?: AbortSignal) => api.get<ApoliceItem[]>('/apolices', { signal }),
  createApolice: (payload: {
    id_seguradora: string;
    valor_segurado: number;
    valor_premio?: number;
    vigencia_inicio: string;
    vigencia_fim: string;
    coberturas: string;
  }) => api.post<ApoliceItem>('/apolices', payload),
  updateApolice: (
    id: string,
    payload: {
      id_seguradora: string;
      valor_segurado: number;
      valor_premio?: number;
      vigencia_inicio: string;
      vigencia_fim: string;
      coberturas: string;
    }
  ) => api.put<ApoliceItem>(`/apolices/${encodeURIComponent(id)}`, payload),
};
