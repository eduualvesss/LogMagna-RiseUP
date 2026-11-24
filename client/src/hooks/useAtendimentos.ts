'use client';

import { useCallback, useEffect, useState } from 'react';
import { pedidosService } from '@/services/pedidos.service';
import { suporteService } from '@/services/suporte.service';
import type { AtendimentoItem, FeedbackItem, PedidoItem } from '@/types';

export function useAtendimentos() {
  const [atendimentos, setAtendimentos] = useState<AtendimentoItem[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [pedidos, setPedidos] = useState<PedidoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const recarregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const [atds, fdbs, peds] = await Promise.all([
        suporteService.listAtendimentos(),
        suporteService.listFeedbacks(),
        pedidosService.list(),
      ]);
      setAtendimentos(Array.isArray(atds) ? atds : []);
      setFeedbacks(Array.isArray(fdbs) ? fdbs : []);
      setPedidos(Array.isArray(peds) ? peds : []);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar atendimentos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      suporteService.listAtendimentos(controller.signal),
      suporteService.listFeedbacks(controller.signal),
      pedidosService.list(controller.signal),
    ])
      .then(([atds, fdbs, peds]) => {
        if (controller.signal.aborted) return;
        setAtendimentos(Array.isArray(atds) ? atds : []);
        setFeedbacks(Array.isArray(fdbs) ? fdbs : []);
        setPedidos(Array.isArray(peds) ? peds : []);
        setErro('');
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (!controller.signal.aborted) {
          setErro(err instanceof Error ? err.message : 'Erro ao carregar atendimentos.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return { atendimentos, feedbacks, pedidos, loading, erro, recarregar };
}
