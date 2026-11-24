'use client';

import { useCallback, useEffect, useState } from 'react';
import { pedidosService } from '@/services/pedidos.service';
import { segurosService } from '@/services/seguros.service';
import type {
  CategoriaItem,
  CreatePedidoPayload,
  PedidoItem,
  SeguradoraItem,
  UpdatePedidoPayload,
} from '@/types';

export function usePedidos() {
  const [pedidos, setPedidos] = useState<PedidoItem[]>([]);
  const [categorias, setCategorias] = useState<CategoriaItem[]>([]);
  const [seguradoras, setSeguradoras] = useState<SeguradoraItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const recarregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const [peds, cats, segs] = await Promise.all([
        pedidosService.list(),
        segurosService.listCategorias(),
        segurosService.listSeguradoras(),
      ]);
      setPedidos(Array.isArray(peds) ? peds : []);
      setCategorias(Array.isArray(cats) ? cats : []);
      setSeguradoras(Array.isArray(segs) ? segs : []);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar pedidos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      pedidosService.list(controller.signal),
      segurosService.listCategorias(controller.signal),
      segurosService.listSeguradoras(controller.signal),
    ])
      .then(([peds, cats, segs]) => {
        if (controller.signal.aborted) return;
        setPedidos(Array.isArray(peds) ? peds : []);
        setCategorias(Array.isArray(cats) ? cats : []);
        setSeguradoras(Array.isArray(segs) ? segs : []);
        setErro('');
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (!controller.signal.aborted) {
          setErro(err instanceof Error ? err.message : 'Erro ao carregar pedidos.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const criarPedido = useCallback(async (payload: CreatePedidoPayload) => {
    const criado = await pedidosService.create(payload);
    await recarregar();
    return criado;
  }, [recarregar]);

  const atualizarPedido = useCallback(async (id: string, payload: UpdatePedidoPayload) => {
    const atualizado = await pedidosService.update(id, payload);
    await recarregar();
    return atualizado;
  }, [recarregar]);

  const excluirPedido = useCallback(async (id: string) => {
    await pedidosService.remove(id);
    await recarregar();
  }, [recarregar]);

  return {
    pedidos,
    categorias,
    seguradoras,
    loading,
    erro,
    recarregar,
    criarPedido,
    atualizarPedido,
    excluirPedido,
  };
}
