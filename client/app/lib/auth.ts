'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export const API_URL = 'http://localhost:3001/api';
const STORAGE_KEY = 'logmagna.session';

export interface User {
  id: number;
  nome: string;
  email: string;
  papel: string;
}

export interface Session {
  token: string;
  user: User;
}

export async function login(email: string, password: string): Promise<Session> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor.');
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Falha ao entrar.');
  return json as Session;
}

/** remember=true guarda no localStorage (persiste); false usa sessionStorage. */
export function saveSession(session: Session, remember: boolean) {
  clearSession();
  (remember ? localStorage : sessionStorage).setItem(STORAGE_KEY, JSON.stringify(session));
}

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
}

/** fetch com o token da sessao; se o servidor responder 401, encerra a sessao e volta ao login. */
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const session = getSession();
  const headers = new Headers(init.headers);
  if (session) headers.set('Authorization', `Bearer ${session.token}`);
  const res = await fetch(input, { ...init, headers });
  if (res.status === 401 && typeof window !== 'undefined') {
    clearSession();
    window.location.assign('/login');
  }
  return res;
}

/** Valida a sessao no servidor; limpa se expirou. */
async function validate(session: Session): Promise<User | null> {
  try {
    const res = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${session.token}` } });
    if (!res.ok) return null;
    return (await res.json()).user as User;
  } catch {
    // servidor fora do ar: mantem a sessao local para nao deslogar a toa
    return session.user;
  }
}

/** Redireciona para /login quando nao ha sessao valida. */
export function useRequireAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let ativo = true;
    const session = getSession();
    if (!session) {
      router.replace('/login');
      return;
    }
    validate(session).then((u) => {
      if (!ativo) return;
      if (!u) {
        clearSession();
        router.replace('/login');
      } else {
        setUser(u);
      }
    });
    return () => { ativo = false; };
  }, [router]);

  return user;
}