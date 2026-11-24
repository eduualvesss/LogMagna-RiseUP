import { api } from './api';
import type { DocumentoItem, OcorrenciaItem, SinistroItem } from '@/types';

export const sinistrosService = {
  listOcorrencias: (signal?: AbortSignal) => api.get<OcorrenciaItem[]>('/ocorrencias', { signal }),
  createOcorrencia: (payload: { id_remessa: string; tipo: string; descricao: string }) =>
    api.post<OcorrenciaItem>('/ocorrencias', payload),

  listSinistros: (signal?: AbortSignal) => api.get<SinistroItem[]>('/sinistros', { signal }),
  createSinistro: (payload: {
    ocorrencia_id_ocorrencia: string;
    status: string;
    valor_indenizado: number | null;
    etapa_mais_dificil: string;
    motivo_nao_acionamento: string;
  }) => api.post<SinistroItem>('/sinistros', payload),
  updateSinistro: (
    id: string,
    payload: {
      status: string;
      valor_indenizado: number | null;
      etapa_mais_dificil: string;
      motivo_nao_acionamento: string;
    }
  ) => api.put<SinistroItem>(`/sinistros/${encodeURIComponent(id)}`, payload),

  addDocumento: (idSinistro: string, payload: { tipo: string; arquivo: string }) =>
    api.post<DocumentoItem>(`/sinistros/${encodeURIComponent(idSinistro)}/documentos`, payload),
  toggleValidacaoDocumento: (idDocumento: string, validado: boolean) =>
    api.patch<DocumentoItem>(`/documentos/${encodeURIComponent(idDocumento)}`, { validado }),
  deleteDocumento: (idDocumento: string) =>
    api.delete(`/documentos/${encodeURIComponent(idDocumento)}`),
};
