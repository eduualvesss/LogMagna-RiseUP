'use client';

import { useCallback, useEffect, useState } from 'react';
import { dashboardService } from '@/services/dashboard.service';
import type { DashboardResponse } from '@/types';

export function useDashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const recarregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const res = await dashboardService.getDashboard();
      setData(res);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar painel.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    dashboardService
      .getDashboard(controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) {
          setData(res);
          setErro('');
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (!controller.signal.aborted) {
          setErro(err instanceof Error ? err.message : 'Erro ao carregar painel.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return { data, loading, erro, recarregar };
}
