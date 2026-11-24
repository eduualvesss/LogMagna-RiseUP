'use client';

import { useCallback, useEffect, useState } from 'react';
import { unidadesService } from '@/services/unidades.service';
import type { UnidadeItem } from '@/types';

export function useUnidades(busca: string, filtroStatus: string) {
  const [unidades, setUnidades] = useState<UnidadeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const recarregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const data = await unidadesService.list(busca, filtroStatus);
      setUnidades(Array.isArray(data) ? data : []);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar unidades.');
    } finally {
      setLoading(false);
    }
  }, [busca, filtroStatus]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const data = await unidadesService.list(busca, filtroStatus, controller.signal);
        if (!controller.signal.aborted) {
          setUnidades(Array.isArray(data) ? data : []);
          setErro('');
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (!controller.signal.aborted) {
          setErro(err instanceof Error ? err.message : 'Erro ao carregar unidades.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [busca, filtroStatus]);

  return { unidades, loading, erro, recarregar };
}
