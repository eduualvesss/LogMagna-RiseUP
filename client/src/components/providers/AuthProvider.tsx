'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/hooks/auth-context';
import { clearSession, getSession, isValidUser, saveSession } from '@/lib/storage';
import { authService } from '@/services/auth.service';
import type {
  ChangePasswordPayload,
  ClientePerfil,
  RegisterPayload,
  UpdateProfilePayload,
  User,
} from '@/types';

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [cliente, setCliente] = useState<ClientePerfil | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    const session = getSession();
    if (!session) {
      setUser(null);
      setCliente(null);
      return;
    }
    try {
      const data = await authService.getMe();
      if (isValidUser(data.user)) {
        setUser(data.user);
        setCliente(data.cliente ?? null);
      } else {
        clearSession();
        setUser(null);
        setCliente(null);
      }
    } catch {
      // Se for 401, o evento logmagna:unauthorized limpa a sessao
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const session = getSession();

    async function hidratar() {
      if (!session) {
        if (!controller.signal.aborted) {
          setUser(null);
          setCliente(null);
          setLoading(false);
        }
        return;
      }

      try {
        const data = await authService.getMe(controller.signal);
        if (controller.signal.aborted) return;
        if (isValidUser(data.user)) {
          setUser(data.user);
          setCliente(data.cliente ?? null);
        } else {
          clearSession();
          setUser(null);
          setCliente(null);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        // Mantem usuario da sessao local apenas se nao foi 401
        if (getSession()) {
          setUser(session.user);
        } else {
          setUser(null);
          setCliente(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void hidratar();

    const handleUnauthorized = () => {
      setUser(null);
      setCliente(null);
      setLoading(false);
      router.replace('/login');
    };

    window.addEventListener('logmagna:unauthorized', handleUnauthorized);
    return () => {
      controller.abort();
      window.removeEventListener('logmagna:unauthorized', handleUnauthorized);
    };
  }, [router]);

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    const session = await authService.login(email, password);
    saveSession(session, remember);
    setUser(session.user);
    try {
      const me = await authService.getMe();
      setUser(me.user);
      setCliente(me.cliente ?? null);
      return me.user;
    } catch {
      return session.user;
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const session = await authService.register(payload);
    saveSession(session, true);
    setUser(session.user);
    try {
      const me = await authService.getMe();
      setUser(me.user);
      setCliente(me.cliente ?? null);
      return me.user;
    } catch {
      return session.user;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (getSession()) {
        await authService.logout();
      }
    } catch {
      // ignora erro de rede ao sair
    } finally {
      clearSession();
      setUser(null);
      setCliente(null);
      router.replace('/login');
    }
  }, [router]);

  const updateProfile = useCallback(async (payload: UpdateProfilePayload) => {
    const res = await authService.updateProfile(payload);
    setUser(res.user);
    setCliente(res.cliente ?? null);
    const atual = getSession();
    if (atual) {
      const inLocal = typeof window !== 'undefined' && Boolean(localStorage.getItem('logmagna.session'));
      saveSession({ token: atual.token, user: res.user }, inLocal);
    }
  }, []);

  const changePassword = useCallback(async (payload: ChangePasswordPayload) => {
    await authService.changePassword(payload);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        cliente,
        loading,
        isAdmin: user?.perfil === 'admin',
        login,
        register,
        logout,
        refreshMe,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
