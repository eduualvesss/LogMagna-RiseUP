'use client';

import { useCallback, useEffect, useState } from 'react';
import { pedidosService } from '@/services/pedidos.service';
import { sinistrosService } from '@/services/sinistros.service';
import type { OcorrenciaItem, PedidoItem, SinistroItem } from '@/types';

export function useSinistros() {
  const [sinistros, setSinistros] = useState<SinistroItem[]>([]);
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaItem[]>([]);
  const [pedidos, setPedidos] = useState<PedidoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const recarregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const [sins, ocos, peds] = await Promise.all([
        sinistrosService.listSinistros(),
        sinistrosService.listOcorrencias(),
        pedidosService.list(),
      ]);
      setSinistros(Array.isArray(sins) ? sins : []);
      setOcorrencias(Array.isArray(ocos) ? ocos : []);
      setPedidos(Array.isArray(peds) ? peds : []);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar sinistros.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      sinistrosService.listSinistros(controller.signal),
      sinistrosService.listOcorrencias(controller.signal),
      pedidosService.list(controller.signal),
    ])
      .then(([sins, ocos, peds]) => {
        if (controller.signal.aborted) return;
        setSinistros(Array.isArray(sins) ? sins : []);
        setOcorrencias(Array.isArray(ocos) ? ocos : []);
        setPedidos(Array.isArray(peds) ? peds : []);
        setErro('');
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (!controller.signal.aborted) {
          setErro(err instanceof Error ? err.message : 'Erro ao carregar sinistros.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return { sinistros, ocorrencias, pedidos, loading, erro, recarregar };
}
