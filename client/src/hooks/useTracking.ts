'use client';

import { useCallback, useEffect, useState } from 'react';
import { pedidosService } from '@/services/pedidos.service';
import { sinistrosService } from '@/services/sinistros.service';
import type { PublicTrackingData, TrackingData } from '@/types';

export function usePublicTracking(initialCode: string) {
  const [data, setData] = useState<PublicTrackingData | null>(null);
  const [loading, setLoading] = useState(() => Boolean(initialCode.trim()));
  const [erro, setErro] = useState('');

  const buscar = useCallback(async (codigo: string) => {
    const limpo = codigo.trim();
    if (!limpo) {
      setData(null);
      setErro('');
      return;
    }
    setLoading(true);
    setErro('');
    try {
      const res = await pedidosService.getPublicTracking(limpo);
      setData(res);
    } catch (err) {
      setData(null);
      setErro(err instanceof Error ? err.message : 'Erro ao rastrear encomenda.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialCode.trim()) return;
    const controller = new AbortController();
    pedidosService
      .getPublicTracking(initialCode.trim(), controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) {
          setData(res);
          setErro('');
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (!controller.signal.aborted) {
          setData(null);
          setErro(err instanceof Error ? err.message : 'Erro ao rastrear encomenda.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [initialCode]);

  return { data, loading, erro, buscar };
}

export function usePrivateTracking(initialCode: string) {
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(() => Boolean(initialCode.trim()));
  const [erro, setErro] = useState('');

  const buscar = useCallback(async (codigo: string) => {
    const limpo = codigo.trim();
    if (!limpo) {
      setData(null);
      setErro('');
      return;
    }
    setLoading(true);
    setErro('');
    try {
      const res = await pedidosService.getPrivateTracking(limpo);
      setData(res);
    } catch (err) {
      setData(null);
      setErro(err instanceof Error ? err.message : 'Erro ao rastrear encomenda.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialCode.trim()) return;
    const controller = new AbortController();
    pedidosService
      .getPrivateTracking(initialCode.trim(), controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) {
          setData(res);
          setErro('');
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (!controller.signal.aborted) {
          setData(null);
          setErro(err instanceof Error ? err.message : 'Erro ao rastrear encomenda.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [initialCode]);

  const codigoAtual = data?.codigo_rastreio;

  const registrarEvento = useCallback(
    async (idRemessa: string, payload: { descricao: string; localizacao?: string; status_entrega?: string }) => {
      await pedidosService.createEventoRemessa(idRemessa, payload);
      if (codigoAtual) {
        await buscar(codigoAtual);
      }
    },
    [buscar, codigoAtual]
  );

  const registrarOcorrencia = useCallback(
    async (payload: { id_remessa: string; tipo: string; descricao: string }) => {
      await sinistrosService.createOcorrencia(payload);
      if (codigoAtual) {
        await buscar(codigoAtual);
      }
    },
    [buscar, codigoAtual]
  );

  return { data, loading, erro, buscar, registrarEvento, registrarOcorrencia };
}
