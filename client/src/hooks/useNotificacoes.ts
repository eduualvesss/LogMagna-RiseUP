'use client';

import { useCallback, useEffect, useState } from 'react';
import { suporteService } from '@/services/suporte.service';
import type { NotificacaoItem } from '@/types';

export function useNotificacoes(filtro: 'todas' | 'nao_lidas') {
  const [items, setItems] = useState<NotificacaoItem[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const recarregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const res = await suporteService.listNotificacoes(filtro);
      setItems(Array.isArray(res.items) ? res.items : []);
      setNaoLidas(Number(res.naoLidas || 0));
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar notificações.');
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => {
    const controller = new AbortController();
    suporteService
      .listNotificacoes(filtro, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setItems(Array.isArray(res.items) ? res.items : []);
        setNaoLidas(Number(res.naoLidas || 0));
        setErro('');
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (!controller.signal.aborted) {
          setErro(err instanceof Error ? err.message : 'Erro ao carregar notificações.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [filtro]);

  return { items, naoLidas, loading, erro, recarregar };
}
