import { api } from './api';
import type { AtendimentoItem, FeedbackItem, NotificacaoItem, NotificacoesResponse } from '@/types';

export const suporteService = {
  listNotificacoes: (filtro: 'todas' | 'nao_lidas' = 'todas', signal?: AbortSignal) => {
    const qs = filtro === 'nao_lidas' ? '?lida=0' : '';
    return api.get<NotificacoesResponse>(`/notificacoes${qs}`, { signal });
  },
  createNotificacao: (payload: { tipo: string; canal: string; cliente_id_cliente?: string }) =>
    api.post<NotificacaoItem>('/notificacoes', payload),
  toggleNotificacaoLida: (id: string, lida: boolean) =>
    api.patch<NotificacaoItem>(`/notificacoes/${encodeURIComponent(id)}/lida`, { lida }),
  marcarTodasLidas: () => api.post<{ ok: boolean }>('/notificacoes/marcar-todas-lidas'),
  deleteNotificacao: (id: string) => api.delete(`/notificacoes/${encodeURIComponent(id)}`),

  listAtendimentos: (signal?: AbortSignal) => api.get<AtendimentoItem[]>('/atendimentos', { signal }),
  createAtendimento: (payload: {
    canal: string;
    assunto: string;
    id_pedido?: string;
    exigiu_repetir_informacao: string;
    atendido_por: string;
    resolvido: boolean;
  }) => api.post<AtendimentoItem>('/atendimentos', payload),
  updateAtendimento: (id: string, payload: { resolvido: boolean }) =>
    api.patch<AtendimentoItem>(`/atendimentos/${encodeURIComponent(id)}`, payload),

  listFeedbacks: (signal?: AbortSignal) => api.get<FeedbackItem[]>('/feedbacks', { signal }),
  createFeedback: (payload: {
    relato_problema: string;
    solucao_esperada: string;
    nivel_compreensao_seguro: string;
    momento_conhecimento_seguro: string;
    aceita_assistente_virtual: string;
  }) => api.post<FeedbackItem>('/feedbacks', payload),
};
