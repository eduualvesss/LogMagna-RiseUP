'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/auth-context';
import { NotifContext } from '@/hooks/notificacoes-context';
import { suporteService } from '@/services/suporte.service';

export function NotificacoesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [naoLidas, setNaoLidas] = useState(0);

  const refreshNotificacoes = useCallback(async () => {
    try {
      const res = await suporteService.listNotificacoes('nao_lidas');
      setNaoLidas(Number(res.naoLidas || 0));
    } catch {
      // ignora erro silencioso na atualizacao do contador
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    suporteService
      .listNotificacoes('nao_lidas', controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) {
          setNaoLidas(Number(res.naoLidas || 0));
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [user]);

  return (
    <NotifContext.Provider value={{ naoLidas, refreshNotificacoes }}>
      {children}
    </NotifContext.Provider>
  );
}
