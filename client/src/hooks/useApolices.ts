'use client';

import { useCallback, useEffect, useState } from 'react';
import { segurosService } from '@/services/seguros.service';
import type { ApoliceItem, SeguradoraItem } from '@/types';

export function useApolices() {
  const [apolices, setApolices] = useState<ApoliceItem[]>([]);
  const [seguradoras, setSeguradoras] = useState<SeguradoraItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const recarregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const [aps, segs] = await Promise.all([
        segurosService.listApolices(),
        segurosService.listSeguradoras(),
      ]);
      setApolices(Array.isArray(aps) ? aps : []);
      setSeguradoras(Array.isArray(segs) ? segs : []);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar apólices.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      segurosService.listApolices(controller.signal),
      segurosService.listSeguradoras(controller.signal),
    ])
      .then(([aps, segs]) => {
        if (controller.signal.aborted) return;
        setApolices(Array.isArray(aps) ? aps : []);
        setSeguradoras(Array.isArray(segs) ? segs : []);
        setErro('');
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (!controller.signal.aborted) {
          setErro(err instanceof Error ? err.message : 'Erro ao carregar apólices.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return { apolices, seguradoras, loading, erro, recarregar };
}
