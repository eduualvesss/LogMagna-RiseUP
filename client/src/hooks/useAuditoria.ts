'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminService } from '@/services/admin.service';
import { segurosService } from '@/services/seguros.service';
import type { CategoriaItem, LogAuditoria, UsuarioAdminItem } from '@/types';

export function useAuditoria(filtroEntidade: string, buscaLog: string) {
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioAdminItem[]>([]);
  const [categorias, setCategorias] = useState<CategoriaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const recarregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const [ls, us, cats] = await Promise.all([
        adminService.listAuditoria(filtroEntidade, buscaLog),
        adminService.listUsuarios(),
        segurosService.listCategorias(),
      ]);
      setLogs(Array.isArray(ls) ? ls : []);
      setUsuarios(Array.isArray(us) ? us : []);
      setCategorias(Array.isArray(cats) ? cats : []);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar dados administrativos.');
    } finally {
      setLoading(false);
    }
  }, [filtroEntidade, buscaLog]);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      adminService.listAuditoria(filtroEntidade, buscaLog, controller.signal),
      adminService.listUsuarios(controller.signal),
      segurosService.listCategorias(controller.signal),
    ])
      .then(([ls, us, cats]) => {
        if (controller.signal.aborted) return;
        setLogs(Array.isArray(ls) ? ls : []);
        setUsuarios(Array.isArray(us) ? us : []);
        setCategorias(Array.isArray(cats) ? cats : []);
        setErro('');
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (!controller.signal.aborted) {
          setErro(err instanceof Error ? err.message : 'Erro ao carregar dados administrativos.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [filtroEntidade, buscaLog]);

  return { logs, usuarios, categorias, loading, erro, recarregar };
}
