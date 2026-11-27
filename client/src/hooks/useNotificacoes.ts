'use client';

import { useCallback, useEffect, useState } from 'react';
import { suporteService } from '@/services/suporte.service';
import type { NotificacaoItem } from '@/types';

export function useNotificacoes(filtro: 'todas' | 'nao_lidas') {
  const [items, setItems] = useState<NotificacaoItem[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const recarregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const [res, resTodas] = await Promise.all([
        suporteService.listNotificacoes(filtro),
        filtro === 'todas' ? Promise.resolve(null) : suporteService.listNotificacoes('todas'),
      ]);
      const lista = Array.isArray(res.items) ? res.items : [];
      setItems(lista);
      setNaoLidas(Number(res.naoLidas || 0));
      setTotal(resTodas ? (Array.isArray(resTodas.items) ? resTodas.items.length : 0) : lista.length);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar notificações.');
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      suporteService.listNotificacoes(filtro, controller.signal),
      filtro === 'todas' ? Promise.resolve(null) : suporteService.listNotificacoes('todas', controller.signal),
    ])
      .then(([res, resTodas]) => {
        if (controller.signal.aborted) return;
        const lista = Array.isArray(res.items) ? res.items : [];
        setItems(lista);
        setNaoLidas(Number(res.naoLidas || 0));
        setTotal(resTodas ? (Array.isArray(resTodas.items) ? resTodas.items.length : 0) : lista.length);
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

  return { items, naoLidas, total, loading, erro, recarregar };
}
