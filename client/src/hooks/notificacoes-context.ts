'use client';

import { createContext, useContext } from 'react';

export const NotifContext = createContext<{
  naoLidas: number;
  refreshNotificacoes: () => Promise<void>;
}>({
  naoLidas: 0,
  refreshNotificacoes: async () => {},
});

export function useNotificacoesHeader() {
  return useContext(NotifContext);
}
